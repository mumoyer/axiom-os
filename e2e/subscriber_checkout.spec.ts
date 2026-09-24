import { test, expect } from '@playwright/test';

test.describe('Subscriber Onboarding & Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=Complete Your Stage Gate OS Subscription')).toBeVisible({ timeout: 10000 });
  });

  test('Page Structure: displays security header and zero-charge guarantee', async ({ page }) => {
    await expect(page.locator('text=256-Bit SSL Encrypted & Secure Checkout')).toBeVisible();
    await expect(page.locator('text=Zero-Charge Failure Protection').first()).toBeVisible();
    await expect(page.locator('text=0.0% Perpetual Revenue Tax').first()).toBeVisible();
  });

  test('Plan Selection & Billing Interval: dynamically recalculates summary totals', async ({ page }) => {
    // Select Founder plan card
    const founderCard = page.locator('text=Founder Plan').first();
    if (await founderCard.isVisible()) {
      await founderCard.click();
      await expect(page.locator('text=$55').first()).toBeVisible();
    }

    // Select Serial Plan card
    const serialCard = page.locator('text=Serial Plan').first();
    if (await serialCard.isVisible()) {
      await serialCard.click();
      await expect(page.locator('text=$119').first()).toBeVisible();
    }

    // Toggle Annual Billing (-20%)
    const annualBtn = page.getByRole('button', { name: /Annual/i });
    await annualBtn.click();
    await expect(page.locator('text=$1140').or(page.locator('text=$1,140')).or(page.locator('text=$1430')).or(page.locator('text=$1,430')).first()).toBeVisible();

    // Toggle back to Monthly
    const monthlyBtn = page.getByRole('button', { name: /Monthly/i });
    await monthlyBtn.click();
    await expect(page.locator('text=$119').first()).toBeVisible();
  });

  test('Payment Method Toggle: switches between Shop Pay and Card checkout', async ({ page }) => {
    // Default is Shop Pay
    await expect(page.locator('text=1-Click Accelerated Checkout')).toBeVisible();

    // Switch to Card
    const cardTabBtn = page.getByRole('button', { name: /Credit \/ Debit Card/i });
    await cardTabBtn.click();
    await page.waitForTimeout(300);

    await expect(page.locator('text=Credit / Debit Card').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('Checkout Submission: provisions session and renders activation confirmation', async ({ page }) => {
    // Switch to Card tab
    const cardTabBtn = page.getByRole('button', { name: /Credit \/ Debit Card/i });
    await cardTabBtn.click();
    await page.waitForTimeout(300);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('founder.alpha@nextgenventures.io');
    await page.fill('input[placeholder="•••• •••• •••• ••••"]', '4242 4242 4242 4242');
    await page.fill('input[placeholder="MM / YY"]', '12/28');
    await page.fill('input[placeholder="CVC"]', '123');

    // Verify Automatic Renewal Law disclosure is visible
    await expect(page.locator('text=Continuous Subscription & Automatic Renewal Terms').first()).toBeVisible();
    await expect(page.locator('text=Click-to-Cancel Guarantee').first()).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /Authorize Subscription/i });
    await expect(submitBtn).toBeVisible();

    // Verify button is disabled before checking clickwrap checkbox
    await expect(submitBtn).toBeDisabled();

    // Check affirmative clickwrap consent checkbox
    const termsCheckbox = page.locator('#terms-consent-checkbox-card');
    await termsCheckbox.check();

    // Now button should be enabled
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify success confirmation card
    await expect(page.locator('text=Subscription Activated Successfully!')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('text=0.0% Guaranteed')).toBeVisible();

    // Action button back to marketing or grader
    await expect(page.getByRole('button', { name: /Validate & Launch First Venture/i })).toBeVisible();
  });
});
