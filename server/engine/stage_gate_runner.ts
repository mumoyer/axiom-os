/**
 * Master Stage-Gate Pipeline Orchestrator
 * 
 * Stage Gate OS Tri-Plane Orchestrator:
 * - Coordinates sequential execution of all 5 deterministic stage gates.
 * - Integrates Two-Phase Commit (2PC) Credit Escrow with Zero-Charge Failure Guarantee.
 * - Enforces bounded self-healing remediation (max 3 retries with platform-absorbed COGS).
 * - Real-time SSE telemetry dispatch.
 */

import { EventEmitter } from 'node:events';
import { executeGate1 } from './gates/gate1_build.js';
import { executeGate2 } from './gates/gate2_infra.js';
import { executeGate3 } from './gates/gate3_dns.js';
import { executeGate4 } from './gates/gate4_stripe.js';
import { executeGate5 } from './gates/gate5_git_eject.js';
import { escrowLedger, TwoPhaseCommitCreditLedger } from './escrow_ledger.js';
import { tenantCircuitBreaker, TenantFailureCircuitBreaker } from './circuit_breaker.js';
import {
  GateExecutionConfig,
  GateNumber,
  StageGateResult,
  VenturePipelineExecution,
} from './types.js';

export interface PipelineOptions {
  ventureId: string;
  ventureName: string;
  tenantId: string;
  planTier?: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  creditCost?: number;
  config?: Partial<GateExecutionConfig>;
}

export class StageGateRunner {
  private executions: Map<string, VenturePipelineExecution> = new Map();
  private telemetryEmitter: EventEmitter = new EventEmitter();

  constructor(
    private ledger: TwoPhaseCommitCreditLedger = escrowLedger,
    private breaker: TenantFailureCircuitBreaker = tenantCircuitBreaker
  ) {}

  public getExecution(ventureId: string): VenturePipelineExecution | undefined {
    const exec = this.executions.get(ventureId);
    return exec ? JSON.parse(JSON.stringify(exec)) : undefined;
  }

  public getAllExecutions(): VenturePipelineExecution[] {
    return Array.from(this.executions.values()).map((e) => JSON.parse(JSON.stringify(e)));
  }

  /**
   * Subscribe to real-time telemetry events for a venture.
   */
  public subscribeTelemetry(
    ventureId: string,
    listener: (data: { type: string; payload: any }) => void
  ): () => void {
    const eventName = `telemetry:${ventureId}`;
    this.telemetryEmitter.on(eventName, listener);
    return () => {
      this.telemetryEmitter.off(eventName, listener);
    };
  }

  private emitTelemetry(ventureId: string, type: string, payload: any) {
    this.telemetryEmitter.emit(`telemetry:${ventureId}`, { type, payload });
  }

