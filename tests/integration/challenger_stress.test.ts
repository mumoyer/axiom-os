/**
 * Challenger 2 Adversarial Stress Test Suite:
 * - Venture Validation Grader (VVG) Mathematical Boundary Conditions & Continuity
 * - Concurrent Stripe Webhook Flood (20 simultaneous requests)
 * - Port 3000 Server Load & Route Stress Under Rapid Bursts
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server/app.js';
import { stripeSandbox } from '../../server/engine/sandbox_adapters.js';
import {
  calculateGraderScore,
  calculateMarketDemand,
  calculateCompetitorDensity,
  calculateUnitEconomics,
  calculateTechnicalFeasibility,
  getGradeBracket,
  generatePivots,
  validateGraderInput,
  FACTOR_WEIGHTS,
  GraderInput,
} from '../../client/src/services/grader.js';

describe('Challenger 2: Empirical Stress Test Suite', () => {
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

  // ==========================================================================
  // TRACK 1: VVG MATHEMATICAL BOUNDARY CONDITIONS & CONTINUITY
  // ==========================================================================
  describe('Track 1: VVG Algorithm Boundary Conditions & Mathematical Stress', () => {
    it('handles TAM = 0 and negative TAM gracefully without NaN or negative scores', () => {
      const zeroTamScore = calculateMarketDemand(0, 0);
      assert.equal(zeroTamScore, 10, 'TAM = 0 must return base floor of 10');
      assert.ok(!Number.isNaN(zeroTamScore));

      const negTamScore = calculateMarketDemand(-50_000_000, 0);
      assert.equal(negTamScore, 10, 'Negative TAM must return base floor of 10');
      assert.ok(!Number.isNaN(negTamScore));

      // Test full score calculation with TAM = 0
      const fullZeroTam: GraderInput = {
        ventureName: 'Zero TAM Concept',
        industry: 'EdTech',
        tamUsd: 0,
        samUsd: 0,
        directCompetitorsCount: 5,
        differentiationFactor: 3,
        estimatedCacUsd: 100,
        estimatedLtvUsd: 500,
        paybackMonths: 6,
        techComplexity: 2,
        regulatoryRisk: 1,
        founderExperienceYears: 2,
      };

      const result = calculateGraderScore(fullZeroTam);
      assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
      assert.ok(!Number.isNaN(result.overallScore));
      assert.equal(result.factorScores.marketDemand, 10);
    });

    it('handles extreme Mega-TAM of $10 Trillion ($10,000,000,000,000) without numerical overflow', () => {
      const tenTrillion = 10_000_000_000_000;
      const demandScore = calculateMarketDemand(tenTrillion, 500_000_000_000);
      assert.ok(demandScore <= 100 && demandScore >= 95);
      assert.ok(!Number.isNaN(demandScore));

      const megaInput: GraderInput = {
        ventureName: 'Global Energy Matrix',
        industry: 'CleanTech',
        tamUsd: tenTrillion,
        samUsd: 500_000_000_000,
        directCompetitorsCount: 1,
        differentiationFactor: 5,
        estimatedCacUsd: 1000,
        estimatedLtvUsd: 50000,
        paybackMonths: 3,
        techComplexity: 5,
        regulatoryRisk: 5,
        founderExperienceYears: 15,
      };

      const result = calculateGraderScore(megaInput);
      assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
      assert.ok(Number.isFinite(result.overallScore));
      assert.equal(result.gradeBracket, 'A');
    });

    it('handles negative CAC and negative LTV inputs with safe clamping', () => {
      // Negative CAC
      const scoreNegCac = calculateUnitEconomics(-500, 1000, 6);
      assert.ok(scoreNegCac >= 10 && scoreNegCac <= 100);
      assert.ok(!Number.isNaN(scoreNegCac));

      // Negative LTV
      const scoreNegLtv = calculateUnitEconomics(200, -1000, 6);
      assert.ok(scoreNegLtv >= 10 && scoreNegLtv <= 100);
      assert.ok(!Number.isNaN(scoreNegLtv));

      // Both negative
      const scoreBothNeg = calculateUnitEconomics(-200, -500, 6);
      assert.ok(scoreBothNeg >= 10 && scoreBothNeg <= 100);
      assert.ok(!Number.isNaN(scoreBothNeg));
    });

    it('handles zero CAC (organic viral growth) with safe division and max score', () => {
      const scoreZeroCac = calculateUnitEconomics(0, 2000, 4);
      assert.ok(!Number.isNaN(scoreZeroCac));
      assert.equal(scoreZeroCac, 100, 'Zero CAC with positive LTV should award top score');
    });

    it('handles extreme payback period (> 120 months) with bounded penalty', () => {
      // 150 months payback
      const score150Mo = calculateUnitEconomics(300, 1500, 150);
      assert.ok(score150Mo >= 10 && score150Mo <= 100);
      // Even with 9999 months payback, score should clamp to floor [10, 100]
      const score9999Mo = calculateUnitEconomics(500, 400, 9999);
      assert.equal(score9999Mo, 10);
    });

    it('handles negative or zero payback months safely', () => {
      const scoreZeroPayback = calculateUnitEconomics(200, 1000, 0);
      assert.ok(scoreZeroPayback >= 10 && scoreZeroPayback <= 100);
      assert.ok(!Number.isNaN(scoreZeroPayback));

      const scoreNegPayback = calculateUnitEconomics(200, 1000, -12);
      assert.ok(scoreNegPayback >= 10 && scoreNegPayback <= 100);
      assert.ok(!Number.isNaN(scoreNegPayback));
    });

    it('handles hyper-saturated competitor landscape (100 competitors) and negative competitors', () => {
      // 100 competitors, no moat (differentiation = 1)
      const score100 = calculateCompetitorDensity(100, 1);
      assert.equal(score100, 14, '100 competitors with diff=1: base 45 + (1-3)*8 - 15 = 14');
      assert.ok(score100 >= 10 && score100 <= 100);

      // 1000 competitors
      const score1000 = calculateCompetitorDensity(1000, 1);
      assert.equal(score1000, 14);

      // Negative competitors: should be treated as 0 competitors
      const scoreNegComp = calculateCompetitorDensity(-20, 5);
      assert.ok(scoreNegComp >= 90 && scoreNegComp <= 100);
    });

    it('handles extreme differentiation factors (< 1 or > 5) with clamping', () => {
      const scoreUnder = calculateCompetitorDensity(5, -5);
      const scoreOver = calculateCompetitorDensity(5, 10);
      assert.ok(scoreUnder >= 10 && scoreUnder <= 100);
      assert.ok(scoreOver >= 10 && scoreOver <= 100);
    });

    it('handles zero founder experience and extreme experience (> 50 years)', () => {
      // 0 experience
      const score0Exp = calculateTechnicalFeasibility(3, 2, 0);
      assert.ok(score0Exp >= 10 && score0Exp <= 100);

      // 50 years experience: should cap bonus at +20
      const score50Exp = calculateTechnicalFeasibility(3, 2, 50);
      const score10Exp = calculateTechnicalFeasibility(3, 2, 10);
      assert.equal(score50Exp, score10Exp, 'Experience bonus must cap at +20 points max');
    });

    it('strictly enforces automated pivot generation contract: score < 60 -> exactly 3 pivots; score >= 60 -> undefined', () => {
      // Venture with score < 60
      const weakInput: GraderInput = {
        ventureName: 'Failing Venture',
        industry: 'Dating App',
        tamUsd: 1_000_000,
        samUsd: 50_000,
        directCompetitorsCount: 50,
        differentiationFactor: 1,
        estimatedCacUsd: 1000,
        estimatedLtvUsd: 200,
        paybackMonths: 48,
        techComplexity: 4,
        regulatoryRisk: 4,
        founderExperienceYears: 0,
      };

      const weakResult = calculateGraderScore(weakInput);
      assert.ok(weakResult.overallScore < 60, `Score was ${weakResult.overallScore}, expected < 60`);
      assert.equal(weakResult.gradeBracket, 'F');
      assert.ok(Array.isArray(weakResult.suggestedPivots), 'Pivots must be an array when score < 60');
      assert.equal(weakResult.suggestedPivots.length, 3, 'Must produce exactly 3 strategic pivots');
      assert.ok(weakResult.suggestedPivots[0].includes('Vertical SaaS Wedge'));
      assert.ok(weakResult.suggestedPivots[1].includes('Headless API Infrastructure'));
      assert.ok(weakResult.suggestedPivots[2].includes('Outcome-Based Managed Service'));

      // Venture with score >= 60
      const strongInput: GraderInput = {
        ventureName: 'Strong Venture',
        industry: 'Enterprise Security',
        tamUsd: 5_000_000_000,
        samUsd: 500_000_000,
        directCompetitorsCount: 3,
        differentiationFactor: 4,
        estimatedCacUsd: 200,
        estimatedLtvUsd: 1500,
        paybackMonths: 6,
        techComplexity: 2,
        regulatoryRisk: 1,
        founderExperienceYears: 6,
      };

      const strongResult = calculateGraderScore(strongInput);
      assert.ok(strongResult.overallScore >= 60, `Score was ${strongResult.overallScore}, expected >= 60`);
      assert.notEqual(strongResult.gradeBracket, 'F');
      assert.equal(strongResult.suggestedPivots, undefined, 'Must NOT generate pivots when score >= 60');
    });

    it('maintains mathematical continuity across 1,000 randomized Monte Carlo stress vectors', () => {
      for (let i = 0; i < 1000; i++) {
        const randomInput: GraderInput = {
          ventureName: `Test Venture ${i}`,
          industry: i % 2 === 0 ? 'SaaS' : 'FinTech',
          tamUsd: Math.floor(Math.random() * 20_000_000_000) - 1_000_000, // can be negative
          samUsd: Math.floor(Math.random() * 2_000_000_000),
          directCompetitorsCount: Math.floor(Math.random() * 150) - 10, // can be negative or huge
          differentiationFactor: Math.floor(Math.random() * 10) - 2,    // -2 to 7
          estimatedCacUsd: Math.floor(Math.random() * 2000) - 100,      // can be 0 or negative
          estimatedLtvUsd: Math.floor(Math.random() * 10000) - 500,     // can be negative
          paybackMonths: Math.floor(Math.random() * 150) - 10,          // can be negative or huge
          techComplexity: Math.floor(Math.random() * 10) - 2,
          regulatoryRisk: Math.floor(Math.random() * 10) - 2,
          founderExperienceYears: Math.floor(Math.random() * 60) - 5,
        };

        const result = calculateGraderScore(randomInput);

        // Invariants
        assert.ok(
          result.overallScore >= 0 && result.overallScore <= 100,
          `Vector ${i} overallScore out of bounds: ${result.overallScore}`
        );
        assert.ok(!Number.isNaN(result.overallScore), `Vector ${i} overallScore is NaN`);
        assert.ok(Number.isFinite(result.overallScore), `Vector ${i} overallScore is not finite`);
        assert.ok(
          ['A', 'B', 'C', 'F'].includes(result.gradeBracket),
          `Vector ${i} invalid gradeBracket: ${result.gradeBracket}`
        );
        assert.ok(result.factorScores.marketDemand >= 10 && result.factorScores.marketDemand <= 100);
        assert.ok(result.factorScores.competitorDensity >= 10 && result.factorScores.competitorDensity <= 100);
        assert.ok(result.factorScores.unitEconomics >= 10 && result.factorScores.unitEconomics <= 100);
        assert.ok(result.factorScores.technicalFeasibility >= 10 && result.factorScores.technicalFeasibility <= 100);

        if (result.overallScore < 60) {
          assert.equal(result.gradeBracket, 'F');
          assert.equal(result.suggestedPivots?.length, 3);
        } else {
          assert.notEqual(result.gradeBracket, 'F');
          assert.equal(result.suggestedPivots, undefined);
        }
      }
    });
  });

  // ==========================================================================
  // TRACK 2: CONCURRENT STRIPE WEBHOOK FLOOD (20 SIMULTANEOUS REQUESTS)
  // ==========================================================================
  describe('Track 2: Concurrent Stripe Webhook Flood (20 Simultaneous Requests)', () => {
    it('serializes 20 simultaneous identical webhook calls: exactly 1 provisioned, 19 idempotent deduplications', async () => {
      const eventId = `evt_flood_test_20_${Date.now()}`;
      const executionLog: Array<{ workerId: number; timestamp: number; result: string }> = [];
      const dbProvisionedRows: Array<{ id: number; eventId: string; workerId: number }> = [];

      // Fire 20 simultaneous webhook notifications for the exact same event
      const workers = Array.from({ length: 20 }, (_, idx) => idx + 1);

      const responses = await Promise.all(
        workers.map((workerId) =>
          stripeSandbox.processWebhookIdempotent(eventId, async () => {
            // Simulate critical DB transaction
            dbProvisionedRows.push({
              id: dbProvisionedRows.length + 1,
              eventId,
              workerId,
            });
            executionLog.push({ workerId, timestamp: Date.now(), result: 'PROVISIONED' });
            return { success: true, data: { subscriptionId: `sub_test_${workerId}` } };
          })
        )
      );

      // Verify responses
      const provisionedResults = responses.filter((r) => r.message === 'PROVISIONED_SUCCESS');
      const deduplicatedResults = responses.filter((r) => r.message === 'DUPLICATE_IDEMPOTENT_IGNORED');

      assert.equal(
        provisionedResults.length,
        1,
        `Expected exactly 1 PROVISIONED_SUCCESS, but got ${provisionedResults.length}`
      );
      assert.equal(
        deduplicatedResults.length,
        19,
        `Expected exactly 19 DUPLICATE_IDEMPOTENT_IGNORED, but got ${deduplicatedResults.length}`
      );
      assert.equal(
        dbProvisionedRows.length,
        1,
        `Double-spend detected! Database contains ${dbProvisionedRows.length} rows instead of 1`
      );

      // All responses should return status 200
      for (const res of responses) {
        assert.equal(res.status, 200);
      }
    });

    it('processes 20 concurrent HTTP requests to /api/checkout/webhook with mutex serialization', async () => {
      const eventId = `evt_http_flood_20_${Date.now()}`;
      const payload = JSON.stringify({
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_flood_${Date.now()}`,
            customer: 'cus_flood_tester',
            subscription: 'sub_flood_pro',
            status: 'complete',
          },
        },
      });

      const secret = 'whsec_axiomos_test_secret_2026';
      const sigHeader = stripeSandbox.generateWebhookHeader(payload, secret);

      // Fire 20 simultaneous HTTP POST requests to Port 3000
      const requests = Array.from({ length: 20 }, () =>
        fetch(`${baseUrl}/api/checkout/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': sigHeader,
          },
          body: payload,
        })
      );

      const httpResponses = await Promise.all(requests);

      // Assert all HTTP status codes are 200 OK
      for (const res of httpResponses) {
        assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      }

      const bodies = await Promise.all(httpResponses.map((res) => res.json()));
      const successCount = bodies.filter((b) => b.message === 'PROVISIONED_SUCCESS').length;
      const ignoredCount = bodies.filter((b) => b.message === 'DUPLICATE_IDEMPOTENT_IGNORED').length;

      assert.equal(successCount, 1, `HTTP flood: expected 1 success, got ${successCount}`);
      assert.equal(ignoredCount, 19, `HTTP flood: expected 19 deduplicated, got ${ignoredCount}`);
    });

    it('handles mixed concurrent event flood: 4 distinct events x 5 requests each = 4 provisions, 16 deduplications', async () => {
      const distinctEvents = [1, 2, 3, 4].map((n) => `evt_mixed_${n}_${Date.now()}`);
      const mixedRequests: string[] = [];

      // Interleave 5 of each event
      for (let i = 0; i < 5; i++) {
        for (const evtId of distinctEvents) {
          mixedRequests.push(evtId);
        }
      }

      const results = await Promise.all(
        mixedRequests.map((eventId) =>
          stripeSandbox.processWebhookIdempotent(eventId, async () => {
            return { success: true };
          })
        )
      );

      const totalProvisioned = results.filter((r) => r.message === 'PROVISIONED_SUCCESS').length;
      const totalIgnored = results.filter((r) => r.message === 'DUPLICATE_IDEMPOTENT_IGNORED').length;

      assert.equal(totalProvisioned, 4, `Expected exactly 4 distinct event provisions, got ${totalProvisioned}`);
      assert.equal(totalIgnored, 16, `Expected exactly 16 deduplications, got ${totalIgnored}`);
    });
  });

  // ==========================================================================
  // TRACK 3: PORT 3000 SERVER LOAD & ROUTE STRESS UNDER RAPID BURSTS
  // ==========================================================================
  describe('Track 3: Port 3000 Server Load & Route Stress Under Rapid Bursts', () => {
    it('survives 50 rapid concurrent GET requests to /api/healthz with 100% 200 OK', async () => {
      const start = Date.now();
      const burstRequests = Array.from({ length: 50 }, () => fetch(`${baseUrl}/api/healthz`));
      const responses = await Promise.all(burstRequests);

      const duration = Date.now() - start;
      assert.ok(duration < 2000, `50 healthz requests took ${duration}ms (> 2000ms SLA)`);

      for (const res of responses) {
        assert.equal(res.status, 200);
      }

      const firstBody = await responses[0].json();
      assert.equal(firstBody.status, 'healthy');
      assert.equal(firstBody.database, 'connected');
    });

    it('survives 30 rapid concurrent GET requests to /api/ventures without socket hangup', async () => {
      const requests = Array.from({ length: 30 }, () => fetch(`${baseUrl}/api/ventures`));
      const responses = await Promise.all(requests);

      for (const res of responses) {
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(Array.isArray(data.ventures));
      }
    });

    it('survives 20 rapid async POST requests to /api/ventures with 202 Accepted', async () => {
      const requests = Array.from({ length: 20 }, (_, i) =>
        fetch(`${baseUrl}/api/ventures?async=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Burst Venture ${i}`,
            tenantId: `tenant_burst_${i}`,
            planTier: 'FOUNDER',
          }),
        })
      );

      const responses = await Promise.all(requests);
      for (const res of responses) {
        assert.equal(res.status, 202, `Expected 202 Accepted, got ${res.status}`);
        const data = await res.json();
        assert.ok(data.venture.id);
        assert.ok(data.telemetryUrl);
      }
    });

    it('survives 30 concurrent POST requests to /api/grader/score with extreme payloads', async () => {
      const extremePayloads = [
        { ventureName: 'Zero TAM', tamUsd: 0, samUsd: 0 },
        { ventureName: 'Negative CAC', estimatedCacUsd: -500 },
        { ventureName: 'Crowded Market', directCompetitorsCount: 150, differentiationFactor: 1 },
        { ventureName: 'Mega Trillion', tamUsd: 10_000_000_000_000 },
        { ventureName: 'Zero Payback', paybackMonths: 0 },
        { ventureName: '100yr Experience', founderExperienceYears: 100 },
      ];

      const requests = Array.from({ length: 30 }, (_, i) => {
        const payload = extremePayloads[i % extremePayloads.length];
        return fetch(`${baseUrl}/api/grader/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      });

      const responses = await Promise.all(requests);
      for (const res of responses) {
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.result.overallScore >= 0 && data.result.overallScore <= 100);
        assert.ok(['A', 'B', 'C', 'F'].includes(data.result.gradeBracket));
      }
    });

    it('survives 20 rapid POST requests to /api/byok/keys without race conditions', async () => {
      const requests = Array.from({ length: 20 }, (_, i) =>
        fetch(`${baseUrl}/api/byok/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: `tenant_byok_stress_${i % 5}`,
            openaiKey: `sk-proj-testkey-${i}`,
            anthropicKey: `sk-ant-testkey-${i}`,
          }),
        })
      );

      const responses = await Promise.all(requests);
      for (const res of responses) {
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.circuitBreaker.byokMode, true);
      }
    });

    it('resiliently handles malformed and adversarial payloads with structured errors', async () => {
      // 1. Missing venture name on POST /api/ventures -> 400 Bad Request
      const badVenture = await fetch(`${baseUrl}/api/ventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(badVenture.status, 400);
      const badVentureData = await badVenture.json();
      assert.ok(badVentureData.error.includes('Venture name is required'));

      // 2. Missing email and name on POST /api/grader/leads -> 400 Bad Request
      const badLead = await fetch(`${baseUrl}/api/grader/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureName: 'No Contact Info' }),
      });
      assert.equal(badLead.status, 400);
      const badLeadData = await badLead.json();
      assert.ok(badLeadData.error.includes('Name and email are required'));

      // 3. Completely empty POST to /api/grader/score -> defaults applied, 200 OK
      const emptyGrader = await fetch(`${baseUrl}/api/grader/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(emptyGrader.status, 200);
      const emptyGraderData = await emptyGrader.json();
      assert.ok(emptyGraderData.result.overallScore >= 0);

      // 4. Unknown endpoint -> 404 with JSON error format
      const notFound = await fetch(`${baseUrl}/api/unknown/subsystem/route`);
      assert.equal(notFound.status, 404);
      const notFoundData = await notFound.json();
      assert.ok(notFoundData.error.includes('not found'));

      // 5. Non-existent venture ID on GET /api/ventures/:id -> 404
      const nonExistentVenture = await fetch(`${baseUrl}/api/ventures/ven_non_existent_99999`);
      assert.equal(nonExistentVenture.status, 404);
      const nonExistentData = await nonExistentVenture.json();
      assert.ok(nonExistentData.error.includes('not found'));
    });
  });
});
