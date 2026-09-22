/**
 * Unit Test Suite: Passwordless Authentication Service (TDD RED Phase)
 *
 * Tests:
 * 1. Requesting magic link generates 6-digit OTP and signed token
 * 2. OTP verification creates authenticated session
 * 3. Token verification (magic link) creates authenticated session
 * 4. Expired OTP/token rejection
 * 5. Rate limiting / brute-force protection (lockout after max attempts)
 * 6. Session lookup & validation
 * 7. Session revocation / logout
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../../server/auth/auth_service.js';

describe('Passwordless AuthService Unit Tests (TDD)', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService({
      otpTtlMinutes: 15,
      maxAttempts: 5,
      secretKey: 'test_secret_salt_123',
    });
  });

  it('generates a 6-digit OTP and secure token upon magic link request', async () => {
    const result = await authService.requestMagicLink('founder@example.com');
    assert.ok(result.success);
    assert.equal(result.email, 'founder@example.com');
    assert.match(result.otp, /^\d{6}$/);
    assert.ok(result.token && result.token.length > 20);
    assert.ok(result.magicLinkUrl.includes(result.token));
  });

  it('normalizes email addresses to lowercase and trimmed string', async () => {
    const result1 = await authService.requestMagicLink('  Founder@Example.COM ');
    assert.equal(result1.email, 'founder@example.com');

    const verify = await authService.verifyOtp('founder@example.com', result1.otp);
    assert.ok(verify.success);
    assert.equal(verify.session?.email, 'founder@example.com');
  });

  it('successfully verifies a valid 6-digit OTP and returns user session', async () => {
    const req = await authService.requestMagicLink('builder@venture.app');
    const verify = await authService.verifyOtp('builder@venture.app', req.otp);

    assert.equal(verify.success, true);
    assert.ok(verify.session);
    assert.equal(verify.session.email, 'builder@venture.app');
    assert.ok(verify.session.sessionToken.length > 20);
    assert.ok(verify.session.tenantId.startsWith('tenant_'));
  });

  it('successfully verifies via Magic Link token', async () => {
    const req = await authService.requestMagicLink('indie@hacker.io');
    const verify = await authService.verifyToken(req.token);

    assert.equal(verify.success, true);
    assert.ok(verify.session);
    assert.equal(verify.session.email, 'indie@hacker.io');
  });

  it('rejects an invalid OTP and decrements remaining attempts', async () => {
    await authService.requestMagicLink('victim@security.io');
    const verify = await authService.verifyOtp('victim@security.io', '000000');

    assert.equal(verify.success, false);
    assert.equal(verify.error, 'INVALID_OTP');
    assert.equal(verify.remainingAttempts, 4);
  });

  it('locks out requests after 5 consecutive invalid OTP attempts', async () => {
    const req = await authService.requestMagicLink('bruteforce@security.io');

    for (let i = 0; i < 5; i++) {
      await authService.verifyOtp('bruteforce@security.io', '111111');
    }

    // 6th attempt should trigger RATE_LIMITED
    const locked = await authService.verifyOtp('bruteforce@security.io', req.otp);
    assert.equal(locked.success, false);
    assert.equal(locked.error, 'TOO_MANY_ATTEMPTS');
  });

  it('rejects expired OTPs when TTL has passed', async () => {
    const shortTtlService = new AuthService({
      otpTtlMinutes: 0.0001, // ~6ms
      secretKey: 'short_key',
    });

    const req = await shortTtlService.requestMagicLink('speedy@time.com');
    // wait 50ms for expiry
    await new Promise((r) => setTimeout(r, 50));

    const verify = await shortTtlService.verifyOtp('speedy@time.com', req.otp);
    assert.equal(verify.success, false);
    assert.equal(verify.error, 'OTP_EXPIRED');
  });

  it('validates active session token via getSession', async () => {
    const req = await authService.requestMagicLink('session@auth.com');
    const verify = await authService.verifyOtp('session@auth.com', req.otp);
    assert.ok(verify.session);

    const activeSession = authService.getSession(verify.session.sessionToken);
    assert.ok(activeSession);
    assert.equal(activeSession.email, 'session@auth.com');
  });

  it('revokes session on logout', async () => {
    const req = await authService.requestMagicLink('logout@auth.com');
    const verify = await authService.verifyOtp('logout@auth.com', req.otp);
    assert.ok(verify.session);

    const revoked = authService.revokeSession(verify.session.sessionToken);
    assert.equal(revoked, true);

    const lookup = authService.getSession(verify.session.sessionToken);
    assert.equal(lookup, null);
  });
});
