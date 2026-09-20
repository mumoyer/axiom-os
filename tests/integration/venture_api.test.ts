/**
 * Integration Test Suite: Express REST APIs & SSE Telemetry Stream
 * 
 * Tests:
 * - Health check SLA probe (/api/healthz)
 * - Venture CRUD and pipeline triggering (/api/ventures)
 * - Venture Validation Grader (VVG) 4-factor calculation & automated pivots (/api/grader/score)
 * - Gated Lead Capture funnel (/api/grader/leads)
 * - Stripe checkout session creation & webhook idempotency (/api/checkout)
 * - BYOK key configuration & circuit breaker status (/api/byok)
 * - SSE real-time telemetry streaming (/api/telemetry/stream/:ventureId)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server/app.js';
import { stripeSandbox } from '../../server/engine/sandbox_adapters.js';

describe('Venture API & Telemetry Integration Tests', () => {
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

  describe('Healthz & Liveness Endpoints', () => {
    it('GET /api/healthz returns 200 OK with container health payload', async () => {
      const resp = await fetch(`${baseUrl}/api/healthz`);
      assert.equal(resp.status, 200);

      const data = await resp.json();
      assert.equal(data.status, 'healthy');
      assert.equal(data.database, 'connected');
      assert.ok(data.uptime >= 0);
      assert.ok(data.timestamp);
    });

    it('GET /api/nonexistent returns 404 with structured error', async () => {
      const resp = await fetch(`${baseUrl}/api/unmapped_route`);
      assert.equal(resp.status, 404);
      const data = await resp.json();
      assert.ok(data.error.includes('route not found'));
    });
  });

  describe('Venture Pipeline Lifecycle Endpoints', () => {
    it('POST /api/ventures creates venture and executes full 5-stage pipeline', async () => {
      const resp = await fetch(`${baseUrl}/api/ventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'HyperScale AI',
          tenantId: 'tenant_api_test_001',
          planTier: 'SERIAL',
          description: 'Autonomous enterprise workflows',
        }),
      });

      assert.equal(resp.status, 201);
      const data = await resp.json();
      assert.ok(data.venture.id);
      assert.equal(data.venture.name, 'HyperScale AI');
      assert.equal(data.pipeline.overallStatus, 'COMPLETED');
      assert.equal(data.pipeline.stages.length, 5);
      assert.ok(data.telemetryUrl.includes(data.venture.id));
    });

    it('GET /api/ventures returns all ventures with pipeline status', async () => {
      const resp = await fetch(`${baseUrl}/api/ventures`);
      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.ok(Array.isArray(data.ventures));
      assert.ok(data.ventures.length >= 1);
    });

    it('GET /api/ventures/:id returns single venture execution state', async () => {
      // Create first
      const createResp = await fetch(`${baseUrl}/api/ventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Single Venture Probe', tenantId: 'tenant_probe_002' }),
      });
      const created = await createResp.json();

      const getResp = await fetch(`${baseUrl}/api/ventures/${created.venture.id}`);
      assert.equal(getResp.status, 200);
      const data = await getResp.json();
      assert.equal(data.venture.id, created.venture.id);
      assert.equal(data.pipeline.overallStatus, 'COMPLETED');
    });

    it('POST /api/ventures/:id/retry retries failed pipeline', async () => {
      // First create a venture that deliberately fails Gate 1
      const failResp = await fetch(`${baseUrl}/api/ventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Failing Retry Test',
          tenantId: 'tenant_retry_003',
          failureSimulations: { failGate1Type: true },
        }),
      });
      const failed = await failResp.json();
      assert.equal(failed.pipeline.overallStatus, 'ABORTED_ZERO_CHARGE');

      // Now retry with clean configuration
      const retryResp = await fetch(`${baseUrl}/api/ventures/${failed.venture.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failureSimulations: {} }),
      });
      assert.equal(retryResp.status, 200);
      const retried = await retryResp.json();
      assert.equal(retried.pipeline.overallStatus, 'COMPLETED');
    });
  });

  describe('Venture Validation Grader (VVG) & Lead Capture Endpoints', () => {
    it('POST /api/grader/score calculates A-grade score for strong venture metrics', async () => {
      const resp = await fetch(`${baseUrl}/api/grader/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureName: 'AeroCloud Analytics',
          industry: 'Cloud Infrastructure',
          tamUsd: 15_000_000_000,
          samUsd: 1_200_000_000,
          directCompetitorsCount: 2,
          differentiationFactor: 5,
          estimatedCacUsd: 200,
          estimatedLtvUsd: 1800,
          paybackMonths: 4,
          techComplexity: 3,
          regulatoryRisk: 1,
          founderExperienceYears: 8,
        }),
      });

      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.ok(data.result.overallScore >= 85);
      assert.equal(data.result.gradeBracket, 'A');
      assert.equal(data.result.suggestedPivots, undefined);
    });

    it('POST /api/grader/score triggers automated pivot generator when score < 60', async () => {
      const resp = await fetch(`${baseUrl}/api/grader/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureName: 'Crowded Me-Too App',
          industry: 'Food Delivery',
          tamUsd: 5_000_000,
          samUsd: 200_000,
          directCompetitorsCount: 25,
          differentiationFactor: 1,
          estimatedCacUsd: 500,
          estimatedLtvUsd: 400,
          paybackMonths: 24,
          techComplexity: 4,
          regulatoryRisk: 4,
          founderExperienceYears: 0,
        }),
      });

      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.ok(data.result.overallScore < 60);
      assert.equal(data.result.gradeBracket, 'F');
      assert.ok(Array.isArray(data.result.suggestedPivots));
      assert.equal(data.result.suggestedPivots.length, 3);
      assert.ok(data.result.suggestedPivots[0].includes('Wedge'));
    });

    it('POST /api/grader/leads captures prospective founder lead', async () => {
      const resp = await fetch(`${baseUrl}/api/grader/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: 'sarah@skynet-defense.com',
          ventureName: 'Defense Grid',
          industry: 'Cybersecurity',
          score: 88,
          gradeBracket: 'A',
        }),
      });

      assert.equal(resp.status, 201);
      const data = await resp.json();
      assert.ok(data.leadId);
      assert.ok(data.reportDownloadUrl.includes(data.leadId));
    });
  });

  describe('Stripe Checkout & Webhook Endpoints', () => {
    it('POST /api/checkout/session provisions a valid checkout session', async () => {
      const resp = await fetch(`${baseUrl}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'SERIAL',
          email: 'serial-founder@axiomrun.app',
        }),
      });

      assert.equal(resp.status, 201);
      const data = await resp.json();
      assert.ok(data.sessionId.startsWith('cs_test_'));
      assert.ok(data.url.includes(data.sessionId));
      assert.equal(data.plan, 'SERIAL');
    });

    it('POST /api/checkout/webhook processes signed webhook idempotently', async () => {
      const payload = JSON.stringify({
        id: `evt_api_test_${Date.now()}`,
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123', status: 'complete' } },
      });
      const secret = 'whsec_axiomos_test_secret_2026';
      const sigHeader = stripeSandbox.generateWebhookHeader(payload, secret);

      const resp = await fetch(`${baseUrl}/api/checkout/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': sigHeader,
        },
        body: payload,
      });

      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.equal(data.message, 'PROVISIONED_SUCCESS');

      // Duplicate webhook replay
      const replayResp = await fetch(`${baseUrl}/api/checkout/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': sigHeader,
        },
        body: payload,
      });
      assert.equal(replayResp.status, 200);
      const replayData = await replayResp.json();
      assert.equal(replayData.message, 'DUPLICATE_IDEMPOTENT_IGNORED');
    });
  });

  describe('BYOK & Circuit Breaker Governance Endpoints', () => {
    const tenantId = 'tenant_byok_api_001';

    it('GET /api/byok/:tenantId returns initial configuration', async () => {
      const resp = await fetch(`${baseUrl}/api/byok/${tenantId}`);
      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.equal(data.tenantId, tenantId);
      assert.equal(data.byokActive, false);
      assert.equal(data.configuredProviders.openai, false);
    });

    it('POST /api/byok/keys saves keys and activates BYOK mode', async () => {
      const resp = await fetch(`${baseUrl}/api/byok/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          openaiKey: 'sk-proj-test1234567890abcdef',
          anthropicKey: 'sk-ant-test1234567890abcdef',
        }),
      });

      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.equal(data.circuitBreaker.byokMode, true);
      assert.equal(data.circuitBreaker.status, 'BYOK_ENFORCED');

      // Verify masked keys on GET
      const getResp = await fetch(`${baseUrl}/api/byok/${tenantId}`);
      const getData = await getResp.json();
      assert.equal(getData.byokActive, true);
      assert.equal(getData.configuredProviders.openai, true);
      assert.ok(getData.maskedKeys.openai.includes('...'));
    });

    it('GET /api/byok/status/:tenantId returns gross margin analysis', async () => {
      const resp = await fetch(`${baseUrl}/api/byok/status/${tenantId}`);
      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.ok(data.grossMargin.grossMarginPercent >= 75.0);
      assert.equal(data.grossMargin.marginFloorSatisfied, true);
    });
  });

  describe('Server-Sent Events (SSE) Telemetry Stream', () => {
    it('GET /api/telemetry/stream/:ventureId opens SSE connection and receives initial event', async () => {
      const ventureId = 'ven_sse_stream_test_001';

      // Connect to SSE stream
      const sseEventReceived = new Promise<string>((resolve, reject) => {
        const req = http.get(`${baseUrl}/api/telemetry/stream/${ventureId}`, (res) => {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], 'text/event-stream');

          let buffer = '';
          res.on('data', (chunk) => {
            buffer += chunk.toString();
            if (buffer.includes('data:')) {
              req.destroy(); // close connection
              resolve(buffer);
            }
          });

          res.on('error', reject);
        });

        req.on('error', (err) => {
          // Socket hangup on manual destroy is expected
          if ((err as any).code !== 'ECONNRESET') reject(err);
        });
      });

      const sseData = await sseEventReceived;
      assert.ok(sseData.includes('CONNECTED'));
      assert.ok(sseData.includes(ventureId));
    });
  });
});
