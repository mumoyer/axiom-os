/**
 * Subscription Store & Founder Settings Management Service
 * 
 * Fulfills FTC Negative Option Rule and California ARL:
 * - Simple 1-click self-service cancellation with $0.00 penalty fees
 * - Preserves Public Beta Lifetime Rate Lock during active subscriptions
 * - Clear disclosure of plan, list price, beta price, and next renewal date
 * - Durable persistence to data/subscribers.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  TierId,
  BillingInterval,
  calculatePricing,
  BETA_CONFIG,
  PRICING_TIERS,
} from '../../shared/pricing.js';

export interface SubscriberConsentRecord {
  agreedToTerms: boolean;
  consentTimestamp: string;
  disclosureVersion: string;
  rateLockedUsd?: number;
  regularListPriceUsd?: number;
  billingInterval?: string;
}

export interface SubscriberRecord {
  id: string;
  email: string;
  plan: TierId;
  billingInterval: BillingInterval;
  status: 'active' | 'cancelled' | 'paused';
  paymentProvider?: string;
  sessionId?: string;
  rateLockedUsd: number;
  listPriceUsd: number;
  savingsUsd: number;
  monthlySavingsUsd: number;
  isBetaRateLocked: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancellationFeeUsd: number;
  cancellationReason?: string;
  cancellationTimestamp?: string;
  reactivationTimestamp?: string;
  createdAt: string;
  updatedAt: string;
  consentRecord?: SubscriberConsentRecord;
}

export interface SubscriberSummary {
  email: string;
  plan: TierId;
  billingInterval: BillingInterval;
  status: string;
  rateLockedUsd: number;
  listPriceUsd: number;
  savingsUsd: number;
  monthlySavingsUsd: number;
  isBetaRateLocked: boolean;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancellationFeeUsd: number;
  cancellationReason?: string;
}

export class SubscriptionStore {
  private storagePath: string;
  private memoryCache: Map<string, SubscriberRecord> = new Map();
  private isInitialized = false;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), 'data', 'subscribers.json');
  }

  public setStoragePathForTesting(customPath: string) {
    this.storagePath = customPath;
    this.isInitialized = false;
    this.memoryCache.clear();
  }

  public clearForTesting() {
    this.memoryCache.clear();
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath);
      }
    } catch {}
    this.isInitialized = true;
  }

  private ensureDirectory() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadFromDisk(): Map<string, SubscriberRecord> {
    const map = new Map<string, SubscriberRecord>();
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: SubscriberRecord[] = JSON.parse(raw);
        for (const sub of list) {
          map.set(sub.email.toLowerCase(), sub);
        }
      }
    } catch (err: any) {
      console.warn('[SubscriptionStore] Failed to read subscribers from disk:', err.message);
    }
    return map;
  }

  private saveToDisk(): void {
    try {
      this.ensureDirectory();
      const list = Array.from(this.memoryCache.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[SubscriptionStore] Failed to write subscribers to disk:', err.message);
    }
  }

  private init() {
    if (!this.isInitialized) {
      this.memoryCache = this.loadFromDisk();
      this.isInitialized = true;
    }
  }

  public async provisionSubscription(params: {
    email: string;
    plan: TierId | string;
    billingInterval?: BillingInterval;
    paymentProvider?: string;
    sessionId?: string;
    consentRecord?: SubscriberConsentRecord;
  }): Promise<SubscriberRecord> {
    this.init();

    const normalizedEmail = params.email.trim().toLowerCase();
    const normalizedPlan: TierId =
      (params.plan.toUpperCase() as TierId) in PRICING_TIERS
        ? (params.plan.toUpperCase() as TierId)
        : 'FOUNDER';
    const interval: BillingInterval = params.billingInterval === 'annual' ? 'annual' : 'monthly';

    const pricing = calculatePricing(normalizedPlan, interval, BETA_CONFIG.active);
    const monthlyPricing = calculatePricing(normalizedPlan, 'monthly', BETA_CONFIG.active);

    const now = new Date();
    const periodEnd = new Date(now);
    if (interval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setDate(periodEnd.getDate() + 30);
    }

    const subscriber: SubscriberRecord = {
      id: `sub_${randomUUID().slice(0, 8)}`,
      email: normalizedEmail,
      plan: normalizedPlan,
      billingInterval: interval,
      status: 'active',
      paymentProvider: params.paymentProvider || 'Shopify / Shop Pay',
      sessionId: params.sessionId,
      rateLockedUsd: pricing.priceUsd,
      listPriceUsd: pricing.listPriceUsd,
      savingsUsd: pricing.savingsUsd,
      monthlySavingsUsd: monthlyPricing.savingsUsd,
      isBetaRateLocked: BETA_CONFIG.active,
      cancelAtPeriodEnd: false,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancellationFeeUsd: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      consentRecord: params.consentRecord,
    };

    this.memoryCache.set(normalizedEmail, subscriber);
    this.saveToDisk();

    return subscriber;
  }

  public async cancelSubscription(
    email: string,
    reason?: string
  ): Promise<{
    success: boolean;
    subscriber: SubscriberRecord;
    effectiveCancellationDate: string;
  }> {
    this.init();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.memoryCache.get(normalizedEmail);
    if (!existing) {
      throw new Error(`No active subscription found for email: ${email}`);
    }

    const now = new Date().toISOString();
    const updated: SubscriberRecord = {
      ...existing,
      cancelAtPeriodEnd: true,
      cancellationFeeUsd: 0,
      cancellationReason: reason?.trim() || 'Voluntary cancellation',
      cancellationTimestamp: now,
      updatedAt: now,
    };

    this.memoryCache.set(normalizedEmail, updated);
    this.saveToDisk();

    return {
      success: true,
      subscriber: updated,
      effectiveCancellationDate: updated.currentPeriodEnd,
    };
  }

  public async reactivateSubscription(email: string): Promise<{
    success: boolean;
    subscriber: SubscriberRecord;
  }> {
    this.init();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.memoryCache.get(normalizedEmail);
    if (!existing) {
      throw new Error(`No subscription found for email: ${email}`);
    }

    const now = new Date().toISOString();
    const updated: SubscriberRecord = {
      ...existing,
      cancelAtPeriodEnd: false,
      cancellationReason: undefined,
      cancellationTimestamp: undefined,
      reactivationTimestamp: now,
      updatedAt: now,
    };

    this.memoryCache.set(normalizedEmail, updated);
    this.saveToDisk();

    return {
      success: true,
      subscriber: updated,
    };
  }

  public async getSubscriberSummary(email: string): Promise<SubscriberSummary | null> {
    this.init();

    const normalizedEmail = email.trim().toLowerCase();
    const sub = this.memoryCache.get(normalizedEmail);
    if (!sub) return null;

    return {
      email: sub.email,
      plan: sub.plan,
      billingInterval: sub.billingInterval,
      status: sub.status,
      rateLockedUsd: sub.rateLockedUsd,
      listPriceUsd: sub.listPriceUsd,
      savingsUsd: sub.savingsUsd,
      monthlySavingsUsd: sub.monthlySavingsUsd,
      isBetaRateLocked: sub.isBetaRateLocked,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      cancellationFeeUsd: sub.cancellationFeeUsd,
      cancellationReason: sub.cancellationReason,
    };
  }

  public async getSubscriber(email: string): Promise<SubscriberRecord | null> {
    this.init();
    return this.memoryCache.get(email.trim().toLowerCase()) || null;
  }
}

export const subscriptionStore = new SubscriptionStore();
