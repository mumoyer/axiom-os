/**
 * Subscription Management & Founder Settings API Routes
 * 
 * Provides:
 * - GET  /api/subscription/me        - Retrieve current subscriber summary, renewal dates, and locked beta rates
 * - POST /api/subscription/cancel    - 1-click self-service cancellation with $0.00 penalty fees (FTC Negative Option compliant)
 * - POST /api/subscription/reactivate- 1-click reactivation preserving locked rate
 * - GET  /api/subscription/plans     - Overview of tiers and pricing
 */

import { Router, Request, Response } from 'express';
import { subscriptionStore } from '../services/subscription_store.js';
import { notificationService } from '../services/notification_service.js';
import { PRICING_TIERS, BETA_CONFIG, calculatePricing, TierId } from '../../shared/pricing.js';

export const subscriptionRoutes = Router();

// GET /api/subscription/plans
subscriptionRoutes.get('/plans', (_req: Request, res: Response) => {
  const tiers = (['FOUNDER', 'SERIAL', 'ENTERPRISE'] as TierId[]).map((tierId) => {
    const tier = PRICING_TIERS[tierId];
    return {
      tierId,
      name: tier.name,
      monthly: calculatePricing(tierId, 'monthly'),
      annual: calculatePricing(tierId, 'annual'),
      deployments: tier.deployments,
      iterations: tier.iterations,
      credits: tier.credits,
      byok: tier.byok,
      shopifyCheckoutUrl: tier.shopifyCheckoutUrl,
    };
  });

  res.json({
    beta: BETA_CONFIG,
    tiers,
  });
});

// GET /api/subscription/me
subscriptionRoutes.get('/me', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Query parameter email is required' });
    }

    const summary = await subscriptionStore.getSubscriberSummary(email);
    if (!summary) {
      return res.status(404).json({
        found: false,
        error: `No active subscriber found for ${email}. You can subscribe anytime on the pricing page.`,
      });
    }

    res.json({
      found: true,
      subscription: summary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscription/cancel
subscriptionRoutes.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { email, reason } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required to cancel subscription' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await subscriptionStore.cancelSubscription(normalizedEmail, reason);

    // Notify administration
    notificationService
      .dispatchAlert({
        type: 'SUBSCRIPTION_CANCEL',
        email: normalizedEmail,
        plan: result.subscriber.plan,
        effectiveDate: result.effectiveCancellationDate,
        reason: result.subscriber.cancellationReason,
        timestamp: result.subscriber.cancellationTimestamp || new Date().toISOString(),
      })
      .catch((err) => console.warn('[Subscription] Cancellation alert warning:', err.message));

    res.json({
      success: true,
      message:
        'Your subscription cancellation has been processed with zero penalty fees ($0.00). You retain full access to Stage Gate OS through the end of your billing period.',
      subscriber: result.subscriber,
      effectiveCancellationDate: result.effectiveCancellationDate,
      cancellationFeeUsd: 0,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('No active subscription found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscription/reactivate
subscriptionRoutes.post('/reactivate', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required to reactivate subscription' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await subscriptionStore.reactivateSubscription(normalizedEmail);

    notificationService
      .dispatchAlert({
        type: 'SUBSCRIPTION_REACTIVATE',
        email: normalizedEmail,
        plan: result.subscriber.plan,
        timestamp: result.subscriber.reactivationTimestamp || new Date().toISOString(),
      })
      .catch((err) => console.warn('[Subscription] Reactivation alert warning:', err.message));

    res.json({
      success: true,
      message:
        'Your subscription has been successfully reactivated! Your Public Beta Lifetime Rate Lock remains in full effect.',
      subscriber: result.subscriber,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('No subscription found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});
