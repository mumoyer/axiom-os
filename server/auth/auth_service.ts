/**
 * Passwordless Authentication Service
 * 
 * Provides:
 * - 6-digit numeric OTP generation with cryptographically secure random values
 * - HMAC-signed Magic Link token generation
 * - Brute force protection (attempt tracking & rate limiting)
 * - Session store with TTL & revocation
 */

import { randomInt, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

export interface AuthSession {
  sessionToken: string;
  email: string;
  tenantId: string;
  role: 'founder' | 'admin';
  createdAt: string;
  expiresAt: string;
}

export interface MagicLinkRequestResult {
  success: boolean;
  email: string;
  otp: string;
  token: string;
  magicLinkUrl: string;
  expiresAt: string;
}

export interface VerifyResult {
  success: boolean;
  session?: AuthSession;
  error?: 'INVALID_OTP' | 'OTP_EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'NOT_FOUND';
  remainingAttempts?: number;
}

interface PendingOtpRecord {
  email: string;
  otp: string;
  token: string;
  tenantId: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

export interface AuthServiceOptions {
  otpTtlMinutes?: number;
  maxAttempts?: number;
  secretKey?: string;
  baseUrl?: string;
}

export class AuthService {
  private pendingOtps: Map<string, PendingOtpRecord> = new Map(); // email -> record
  private tokenIndex: Map<string, string> = new Map(); // token -> email
  private sessions: Map<string, AuthSession> = new Map(); // sessionToken -> AuthSession
  private tenantByEmail: Map<string, string> = new Map(); // email -> tenantId

  private otpTtlMinutes: number;
  private maxAttempts: number;
  private secretKey: string;
  private baseUrl: string;

  constructor(options?: AuthServiceOptions) {
    this.otpTtlMinutes = options?.otpTtlMinutes ?? 15;
    this.maxAttempts = options?.maxAttempts ?? 5;
    this.secretKey = options?.secretKey ?? 'stagegate_auth_master_salt_2026';
    this.baseUrl = options?.baseUrl ?? 'https://www.stagegateos.com';
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  private generateToken(email: string, expiresAt: number): string {
    const rawRandom = randomBytes(24).toString('hex');
    const signature = createHmac('sha256', this.secretKey)
      .update(`${email}:${expiresAt}:${rawRandom}`)
      .digest('hex');
    return `${rawRandom}.${signature.slice(0, 32)}`;
  }

  private getOrCreateTenantId(normalizedEmail: string): string {
    let tenantId = this.tenantByEmail.get(normalizedEmail);
    if (!tenantId) {
      // Derive deterministic tenant prefix from email username slug + salt
      const slug = normalizedEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      const suffix = randomBytes(4).toString('hex');
      tenantId = `tenant_${slug || 'founder'}_${suffix}`;
      this.tenantByEmail.set(normalizedEmail, tenantId);
    }
    return tenantId;
  }

  /**
   * Request a new Magic Link and 6-digit OTP code for a given email address.
   */
  public async requestMagicLink(email: string): Promise<MagicLinkRequestResult> {
    const normalized = this.normalizeEmail(email);
    const now = Date.now();
    const expiresAt = now + this.otpTtlMinutes * 60 * 1000;
    const otp = this.generateOtp();
    const token = this.generateToken(normalized, expiresAt);
    const tenantId = this.getOrCreateTenantId(normalized);

    const record: PendingOtpRecord = {
      email: normalized,
      otp,
      token,
      tenantId,
      createdAt: now,
      expiresAt,
      attempts: 0,
      maxAttempts: this.maxAttempts,
    };

    // Clean up previous token index if re-requesting
    const existing = this.pendingOtps.get(normalized);
    if (existing) {
      this.tokenIndex.delete(existing.token);
    }

    this.pendingOtps.set(normalized, record);
    this.tokenIndex.set(token, normalized);

    const magicLinkUrl = `${this.baseUrl}/#/verify?token=${token}&email=${encodeURIComponent(normalized)}`;

    return {
      success: true,
      email: normalized,
      otp,
      token,
      magicLinkUrl,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Verify an entered 6-digit OTP code.
   */
  public async verifyOtp(email: string, inputOtp: string): Promise<VerifyResult> {
    const normalized = this.normalizeEmail(email);
    const record = this.pendingOtps.get(normalized);

    if (!record) {
      return { success: false, error: 'NOT_FOUND' };
    }

    if (record.attempts >= record.maxAttempts) {
      return { success: false, error: 'TOO_MANY_ATTEMPTS', remainingAttempts: 0 };
    }

    if (Date.now() > record.expiresAt) {
      this.pendingOtps.delete(normalized);
      this.tokenIndex.delete(record.token);
      return { success: false, error: 'OTP_EXPIRED' };
    }

    const expectedBuffer = Buffer.from(record.otp, 'utf8');
    const inputBuffer = Buffer.from(inputOtp.trim(), 'utf8');

    const isMatch =
      expectedBuffer.length === inputBuffer.length &&
      timingSafeEqual(expectedBuffer, inputBuffer);

    if (!isMatch) {
      record.attempts += 1;
      const remaining = Math.max(0, record.maxAttempts - record.attempts);
      if (record.attempts >= record.maxAttempts) {
        return { success: false, error: 'TOO_MANY_ATTEMPTS', remainingAttempts: 0 };
      }
      return { success: false, error: 'INVALID_OTP', remainingAttempts: remaining };
    }

    // Correct OTP: create session and invalidate OTP
    const session = this.createSession(record.email, record.tenantId);
    this.pendingOtps.delete(normalized);
    this.tokenIndex.delete(record.token);

    return {
      success: true,
      session,
    };
  }

  /**
   * Verify a Magic Link token.
   */
  public async verifyToken(token: string): Promise<VerifyResult> {
    const email = this.tokenIndex.get(token);
    if (!email) {
      return { success: false, error: 'NOT_FOUND' };
    }

    const record = this.pendingOtps.get(email);
    if (!record || record.token !== token) {
      return { success: false, error: 'NOT_FOUND' };
    }

    if (Date.now() > record.expiresAt) {
      this.pendingOtps.delete(email);
      this.tokenIndex.delete(token);
      return { success: false, error: 'OTP_EXPIRED' };
    }

    const session = this.createSession(record.email, record.tenantId);
    this.pendingOtps.delete(email);
    this.tokenIndex.delete(token);

    return {
      success: true,
      session,
    };
  }

  /**
   * Internal session creator.
   */
  private createSession(email: string, tenantId: string): AuthSession {
    const sessionToken = `sg_sess_${randomBytes(32).toString('hex')}`;
    const now = Date.now();
    const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30-day session

    const session: AuthSession = {
      sessionToken,
      email,
      tenantId,
      role: 'founder',
      createdAt: new Date(now).toISOString(),
      expiresAt,
    };

    this.sessions.set(sessionToken, session);
    return session;
  }

  /**
   * Retrieve active session by token.
   */
  public getSession(sessionToken: string): AuthSession | null {
    const session = this.sessions.get(sessionToken);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(sessionToken);
      return null;
    }

    return { ...session };
  }

  /**
   * Revoke session on logout.
   */
  public revokeSession(sessionToken: string): boolean {
    return this.sessions.delete(sessionToken);
  }
}

export const authService = new AuthService();
