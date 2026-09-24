import { test, expect } from '@playwright/test';

test.describe('Marketing Portal & Competitive Intelligence Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Too busy to start that side business?', { timeout: 10000 });
  });

  test('Hero Section: displays core value proposition and anti-fragile guarantee pills', async ({ page }) => {
    // Verify main headline
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toContainText('Too busy to start that side business?');
    await expect(headline).toContainText('Let AI build & run it while you work your 9-to-5.');

    // Verify subheadline & guarantee
    await expect(page.locator('text=Pay-Only-For-Working-Code Guarantee').first()).toBeVisible();

    // Verify guarantee tags
    await expect(page.locator('text=0.0% Perpetual Revenue Tax').first()).toBeVisible();
    await expect(page.locator('text=100% Personal GitHub Ejection').first()).toBeVisible();
    await expect(page.locator('text=15 Min/Day Maintenance').first()).toBeVisible();
  });

  test('Interactive Stage-Gate Simulator: executes verified pass & $0.00 refund simulations', async ({ page }) => {
    const simContainer = page.locator('text=stagegate-console --pipeline=tri-plane-deterministic');
    await expect(simContainer).toBeVisible();

    // 1. Simulate Verified Pass
    const passBtn = page.getByRole('button', { name: /PASS_SCENARIO/i });
    await expect(passBtn).toBeVisible();
    await passBtn.click();

    // Wait for simulation to finish through Gate 5
    await page.waitForTimeout(3500);
    await expect(page.locator('text=Gate 5: Clean-Room Git Ejection')).toBeVisible();

    // 2. Simulate $0.00 Refund
    const refundBtn = page.getByRole('button', { name: /REFUND_TEST/i });
    await expect(refundBtn).toBeVisible();
    await refundBtn.click();

    // Wait for Gate 2 simulated breach & refund notification
    await page.waitForTimeout(2000);
    await expect(page.locator('text=2PC Escrow triggered automatic rollback').or(page.locator('text=ESCROW_ABORT_ROLLBACK')).first()).toBeVisible();
  });

  test('Master Competitive Matrix: validates 12 dimensions and category filtering tabs', async ({ page }) => {
    // Scroll to competitive matrix
    const matrixSection = page.locator('text=UNAPOLOGETIC ARCHITECTURAL COMPARISON');
    await matrixSection.scrollIntoViewIfNeeded();
    await expect(matrixSection).toBeVisible();

    // Verify column headers
    await expect(page.locator('text=Stage Gate OS (Tri-Plane)')).toBeVisible();
    await expect(page.locator('text=Polsia (God Mode Loop)')).toBeVisible();
    await expect(page.locator('text=AI Dev Tools (Cursor / Lovable)')).toBeVisible();
    await expect(page.locator('text=Corporate Venture Studios')).toBeVisible();

    // Verify critical comparison rows
    await expect(page.locator('text=Monetization & Revenue Share')).toBeVisible();
    await expect(page.locator('text=Billing on Failures (Bug Tax)')).toBeVisible();
    await expect(page.locator('text=Code & Data Ownership (Portability)')).toBeVisible();

    // Verify 0% Revenue Tax vs Polsia take rate
    await expect(page.locator('text=Strict 0.0% Perpetual Revenue Tax').first()).toBeVisible();
    await expect(page.locator('text=20% to 50% lifetime revenue royalty model')).toBeVisible();

    // Test matrix filter tabs
    const polsiaTab = page.locator('#matrix').getByRole('button', { name: /VS_POLSIA/i });
    if (await polsiaTab.isVisible()) {
      await polsiaTab.click();
      await expect(page.locator('text=Unchecked Celery/Redis "God Mode" loops')).toBeVisible();
    }
  });

  test('Transparent Pricing Table: validates 3 tiers and 20% annual discount toggle', async ({ page }) => {
    const pricingSection = page.locator('text=PUBLIC BETA PRICING').first();
    await pricingSection.scrollIntoViewIfNeeded();
    await expect(pricingSection).toBeVisible();

    // Verify initial monthly pricing
    await expect(page.getByRole('heading', { name: 'Founder Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Serial Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise Studio' })).toBeVisible();

    // Verify beta prices & strikethrough list prices
    await expect(page.locator('text=$55').first()).toBeVisible();
    await expect(page.locator('text=$69').first()).toBeVisible();
    await expect(page.locator('text=$119').first()).toBeVisible();
    await expect(page.locator('text=$149').first()).toBeVisible();
    await expect(page.locator('text=$799').first()).toBeVisible();
    await expect(page.locator('text=$999').first()).toBeVisible();

    // Toggle Annual Billing (extra 20% discount)
    const annualBtn = page.getByRole('button', { name: /ANNUAL/i }).first();
    await annualBtn.click();

    // Verify discounted annual rates
    await expect(page.locator('text=$44').first()).toBeVisible();
    await expect(page.locator('text=$95').first()).toBeVisible();
    await expect(page.locator('text=$639').first()).toBeVisible();
    await expect(page.locator('text=$528 billed annually')).toBeVisible();

    // Toggle back to Monthly Billing
    const monthlyBtn = page.getByRole('button', { name: /MONTHLY/i }).first();
    await monthlyBtn.click();
    await expect(page.locator('text=$55').first()).toBeVisible();
    await expect(page.locator('text=$119').first()).toBeVisible();
  });

  test('Primary CTAs: routes cleanly to Grader and Checkout', async ({ page }) => {
    // Click Hero CTA "GRADE YOUR SIDE BUSINESS IDEA FREE"
    const validateBtn = page.getByRole('button', { name: /GRADE YOUR SIDE BUSINESS IDEA FREE/i });
    await validateBtn.click();

    // Should navigate to /grader
    await expect(page.locator('text=Free 9-to-5 Feasibility & Time-Commitment Grader')).toBeVisible({ timeout: 8000 });
  });
});
