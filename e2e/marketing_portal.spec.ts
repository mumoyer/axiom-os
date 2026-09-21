import { test, expect } from '@playwright/test';

test.describe('Marketing Portal & Competitive Intelligence Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('From Validated Idea to Live Venture in Hours', { timeout: 10000 });
  });

  test('Hero Section: displays core value proposition and anti-fragile guarantee pills', async ({ page }) => {
    // Verify main headline
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toContainText('From Validated Idea to Live Venture in Hours');
    await expect(headline).toContainText('Zero Technical Debt');

    // Verify subheadline
    await expect(page.locator('text=Deterministic stage-gates, 100% full Git ejection')).toBeVisible();
    await expect(page.locator('text=Zero-Charge Failure Guarantee').first()).toBeVisible();

    // Verify guarantee tags
    await expect(page.locator('text=0.0% Revenue Tax')).toBeVisible();
    await expect(page.locator('text=100% Code Ownership')).toBeVisible();
    await expect(page.locator('text=2PC Escrow Protection')).toBeVisible();
  });

  test('Interactive Stage-Gate Simulator: executes verified pass & $0.00 refund simulations', async ({ page }) => {
    const simContainer = page.locator('text=TRI-PLANE DETERMINISTIC STAGE-GATE PIPELINE');
    await expect(simContainer).toBeVisible();

    // 1. Simulate Verified Pass
    const passBtn = page.getByRole('button', { name: 'Simulate Verified Pass' });
    await expect(passBtn).toBeVisible();
    await passBtn.click();

    // Wait for simulation to finish through Gate 5
    await page.waitForTimeout(3500);
    await expect(page.locator('text=Gate 5: Clean-Room Git Ejection')).toBeVisible();

    // 2. Simulate $0.00 Refund
    const refundBtn = page.getByRole('button', { name: 'Simulate $0.00 Refund' });
    await expect(refundBtn).toBeVisible();
    await refundBtn.click();

    // Wait for Gate 2 simulated breach & refund notification
    await page.waitForTimeout(2000);
    await expect(page.locator('text=2PC Escrow refunded 100% of credits')).toBeVisible();
  });

  test('Master Competitive Matrix: validates 12 dimensions and category filtering tabs', async ({ page }) => {
    // Scroll to competitive matrix
    const matrixSection = page.locator('text=UNAPOLOGETIC COMPARISON');
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

    // Verify Axiom OS 0% Revenue Tax vs Polsia exploitative take rate
    await expect(page.locator('text=Strict 0.0% Perpetual Revenue Tax').first()).toBeVisible();
    await expect(page.locator('text=20% to 50% perpetual lifetime revenue tax')).toBeVisible();

    // Test matrix filter tabs
    const polsiaTab = page.locator('#matrix').getByRole('button', { name: /vs Polsia/i });
    if (await polsiaTab.isVisible()) {
      await polsiaTab.click();
      await expect(page.locator('text=Unchecked Celery/Redis "God Mode" loops')).toBeVisible();
    }
  });

  test('Transparent Pricing Table: validates 3 tiers and 20% annual discount toggle', async ({ page }) => {
    const pricingSection = page.locator('text=TRANSPARENT VALUE PRICING');
    await pricingSection.scrollIntoViewIfNeeded();
    await expect(pricingSection).toBeVisible();

    // Verify initial monthly pricing
    await expect(page.locator('text=Tier 1: Founder')).toBeVisible();
    await expect(page.locator('text=Tier 2: Serial')).toBeVisible();
    await expect(page.locator('text=Tier 3: Enterprise')).toBeVisible();

    await expect(page.getByText('$49', { exact: true })).toBeVisible();
    await expect(page.getByText('$149', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('$999', { exact: true }).first()).toBeVisible();

    // Toggle Annual Billing (20% discount)
    const annualBtn = page.getByRole('button', { name: /Annual Billing/i });
    await annualBtn.click();

    // Verify discounted rates
    await expect(page.getByText('$39', { exact: true })).toBeVisible();
    await expect(page.getByText('$119', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('$799', { exact: true }).first()).toBeVisible();
    await expect(page.locator('text=$470 billed annually')).toBeVisible();

    // Toggle back to Monthly Billing
    const monthlyBtn = page.getByRole('button', { name: /Monthly Billing/i });
    await monthlyBtn.click();
    await expect(page.getByText('$49', { exact: true })).toBeVisible();
    await expect(page.getByText('$149', { exact: true }).first()).toBeVisible();
  });

  test('Primary CTAs: routes cleanly to Grader and Checkout', async ({ page }) => {
    // Click Hero CTA "Validate Your Idea Free"
    const validateBtn = page.getByRole('button', { name: /Validate Your Idea Free/i });
    await validateBtn.click();

    // Should navigate to /grader
    await expect(page.locator('text=Autonomous Venture Validation Grader')).toBeVisible({ timeout: 8000 });
  });
});

