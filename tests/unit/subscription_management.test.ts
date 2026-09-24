import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { subscriptionStore, SubscriberRecord } from '../../server/services/subscription_store.js';

describe('Subscription Management & Click-to-Cancel Subsystem', () => {
  const testEmail = 'founder.test@venturestudio.io';
  const testStoragePath = path.resolve(process.cwd(), 'data', 'test_subscribers.json');

  beforeEach(() => {
    subscriptionStore.setStoragePathForTesting(testStoragePath);
    subscriptionStore.clearForTesting();
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testStoragePath)) fs.unlinkSync(testStoragePath);
    } catch {}
  });

  test('provisions subscriber with Public Beta Lifetime Rate Lock on checkout completion', async () => {
    const subscriber = await subscriptionStore.provisionSubscription({
      email: testEmail,
      plan: 'FOUNDER',
      billingInterval: 'monthly',
      paymentProvider: 'Shopify / Shop Pay',
      sessionId: 'cs_test_founder_beta_001',
      consentRecord: {
        agreedToTerms: true,
        consentTimestamp: new Date().toISOString(),
        disclosureVersion: '2026-09-PUBLIC-BETA-RATE-LOCK-v1',
      },
    });

    assert.equal(subscriber.email, testEmail);
    assert.equal(subscriber.plan, 'FOUNDER');
    assert.equal(subscriber.billingInterval, 'monthly');
    assert.equal(subscriber.status, 'active');
    assert.equal(subscriber.rateLockedUsd, 55);
    assert.equal(subscriber.listPriceUsd, 69);
    assert.equal(subscriber.isBetaRateLocked, true);
    assert.equal(subscriber.cancelAtPeriodEnd, false);
    assert.ok(subscriber.currentPeriodEnd);
  });

  test('provisions annual Serial tier with correct $1,140 beta rate ($290 savings vs list)', async () => {
    const subscriber = await subscriptionStore.provisionSubscription({
      email: 'serial.founder@nextgen.com',
      plan: 'SERIAL',
      billingInterval: 'annual',
      paymentProvider: 'Stripe',
      sessionId: 'cs_test_serial_annual_002',
      consentRecord: {
        agreedToTerms: true,
        consentTimestamp: new Date().toISOString(),
        disclosureVersion: '2026-09-PUBLIC-BETA-RATE-LOCK-v1',
      },
    });

    assert.equal(subscriber.plan, 'SERIAL');
    assert.equal(subscriber.billingInterval, 'annual');
    assert.equal(subscriber.rateLockedUsd, 1140);
    assert.equal(subscriber.listPriceUsd, 1430);
    assert.equal(subscriber.savingsUsd, 290);
    assert.equal(subscriber.isBetaRateLocked, true);
  });

  test('executes 1-click self-service cancellation with zero penalty fees per FTC Negative Option rule', async () => {
    // 1. Create active subscription
    await subscriptionStore.provisionSubscription({
      email: testEmail,
      plan: 'FOUNDER',
      billingInterval: 'monthly',
      sessionId: 'cs_test_cancel_003',
    });

    // 2. Execute cancellation
    const cancelResult = await subscriptionStore.cancelSubscription(
      testEmail,
      'Project pivoted to different niche'
    );

    assert.equal(cancelResult.success, true);
    assert.equal(cancelResult.subscriber.status, 'active'); // Remains active through period end
    assert.equal(cancelResult.subscriber.cancelAtPeriodEnd, true);
    assert.equal(cancelResult.subscriber.cancellationFeeUsd, 0); // Strictly $0.00 fee
    assert.equal(cancelResult.subscriber.cancellationReason, 'Project pivoted to different niche');
    assert.ok(cancelResult.subscriber.cancellationTimestamp);
    assert.ok(cancelResult.effectiveCancellationDate);
  });

  test('allows 1-click reactivation before billing cycle concludes', async () => {
    // 1. Provision and cancel
    await subscriptionStore.provisionSubscription({
      email: testEmail,
      plan: 'FOUNDER',
      billingInterval: 'monthly',
      sessionId: 'cs_test_reactivate_004',
    });
    await subscriptionStore.cancelSubscription(testEmail, 'Temporary pause');

    // 2. Reactivate
    const reactivateResult = await subscriptionStore.reactivateSubscription(testEmail);
    assert.equal(reactivateResult.success, true);
    assert.equal(reactivateResult.subscriber.status, 'active');
    assert.equal(reactivateResult.subscriber.cancelAtPeriodEnd, false);
    assert.equal(reactivateResult.subscriber.rateLockedUsd, 55); // Preserves locked beta rate!
  });

  test('retrieves subscriber summary by email with lifetime savings calculation', async () => {
    await subscriptionStore.provisionSubscription({
      email: testEmail,
      plan: 'FOUNDER',
      billingInterval: 'monthly',
      sessionId: 'cs_test_summary_005',
    });

    const summary = await subscriptionStore.getSubscriberSummary(testEmail);
    assert.ok(summary);
    assert.equal(summary?.email, testEmail);
    assert.equal(summary?.rateLockedUsd, 55);
    assert.equal(summary?.listPriceUsd, 69);
    assert.equal(summary?.monthlySavingsUsd, 14);
    assert.equal(summary?.isBetaRateLocked, true);
  });
});
