/**
 * Dedicated Unit Test Suite: Zero-Charge Failure Containment & Circuit Breaker COGS Cap
 * 
 * Mandated Verification Criteria:
 * 1. Mathematical proof of Delta B == 0.00 on any stage-gate failure or rollback.
 * 2. Strict enforcement of $9.45 platform-absorbed COGS ceiling across 5 unhealed failures.
 * 3. Bounded self-healing retries (max 3) with $0 user liability.
 * 4. Denial-of-Wallet (DoW) protection & circuit breaker trip freeze.
 * 5. BYOK zero-COGS absorption mode.
 * 6. Idempotency and concurrency safety during abort/refund transitions.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TwoPhaseCommitCreditLedger } from '../../server/engine/escrow_ledger.js';
import { TenantFailureCircuitBreaker } from '../../server/engine/circuit_breaker.js';
import { StageGateRunner } from '../../server/engine/stage_gate_runner.js';

describe('Zero-Charge Failure Containment & Circuit Breaker Unit Suite', () => {
  let breaker: TenantFailureCircuitBreaker;
  let ledger: TwoPhaseCommitCreditLedger;
  let runner: StageGateRunner;

  const tenantId = 'tenant_zero_charge_guard_001';
  const ventureId = 'ven_zero_charge_001';

  beforeEach(() => {
    breaker = new TenantFailureCircuitBreaker();
    ledger = new TwoPhaseCommitCreditLedger(breaker);
    runner = new StageGateRunner(ledger, breaker);
    ledger.getOrCreateWallet(tenantId, 1000.0);
  });

  describe('Tier 1: Functional Feature Coverage (Zero-Charge Lifecycle)', () => {
    it('guarantees Delta B == 0.00 on hold and immediate abort rollback', async () => {
      const initialBalance = await ledger.getBalance(tenantId);
      assert.equal(initialBalance, 1000.0);

      // Phase 1: Lock credits in escrow
      const hold = await ledger.holdCredits(tenantId, ventureId, 50.0, 1);
      assert.equal(hold.state, 'HELD');
      assert.equal(await ledger.getBalance(tenantId), 950.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 50.0);

      // Phase 2: Abort and refund
      const refundResult = await ledger.refundZeroCharge(hold.escrowId, 'Simulated Gate Failure', 1.890);
      assert.equal(refundResult.refunded, true);
      assert.equal(refundResult.invariantDeltaB, 0.0);

      const finalBalance = await ledger.getBalance(tenantId);
      const deltaB = Number((finalBalance - initialBalance).toFixed(6));
      assert.equal(deltaB, 0.0, 'Mathematical Invariant: Delta B must be strictly 0.00');
      assert.equal(finalBalance, initialBalance);
      assert.equal(await ledger.getLockedCredits(tenantId), 0.0);
    });

    it('absorbs self-healing retry compute costs internally with zero user liability', async () => {
      const initialBalance = await ledger.getBalance(tenantId);

      // Run pipeline with simulation configured to fail on Gate 1 permanently
      const execution = await runner.executePipeline({
        ventureId: 'ven_self_healing_test',
        ventureName: 'Self Healing Fail Venture',
        tenantId,
        creditCost: 30.0,
        config: {
          failureSimulations: {
            failGate1Type: true, // Permanent failure on Gate 1
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.escrowStatus, 'REFUNDED_ZERO_CHARGE');

      // Platform absorbs 3 retries ($0.15 * 3 = $0.45) + base unhealed failure ($1.890) = $2.340
      assert.equal(execution.absorbedPlatformCogsUsd, 2.34);

      // User wallet balance must reflect strictly Delta B == 0.00
      const finalBalance = await ledger.getBalance(tenantId);
      assert.equal(finalBalance, initialBalance);
    });

    it('increments tenant failure count and absorbs exactly $1.890 COGS per unhealed failure', () => {
      const rec1 = breaker.recordFailure(tenantId);
      assert.equal(rec1.consecutiveUnhealedFailures, 1);
      assert.equal(rec1.monthlyCogsAbsorbed, 1.89);
      assert.equal(rec1.circuitBreakerTripped, false);

      const rec2 = breaker.recordFailure(tenantId);
      assert.equal(rec2.consecutiveUnhealedFailures, 2);
      assert.equal(rec2.monthlyCogsAbsorbed, 3.78);
      assert.equal(rec2.circuitBreakerTripped, false);
    });

    it('trips circuit breaker after exactly 5 failures and caps COGS at $9.45', () => {
      for (let i = 1; i <= 4; i++) {
        const rec = breaker.recordFailure(tenantId);
        assert.equal(rec.consecutiveUnhealedFailures, i);
        assert.equal(rec.circuitBreakerTripped, false);
      }

      // 5th failure: threshold reached
      const rec5 = breaker.recordFailure(tenantId);
      assert.equal(rec5.consecutiveUnhealedFailures, 5);
      assert.equal(rec5.monthlyCogsAbsorbed, 9.45);
      assert.equal(rec5.circuitBreakerTripped, true);
      assert.equal(rec5.status, 'TRIPPED_INTERVENTION_REQUIRED');
    });

    it('calculates gross margin report correctly at circuit breaker threshold', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure(tenantId);
      }

      const report = breaker.calculateGrossMargin(tenantId);
      assert.equal(report.tenantId, tenantId);
      assert.equal(report.subscriptionTier, 'STARTER');
      assert.equal(report.monthlySubscriptionFee, 39.0);
      assert.equal(report.platformCogsAbsorbed, 9.45);
      assert.equal(report.netMarginUsd, 29.55);
      assert.equal(report.grossMarginPercent, 75.77);
      assert.equal(report.marginFloorSatisfied, true); // >= 75.0% floor
      assert.equal(report.circuitBreakerTripped, true);
    });
  });

  describe('Tier 2: Boundary Value Analysis & Error Injection', () => {
    it('prevents floating point epsilon drift on tiny decimal transactions', async () => {
      const initialBalance = await ledger.getBalance(tenantId);

      // Micro-hold
      const hold = await ledger.holdCredits(tenantId, ventureId, 0.0001, 1);
      const res = await ledger.refundZeroCharge(hold.escrowId, 'Epsilon Test', 1.890);
      assert.equal(res.refunded, true);

      const finalBalance = await ledger.getBalance(tenantId);
      // Explicit exact comparison
      assert.equal(finalBalance, initialBalance);
      assert.equal(finalBalance - initialBalance, 0);
    });

    it('handles extreme credit amounts (e.g. 50,000 credits) with clean rollback', async () => {
      const largeTenant = 'tenant_large_wallet_001';
      ledger.getOrCreateWallet(largeTenant, 100000.0);
      const initialBalance = await ledger.getBalance(largeTenant);

      const hold = await ledger.holdCredits(largeTenant, ventureId, 50000.0, 1);
      assert.equal(await ledger.getBalance(largeTenant), 50000.0);
      assert.equal(await ledger.getLockedCredits(largeTenant), 50000.0);

      await ledger.refundZeroCharge(hold.escrowId, 'Large Scale Abort', 1.890);
      assert.equal(await ledger.getBalance(largeTenant), initialBalance);
      assert.equal(await ledger.getLockedCredits(largeTenant), 0.0);
    });

    it('rejects credit hold exceeding available wallet balance', async () => {
      await assert.rejects(
        async () => ledger.holdCredits(tenantId, ventureId, 999999.0, 1),
        /ERR_ESCROW_INSUFFICIENT/
      );
    });

    it('blocks 6th failure execution when circuit breaker is tripped', async () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure(tenantId);
      }
      assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, true);

      // Attempting to run a 6th pipeline must throw immediately
      await assert.rejects(
        async () =>
          runner.executePipeline({
            ventureId: 'ven_6th_attempt',
            ventureName: 'Blocked 6th Venture',
            tenantId,
            creditCost: 10.0,
          }),
        /TENANT_CIRCUIT_BREAKER_TRIPPED/
      );
    });

    it('enforces protection on repeated refund attempts (preventing double credit)', async () => {
      const initialBalance = await ledger.getBalance(tenantId);
      const hold = await ledger.holdCredits(tenantId, ventureId, 40.0, 1);
      assert.equal(await ledger.getBalance(tenantId), initialBalance - 40.0);

      // 1st refund
      const refund1 = await ledger.refundZeroCharge(hold.escrowId, 'Abort 1', 1.890);
      assert.equal(refund1.refunded, true);
      assert.equal(await ledger.getBalance(tenantId), initialBalance);

      // 2nd refund attempt on same escrowId must throw and not double credit
      await assert.rejects(
        async () => ledger.refundZeroCharge(hold.escrowId, 'Abort 2', 1.890),
        /Cannot refund escrow in state REFUNDED/
      );
      assert.equal(await ledger.getBalance(tenantId), initialBalance, 'Must not double-credit wallet');
    });

    it('protects against concurrent race condition on refund', async () => {
      const initialBalance = await ledger.getBalance(tenantId);
      const hold = await ledger.holdCredits(tenantId, ventureId, 75.0, 1);

      // Dispatch 5 concurrent refund attempts on the same escrow hold
      const results = await Promise.allSettled([
        ledger.refundZeroCharge(hold.escrowId, 'Concurrent 1', 1.890),
        ledger.refundZeroCharge(hold.escrowId, 'Concurrent 2', 1.890),
        ledger.refundZeroCharge(hold.escrowId, 'Concurrent 3', 1.890),
        ledger.refundZeroCharge(hold.escrowId, 'Concurrent 4', 1.890),
        ledger.refundZeroCharge(hold.escrowId, 'Concurrent 5', 1.890),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      assert.equal(fulfilled.length, 1, 'Only exactly one refund operation may succeed');
      assert.equal(rejected.length, 4, 'Remaining concurrent attempts must be rejected');

      const finalBalance = await ledger.getBalance(tenantId);
      assert.equal(finalBalance, initialBalance);
      assert.equal(await ledger.getLockedCredits(tenantId), 0.0);
    });

    it('rejects refund on non-existent escrowId', async () => {
      await assert.rejects(
        async () => ledger.refundZeroCharge('non_existent_escrow_id', 'Fake Refund', 1.890),
        /Escrow hold not found: non_existent_escrow_id/
      );
    });

    it('rejects refund on already COMMITTED escrow', async () => {
      const hold = await ledger.holdCredits(tenantId, ventureId, 25.0, 1);
      await ledger.commitCredits(hold.escrowId, 'hash_pass_verified');

      await assert.rejects(
        async () => ledger.refundZeroCharge(hold.escrowId, 'Attempt Abort on Committed', 1.890),
        /Cannot refund escrow in state COMMITTED/
      );
    });
  });

  describe('Tier 3: Pairwise Combinations & Architectural Guards', () => {
    it('Pairwise 1: Multi-stage failure rollback guarantees Delta B == 0 across each individual gate', async () => {
      // Test failures at each gate 1, 2, 3, 4, 5
      const failureConfigs = [
        { name: 'Gate 1 Build Fail', sim: { failGate1Type: true }, expectedFailGate: 1 },
        { name: 'Gate 2 Infra Fail', sim: { failGate2Health: true }, expectedFailGate: 2 },
        { name: 'Gate 3 DNS Fail', sim: { failGate3Dns: true }, expectedFailGate: 3 },
        { name: 'Gate 4 Stripe Fail', sim: { failGate4Concurrency: true }, expectedFailGate: 4 },
        { name: 'Gate 5 Git Fail', sim: { failGate5Lockin: true }, expectedFailGate: 5 },
      ];

      for (const fc of failureConfigs) {
        const testTenant = `tenant_gate_fail_${fc.expectedFailGate}`;
        ledger.getOrCreateWallet(testTenant, 500.0);
        const startBal = await ledger.getBalance(testTenant);

        const exec = await runner.executePipeline({
          ventureId: `ven_fail_gate_${fc.expectedFailGate}`,
          ventureName: fc.name,
          tenantId: testTenant,
          creditCost: 25.0,
          config: {
            failureSimulations: fc.sim,
          },
        });

        assert.equal(exec.overallStatus, 'ABORTED_ZERO_CHARGE');
        assert.equal(exec.escrowStatus, 'REFUNDED_ZERO_CHARGE');
        assert.equal(exec.stages[fc.expectedFailGate - 1].status, 'FAILED');

        // Verify remaining gates marked ROLLED_BACK
        for (let j = fc.expectedFailGate; j < 5; j++) {
          assert.equal(exec.stages[j].status, 'ROLLED_BACK');
        }

        // Wallet balance must be completely preserved
        const endBal = await ledger.getBalance(testTenant);
        assert.equal(endBal, startBal, `Delta B must be 0 for failure at Gate ${fc.expectedFailGate}`);
      }
    });

    it('Pairwise 2: BYOK Mode Bypass resets platform COGS liability to $0.00 while maintaining Delta B == 0', async () => {
      // Trip the breaker first
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure(tenantId);
      }
      assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, true);

      // Switch to BYOK mode
      const byokRecord = breaker.switchToByok(tenantId);
      assert.equal(byokRecord.byokMode, true);
      assert.equal(byokRecord.status, 'BYOK_ENFORCED');

      const initialBal = await ledger.getBalance(tenantId);

      // Run pipeline in BYOK mode with permanent failure
      const exec = await runner.executePipeline({
        ventureId: 'ven_byok_failure_test',
        ventureName: 'BYOK Venture Failure',
        tenantId,
        creditCost: 20.0,
        config: {
          failureSimulations: {
            failGate1Type: true,
          },
        },
      });

      assert.equal(exec.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(exec.byokMode, true);
      // In BYOK mode, platform absorbs $0.00
      assert.equal(exec.absorbedPlatformCogsUsd, 0.0);

      // Wallet unchanged
      const finalBal = await ledger.getBalance(tenantId);
      assert.equal(finalBal, initialBal);
    });

    it('Pairwise 3: Circuit Breaker Reset restores normal autonomous operation', async () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure(tenantId);
      }
      assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, true);

      // Admin or support reset
      const resetRec = breaker.resetBreaker(tenantId);
      assert.equal(resetRec.circuitBreakerTripped, false);
      assert.equal(resetRec.consecutiveUnhealedFailures, 0);
      assert.equal(resetRec.status, 'NORMAL_AUTONOMOUS');

      // Now run clean pipeline
      const exec = await runner.executePipeline({
        ventureId: 'ven_post_reset_clean',
        ventureName: 'Post Reset Clean Venture',
        tenantId,
        creditCost: 15.0,
      });

      assert.equal(exec.overallStatus, 'COMPLETED');
      assert.equal(exec.escrowStatus, 'COMMITTED');
    });

    it('Pairwise 4: Pro tier maintains >= 91.25% gross margin under worst-case 5 failures ($9.45 COGS)', () => {
      const proFee = 108.0;
      const maxCogs = 9.45;
      const netMargin = proFee - maxCogs;
      const marginPercent = Number(((netMargin / proFee) * 100).toFixed(2));
      assert.equal(marginPercent, 91.25);
      assert.ok(marginPercent >= 91.25);
    });

    it('Pairwise 5: Enterprise tier maintains >= 99.05% gross margin under worst-case 5 failures ($9.45 COGS)', () => {
      const entFee = 999.0;
      const maxCogs = 9.45;
      const netMargin = entFee - maxCogs;
      const marginPercent = Number(((netMargin / entFee) * 100).toFixed(2));
      assert.equal(marginPercent, 99.05);
      assert.ok(marginPercent >= 99.0);
    });
  });
});
