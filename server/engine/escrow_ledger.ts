/**
 * Two-Phase Commit (2PC) Credit Escrow Ledger
 * 
 * Axiom OS Zero-Charge Failure Guarantee:
 * - Mathematical Invariant: Net user credit burn on failed or aborted gate is strictly 0.00 (Delta B == 0.00).
 * - Phase 1 (Prepare): holdCredits() locks milestone credits in escrow; funds are inaccessible.
 * - Phase 2 (Commit): commitCredits() settles funds upon cryptographically verified PASS receipt.
 * - Phase 2 (Abort): refundZeroCharge() releases 100% of escrowed funds back to user wallet upon failure.
 * - All self-healing compute and retry tokens are billed to internal Platform Reserve ($0 liability to user).
 * - Integrated with TenantFailureCircuitBreaker to enforce $9.45 COGS cap and freeze retries after 5 unhealed failures.
 */

import { randomUUID } from 'node:crypto';
import { tenantCircuitBreaker, TenantFailureCircuitBreaker } from './circuit_breaker.js';

export type EscrowState = 'PENDING_AUTHORIZATION' | 'HELD' | 'COMMITTED' | 'REFUNDED';

export interface EscrowHold {
  escrowId: string;
  tenantId: string;
  ventureId: string;
  creditsHeld: number;
  stageIndex: number;
  state: EscrowState;
  timestamp: string;
  idempotencyKey?: string;
  verificationHash?: string;
  refundReason?: string;
  settledAt?: string;
  rolledBackAt?: string;
}

export interface CreditWallet {
  tenantId: string;
  availableCredits: number;
  escrowLockedCredits: number;
  initialBalance: number;
  updatedAt: string;
}

export interface CreditLedger {
  holdCredits(
    tenantId: string,
    ventureId: string,
    credits: number,
    stage: number,
    idempotencyKey?: string
  ): Promise<EscrowHold>;
  commitCredits(
    escrowId: string,
    verificationHash?: string
  ): Promise<{ success: boolean; newBalance: number }>;
  refundZeroCharge(
    escrowId: string,
    reason: string,
    cogsIncurred?: number
  ): Promise<{ refunded: boolean; invariantDeltaB: 0.00; balance: number }>;
  getBalance(tenantId: string): Promise<number>;
  getLockedCredits(tenantId: string): Promise<number>;
}

export class TwoPhaseCommitCreditLedger implements CreditLedger {
  private wallets: Map<string, CreditWallet> = new Map();
  private holds: Map<string, EscrowHold> = new Map();
  private idempotencyIndex: Map<string, string> = new Map(); // idempotencyKey -> escrowId

  constructor(private circuitBreaker: TenantFailureCircuitBreaker = tenantCircuitBreaker) {}

  /**
   * Initialize or retrieve a tenant's credit wallet.
   */
  public getOrCreateWallet(tenantId: string, defaultCredits: number = 100.0): CreditWallet {
    let wallet = this.wallets.get(tenantId);
    if (!wallet) {
      wallet = {
        tenantId,
        availableCredits: defaultCredits,
        escrowLockedCredits: 0.0,
        initialBalance: defaultCredits,
        updatedAt: new Date().toISOString(),
      };
      this.wallets.set(tenantId, wallet);
    }
    return wallet;
  }

  /**
   * Fund a tenant wallet with additional credits.
   */
  public depositCredits(tenantId: string, amount: number): CreditWallet {
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    const wallet = this.getOrCreateWallet(tenantId);
    wallet.availableCredits = Number((wallet.availableCredits + amount).toFixed(4));
    wallet.updatedAt = new Date().toISOString();
    return { ...wallet };
  }

