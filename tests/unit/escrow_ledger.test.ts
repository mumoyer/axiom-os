/**
 * Unit Test Suite: Two-Phase Commit (2PC) Credit Escrow Ledger & Invariants
 * 
 * Tests:
 * - Phase 1 (Prepare): Hold credits in escrow with atomic balance transition
 * - Phase 2 (Commit): Settle funds upon verified PASS receipt
 * - Phase 2 (Abort): 100% refund with strict invariant Delta B == 0.00
 * - Idempotency deduplication preventing double-debiting
 * - Insufficient balance guardrail
 * - Integration with TenantFailureCircuitBreaker
 * - Zero user burn invariant across multiple adversarial failure cycles
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TwoPhaseCommitCreditLedger } from '../../server/engine/escrow_ledger.js';
import { TenantFailureCircuitBreaker } from '../../server/engine/circuit_breaker.js';

describe('TwoPhaseCommitCreditLedger Unit Tests', () => {
  let ledger: TwoPhaseCommitCreditLedger;
  let breaker: TenantFailureCircuitBreaker;
  const tenantId = 'tenant_escrow_test_001';
  const ventureId = 'ven_escrow_001';

  beforeEach(() => {
    breaker = new TenantFailureCircuitBreaker();
    ledger = new TwoPhaseCommitCreditLedger(breaker);
    ledger.getOrCreateWallet(tenantId, 100.0);
  });

  describe('Tier 1: 2PC Functional Lifecycle', () => {
    it('initializes wallet with 100.0 available credits and 0.0 locked', async () => {
      const balance = await ledger.getBalance(tenantId);
      const locked = await ledger.getLockedCredits(tenantId);
      assert.equal(balance, 100.0);
      assert.equal(locked, 0.0);
    });

    it('Phase 1 (Prepare): holds credits, locks funds in escrow state HELD', async () => {
      const hold = await ledger.holdCredits(tenantId, ventureId, 25.0, 1);
      assert.equal(hold.state, 'HELD');
      assert.equal(hold.creditsHeld, 25.0);
      assert.equal(await ledger.getBalance(tenantId), 75.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 25.0);
    });

    it('Phase 2 (Commit): settles escrowed credits, transfers to recognized revenue', async () => {
      const hold = await ledger.holdCredits(tenantId, ventureId, 25.0, 1);
      const result = await ledger.commitCredits(hold.escrowId, 'mock_hash_123');

      assert.equal(result.success, true);
      assert.equal(result.newBalance, 75.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 0.0);

      const updatedHold = ledger.getHold(hold.escrowId);
      assert.equal(updatedHold?.state, 'COMMITTED');
      assert.equal(updatedHold?.verificationHash, 'mock_hash_123');
    });

    it('Phase 2 (Abort): releases 100% refund with mathematical invariant Delta B == 0.00', async () => {
      const initialBalance = await ledger.getBalance(tenantId);
      const hold = await ledger.holdCredits(tenantId, ventureId, 30.0, 2);

      assert.equal(await ledger.getBalance(tenantId), 70.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 30.0);

      // Gate fails -> Rollback
      const refundResult = await ledger.refundZeroCharge(hold.escrowId, 'Synthetic build failure');

      assert.equal(refundResult.refunded, true);
      assert.equal(refundResult.invariantDeltaB, 0.0);
      assert.equal(refundResult.balance, 100.0);

      // Verify exact invariant
      const finalBalance = await ledger.getBalance(tenantId);
      const deltaB = initialBalance - finalBalance;
      assert.equal(deltaB, 0.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 0.0);

      const updatedHold = ledger.getHold(hold.escrowId);
      assert.equal(updatedHold?.state, 'REFUNDED');
    });

    it('deduplicates idempotent calls to holdCredits() without double-debiting', async () => {
      const idempKey = 'idemp_unique_tx_001';
      const hold1 = await ledger.holdCredits(tenantId, ventureId, 20.0, 1, idempKey);
      const hold2 = await ledger.holdCredits(tenantId, ventureId, 20.0, 1, idempKey);

      assert.equal(hold1.escrowId, hold2.escrowId);
      // Balance only decremented once
      assert.equal(await ledger.getBalance(tenantId), 80.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 20.0);
    });
  });

  describe('Tier 2: Boundary Value & Exception Handling', () => {
    it('throws ERR_ESCROW_INSUFFICIENT if credits requested exceeds available balance', async () => {
      await assert.rejects(
        async () => ledger.holdCredits(tenantId, ventureId, 150.0, 1),
        /ERR_ESCROW_INSUFFICIENT/
      );
      // Balance remains unmodified
      assert.equal(await ledger.getBalance(tenantId), 100.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 0.0);
    });

    it('rejects commit on already committed or refunded escrow', async () => {
      const hold = await ledger.holdCredits(tenantId, ventureId, 15.0, 1);
      await ledger.commitCredits(hold.escrowId);

      await assert.rejects(
        async () => ledger.commitCredits(hold.escrowId),
        /Cannot commit escrow in state COMMITTED/
      );
    });

    it('rejects refund on already committed or refunded escrow', async () => {
      const hold = await ledger.holdCredits(tenantId, ventureId, 15.0, 1);
      await ledger.refundZeroCharge(hold.escrowId, 'Simulated failure');

      await assert.rejects(
        async () => ledger.refundZeroCharge(hold.escrowId, 'Second refund'),
        /Cannot refund escrow in state REFUNDED/
      );
    });

    it('supports wallet credit deposits', () => {
      const updated = ledger.depositCredits(tenantId, 50.0);
      assert.equal(updated.availableCredits, 150.0);
      assert.throws(() => ledger.depositCredits(tenantId, -10.0), /must be positive/);
    });
  });

  describe('Tier 3: Pairwise Integration with Tenant Circuit Breaker', () => {
    it('records failure on circuit breaker when escrow is refunded', async () => {
      const hold = await ledger.holdCredits(tenantId, ventureId, 20.0, 1);
      await ledger.refundZeroCharge(hold.escrowId, 'Test failure');

      const breakerRec = breaker.getRecord(tenantId);
      assert.equal(breakerRec.consecutiveUnhealedFailures, 1);
      assert.equal(breakerRec.monthlyCogsAbsorbed, 1.89);
    });

    it('blocks holdCredits when tenant circuit breaker trips after 5 failures', async () => {
      for (let i = 1; i <= 5; i++) {
        const hold = await ledger.holdCredits(tenantId, ventureId, 10.0, 1);
        await ledger.refundZeroCharge(hold.escrowId, `Failure ${i}`);
      }

      // Assert breaker is tripped
      assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, true);

      // Subsequent hold must be blocked
      await assert.rejects(
        async () => ledger.holdCredits(tenantId, ventureId, 10.0, 1),
        /TENANT_CIRCUIT_BREAKER_TRIPPED/
      );
    });

    it('unfreezes holdCredits after switching to BYOK mode', async () => {
      for (let i = 1; i <= 5; i++) {
        const hold = await ledger.holdCredits(tenantId, ventureId, 10.0, 1);
        await ledger.refundZeroCharge(hold.escrowId, `Failure ${i}`);
      }

      // Switch to BYOK
      breaker.switchToByok(tenantId);

      // Now holdCredits succeeds
      const hold = await ledger.holdCredits(tenantId, ventureId, 10.0, 1);
      assert.equal(hold.state, 'HELD');
    });
  });

  describe('Tier 4: Multi-Cycle Zero User Burn Invariance', () => {
    it('strictly preserves Delta B == 0.00 across 5 consecutive failure and refund cycles', async () => {
      const initialBalance = await ledger.getBalance(tenantId);
      assert.equal(initialBalance, 100.0);

      for (let cycle = 1; cycle <= 5; cycle++) {
        const hold = await ledger.holdCredits(tenantId, ventureId, 20.0, cycle);
        assert.equal(await ledger.getBalance(tenantId), 80.0);
        assert.equal(await ledger.getLockedCredits(tenantId), 20.0);

        const refund = await ledger.refundZeroCharge(hold.escrowId, `Cycle ${cycle} failure`);
        assert.equal(refund.invariantDeltaB, 0.0);
        assert.equal(await ledger.getBalance(tenantId), 100.0);
        assert.equal(await ledger.getLockedCredits(tenantId), 0.0);
      }

      const finalBalance = await ledger.getBalance(tenantId);
      const totalNetBurn = initialBalance - finalBalance;
      assert.equal(totalNetBurn, 0.0);
    });
  });
});
