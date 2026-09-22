/**
 * Passwordless Authentication Routes
 * 
 * Endpoints:
 * - POST /api/auth/magic-link - Generates and sends a 6-digit OTP & Magic Link
 * - POST /api/auth/verify     - Validates OTP or Magic Link token and returns session
 * - GET  /api/auth/me         - Validates session Bearer token and returns profile
 * - POST /api/auth/logout     - Revokes active session
 */

import { Router, Request, Response } from 'express';
import { authService } from '../auth/auth_service.js';

export const authRoutes = Router();

// POST /api/auth/magic-link
authRoutes.post('/magic-link', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  try {
    const result = await authService.requestMagicLink(email);

    // In development / sandbox mode, return preview OTP and magic link so the user can test seamlessly
    console.log(`[Auth] Magic Link generated for ${result.email}: OTP=${result.otp} URL=${result.magicLinkUrl}`);

    // Only expose previewOtp and direct URL in development/sandbox mode for testing convenience
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    res.status(200).json({
      success: true,
      message: `A login code has been sent to ${result.email}.`,
      email: result.email,
      ...(isDevOrTest ? { previewOtp: result.otp, magicLinkUrl: result.magicLinkUrl } : {}),
      expiresAt: result.expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to dispatch magic link' });
  }
});

// POST /api/auth/verify
authRoutes.post('/verify', async (req: Request, res: Response) => {
  const { email, otp, token } = req.body;

  try {
    let result;
    if (token && typeof token === 'string') {
      result = await authService.verifyToken(token);
    } else if (email && otp) {
      result = await authService.verifyOtp(email, otp);
    } else {
      res.status(400).json({ error: 'Either email + otp OR token is required.' });
      return;
    }

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
        remainingAttempts: result.remainingAttempts,
      });
      return;
    }

    res.status(200).json({
      success: true,
      session: result.session,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

// GET /api/auth/me
authRoutes.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({ authenticated: false, error: 'Authorization token required' });
    return;
  }

  const session = authService.getSession(token);
  if (!session) {
    res.status(401).json({ authenticated: false, error: 'Invalid or expired session' });
    return;
  }

  res.status(200).json({
    authenticated: true,
    user: {
      email: session.email,
      tenantId: session.tenantId,
      role: session.role,
      createdAt: session.createdAt,
    },
  });
});

// POST /api/auth/logout
authRoutes.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token) {
    authService.revokeSession(token);
  }

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
