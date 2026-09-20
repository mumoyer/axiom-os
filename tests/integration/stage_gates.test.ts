/**
 * Integration Test Suite: Programmatic 5-Stage Gate Pipeline & Zero-Charge Protocol
 * 
 * Tests:
 * - Happy path: Full 5-stage sequential execution (Gates 1 - 5) with escrow commitment
 * - Gate 1 failure: TS syntax error, bundle budget exceeded (>250KB)
 * - Gate 2 failure: Container p95 latency SLA breach (>300ms), RFC 6125 multi-level wildcard rejection
 * - Gate 3 failure: Quad-DoH quorum failure (< 3 of 4)
 * - Gate 4 failure: Concurrent idempotency race condition simulation
 * - Gate 5 failure: Proprietary lock-in dependency detection
 * - Zero-Charge Guarantee: Net user burn is strictly 0.00 across any failure
 * - Tenant Failure Circuit Breaker: Tripping at 5 unhealed failures, capping platform COGS at $9.45
 * - Cryptographic Receipts: Immutable SHA-256 signatures for every stage
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { StageGateRunner } from '../../server/engine/stage_gate_runner.js';
import { TwoPhaseCommitCreditLedger } from '../../server/engine/escrow_ledger.js';
import { TenantFailureCircuitBreaker } from '../../server/engine/circuit_breaker.js';

describe('Stage-Gate Pipeline & Zero-Charge Protocol Integration', () => {
  let breaker: TenantFailureCircuitBreaker;
  let ledger: TwoPhaseCommitCreditLedger;
  let runner: StageGateRunner;

  const tenantId = 'tenant_integration_001';

  beforeEach(() => {
    breaker = new TenantFailureCircuitBreaker();
    ledger = new TwoPhaseCommitCreditLedger(breaker);
    runner = new StageGateRunner(ledger, breaker);
    ledger.getOrCreateWallet(tenantId, 100.0);
  });

  describe('Happy Path: Complete 5-Gate Execution', () => {
    it('executes Gates 1 to 5 cleanly, commits escrow, and generates cryptographic receipts', async () => {
      const initialBalance = await ledger.getBalance(tenantId);
      assert.equal(initialBalance, 100.0);

      const execution = await runner.executePipeline({
        ventureId: 'ven_happy_path_001',
        ventureName: 'Nexus Cloud Studio',
        tenantId,
        planTier: 'FOUNDER',
        creditCost: 20.0,
      });

      // Pipeline status checks
      assert.equal(execution.overallStatus, 'COMPLETED');
      assert.equal(execution.escrowStatus, 'COMMITTED');
      assert.equal(execution.stages.length, 5);

      // Verify all 5 gates passed
      for (let i = 0; i < 5; i++) {
        const stage = execution.stages[i];
        assert.equal(stage.status, 'PASSED', `Stage ${i + 1} (${stage.gateName}) should be PASSED`);
        assert.ok(stage.receipt, `Stage ${i + 1} must emit a GateReceipt`);
        assert.equal(stage.receipt.status, 'PASS');
        assert.ok(stage.receipt.signature.length >= 32, 'Receipt signature must be present');
        assert.ok(stage.assertionsPassed > 0);
        assert.equal(stage.assertionsFailed, 0);
      }

      // 20 credits committed
      const finalBalance = await ledger.getBalance(tenantId);
      assert.equal(finalBalance, 80.0);
      assert.equal(await ledger.getLockedCredits(tenantId), 0.0);
    });
  });

  describe('Failure Containment & Zero-Charge Guarantee', () => {
    it('contains Gate 1 TypeScript failure, halts pipeline, rolls back, and guarantees Delta B == 0.00', async () => {
      const initialBalance = await ledger.getBalance(tenantId);

      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate1_type',
        ventureName: 'Broken TS Venture',
        tenantId,
        creditCost: 20.0,
        config: {
          failureSimulations: {
            failGate1Type: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.escrowStatus, 'REFUNDED_ZERO_CHARGE');

      // Gate 1 failed
      assert.equal(execution.stages[0].status, 'FAILED');
      assert.ok(execution.stages[0].error?.includes('TS2322'));

      // Gates 2-5 never ran; rolled back
      for (let i = 1; i < 5; i++) {
        assert.equal(execution.stages[i].status, 'ROLLED_BACK');
      }

      // Zero-Charge Invariant: Net user credit burn is 0.00!
      const finalBalance = await ledger.getBalance(tenantId);
      const deltaB = initialBalance - finalBalance;
      assert.equal(deltaB, 0.00);
      assert.equal(finalBalance, 100.0);
    });

    it('contains Gate 1 bundle budget failure (>250KB) and refunds 100% of credits', async () => {
      const initialBalance = await ledger.getBalance(tenantId);

      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate1_bundle',
        ventureName: 'Oversized Bundle Venture',
        tenantId,
        creditCost: 20.0,
        config: {
          failureSimulations: {
            failGate1Bundle: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.stages[0].status, 'FAILED');
      assert.ok(execution.stages[0].error?.includes('ERR_G1_BUNDLE_OVERSIZED'));

      const finalBalance = await ledger.getBalance(tenantId);
      assert.equal(finalBalance, initialBalance);
    });

    it('contains Gate 2 container p95 latency breach (>300ms SLA)', async () => {
      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate2_health',
        ventureName: 'Laggy Container Venture',
        tenantId,
        config: {
          failureSimulations: {
            failGate2Health: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.stages[0].status, 'PASSED');
      assert.equal(execution.stages[1].status, 'FAILED');
      assert.ok(execution.stages[1].error?.includes('ERR_G2_HEALTH_TIMEOUT'));
      assert.equal(execution.stages[2].status, 'ROLLED_BACK');
    });

    it('contains Gate 2 RFC 6125 TLS multi-level subdomain rejection', async () => {
      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate2_tls',
        ventureName: 'Invalid TLS Venture',
        tenantId,
        config: {
          failureSimulations: {
            failGate2Tls: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.stages[1].status, 'FAILED');
      assert.ok(execution.stages[1].error?.includes('ERR_G2_TLS_SAN_MISMATCH'));
    });

    it('contains Gate 3 Quad-DoH quorum consensus failure (< 3 of 4)', async () => {
      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate3_dns',
        ventureName: 'Dangling DNS Venture',
        tenantId,
        config: {
          failureSimulations: {
            failGate3Dns: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.stages[0].status, 'PASSED');
      assert.equal(execution.stages[1].status, 'PASSED');
      assert.equal(execution.stages[2].status, 'FAILED');
      assert.ok(execution.stages[2].error?.includes('ERR_G3_DNS_QUORUM_FAILED'));
    });

    it('contains Gate 4 concurrent idempotency flood double-spend attempt', async () => {
      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate4_race',
        ventureName: 'Concurrent Race Venture',
        tenantId,
        config: {
          failureSimulations: {
            failGate4Concurrency: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.stages[3].status, 'FAILED');
      assert.ok(execution.stages[3].error?.includes('ERR_G4_IDEMP_RACE_CONDITION'));
    });

    it('contains Gate 5 proprietary lock-in dependency injection', async () => {
      const execution = await runner.executePipeline({
        ventureId: 'ven_fail_gate5_lockin',
        ventureName: 'Locked-In Platform Venture',
        tenantId,
        config: {
          failureSimulations: {
            failGate5Lockin: true,
          },
        },
      });

      assert.equal(execution.overallStatus, 'ABORTED_ZERO_CHARGE');
      assert.equal(execution.stages[4].status, 'FAILED');
      assert.ok(execution.stages[4].error?.includes('ERR_G5_LOCKIN_DEPENDENCY'));
    });
  });

  describe('Circuit Breaker Platform COGS Cap & Freeze Integration', () => {
    it('trips tenant circuit breaker after 5 unhealed venture failures and caps COGS at $9.45', async () => {
      const initialBalance = await ledger.getBalance(tenantId);

      // Run 5 failing venture pipelines
      for (let i = 1; i <= 5; i++) {
        const exec = await runner.executePipeline({
          ventureId: `ven_breaker_fail_${i}`,
          ventureName: `Failing Venture ${i}`,
          tenantId,
          creditCost: 20.0,
          config: {
            failureSimulations: { failGate1Type: true },
          },
        });
        assert.equal(exec.overallStatus, 'ABORTED_ZERO_CHARGE');
      }

      // Check tenant breaker state
      const breakerRec = breaker.getRecord(tenantId);
      assert.equal(breakerRec.consecutiveUnhealedFailures, 5);
      assert.equal(breakerRec.circuitBreakerTripped, true);
      assert.equal(breakerRec.monthlyCogsAbsorbed, 9.45);

      // Net user burn across all 5 failures is strictly 0.00
      const finalBalance = await ledger.getBalance(tenantId);
      assert.equal(finalBalance, initialBalance);

      // Attempting a 6th venture execution must throw circuit breaker error
      await assert.rejects(
        async () =>
          runner.executePipeline({
            ventureId: 'ven_breaker_fail_6',
            ventureName: 'Blocked 6th Venture',
            tenantId,
            creditCost: 20.0,
          }),
        /TENANT_CIRCUIT_BREAKER_TRIPPED/
      );
    });
  });
});
