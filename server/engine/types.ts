/**
 * Axiom OS Stage-Gate Engine Core Types & Receipts
 */

import { createHmac } from 'node:crypto';

export type GateNumber = 1 | 2 | 3 | 4 | 5;
export type GateStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ROLLED_BACK';

export interface AssertionResult {
  assertionId: string;
  name: string;
  status: 'PASS' | 'FAIL';
  latencyMs: number;
  expected: unknown;
  actual: unknown;
  errorTrace?: string;
}

export interface GateReceipt {
  gateNumber: number;
  ventureId: string;
  timestamp: string;
  status: 'PASS' | 'FAIL';
  assertions: AssertionResult[];
  executionTimeMs: number;
  remediationAttempts: number;
  signature: string;
}

export interface StageGateResult {
  gateId: number;
  gateName: string;
  status: GateStatus;
  startTime: number;
  durationMs: number;
  metrics: Record<string, any>;
  diagnosticLogs: string[];
  assertionsPassed: number;
  assertionsFailed: number;
  error?: string;
  receipt?: GateReceipt;
}

export interface VenturePipelineExecution {
  ventureId: string;
  ventureName: string;
  tenantId: string;
  planTier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  stages: StageGateResult[];
  overallStatus: 'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED_ZERO_CHARGE';
  escrowStatus: 'HELD' | 'COMMITTED' | 'REFUNDED_ZERO_CHARGE';
  absorbedPlatformCogsUsd: number;
  circuitBreakerTripped: boolean;
  byokMode?: boolean;
}

export interface GateExecutionConfig {
  ventureId: string;
  repoPath?: string;
  domain?: string;
  stagingUrl?: string;
  expectedDnsTarget?: string;
  databaseUrl?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  userGitRemote?: string;
  sandboxMode?: boolean;
  failureSimulations?: {
    failGate1Type?: boolean;
    failGate1Zod?: boolean;
    failGate1Bundle?: boolean;
    failGate2Health?: boolean;
    failGate2Tls?: boolean;
    failGate3Dns?: boolean;
    failGate4Stripe?: boolean;
    failGate4Concurrency?: boolean;
    failGate5Lockin?: boolean;
  };
}

/**
 * Generates an immutable cryptographic SHA-256 HMAC signature for a gate receipt.
 */
export function signGateReceipt(receiptData: Omit<GateReceipt, 'signature'>, secret: string = 'axiom_supervisor_secret_key_2026'): string {
  const payload = JSON.stringify({
    gateNumber: receiptData.gateNumber,
    ventureId: receiptData.ventureId,
    timestamp: receiptData.timestamp,
    status: receiptData.status,
    assertionsCount: receiptData.assertions.length,
    executionTimeMs: receiptData.executionTimeMs,
  });
  return createHmac('sha256', secret).update(payload).digest('hex');
}
