/**
 * Unit Test Suite: Tenant Cumulative Failure Circuit Breaker & Margin Defense
 * 
 * Tests:
 * - 5-consecutive unhealed failure ceiling per monthly billing cycle
 * - $9.45 platform COGS absorption hard cap
 * - Mathematical gross margin floors (>= 75.77% Starter, >= 91.25% Pro, > 80% blended cohort)
 * - Autonomous retry freeze enforcement
 * - BYOK mode transition eliminating variable platform COGS ($0.00)
 * - Administrative concierge reset
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TenantFailureCircuitBreaker } from '../../server/engine/circuit_breaker.js';

describe('TenantFailureCircuitBreaker Unit Tests', () => {
  let breaker: TenantFailureCircuitBreaker;
  const tenantId = 'tenant_test_circuit_001';

  beforeEach(() => {
    breaker = new TenantFailureCircuitBreaker();
  });

  describe('Tier 1: Functional State Transitions', () => {
    it('initializes tenant in NORMAL_AUTONOMOUS with zero failures and $0 COGS', () => {
      const rec = breaker.getRecord(tenantId);
      assert.equal(rec.tenantId, tenantId);
      assert.equal(rec.consecutiveUnhealedFailures, 0);
      assert.equal(rec.monthlyCogsAbsorbed, 0.0);
      assert.equal(rec.circuitBreakerTripped, false);
      assert.equal(rec.status, 'NORMAL_AUTONOMOUS');
      assert.equal(rec.byokMode, false);
      assert.doesNotThrow(() => breaker.assertCanExecute(tenantId));
    });

    it('increments consecutive failures and accumulates $1.890 COGS per failure', () => {
      breaker.recordFailure(tenantId);
      let rec = breaker.getRecord(tenantId);
      assert.equal(rec.consecutiveUnhealedFailures, 1);
      assert.equal(rec.monthlyCogsAbsorbed, 1.89);
      assert.equal(rec.circuitBreakerTripped, false);

      breaker.recordFailure(tenantId);
      rec = breaker.getRecord(tenantId);
      assert.equal(rec.consecutiveUnhealedFailures, 2);
      assert.equal(rec.monthlyCogsAbsorbed, 3.78);
    });

    it('resets consecutive failures to 0 on verified green gate', () => {
      breaker.recordFailure(tenantId);
      breaker.recordFailure(tenantId);
      assert.equal(breaker.getRecord(tenantId).consecutiveUnhealedFailures, 2);

      breaker.recordSuccess(tenantId);
      const rec = breaker.getRecord(tenantId);
      assert.equal(rec.consecutiveUnhealedFailures, 0);
      assert.equal(rec.circuitBreakerTripped, false);
      assert.equal(rec.status, 'NORMAL_AUTONOMOUS');
      // Cumulative absorbed COGS is preserved for the monthly billing cycle
      assert.equal(rec.monthlyCogsAbsorbed, 3.78);
    });

    it('trips circuit breaker at exactly 5 consecutive unhealed failures', () => {
      for (let i = 1; i <= 4; i++) {
        breaker.recordFailure(tenantId);
        assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, false);
      }
      // 5th failure
      breaker.recordFailure(tenantId);
      const rec = breaker.getRecord(tenantId);
      assert.equal(rec.consecutiveUnhealedFailures, 5);
      assert.equal(rec.circuitBreakerTripped, true);
      assert.equal(rec.status, 'TRIPPED_INTERVENTION_REQUIRED');
      assert.equal(rec.monthlyCogsAbsorbed, 9.45);
    });

    it('enforces autonomous retry freeze when circuit breaker is tripped', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure(tenantId);
      }
      assert.throws(
        () => breaker.assertCanExecute(tenantId),
        /TENANT_CIRCUIT_BREAKER_TRIPPED/
      );
    });
  });

  describe('Tier 2: Mathematical Margins & Boundary Values', () => {
    it('guarantees worst-case Starter gross margin >= 75.75% (actual: 75.77%)', () => {
      for (let i = 0; i < 5; i++) breaker.recordFailure(tenantId);
      const report = breaker.calculateGrossMargin(tenantId);

      assert.equal(report.monthlySubscriptionFee, 39.00);
      assert.equal(report.platformCogsAbsorbed, 9.45);
      assert.equal(report.netMarginUsd, 29.55);
      assert.equal(report.grossMarginPercent, 75.77);
      assert.equal(report.marginFloorSatisfied, true);
      assert.equal(report.circuitBreakerTripped, true);
    });

    it('guarantees Pro tier gross margin >= 91.25%', () => {
      const proTenant = 'tenant_pro_margin_002';
      // Initialize as PRO
      breaker = new TenantFailureCircuitBreaker();
      // Record failure on Pro
      const rec = breaker.recordFailure(proTenant);
      // Change to pro tier for test
      const fullRec = breaker.getRecord(proTenant);
      fullRec.subscriptionTier = 'PRO';
      fullRec.monthlySubscriptionFee = 108.00;

      // 4 more failures
      for (let i = 0; i < 4; i++) breaker.recordFailure(proTenant);

      const margin = (108.00 - 9.45) / 108.00 * 100;
      assert.equal(Number(margin.toFixed(2)), 91.25);
      assert.ok(margin > 90.0);
    });

    it('validates blended cohort gross margin strictly preserved > 80% (83.34%)', () => {
      const cohort = TenantFailureCircuitBreaker.calculateBlendedCohortMargin(100, 8, 39.00, 6.24, 9.45);
      assert.equal(cohort.totalRevenue, 3900.00);
      assert.equal(cohort.totalCogs, 649.68);
      assert.equal(cohort.blendedMarginPercent, 83.34);
      assert.ok(cohort.blendedMarginPercent > 80.0);
    });
  });

  describe('Tier 3: BYOK Mode Transitions & Administrative Reset', () => {
    it('transitions to BYOK mode and eliminates platform token COGS exposure ($0.00)', () => {
      // 5 failures trip the breaker
      for (let i = 0; i < 5; i++) breaker.recordFailure(tenantId);
      assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, true);

      // Switch to BYOK
      const byokRec = breaker.switchToByok(tenantId);
      assert.equal(byokRec.byokMode, true);
      assert.equal(byokRec.status, 'BYOK_ENFORCED');
      assert.equal(byokRec.circuitBreakerTripped, false);

      // Subsequent failures in BYOK mode incur exactly $0.00 platform COGS
      const beforeCogs = byokRec.monthlyCogsAbsorbed;
      breaker.recordFailure(tenantId);
      const afterCogs = breaker.getRecord(tenantId).monthlyCogsAbsorbed;
      assert.equal(afterCogs, beforeCogs);

      // Retries are unfrozen
      assert.doesNotThrow(() => breaker.assertCanExecute(tenantId));
    });

    it('administrative reset restores NORMAL_AUTONOMOUS and unfreezes retries', () => {
      for (let i = 0; i < 5; i++) breaker.recordFailure(tenantId);
      assert.equal(breaker.getRecord(tenantId).circuitBreakerTripped, true);

      const resetRec = breaker.resetBreaker(tenantId);
      assert.equal(resetRec.consecutiveUnhealedFailures, 0);
      assert.equal(resetRec.circuitBreakerTripped, false);
      assert.equal(resetRec.status, 'NORMAL_AUTONOMOUS');
      assert.doesNotThrow(() => breaker.assertCanExecute(tenantId));
    });
  });

  describe('Tier 4: Adversarial Denial-of-Wallet Defense', () => {
    it('blocks repeated retries (attempts 6-25), preventing COGS runaway past $9.45', () => {
      // First 5 failures are absorbed
      for (let i = 0; i < 5; i++) breaker.recordFailure(tenantId);
      assert.equal(breaker.getRecord(tenantId).monthlyCogsAbsorbed, 9.45);

      // Attempts 6 to 25 must be blocked by assertCanExecute
      let blockedCount = 0;
      for (let attempt = 6; attempt <= 25; attempt++) {
        try {
          breaker.assertCanExecute(tenantId);
        } catch {
          blockedCount++;
        }
      }
      assert.equal(blockedCount, 20);
      // Total platform COGS absorbed remains strictly $9.45!
      assert.equal(breaker.getRecord(tenantId).monthlyCogsAbsorbed, 9.45);
    });
  });
});
