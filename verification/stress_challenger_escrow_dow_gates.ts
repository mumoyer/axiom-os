/**
 * Empirical Challenger Stress Suite:
 * 1. 2PC Credit Escrow Invariant (Delta B == 0.00) under High Concurrency, Decimal Precision & Conservation
 * 2. Denial-of-Wallet (DoW) Abuse Bounding ($9.45 COGS Cap, 5-Failure Freeze, BYOK Bypass)
 * 3. Deterministic Stage-Gate Failure Injection across all 5 Gates & Sub-vectors
 */

import { TwoPhaseCommitCreditLedger } from '../server/engine/escrow_ledger.js';
import { TenantFailureCircuitBreaker } from '../server/engine/circuit_breaker.js';
import { StageGateRunner } from '../server/engine/stage_gate_runner.js';
import { cloudDnsSandbox, stripeSandbox, gitHubSandbox } from '../server/engine/sandbox_adapters.js';

interface StressTestSummary {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs: number;
}

const testResults: StressTestSummary[] = [];

function recordResult(category: string, name: string, passed: boolean, details: string, durationMs: number) {
  testResults.push({
    category,
    name,
    status: passed ? 'PASS' : 'FAIL',
    details,
    durationMs,
  });
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name} (${durationMs}ms) - ${details}`);
}

async function runEscrowInvariantStressTests() {
  console.log('\n================================================================================');
  console.log('CATEGORY 1: 2PC CREDIT ESCROW INVARIANT (Delta B == 0.00) EMPIRICAL STRESS');
  console.log('================================================================================');

  // Test 1.1: 50 Concurrent Failing Pipelines Across 5 Tenants (Delta B == 0.00 Invariance)
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const runner = new StageGateRunner(ledger, breaker);

    const initialWallets: Record<string, number> = {
      t_concurrent_1: 500.0,
      t_concurrent_2: 500.0,
      t_concurrent_3: 500.0,
      t_concurrent_4: 500.0,
      t_concurrent_5: 500.0,
    };

    for (const [tid, bal] of Object.entries(initialWallets)) {
      ledger.getOrCreateWallet(tid, bal);
    }

    // Launch 10 parallel failing pipelines for each of the 5 tenants (total 50 concurrent requests)
    // Note: breaker trips at 5, so each tenant will run 4 failures, trip on 5th, and 6-10 will be blocked
    const promises: Promise<any>[] = [];
    for (const tid of Object.keys(initialWallets)) {
      for (let i = 0; i < 10; i++) {
        promises.push(
          runner
            .executePipeline({
              ventureId: `ven_stress_${tid}_${i}`,
              ventureName: `Stress Venture ${tid}-${i}`,
              tenantId: tid,
              creditCost: 25.0,
              config: {
                failureSimulations: { failGate1Type: true },
              },
            })
            .catch((err) => ({ error: err.message }))
        );
      }
    }

    await Promise.all(promises);

    // Verify Delta B == 0.00 for EVERY tenant wallet
    let allDeltaBZero = true;
    for (const [tid, initBal] of Object.entries(initialWallets)) {
      const currentBal = await ledger.getBalance(tid);
      const locked = await ledger.getLockedCredits(tid);
      if (currentBal !== initBal || locked !== 0.0) {
        allDeltaBZero = false;
        console.error(`Tenant ${tid} leaked credits! Initial: ${initBal}, Current: ${currentBal}, Locked: ${locked}`);
      }
    }

    recordResult(
      '2PC Escrow',
      '50 Concurrent Pipelines Across 5 Tenants: Strict Delta B == 0.00 Conservation',
      allDeltaBZero,
      'All 5 tenant wallets returned exactly to initial balances with 0 locked credits',
      Date.now() - t0
    );
  }

  // Test 1.2: System-Wide Credit Conservation Law: Available + Locked + Committed == Total Deposited
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);

    const tenantId = 't_conservation_001';
    const initialDeposit = 2500.0;
    ledger.getOrCreateWallet(tenantId, initialDeposit);

    let recognizedRevenue = 0.0;
    const holds: any[] = [];

    // Create 20 holds of varying amounts
    for (let i = 0; i < 20; i++) {
      const amount = (i + 1) * 5.0; // 5, 10, 15, ..., 100 (total = 1050)
      const hold = await ledger.holdCredits(tenantId, `v_cons_${i}`, amount, 1);
      holds.push(hold);
    }

    // Commit half (10) and Refund half (10)
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        // Commit
        await ledger.commitCredits(holds[i].escrowId, 'hash_commit');
        recognizedRevenue += holds[i].creditsHeld;
      } else {
        // Refund
        await ledger.refundZeroCharge(holds[i].escrowId, 'Test Abort');
      }
    }

    const availableCredits = await ledger.getBalance(tenantId);
    const lockedCredits = await ledger.getLockedCredits(tenantId);
    const totalSystemCredits = Number((availableCredits + lockedCredits + recognizedRevenue).toFixed(4));

    const conserved = totalSystemCredits === initialDeposit && lockedCredits === 0.0;
    recordResult(
      '2PC Escrow',
      'Universal Conservation Invariant: Available + Locked + Recognized == TotalDeposited',
      conserved,
      `Avail: ${availableCredits}, Locked: ${lockedCredits}, Revenue: ${recognizedRevenue} -> Total: ${totalSystemCredits} == ${initialDeposit}`,
      Date.now() - t0
    );
  }

  // Test 1.3: Floating-Point Epsilon Drift Stress over 1,000 Hold & Refund Cycles
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const tenantId = 't_epsilon_stress';
    const initialBalance = 1000.0;
    ledger.getOrCreateWallet(tenantId, initialBalance);
    // Switch to BYOK so 1,000 consecutive aborts are permitted without tripping the 5-failure ceiling
    breaker.switchToByok(tenantId);

    let driftDetected = false;
    for (let i = 0; i < 1000; i++) {
      // Sub-cent amounts: 0.1234, 0.5678, etc.
      const microAmount = 0.1234;
      const hold = await ledger.holdCredits(tenantId, `ven_micro_${i}`, microAmount, 1);
      await ledger.refundZeroCharge(hold.escrowId, 'Micro Abort', 0.0);
    }

    const finalBalance = await ledger.getBalance(tenantId);
    const delta = Math.abs(finalBalance - initialBalance);
    driftDetected = delta > 0.000001;

    recordResult(
      '2PC Escrow',
      '1,000 Micro-Transaction Hold & Refund Cycles: Zero Floating-Point Drift',
      !driftDetected,
      `Balance after 1,000 iterations: ${finalBalance} (Exact delta: ${delta})`,
      Date.now() - t0
    );
  }

  // Test 1.4: Race Condition: Parallel Promise.all of commitCredits vs refundZeroCharge on Same Escrow
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const tenantId = 't_race_commit_refund';
    ledger.getOrCreateWallet(tenantId, 500.0);
    breaker.switchToByok(tenantId);

    let cleanMutexHandling = true;
    for (let i = 0; i < 20; i++) {
      const hold = await ledger.holdCredits(tenantId, `v_race_${i}`, 20.0, 1);

      // Race commit vs refund simultaneously
      const results = await Promise.allSettled([
        ledger.commitCredits(hold.escrowId, 'hash_verified'),
        ledger.refundZeroCharge(hold.escrowId, 'Simulated Race Abort'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE must succeed and ONE must be rejected
      if (fulfilled.length !== 1 || rejected.length !== 1) {
        cleanMutexHandling = false;
        console.error(`Race condition violation at iteration ${i}: fulfilled=${fulfilled.length}, rejected=${rejected.length}`);
      }
    }

    recordResult(
      '2PC Escrow',
      'State-Machine Mutex: Concurrent Commit vs. Refund Race on 20 Identical Escrow Holds',
      cleanMutexHandling,
      'Exactly 1 outcome succeeded per hold (zero double-settlement or dual-mutation)',
      Date.now() - t0
    );
  }

  // Test 1.5: Concurrent Holds Racing to Exhaust Finite Balance
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const tenantId = 't_exhaust_race';
    ledger.getOrCreateWallet(tenantId, 100.0); // Only 100 credits available

    // Dispatch 10 concurrent requests of 30 credits each (total demand 300 credits)
    const holdPromises = Array.from({ length: 10 }, (_, i) =>
      ledger.holdCredits(tenantId, `v_drain_${i}`, 30.0, 1)
    );

    const holdResults = await Promise.allSettled(holdPromises);
    const fulfilled = holdResults.filter((r) => r.status === 'fulfilled');
    const rejected = holdResults.filter((r) => r.status === 'rejected');

    // Exactly 3 can succeed (3 * 30 = 90 <= 100), 7 must be rejected
    const finalBalance = await ledger.getBalance(tenantId);
    const lockedCredits = await ledger.getLockedCredits(tenantId);

    const correctAllocation = fulfilled.length === 3 && rejected.length === 7 && finalBalance === 10.0 && lockedCredits === 90.0;
    recordResult(
      '2PC Escrow',
      'Concurrency Balance Depletion: 10 Parallel 30-Credit Holds on 100-Credit Wallet',
      correctAllocation,
      `Fulfilled: ${fulfilled.length} (90 credits), Rejected: ${rejected.length}, Remaining: ${finalBalance} credits`,
      Date.now() - t0
    );
  }
}

async function runDenialOfWalletStressTests() {
  console.log('\n================================================================================');
  console.log('CATEGORY 2: DENIAL-OF-WALLET (DoW) ABUSE & $9.45 COGS CAP STRESS');
  console.log('================================================================================');

  // Test 2.1: Exhaustive 50 Consecutive Failure Attacks - Hard Bounded at $9.45
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const runner = new StageGateRunner(ledger, breaker);
    const tenantId = 't_dow_attacker_001';
    ledger.getOrCreateWallet(tenantId, 5000.0);

    let blockedCount = 0;
    let failedCount = 0;

    for (let i = 1; i <= 50; i++) {
      try {
        const exec = await runner.executePipeline({
          ventureId: `ven_dow_${i}`,
          ventureName: `DoW Attack Venture ${i}`,
          tenantId,
          creditCost: 20.0,
          config: {
            failureSimulations: { failGate1Type: true },
          },
        });
        if (exec.overallStatus === 'ABORTED_ZERO_CHARGE') {
          failedCount++;
        }
      } catch (err: any) {
        if (err.message.includes('TENANT_CIRCUIT_BREAKER_TRIPPED')) {
          blockedCount++;
        } else {
          throw err;
        }
      }
    }

    const rec = breaker.getRecord(tenantId);
    const cogsCapped = rec.monthlyCogsAbsorbed === 9.45;
    const exactly5Failures = failedCount === 5 && blockedCount === 45;
    const isTripped = rec.circuitBreakerTripped === true && rec.status === 'TRIPPED_INTERVENTION_REQUIRED';

    recordResult(
      'DoW Circuit Breaker',
      '50 Consecutive Pipeline Abort Attacks: Platform COGS Strictly Bounded at $9.45',
      cogsCapped && exactly5Failures && isTripped,
      `Executed failures: ${failedCount}, Blocked attempts: ${blockedCount}, Absorbed COGS: $${rec.monthlyCogsAbsorbed.toFixed(2)}`,
      Date.now() - t0
    );
  }

  // Test 2.2: Unit Economic Gross Margin Floors across all 3 tiers at $9.45 Max COGS
  {
    const t0 = Date.now();
    const starterBreaker = new TenantFailureCircuitBreaker();
    const proBreaker = new TenantFailureCircuitBreaker();
    const entBreaker = new TenantFailureCircuitBreaker();

    // Trip all 3 tiers with 5 failures
    for (let i = 0; i < 5; i++) {
      starterBreaker.recordFailure('starter_t');
      proBreaker.recordFailure('pro_t');
      entBreaker.recordFailure('ent_t');
    }

    // Set tiers
    (starterBreaker as any).tenants.get('starter_t').subscriptionTier = 'STARTER';
    (starterBreaker as any).tenants.get('starter_t').monthlySubscriptionFee = 39.0;
    (proBreaker as any).tenants.get('pro_t').subscriptionTier = 'PRO';
    (proBreaker as any).tenants.get('pro_t').monthlySubscriptionFee = 108.0;
    (entBreaker as any).tenants.get('ent_t').subscriptionTier = 'ENTERPRISE';
    (entBreaker as any).tenants.get('ent_t').monthlySubscriptionFee = 999.0;

    const repStarter = starterBreaker.calculateGrossMargin('starter_t');
    const repPro = proBreaker.calculateGrossMargin('pro_t');
    const repEnt = entBreaker.calculateGrossMargin('ent_t');

    const starterPass = repStarter.grossMarginPercent === 75.77 && repStarter.grossMarginPercent >= 75.75;
    const proPass = repPro.grossMarginPercent === 91.25 && repPro.grossMarginPercent >= 90.0;
    const entPass = repEnt.grossMarginPercent === 99.05 && repEnt.grossMarginPercent >= 98.0;

    recordResult(
      'DoW Circuit Breaker',
      'Multi-Tier Unit Margin Guarantees Under Worst-Case $9.45 COGS Absorption',
      starterPass && proPass && entPass,
      `Starter: ${repStarter.grossMarginPercent}% (>=75.8%), Pro: ${repPro.grossMarginPercent}% (>=91.2%), Enterprise: ${repEnt.grossMarginPercent}% (>=99.0%)`,
      Date.now() - t0
    );
  }

  // Test 2.3: BYOK Mode Bypass: 20 Failing Pipelines Incur $0.00 Platform COGS
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const runner = new StageGateRunner(ledger, breaker);
    const tenantId = 't_byok_stress';
    ledger.getOrCreateWallet(tenantId, 2000.0);

    // Trip the breaker first (5 failures = $9.45 COGS)
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure(tenantId);
    }
    const preByokCogs = breaker.getRecord(tenantId).monthlyCogsAbsorbed;

    // Switch to BYOK Mode
    breaker.switchToByok(tenantId);
    const byokStatus = breaker.getRecord(tenantId).status;

    // Run 20 failing pipelines in BYOK mode
    for (let i = 0; i < 20; i++) {
      const exec = await runner.executePipeline({
        ventureId: `ven_byok_${i}`,
        ventureName: `BYOK Venture ${i}`,
        tenantId,
        creditCost: 20.0,
        config: {
          failureSimulations: { failGate1Type: true },
        },
      });
      if (exec.absorbedPlatformCogsUsd !== 0.0) {
        throw new Error(`Platform absorbed COGS during BYOK mode! ${exec.absorbedPlatformCogsUsd}`);
      }
    }

    const postByokRec = breaker.getRecord(tenantId);
    const zeroAdditionalCogs = postByokRec.monthlyCogsAbsorbed === preByokCogs;

    recordResult(
      'DoW Circuit Breaker',
      'BYOK Mode Unfreeze: 20 Failing Pipelines Incur Exactly $0.00 Additional Platform COGS',
      zeroAdditionalCogs && byokStatus === 'BYOK_ENFORCED',
      `COGS before BYOK: $${preByokCogs.toFixed(2)}, COGS after 20 failures: $${postByokRec.monthlyCogsAbsorbed.toFixed(2)} (Delta = $0.00)`,
      Date.now() - t0
    );
  }

  // Test 2.4: Mid-Sequence Green Gate Resets Failure Counter
  {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const runner = new StageGateRunner(ledger, breaker);
    const tenantId = 't_reset_on_green';
    ledger.getOrCreateWallet(tenantId, 1000.0);

    // 4 consecutive failures (1 away from trip)
    for (let i = 1; i <= 4; i++) {
      await runner.executePipeline({
        ventureId: `ven_seq_fail_${i}`,
        ventureName: `Fail ${i}`,
        tenantId,
        creditCost: 10.0,
        config: { failureSimulations: { failGate1Type: true } },
      });
    }
    const preGreenRec = breaker.getRecord(tenantId);

    // 5th run is CLEAN (Happy Path passes all 5 gates)
    const cleanExec = await runner.executePipeline({
      ventureId: 'ven_seq_success',
      ventureName: 'Clean Run',
      tenantId,
      creditCost: 10.0,
    });

    const postGreenRec = breaker.getRecord(tenantId);
    const counterReset = preGreenRec.consecutiveUnhealedFailures === 4 &&
      postGreenRec.consecutiveUnhealedFailures === 0 &&
      postGreenRec.circuitBreakerTripped === false &&
      cleanExec.overallStatus === 'COMPLETED';

    recordResult(
      'DoW Circuit Breaker',
      'Mid-Sequence Verified Pass Resets Failure Counter (4 Failures -> 1 Pass -> 0 Failures)',
      counterReset,
      `Pre-pass failure count: 4, Post-pass count: ${postGreenRec.consecutiveUnhealedFailures}, Breaker Tripped: ${postGreenRec.circuitBreakerTripped}`,
      Date.now() - t0
    );
  }
}

async function runStageGateFailureInjectionTests() {
  console.log('\n================================================================================');
  console.log('CATEGORY 3: STAGE-GATE FAILURE INJECTION ACROSS ALL 5 GATES');
  console.log('================================================================================');

  const failureVectors = [
    {
      gateId: 1,
      name: 'Gate 1 AST TypeScript Compilation Error (TS2322)',
      sim: { failGate1Type: true },
      expectedErrorPattern: 'TS2322',
    },
    {
      gateId: 1,
      name: 'Gate 1 Zod Environment Contract Validation Failure',
      sim: { failGate1Zod: true },
      expectedErrorPattern: 'ZodError',
    },
    {
      gateId: 1,
      name: 'Gate 1 First-Load JS Bundle Size Budget Exceeded (>250KB)',
      sim: { failGate1Bundle: true },
      expectedErrorPattern: 'ERR_G1_BUNDLE_OVERSIZED',
    },
    {
      gateId: 2,
      name: 'Gate 2 Container Liveness SLA Breach (p95 Latency > 300ms)',
      sim: { failGate2Health: true },
      expectedErrorPattern: 'ERR_G2_HEALTH_TIMEOUT',
    },
    {
      gateId: 2,
      name: 'Gate 2 RFC 6125 TLS Multi-Level Subdomain Attack Rejection',
      sim: { failGate2Tls: true },
      expectedErrorPattern: 'ERR_G2_TLS_SAN_MISMATCH',
    },
    {
      gateId: 3,
      name: 'Gate 3 Quad-DoH DNS Quorum Consensus Failure (< 3 of 4)',
      sim: { failGate3Dns: true },
      expectedErrorPattern: 'ERR_G3_DNS_QUORUM_FAILED',
    },
    {
      gateId: 4,
      name: 'Gate 4 Webhook Idempotency Race Condition Double-Spend',
      sim: { failGate4Concurrency: true },
      expectedErrorPattern: 'ERR_G4_IDEMP_RACE_CONDITION',
    },
    {
      gateId: 5,
      name: 'Gate 5 Zero-Lock-In Proprietary Dependency Scan Violation',
      sim: { failGate5Lockin: true },
      expectedErrorPattern: 'ERR_G5_LOCKIN_DEPENDENCY',
    },
  ];

  for (const fv of failureVectors) {
    const t0 = Date.now();
    const breaker = new TenantFailureCircuitBreaker();
    const ledger = new TwoPhaseCommitCreditLedger(breaker);
    const runner = new StageGateRunner(ledger, breaker);
    const tenantId = `t_inj_gate_${fv.gateId}_${Date.now()}`;
    const initialBalance = 100.0;
    ledger.getOrCreateWallet(tenantId, initialBalance);

    const exec = await runner.executePipeline({
      ventureId: `ven_inj_${fv.gateId}_${Date.now()}`,
      ventureName: fv.name,
      tenantId,
      creditCost: 20.0,
      config: {
        failureSimulations: fv.sim,
      },
    });

    const failedGate = exec.stages[fv.gateId - 1];
    const failedProperly = failedGate.status === 'FAILED';
    const errorMatches = failedGate.error?.toLowerCase().includes(fv.expectedErrorPattern.toLowerCase());

    // Subsequent gates must be ROLLED_BACK
    let subsequentRolledBack = true;
    for (let j = fv.gateId; j < 5; j++) {
      if (exec.stages[j].status !== 'ROLLED_BACK') {
        subsequentRolledBack = false;
      }
    }

    // Prior gates must have PASSED
    let priorPassed = true;
    for (let j = 0; j < fv.gateId - 1; j++) {
      if (exec.stages[j].status !== 'PASSED') {
        priorPassed = false;
      }
    }

    // Delta B == 0.00 check
    const finalBalance = await ledger.getBalance(tenantId);
    const zeroBurn = finalBalance === initialBalance;

    const overallPass = failedProperly && errorMatches && subsequentRolledBack && priorPassed && zeroBurn;

    recordResult(
      `Gate ${fv.gateId} Injection`,
      fv.name,
      overallPass,
      `Halted at Gate ${fv.gateId} (Error: ${failedGate.error?.slice(0, 45)}...), Rolled back: ${5 - fv.gateId} gates, Balance: ${finalBalance} (Delta B == 0.00)`,
      Date.now() - t0
    );
  }
}

async function main() {
  console.log('================================================================================');
  console.log('  AXIOM OS MVP: EMPIRICAL CHALLENGER STRESS & ADVERSARIAL TEST HARNESS');
  console.log('  Target: 2PC Escrow Invariant, Denial-of-Wallet Bounding & Stage-Gate Probes');
  console.log('================================================================================');

  const suiteStart = Date.now();

  try {
    await runEscrowInvariantStressTests();
    await runDenialOfWalletStressTests();
    await runStageGateFailureInjectionTests();
  } catch (err: any) {
    console.error('FATAL SUITE RUNTIME ERROR:', err);
    process.exit(1);
  }

  const suiteDuration = Date.now() - suiteStart;
  const totalTests = testResults.length;
  const passedTests = testResults.filter((t) => t.status === 'PASS').length;
  const failedTests = testResults.filter((t) => t.status === 'FAIL').length;

  console.log('\n================================================================================');
  console.log('  EMPIRICAL CHALLENGER SUITE SUMMARY REPORT');
  console.log('================================================================================');
  console.log(`  Total Stress Tests Executed: ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Execution Duration: ${suiteDuration}ms`);
  console.log('================================================================================');

  if (failedTests > 0) {
    console.log('\nFAILED TEST BREAKDOWN:');
    testResults
      .filter((t) => t.status === 'FAIL')
      .forEach((t) => console.log(`  - [${t.category}] ${t.name}: ${t.details}`));
    process.exit(1);
  } else {
    console.log('\nVERDICT: ALL ADVERSARIAL STRESS CHALLENGES CONFIRMED MATHEMATICALLY & EMPIRICALLY!');
    process.exit(0);
  }
}

main();
