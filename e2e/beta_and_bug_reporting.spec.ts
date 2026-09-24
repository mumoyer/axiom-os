import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test.describe('Stage Gate OS Public Beta Launch & Bug Reporting Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('Beta Banner & Navigation Branding: renders 20% discount announcement & BETA badge', async ({ page }) => {
    // 1. Verify Top Beta Banner
    const betaBadge = page.locator('text=PUBLIC BETA').first();
    await expect(betaBadge).toBeVisible();

    const discountText = page.locator('text=20% Early Adopter Discount Active:').first();
    await expect(discountText).toBeVisible();

    // Verify banner CTA button
    const bannerBugBtn = page.getByRole('button', { name: /Report a Bug & Earn 1–3 Free Months/i }).first();
    await expect(bannerBugBtn).toBeVisible();

    // 2. Verify BETA pill in Navigation bar next to STAGEGATE.OS
    const logoArea = page.locator('text=STAGEGATE.OS').first();
    await expect(logoArea).toBeVisible();
    const betaPill = page.locator('text=BETA').first();
    await expect(betaPill).toBeVisible();

    // 3. Verify Desktop Navigation "Report Bug" button
    const navBugBtn = page.getByRole('button', { name: /Report Bug/i }).first();
    await expect(navBugBtn).toBeVisible();

    // 4. Verify Floating Action "Report Bug Bounty" button
    const floatingBugBtn = page.locator('button[title*="Report a bug and earn Bug Bounty"]').first();
    await expect(floatingBugBtn).toBeVisible();
  });

  test('Pricing Section: validates 20% reduced rates, strikethrough list prices, and early-adopter explanation', async ({ page }) => {
    // Scroll to pricing section
    const pricingHeader = page.locator('text=Early Adopter Beta Rates. 20% Off Regular List.').first();
    await pricingHeader.scrollIntoViewIfNeeded();
    await expect(pricingHeader).toBeVisible();

    // Verify Beta Discount explanation card
    await expect(page.locator('text=WHY ARE PRICES LOWER DURING BETA?').first()).toBeVisible();
    await expect(page.locator('text=LIFETIME RATE LOCK FOR BETA TESTERS').first()).toBeVisible();

    // Verify Founder Tier prices: $55 beta price, $69 struck out list price
    await expect(page.locator('text=$55').first()).toBeVisible();
    await expect(page.locator('text=$69').first()).toBeVisible();

    // Verify Serial Tier prices: $119 beta price, $149 struck out list price
    await expect(page.locator('text=$119').first()).toBeVisible();
    await expect(page.locator('text=$149').first()).toBeVisible();

    // Verify Enterprise Studio prices: $799 beta price, $999 struck out list price
    await expect(page.locator('text=$799').first()).toBeVisible();
    await expect(page.locator('text=$999').first()).toBeVisible();

    // Verify Bug Bounty encouragement card at bottom of pricing
    await expect(page.locator('text=Help Us Break Stage Gate OS — We Reward Every Verified Bug').first()).toBeVisible();
    await expect(page.locator('text=Earn 1–3 Free Months').first()).toBeVisible();
  });

  test('Bug Report Modal: opens from banner, auto-captures diagnostics, and submits test report', async ({ page }) => {
    // Click Report Bug button in banner
    const bannerBugBtn = page.getByRole('button', { name: /Report a Bug & Earn 1–3 Free Months/i }).first();
    await bannerBugBtn.click();

    // Verify Modal Header & Bounty scale
    await expect(page.locator('text=Report a Bug & Earn Free Months').first()).toBeVisible();
    await expect(page.locator('text=1 Free Month').first()).toBeVisible();
    await expect(page.locator('text=2–3 Free Months + Founder Line').first()).toBeVisible();

    // Verify Diagnostic context notice is shown
    await expect(page.locator('text=Diagnostic context').first()).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="Gate 2 container check"]', 'E2E Headless Browser Verification: Test Report');
    await page.fill('textarea[placeholder*="What were you doing"]', 'Automated headless verification step test description. Everything worked smoothly.');
    await page.fill('input[placeholder="founder@venture.com"]', 'e2e-tester@stagegateos.com');

    // Submit bug report
    const submitBtn = page.getByRole('button', { name: /Submit & Claim Bounty/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify Confirmation state
    await expect(page.locator('text=Report Successfully Logged!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tracking Ref:').first()).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: /Close & Return/i });
    await closeBtn.click();
    await expect(page.locator('text=Report a Bug & Earn Free Months')).not.toBeVisible();
  });

  test('Checkout Page: verifies beta pricing breakdown, lifetime rate lock terms, and order completion', async ({ page }) => {
    await page.goto('/checkout?plan=FOUNDER');
    await expect(page.locator('text=Complete Your Stage Gate OS Subscription')).toBeVisible({ timeout: 10000 });

    // Verify Founder Beta Price ($55) and Strikethrough list price ($69)
    await expect(page.locator('text=$55').first()).toBeVisible();
    await expect(page.locator('text=$69').first()).toBeVisible();

    // Switch to Serial Plan
    const serialCard = page.locator('text=Serial Plan').first();
    await serialCard.click();
    await expect(page.locator('text=$119').first()).toBeVisible();
    await expect(page.locator('text=$149').first()).toBeVisible();

    // Switch to Card tab
    const cardTabBtn = page.getByRole('button', { name: /Credit \/ Debit Card/i });
    await cardTabBtn.click();
    await page.waitForTimeout(300);

    // Verify order summary shows Public Beta Savings (20% Off)
    await expect(page.locator('text=Public Beta Savings (20% Off):').first()).toBeVisible();

    // Verify Lifetime Rate Lock FTC continuous renewal disclosure
    await expect(page.locator('text=Public Beta Rate Lock:').first()).toBeVisible();
    await expect(page.locator('text=Your 20% discount is locked for the lifetime of your active subscription').first()).toBeVisible();

    // Fill customer email, card details
    await page.fill('input[type="email"]', 'beta.subscriber@example.com');
    await page.fill('input[placeholder="•••• •••• •••• ••••"]', '4242 4242 4242 4242');
    await page.fill('input[placeholder="MM / YY"]', '12/28');
    await page.fill('input[placeholder="CVC"]', '123');

    // Check affirmative clickwrap consent
    const consentCheckbox = page.locator('#terms-consent-checkbox-card');
    await consentCheckbox.check();

    // Submit checkout
    const submitBtn = page.locator('[data-testid="authorize-subscription-btn"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify success confirmation card
    await expect(page.locator('text=Subscription Activated Successfully!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=0.0% Guaranteed')).toBeVisible();

    // Take screenshot artifact of the completed activation
    const screenshotDir = path.resolve(process.cwd(), 'e2e-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotDir, 'checkout_beta_activation.png'), fullPage: true });
  });
});
