/**
 * Stage Gate OS Branding & Path B Architecture Verification Tests
 * TDD Phase 1: Red Test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../server/app.js';
import http from 'node:http';

describe('Stage Gate OS Branding & Path B Shopify Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const addr = server.address() as any;
    baseUrl = `http://localhost:${addr.port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/healthz returns engine branded as Stage Gate OS', async () => {
    const resp = await fetch(`${baseUrl}/api/healthz`);
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.engine, 'Stage Gate OS Stage-Gate Orchestrator v1.0');
  });

  it('GET /api/checkout/config returns Moyer Ventures LLC Shopify Checkout & Shop Pay', async () => {
    const resp = await fetch(`${baseUrl}/api/checkout/config`);
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.organization, 'Moyer Ventures LLC');
    assert.equal(data.shopifyIntegration.enabled, true);
    assert.equal(data.shopifyIntegration.shopPayEnabled, true);
    assert.equal(data.shopifyIntegration.checkoutMode, 'Shopify / Shop Pay (Moyer Ventures LLC)');
  });

  it('GET /api/messages/:ventureId returns initial greeting branded as Stage Gate OS', async () => {
    const resp = await fetch(`${baseUrl}/api/messages/ven_docuflow_02`);
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.ok(data.messages.length > 0);
    const adminMsg = data.messages.find((m: any) => m.sender === 'admin');
    assert.ok(adminMsg, 'Admin message exists');
    assert.equal(adminMsg.senderName, 'Jason Moyer (Stage Gate OS Lead)');
    assert.ok(adminMsg.text.includes('Welcome to Stage Gate OS!'));
  });
});
