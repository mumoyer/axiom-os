/**
 * Beta Pricing Verification Suite
 * 
 * Verifies:
 * 1. Single source of truth in shared/pricing.ts:
 *    - All tier prices during beta are reduced by >= 20% compared to list prices
 *    - Founder: $55/mo (list $69/mo, 20.3% discount), annual $528/yr ($44/mo, 20.0% discount)
 *    - Serial: $119/mo (list $149/mo, 20.1% discount), annual $1,140/yr ($95/mo, 20.3% discount)
 *    - Enterprise: $799/mo (list $999/mo, 20.0% discount), annual $7,668/yr ($639/mo, 20.0% discount)
 *    - All annual amounts are exact multiples of 12 (perMonth * 12)
 *    - Toggling BETA_CONFIG.active to false restores regular list pricing
 * 2. API integration:
 *    - GET /api/checkout/config returns beta metadata (active: true, discountPercent: 20)
 *    - GET /api/checkout/config returns both priceUsd (beta price) and listPriceUsd (regular list price)
 *    - POST /api/checkout/session charges the correct beta amount for both monthly and annual intervals
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server/app.js';
import { BETA_CONFIG, PRICING_TIERS, calculatePricing, getTierConfig } from '../../shared/pricing.js';

describe('Public Beta Pricing Invariants & Single Source of Truth', () => {
  it('BETA_CONFIG has active status, 20% discount, and lifetime rate lock terms', () => {
    assert.equal(BETA_CONFIG.active, true);
    assert.equal(BETA_CONFIG.discountPercent, 20);
    assert.ok(BETA_CONFIG.lifetimeLockIn, 'Beta pricing must feature lifetime rate lock-in');
    assert.ok(BETA_CONFIG.explanation.length > 20, 'Explanatory copy explaining why pricing is lower must be provided');
  });

  it('All tiers during beta have >= 20% discount for both monthly and annual billing', () => {
    const tiers = ['FOUNDER', 'SERIAL', 'ENTERPRISE'] as const;
    for (const tier of tiers) {
      const monthly = calculatePricing(tier, 'monthly', true);
      const annual = calculatePricing(tier, 'annual', true);

      // Verify >= 20% discount
      assert.ok(
        monthly.discountPercent >= 20,
        `${tier} monthly discount must be >= 20%, got ${monthly.discountPercent}%`
      );
      assert.ok(
        annual.discountPercent >= 20,
        `${tier} annual discount must be >= 20%, got ${annual.discountPercent}%`
      );

      // Verify whole dollars
      assert.equal(Number.isInteger(monthly.priceUsd), true, `${tier} monthly price must be integer`);
      assert.equal(Number.isInteger(annual.priceUsd), true, `${tier} annual price must be integer`);

      // Verify exact 12x annual math
      assert.equal(
        annual.priceUsd,
        annual.perMonthUsd * 12,
        `${tier} annual price (${annual.priceUsd}) must equal perMonth (${annual.perMonthUsd}) * 12`
      );

      // Verify savings are positive
      assert.ok(monthly.savingsUsd > 0, `${tier} monthly savings must be > 0`);
      assert.ok(annual.savingsUsd > 0, `${tier} annual savings must be > 0`);
    }
  });

  it('Founder tier matches exact target figures: $55/mo (list $69) and $528/yr ($44/mo)', () => {
    const monthly = calculatePricing('FOUNDER', 'monthly', true);
    assert.equal(monthly.priceUsd, 55);
    assert.equal(monthly.listPriceUsd, 69);
    assert.equal(monthly.savingsUsd, 14);

    const annual = calculatePricing('FOUNDER', 'annual', true);
    assert.equal(annual.priceUsd, 528);
    assert.equal(annual.listPriceUsd, 660);
    assert.equal(annual.perMonthUsd, 44);
    assert.equal(annual.savingsUsd, 132);
  });

  it('Serial tier matches exact target figures: $119/mo (list $149) and $1,140/yr ($95/mo)', () => {
    const monthly = calculatePricing('SERIAL', 'monthly', true);
    assert.equal(monthly.priceUsd, 119);
    assert.equal(monthly.listPriceUsd, 149);
    assert.equal(monthly.savingsUsd, 30);

    const annual = calculatePricing('SERIAL', 'annual', true);
    assert.equal(annual.priceUsd, 1140);
    assert.equal(annual.listPriceUsd, 1430);
    assert.equal(annual.perMonthUsd, 95);
    assert.equal(annual.savingsUsd, 290);
  });

  it('Enterprise tier matches exact target figures: $799/mo (list $999) and $7,668/yr ($639/mo)', () => {
    const monthly = calculatePricing('ENTERPRISE', 'monthly', true);
    assert.equal(monthly.priceUsd, 799);
    assert.equal(monthly.listPriceUsd, 999);
    assert.equal(monthly.savingsUsd, 200);

    const annual = calculatePricing('ENTERPRISE', 'annual', true);
    assert.equal(annual.priceUsd, 7668);
    assert.equal(annual.listPriceUsd, 9590);
    assert.equal(annual.perMonthUsd, 639);
    assert.equal(annual.savingsUsd, 1922);
  });

  it('When isBeta is false, calculatePricing reverts cleanly to list pricing', () => {
    const founder = calculatePricing('FOUNDER', 'monthly', false);
    assert.equal(founder.priceUsd, 69);
    assert.equal(founder.listPriceUsd, 69);
    assert.equal(founder.savingsUsd, 0);
    assert.equal(founder.discountPercent, 0);

    const serial = calculatePricing('SERIAL', 'monthly', false);
    assert.equal(serial.priceUsd, 149);

    const enterprise = calculatePricing('ENTERPRISE', 'monthly', false);
    assert.equal(enterprise.priceUsd, 999);
  });
});

describe('Checkout API Beta Pricing Integration', () => {
  it('GET /api/checkout/config returns beta metadata, beta prices, and regular list prices', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/checkout/config`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.ok(data.beta, 'Expected beta object in config');
      assert.equal(data.beta.active, true);
      assert.equal(data.beta.discountPercent, 20);

      const founder = data.supportedTiers.find((t: any) => t.id === 'FOUNDER');
      assert.ok(founder, 'FOUNDER tier must exist');
      assert.equal(founder.priceUsd, 55, 'Beta price for FOUNDER must be $55');
      assert.equal(founder.listPriceUsd, 69, 'Regular list price for FOUNDER must be $69');

      const serial = data.supportedTiers.find((t: any) => t.id === 'SERIAL');
      assert.ok(serial, 'SERIAL tier must exist');
      assert.equal(serial.priceUsd, 119, 'Beta price for SERIAL must be $119');
      assert.equal(serial.listPriceUsd, 149, 'Regular list price for SERIAL must be $149');

      const enterprise = data.supportedTiers.find((t: any) => t.id === 'ENTERPRISE');
      assert.ok(enterprise, 'ENTERPRISE tier must exist');
      assert.equal(enterprise.priceUsd, 799, 'Beta price for ENTERPRISE must be $799');
      assert.equal(enterprise.listPriceUsd, 999, 'Regular list price for ENTERPRISE must be $999');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/checkout/session charges beta price and supports annual billing interval', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      // Monthly Founder session
      const resMonthly = await fetch(`http://localhost:${port}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'FOUNDER',
          billingInterval: 'monthly',
          email: 'founder-beta@example.com',
        }),
      });
      assert.equal(resMonthly.status, 201);
      const dataMonthly = await resMonthly.json();
      assert.equal(dataMonthly.amountUsd, 55, 'Monthly Founder session must bill $55 during beta');

      // Annual Serial session
      const resAnnual = await fetch(`http://localhost:${port}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'SERIAL',
          billingInterval: 'annual',
          email: 'serial-annual@example.com',
        }),
      });
      assert.equal(resAnnual.status, 201);
      const dataAnnual = await resAnnual.json();
      assert.equal(dataAnnual.amountUsd, 1140, 'Annual Serial session must bill $1,140 during beta');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
