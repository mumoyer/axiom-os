import { test, expect } from '@playwright/test';

test.describe('Subscriber Onboarding & Stripe Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=Complete Your Axiom OS Subscription')).toBeVisible({ timeout: 10000 });
  });

  test('Page Structure: displays sandbox test mode header and order summary', async ({ page }) => {
    await expect(page.locator('text=Stripe Sandbox Test Mode Active')).toBeVisible();
    await expect(page.locator('text=Zero-Charge Failure Guarantee')).toBeVisible();
    await expect(page.locator('text=0.0% Perpetual Revenue Tax')).toBeVisible();
  });

  test('Plan Selection & Billing Interval: dynamically recalculates summary totals', async ({ page }) => {
    // Select Founder plan card
    const founderCard = page.locator('text=Founder Plan').locator('..').locator('..');
    if (await founderCard.isVisible()) {
      await founderCard.click();
      await expect(page.locator('text=$49.00').first()).toBeVisible();
    }

    // Select Serial Entrepreneur plan card
    const serialCard = page.locator('text=Serial Entrepreneur Plan').locator('..').locator('..');
    if (await serialCard.isVisible()) {
      await serialCard.click();
      await expect(page.locator('text=$149.00').first()).toBeVisible();
    }

    // Toggle Annual Billing (-20%)
    const annualBtn = page.getByRole('button', { name: /Annual/i });
    await annualBtn.click();
    await expect(page.locator('text=$1430.00 / yr')).toBeVisible();

    // Toggle back to Monthly
    const monthlyBtn = page.getByRole('button', { name: /Monthly/i });
    await monthlyBtn.click();
    await expect(page.locator('text=$149.00 / mo')).toBeVisible();
  });

  test('Stripe Sandbox Card Helper: copies sandbox test credentials', async ({ page }) => {
    await expect(page.locator('text=Stripe Sandbox Test Card')).toBeVisible();
    await expect(page.locator('text=4242 •••• •••• 4242').first()).toBeVisible();

    // Click copy button on test card
    const copyCardBtn = page.getByRole('button', { name: /Copy/i }).first();
    await copyCardBtn.click();

    // Check feedback
    await expect(page.getByRole('button', { name: /Copied/i })).toBeVisible();
  });

  test('Checkout Submission: provisions sandbox session and renders activation confirmation', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('founder.alpha@nextgenventures.io');

    const submitBtn = page.getByRole('button', { name: /Authorize Subscription/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success confirmation card
    await expect(page.locator('text=Subscription Activated Successfully!')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('text=Stripe Session ID: cs_test_')).toBeVisible();
    await expect(page.locator('text=0.0% Guaranteed')).toBeVisible();

    // Action button back to marketing or grader
    await expect(page.getByRole('button', { name: /Validate & Launch First Venture/i })).toBeVisible();
  });
});
