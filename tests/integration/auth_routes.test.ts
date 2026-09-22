/**
 * Integration Test Suite: Passwordless Authentication API Endpoints (TDD RED Phase)
 *
 * Tests:
 * 1. POST /api/auth/magic-link requests OTP & link
 * 2. POST /api/auth/verify verifies OTP and sets session
 * 3. GET /api/auth/me returns authenticated founder profile with bearer token
 * 4. POST /api/auth/logout revokes session
 * 5. GET /api/auth/me rejects unauthenticated or expired token
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../server/app.js';
import type { Express } from 'express';

describe('Passwordless Auth Routes Integration Tests', () => {
  let app: Express;
  let server: any;
  let baseUrl: string;

  before(async () => {
    app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/auth/magic-link returns success with preview payload', async () => {
    const res = await fetch(`${baseUrl}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'integration@stagegateos.com' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.email, 'integration@stagegateos.com');
    assert.ok(data.previewOtp); // sandbox dev preview
    assert.ok(data.magicLinkUrl);
  });

  it('POST /api/auth/verify with valid OTP returns session and token', async () => {
    // 1. Request
    const reqRes = await fetch(`${baseUrl}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'verified@stagegateos.com' }),
    });
    const reqData = await reqRes.json();

    // 2. Verify with preview OTP
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'verified@stagegateos.com',
        otp: reqData.previewOtp,
      }),
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.ok(verifyData.session);
    assert.equal(verifyData.session.email, 'verified@stagegateos.com');
    assert.ok(verifyData.session.sessionToken);
  });

  it('GET /api/auth/me returns authenticated founder profile with bearer token', async () => {
    // 1. Request & Verify
    const reqRes = await fetch(`${baseUrl}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'profile@stagegateos.com' }),
    });
    const reqData = await reqRes.json();

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'profile@stagegateos.com',
        otp: reqData.previewOtp,
      }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.session.sessionToken;

    // 2. Query /api/auth/me with Authorization Header
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.authenticated, true);
    assert.equal(meData.user.email, 'profile@stagegateos.com');
    assert.ok(meData.user.tenantId);
  });

  it('POST /api/auth/logout revokes session token', async () => {
    const reqRes = await fetch(`${baseUrl}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logout@stagegateos.com' }),
    });
    const reqData = await reqRes.json();

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'logout@stagegateos.com',
        otp: reqData.previewOtp,
      }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.session.sessionToken;

    // Logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(logoutRes.status, 200);

    // Verify /api/auth/me now returns 401
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(meRes.status, 401);
  });
});