  /**
   * Executes the full 5-stage gate pipeline for a venture.
   */
  public async executePipeline(options: PipelineOptions): Promise<VenturePipelineExecution> {
    const {
      ventureId,
      ventureName,
      tenantId,
      planTier = 'FOUNDER',
      creditCost = 20.0,
      config = {},
    } = options;

    const fullConfig: GateExecutionConfig = {
      ventureId,
      domain: config.domain || `${ventureId.slice(0, 8)}.axiomrun.app`,
      stagingUrl: config.stagingUrl || `https://stage-${ventureId.slice(0, 8)}.axiomrun.app`,
      expectedDnsTarget: config.expectedDnsTarget || 'cname.axiomrun.app',
      sandboxMode: config.sandboxMode ?? true,
      failureSimulations: config.failureSimulations || {},
    };

    const breakerRecord = this.breaker.getRecord(tenantId);
    if (breakerRecord.circuitBreakerTripped && !breakerRecord.byokMode) {
      throw new Error(
        `TENANT_CIRCUIT_BREAKER_TRIPPED: Autonomous retries frozen for tenant ${tenantId}. Platform absorption ceiling reached. Founder intervention or BYOK mode required.`
      );
    }

    // Initialize pipeline execution record
    const stages: StageGateResult[] = [
      {
        gateId: 1,
        gateName: 'Build & Strict TypeScript Check',
        status: 'PENDING',
        startTime: 0,
        durationMs: 0,
        metrics: {},
        diagnosticLogs: [],
        assertionsPassed: 0,
        assertionsFailed: 0,
      },
      {
        gateId: 2,
        gateName: 'Infrastructure & Container Health Probe',
        status: 'PENDING',
        startTime: 0,
        durationMs: 0,
        metrics: {},
        diagnosticLogs: [],
        assertionsPassed: 0,
        assertionsFailed: 0,
      },
      {
        gateId: 3,
        gateName: 'RFC 6125 SSL & Quad-DoH DNS Quorum',
        status: 'PENDING',
        startTime: 0,
        durationMs: 0,
        metrics: {},
        diagnosticLogs: [],
        assertionsPassed: 0,
        assertionsFailed: 0,
      },
      {
        gateId: 4,
        gateName: 'Stripe Checkout & Webhook Idempotency',
        status: 'PENDING',
        startTime: 0,
        durationMs: 0,
        metrics: {},
        diagnosticLogs: [],
        assertionsPassed: 0,
        assertionsFailed: 0,
      },
      {
        gateId: 5,
        gateName: 'Git Ejection & 100% Repository Portability',
        status: 'PENDING',
        startTime: 0,
        durationMs: 0,
        metrics: {},
        diagnosticLogs: [],
        assertionsPassed: 0,
        assertionsFailed: 0,
      },
    ];

    const execution: VenturePipelineExecution = {
      ventureId,
      ventureName,
      tenantId,
      planTier,
      stages,
      overallStatus: 'INITIALIZING',
      escrowStatus: 'HELD',
      absorbedPlatformCogsUsd: 0.0,
      circuitBreakerTripped: breakerRecord.circuitBreakerTripped,
      byokMode: breakerRecord.byokMode,
    };
    this.executions.set(ventureId, execution);

    // 1. Phase 1 2PC Prepare: Hold milestone credits in escrow
    let escrowHold;
    try {
      escrowHold = await this.ledger.holdCredits(
        tenantId,
        ventureId,
        creditCost,
        1,
        `idemp_pipe_${ventureId}`
      );
      this.emitTelemetry(ventureId, 'ESCROW_HELD', { escrowId: escrowHold.escrowId, amount: creditCost });
    } catch (err: any) {
      execution.overallStatus = 'ABORTED_ZERO_CHARGE';
      execution.escrowStatus = 'REFUNDED_ZERO_CHARGE';
      this.emitTelemetry(ventureId, 'PIPELINE_ABORTED', { reason: err.message });
      throw err;
    }

    execution.overallStatus = 'IN_PROGRESS';
    this.emitTelemetry(ventureId, 'PIPELINE_STARTED', { ventureId, ventureName });

    const gateExecutors: Record<GateNumber, (cfg: GateExecutionConfig) => Promise<StageGateResult>> = {
      1: executeGate1,
      2: executeGate2,
      3: executeGate3,
      4: executeGate4,
      5: executeGate5,
    };

    let pipelinePassed = true;
    let failedGateIndex = -1;

    for (let i = 0; i < 5; i++) {
      const gateNum = (i + 1) as GateNumber;
      execution.stages[i].status = 'RUNNING';
      execution.stages[i].startTime = Date.now();
      this.emitTelemetry(ventureId, 'GATE_RUNNING', { gateId: gateNum, gateName: execution.stages[i].gateName });

      let result: StageGateResult = await gateExecutors[gateNum](fullConfig);

      // Bounded self-healing retry loop (up to 3 retries if failed)
      let retryCount = 0;
      const MAX_RETRIES = 3;
      while (result.status === 'FAILED' && retryCount < MAX_RETRIES) {
        retryCount++;
        // Platform absorbs internal remediation COGS ($0.15 per retry)
        const absorbedRetryCogs = execution.byokMode ? 0.0 : 0.15;
        execution.absorbedPlatformCogsUsd = Number(
          (execution.absorbedPlatformCogsUsd + absorbedRetryCogs).toFixed(4)
        );

        this.emitTelemetry(ventureId, 'GATE_RETRYING', {
          gateId: gateNum,
          retryCount,
          absorbedCogs: execution.absorbedPlatformCogsUsd,
        });

        // Re-execute gate (unless simulation is permanent)
        result = await gateExecutors[gateNum](fullConfig);
        if (result.receipt) {
          result.receipt.remediationAttempts = retryCount;
        }
      }

      execution.stages[i] = result;
      this.emitTelemetry(ventureId, 'GATE_COMPLETED', {
        gateId: gateNum,
        status: result.status,
        durationMs: result.durationMs,
        receipt: result.receipt,
      });

      if (result.status === 'FAILED') {
        pipelinePassed = false;
        failedGateIndex = i;
        break; // Halt subsequent gates
      }
    }

    // Phase 2 Commit or Rollback
    if (pipelinePassed) {
      execution.overallStatus = 'COMPLETED';
      execution.escrowStatus = 'COMMITTED';
      const lastReceipt = execution.stages[4].receipt;
      await this.ledger.commitCredits(escrowHold.escrowId, lastReceipt?.signature);
      this.emitTelemetry(ventureId, 'PIPELINE_SUCCESS', {
        ventureId,
        totalStages: 5,
        receipt: lastReceipt,
      });
    } else {
      // Net User Burn == 0.00 Invariant Guarantee!
      execution.overallStatus = 'ABORTED_ZERO_CHARGE';
      execution.escrowStatus = 'REFUNDED_ZERO_CHARGE';

      // Roll remaining pending gates to ROLLED_BACK
      for (let j = failedGateIndex + 1; j < 5; j++) {
        execution.stages[j].status = 'ROLLED_BACK';
      }

      // Absorb baseline unhealed failure COGS ($1.890)
      const baseFailureCogs = execution.byokMode ? 0.0 : 1.890;
      execution.absorbedPlatformCogsUsd = Number(
        (execution.absorbedPlatformCogsUsd + baseFailureCogs).toFixed(4)
      );

      const refundResult = await this.ledger.refundZeroCharge(
        escrowHold.escrowId,
        `Gate ${failedGateIndex + 1} failed after self-healing attempts`,
        baseFailureCogs
      );

      // Check if tenant circuit breaker tripped
      const updatedBreaker = this.breaker.getRecord(tenantId);
      execution.circuitBreakerTripped = updatedBreaker.circuitBreakerTripped;

      this.emitTelemetry(ventureId, 'PIPELINE_ABORTED_REFUNDED', {
        ventureId,
        failedGate: failedGateIndex + 1,
        refundedCredits: creditCost,
        invariantDeltaB: refundResult.invariantDeltaB, // 0.00
        circuitBreakerTripped: updatedBreaker.circuitBreakerTripped,
      });
    }

    return JSON.parse(JSON.stringify(execution));
  }
}

export const stageGateRunner = new StageGateRunner();
