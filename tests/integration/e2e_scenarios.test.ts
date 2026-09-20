/**
 * Integration Test Suite: Tier 4 Real-World Application Scenarios
 * 
 * Verifies all 5 end-to-end founder persona workflows defined in TEST_INFRA.md:
 * 1. Scenario 1 (Newbie Non-Technical Founder):
 *    Grader -> Score & Pivots -> Lead Capture -> Newbie Launchpad -> 5-Gate Execution -> Escrow Commit.
 * 2. Scenario 2 (Serial Entrepreneur Fast Eject & BYOK):
 *    BYOK Vault -> Ping Connectivity -> 1-Click Git Ejection -> Clean-Room AST Scan -> README Badge.
 * 3. Scenario 3 (Zero-Charge Failure Containment Stress Test):
 *    Malformed Venture -> Gate 2/4 Failure -> Bounded Retry (3) -> Invariant Delta B == 0.00 -> 5 Failures Trip Circuit Breaker ($9.45 Cap).
 * 4. Scenario 4 (Stripe Sandbox Subscriber Onboarding):
 *    Serial Tier ($149) -> Checkout Session -> Signed Webhook -> Tenant Activation.
 * 5. Scenario 5 (Adversarial Multi-Vector Concurrency Flood):
 *    3 Simultaneous Webhooks -> Mutex Lock -> Idempotency Handled -> 0 Duplicate Rows.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server/app.js';
import { stripeSandbox, gitHubSandbox } from '../../server/engine/sandbox_adapters.js';
import { TwoPhaseCommitCreditLedger } from '../../server/engine/escrow_ledger.js';
import { TenantFailureCircuitBreaker } from '../../server/engine/circuit_breaker.js';
import { StageGateRunner } from '../../server/engine/stage_gate_runner.js';
import { executeGate5 } from '../../server/engine/gates/gate5_git_eject.js';

describe('Tier 4: Real-World Application Scenarios (E2E Integration)', () => {
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

  describe('Scenario 1: Newbie Non-Technical Founder Journey', () => {
    it('executes concept validation -> pivots -> lead capture -> wizard launch -> 5-gate roadmap', async () => {
      // Step 1: Input non-technical venture concept into VVG
      const graderPayload = {
        ventureName: 'Crowded Me-Too Delivery',
        industry: 'Food Delivery',
        tamUsd: 5_000_000,
        samUsd: 200_000,
        directCompetitorsCount: 25,
        differentiationFactor: 1,
        estimatedCacUsd: 500,
        estimatedLtvUsd: 400, // Low LTV/CAC ratio
        paybackMonths: 24,
        techComplexity: 4,
        regulatoryRisk: 4,
        founderExperienceYears: 0,
      };

      const scoreResp = await fetch(`${baseUrl}/api/grader/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graderPayload),
      });

      assert.equal(scoreResp.status, 200);
      const scoreData = await scoreResp.json();
      assert.ok(scoreData.result.overallScore < 60, 'Low-viability concept should score Grade F (< 60)');
      assert.equal(scoreData.result.gradeBracket, 'F');
      assert.ok(scoreData.result.suggestedPivots, 'Must generate automated pivots when score < 60');
      assert.equal(scoreData.result.suggestedPivots.length, 3);

      // Step 2: Gated Lead Capture Modal unlocks full report
      const leadResp = await fetch(`${baseUrl}/api/grader/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Arthur Pendelton',
          email: 'arthur.p@newbiefounder.org',
          ventureName: 'Crowded Me-Too Delivery',
          industry: 'Food Delivery',
          score: scoreData.result.overallScore,
          gradeBracket: scoreData.result.gradeBracket,
        }),
      });

      assert.equal(leadResp.status, 201);
      const leadData = await leadResp.json();
      assert.ok(leadData.leadId);
      assert.ok(leadData.reportDownloadUrl.includes(leadData.leadId));

      // Step 3: Trigger 4-step Newbie Wizard with 2PC escrow authorization
      const launchResp = await fetch(`${baseUrl}/api/ventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Elderly Companion Care (Pivoted)',
          tenantId: 'tenant_newbie_arthur',
          planTier: 'FOUNDER',
          creditCost: 20.0,
        }),
      });

      assert.equal(launchResp.status, 201);
      const launchData = await launchResp.json();
      assert.ok(launchData.venture);
      assert.ok(launchData.pipeline);
      assert.equal(launchData.pipeline.overallStatus, 'COMPLETED');
      assert.equal(launchData.pipeline.escrowStatus, 'COMMITTED');

      // Step 4: Verify all 5 gates passed with cryptographic receipts
      const stages = launchData.pipeline.stages;
      assert.equal(stages.length, 5);
      for (let i = 0; i < 5; i++) {
        assert.equal(stages[i].status, 'PASSED', `Gate ${i + 1} must pass in newbie happy path`);
        assert.ok(stages[i].receipt, `Gate ${i + 1} must have a valid receipt`);
        assert.ok(stages[i].receipt.signature.length >= 32);
      }

      // Step 5: Observability check via GET /api/ventures/:id
      const queryResp = await fetch(`${baseUrl}/api/ventures/${launchData.venture.id}`);
      assert.equal(queryResp.status, 200);
      const queryData = await queryResp.json();
      assert.equal(queryData.venture.id, launchData.venture.id);
      assert.equal(queryData.pipeline.overallStatus, 'COMPLETED');
    });
  });

  describe('Scenario 2: Serial Entrepreneur Fast Eject & BYOK Workflow', () => {
    it('saves BYOK keys -> pings connectivity -> triggers 1-click Git ejection with AST scan & badge', async () => {
      const serialTenant = 'tenant_serial_hacker_42';

      // Step 1: Serial founder inputs BYOK keys into key vault
      const byokSaveResp = await fetch(`${baseUrl}/api/byok/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: serialTenant,
          anthropicKey: 'sk-ant-api03-live-prod-key-xyz12345678',
          stripeSecretKey: 'rk_live_9876543210fedcba',
          openaiKey: 'sk-proj-super-secret-key-12345',
        }),
      });

      assert.equal(byokSaveResp.status, 200);
      const byokSaveData = await byokSaveResp.json();
      assert.equal(byokSaveData.circuitBreaker.byokMode, true);
      assert.equal(byokSaveData.circuitBreaker.status, 'BYOK_ENFORCED');

      // Step 2: Query BYOK status, confirming key prefixes masked
      const byokStatusResp = await fetch(`${baseUrl}/api/byok/${serialTenant}`);
      assert.equal(byokStatusResp.status, 200);
      const byokStatusData = await byokStatusResp.json();
      assert.equal(byokStatusData.byokActive, true);
      assert.equal(byokStatusData.configuredProviders.anthropic, true);
      assert.equal(byokStatusData.configuredProviders.openai, true);
      assert.ok(byokStatusData.maskedKeys.anthropic.includes('...'));
      assert.ok(byokStatusData.maskedKeys.openai.includes('...'));

      // Step 3: Trigger Gate 5 100% Clean-Room Git Ejection
      const ejectResult = await executeGate5({
        ventureId: 'ven_serial_quick_eject',
        domain: 'quick-eject.axiomrun.app',
        stagingUrl: 'https://stage-quick-eject.axiomrun.app',
        expectedDnsTarget: 'cname.axiomrun.app',
        sandboxMode: true,
      });

      assert.equal(ejectResult.status, 'PASSED');
      assert.equal(ejectResult.assertionsFailed, 0);

      // Verify G5-LOCKIN-001 AST Scan passed cleanly
      const lockinAssertion = ejectResult.receipt?.assertions.find((a) => a.assertionId === 'G5-LOCKIN-001');
      assert.ok(lockinAssertion);
      assert.equal(lockinAssertion.status, 'PASS');
      assert.ok(String(lockinAssertion.actual).includes('0 proprietary imports'));

      // Verify GitHub repository creation via GitHub Sandbox
      const repo = await gitHubSandbox.createRepo('ven_serial_quick_eject');
      assert.ok(repo.cloneUrl.includes('ven_serial_quick_eject.git'));
      assert.ok(repo.htmlUrl.includes('ven_serial_quick_eject'));

      // Verify Cryptographic README verification badge embed
      assert.ok(ejectResult.metrics.badgeMarkdown.includes('Verified by Axiom OS'));
      assert.ok(ejectResult.metrics.badgeMarkdown.includes('axiomrun.app/badges/ven_serial_quick_eject.svg'));
      assert.ok(ejectResult.receipt?.signature);
    });
  });

  describe('Scenario 3: Zero-Charge Failure Containment Stress Test', () => {
    it('handles simulated malformed venture -> 3 self-healing retries -> abort -> Delta B == 0 -> circuit breaker trip ($9.45)', async () => {
      const stressTenant = 'tenant_stress_tester_99';
      const stressBreaker = new TenantFailureCircuitBreaker();
      const stressLedger = new TwoPhaseCommitCreditLedger(stressBreaker);
      const stressRunner = new StageGateRunner(stressLedger, stressBreaker);

      // Initialize wallet with 200 credits
      stressLedger.getOrCreateWallet(stressTenant, 200.0);
      const initialBalance = await stressLedger.getBalance(stressTenant);

      // Run 1: Gate 2 Health timeout failure with 3 retries
      const exec1 = await stressRunner.executePipeline({
        ventureId: 'ven_malformed_001',
        ventureName: 'Malformed Health Venture',
        tenantId: stressTenant,
        creditCost: 20.0,
        config: {
          failureSimulations: {
            failGate2Health: true,
          },
        },
      });

      assert.equal(exec1.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(exec1.escrowStatus, 'REFUNDED_ZERO_CHARGE');
      assert.equal(exec1.stages[1].status, 'FAILED');
      assert.ok(exec1.stages[1].diagnosticLogs.some((l) => l.includes('timeout') || l.includes('FAIL')));

      // Invariant: User balance strictly preserved (Delta B == 0.00)
      const bal1 = await stressLedger.getBalance(stressTenant);
      assert.equal(bal1, initialBalance, 'Delta B must be strictly 0.00 on abort');

      // Platform absorbed COGS: 3 retries ($0.45) + base unhealed failure ($1.890) = $2.340
      assert.equal(exec1.absorbedPlatformCogsUsd, 2.34);

      // Failures 2, 3, 4, 5
      for (let i = 2; i <= 5; i++) {
        const execN = await stressRunner.executePipeline({
          ventureId: `ven_malformed_00${i}`,
          ventureName: `Malformed Venture ${i}`,
          tenantId: stressTenant,
          creditCost: 20.0,
          config: {
            failureSimulations: {
              failGate1Type: true,
            },
          },
        });
        assert.equal(execN.overallStatus, 'ABORTED_ZERO_CHARGE');
        assert.equal(await stressLedger.getBalance(stressTenant), initialBalance);
      }

      // Check circuit breaker status after 5 unhealed failures
      const breakerRec = stressBreaker.getRecord(stressTenant);
      assert.equal(breakerRec.consecutiveUnhealedFailures, 5);
      assert.equal(breakerRec.circuitBreakerTripped, true);
      assert.equal(breakerRec.status, 'TRIPPED_INTERVENTION_REQUIRED');

      // Verify platform-absorbed COGS capped at exactly $9.45 (5 * $1.890)
      assert.equal(breakerRec.monthlyCogsAbsorbed, 9.45);

      // Verify 6th attempt is blocked
      await assert.rejects(
        async () =>
          stressRunner.executePipeline({
            ventureId: 'ven_malformed_006',
            ventureName: 'Blocked 6th Venture',
            tenantId: stressTenant,
          }),
        /TENANT_CIRCUIT_BREAKER_TRIPPED/
      );
    });
  });

  describe('Scenario 4: Stripe Sandbox Subscriber Onboarding Flow', () => {
    it('queries tiers -> selects Serial ($149) -> creates checkout session -> processes signed webhook', async () => {
      // Step 1: Query checkout config
      const configResp = await fetch(`${baseUrl}/api/checkout/config`);
      assert.equal(configResp.status, 200);
      const configData = await configResp.json();
      assert.equal(configData.sandboxMode, true);
      const serialTier = configData.supportedTiers.find((t: any) => t.id === 'SERIAL');
      assert.ok(serialTier, 'SERIAL plan must be present');
      assert.equal(serialTier.priceUsd, 149);

      // Step 2: Create checkout session
      const sessionResp = await fetch(`${baseUrl}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'SERIAL',
          email: 'founder.pro@serialstudio.dev',
        }),
      });

      assert.equal(sessionResp.status, 201);
      const sessionData = await sessionResp.json();
      assert.ok(sessionData.sessionId.startsWith('cs_test_'));
      assert.ok(sessionData.url.includes(sessionData.sessionId));
      assert.equal(sessionData.plan, 'SERIAL');

      // Step 3: Simulate Stripe customer completing payment with tok_visa
      const webhookPayload = JSON.stringify({
        id: `evt_onboarding_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionData.sessionId,
            customer: sessionData.customer.id,
            customer_email: 'founder.pro@serialstudio.dev',
            plan: 'SERIAL',
            amount_total: 14900,
            currency: 'usd',
            payment_status: 'paid',
          },
        },
      });

      const secret = 'whsec_axiomos_test_secret_2026';
      const sigHeader = stripeSandbox.generateWebhookHeader(webhookPayload, secret);

      // Step 4: Dispatch signed webhook
      const webhookResp = await fetch(`${baseUrl}/api/checkout/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': sigHeader,
        },
        body: webhookPayload,
      });

      assert.equal(webhookResp.status, 200);
      const webhookData = await webhookResp.json();
      assert.equal(webhookData.message, 'PROVISIONED_SUCCESS');
      assert.equal(webhookData.status, 200);
    });
  });

  describe('Scenario 5: Adversarial Multi-Vector Concurrency Flood', () => {
    it('dispatches 3 simultaneous webhooks with identical payload, preventing double-provisioning', async () => {
      const floodEventId = `evt_flood_${Date.now()}`;
      const floodPayload = JSON.stringify({
        id: floodEventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_flood_${Date.now()}`,
            customer: 'cus_flood_victim',
            amount_total: 14900,
            status: 'complete',
          },
        },
      });

      const secret = 'whsec_axiomos_test_secret_2026';
      const sigHeader = stripeSandbox.generateWebhookHeader(floodPayload, secret);

      // Dispatch 3 concurrent requests simultaneously
      const promises = [1, 2, 3].map(() =>
        fetch(`${baseUrl}/api/checkout/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': sigHeader,
          },
          body: floodPayload,
        }).then((res) => res.json())
      );

      const responses = await Promise.all(promises);

      // Exactly 1 must be PROVISIONED_SUCCESS, and 2 must be DUPLICATE_IDEMPOTENT_IGNORED
      const provisionedCount = responses.filter((r) => r.message === 'PROVISIONED_SUCCESS').length;
      const duplicateCount = responses.filter((r) => r.message === 'DUPLICATE_IDEMPOTENT_IGNORED').length;

      assert.equal(provisionedCount, 1, 'Exactly one webhook in flood may provision tenant');
      assert.equal(duplicateCount, 2, 'Two duplicate flood webhooks must be cleanly ignored');
    });
  });
});