  /**
   * Phase 1 (Prepare): Lock credits into escrow before executing stage gate.
   * Enforces circuit breaker check, balance check, and idempotency deduplication.
   */
  public async holdCredits(
    tenantId: string,
    ventureId: string,
    credits: number,
    stage: number,
    idempotencyKey?: string
  ): Promise<EscrowHold> {
    // 1. Assert tenant circuit breaker is not tripped
    this.circuitBreaker.assertCanExecute(tenantId);

    // 2. Idempotency Check
    if (idempotencyKey && this.idempotencyIndex.has(idempotencyKey)) {
      const existingId = this.idempotencyIndex.get(idempotencyKey)!;
      const existingHold = this.holds.get(existingId);
      if (existingHold && existingHold.state === 'HELD') {
        return { ...existingHold };
      }
    }

    const wallet = this.getOrCreateWallet(tenantId);

    // 3. Balance verification
    if (wallet.availableCredits < credits) {
      throw new Error(
        `ERR_ESCROW_INSUFFICIENT: Insufficient available credits. Required: ${credits}, Available: ${wallet.availableCredits}`
      );
    }

    // 4. Atomic balance transition
    wallet.availableCredits = Number((wallet.availableCredits - credits).toFixed(4));
    wallet.escrowLockedCredits = Number((wallet.escrowLockedCredits + credits).toFixed(4));
    wallet.updatedAt = new Date().toISOString();

    const escrowId = `escrow_${randomUUID()}`;
    const hold: EscrowHold = {
      escrowId,
      tenantId,
      ventureId,
      creditsHeld: credits,
      stageIndex: stage,
      state: 'HELD',
      timestamp: new Date().toISOString(),
      idempotencyKey,
    };

    this.holds.set(escrowId, hold);
    if (idempotencyKey) {
      this.idempotencyIndex.set(idempotencyKey, escrowId);
    }

    return { ...hold };
  }

  /**
   * Phase 2 (Commit): Settle escrowed funds upon verified cryptographic PASS receipt.
   * Credits are transferred to platform recognized revenue.
   */
  public async commitCredits(
    escrowId: string,
    verificationHash?: string
  ): Promise<{ success: boolean; newBalance: number }> {
    const hold = this.holds.get(escrowId);
    if (!hold) {
      throw new Error(`Escrow hold not found: ${escrowId}`);
    }

    if (hold.state !== 'HELD') {
      throw new Error(`Cannot commit escrow in state ${hold.state}`);
    }

    const wallet = this.getOrCreateWallet(hold.tenantId);
    if (wallet.escrowLockedCredits < hold.creditsHeld) {
      throw new Error('Escrow lock underflow invariant violated');
    }

    // Deduct from locked escrow (revenue recognized)
    wallet.escrowLockedCredits = Number((wallet.escrowLockedCredits - hold.creditsHeld).toFixed(4));
    wallet.updatedAt = new Date().toISOString();

    hold.state = 'COMMITTED';
    hold.verificationHash = verificationHash;
    hold.settledAt = new Date().toISOString();

    // Reset circuit breaker consecutive failure counter on verified green gate
    this.circuitBreaker.recordSuccess(hold.tenantId);

    return {
      success: true,
      newBalance: wallet.availableCredits,
    };
  }

  /**
   * Phase 2 (Rollback): 100% refund of escrowed credits to user wallet on failure.
   * Mathematical invariant: Delta B == 0.00.
   * Internal platform COGS is recorded on tenant circuit breaker.
   */
  public async refundZeroCharge(
    escrowId: string,
    reason: string,
    cogsIncurred?: number
  ): Promise<{ refunded: boolean; invariantDeltaB: 0.00; balance: number }> {
    const hold = this.holds.get(escrowId);
    if (!hold) {
      throw new Error(`Escrow hold not found: ${escrowId}`);
    }

    if (hold.state !== 'HELD') {
      throw new Error(`Cannot refund escrow in state ${hold.state}`);
    }

    const wallet = this.getOrCreateWallet(hold.tenantId);
    if (wallet.escrowLockedCredits < hold.creditsHeld) {
      throw new Error('Escrow lock underflow invariant violated');
    }

    // 100% refund back to available
    wallet.availableCredits = Number((wallet.availableCredits + hold.creditsHeld).toFixed(4));
    wallet.escrowLockedCredits = Number((wallet.escrowLockedCredits - hold.creditsHeld).toFixed(4));
    wallet.updatedAt = new Date().toISOString();

    hold.state = 'REFUNDED';
    hold.refundReason = reason;
    hold.rolledBackAt = new Date().toISOString();

    // Incur platform COGS and notify circuit breaker
    this.circuitBreaker.recordFailure(hold.tenantId, cogsIncurred);

    return {
      refunded: true,
      invariantDeltaB: 0.00,
      balance: wallet.availableCredits,
    };
  }

  public async getBalance(tenantId: string): Promise<number> {
    const wallet = this.getOrCreateWallet(tenantId);
    return wallet.availableCredits;
  }

  public async getLockedCredits(tenantId: string): Promise<number> {
    const wallet = this.getOrCreateWallet(tenantId);
    return wallet.escrowLockedCredits;
  }

  public getHold(escrowId: string): EscrowHold | undefined {
    const hold = this.holds.get(escrowId);
    return hold ? { ...hold } : undefined;
  }
}

export const escrowLedger = new TwoPhaseCommitCreditLedger();
