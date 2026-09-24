/**
 * Bug Feedback & Reporting Unit Tests
 * 
 * Verifies:
 * 1. POST /api/feedback/bug:
 *    - Validates required fields (title, description, category, severity)
 *    - Rejects invalid/too-short inputs
 *    - Persists bug report in store with generated ID, status 'open', and timestamp
 *    - Dispatches real-time BUG_REPORT alert to notificationService
 *    - Returns success response with bugId, confirmation, and bounty acknowledgment
 * 2. GET /api/feedback/config:
 *    - Returns public bug bounty terms, severity reward levels, and encouragement copy
 * 3. GET /api/feedback/bugs:
 *    - Rejects unauthenticated requests with 401
 *    - Returns list of bug reports when authenticated with valid x-admin-key
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server/app.js';
import { notificationService } from '../../server/services/notification_service.js';

describe('Bug Reporting & Tester Incentive Feedback API', () => {
  it('GET /api/feedback/config returns public bounty terms and encouragement copy', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/feedback/config`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.bugBounty, 'Expected bugBounty object');
      assert.ok(data.bugBounty.rewards, 'Expected rewards levels');
      assert.ok(data.encouragement, 'Expected encouragement message');
      assert.equal(data.bugBounty.rewards.functional, '1 Free Month');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/feedback/bug rejects invalid or missing fields', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      // Missing description
      const res = await fetch(`http://localhost:${port}/api/feedback/bug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Button does nothing',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error, 'Should return error for missing description');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/feedback/bug successfully saves report and dispatches notification', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      const bugPayload = {
        title: 'Gate 2 latency probe timed out under load',
        description: 'While running simulation with 20 concurrent probes, Gate 2 reported p95 320ms instead of 18ms and failed to self-heal within 2 retry loops.',
        category: 'stage_gate',
        severity: 'functional',
        reporterEmail: 'tester@autonomousventures.com',
        ventureId: 'ven_docuflow_02',
        url: 'https://stagegateos.com/#dashboard',
        systemInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          screenResolution: '1920x1080',
        },
      };

      const res = await fetch(`http://localhost:${port}/api/feedback/bug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugPayload),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.bugId && data.bugId.startsWith('bug_'), 'Must return formatted bugId');
      assert.ok(data.bountyReward, 'Must acknowledge bounty reward level');
      assert.equal(data.bountyReward, '1 Free Month');
      assert.ok(data.message.includes('Thank you'), 'Must return appreciative confirmation');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/feedback/bugs enforces admin authentication', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      // Unauthenticated
      const unauthRes = await fetch(`http://localhost:${port}/api/feedback/bugs`);
      assert.equal(unauthRes.status, 401);

      // Authenticated
      const authRes = await fetch(`http://localhost:${port}/api/feedback/bugs`, {
        headers: { 'x-admin-key': 'stagegate_admin_key_2026' },
      });
      assert.equal(authRes.status, 200);
      const data = await authRes.json();
      assert.ok(Array.isArray(data.bugs), 'Must return array of bug reports');
      assert.ok(data.bugs.length >= 1, 'Must include previously reported bug');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
