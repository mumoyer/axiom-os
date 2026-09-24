import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test.describe('Founder Settings (Click-to-Cancel) & Durable Bug Triage E2E Suite', () => {
  const artifactDir = path.resolve('C:/Users/mumoy/.gemini/antigravity/brain/48b9f3cb-5495-42a3-9f46-06c517ff48de');

  test.beforeEach(async ({ page }) => {
    // Ensure clean storage
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('Founder Settings: verifies Public Beta Rate Lock, $0.00 cancellation fee, 1-click cancel and reactivation', async ({ page }) => {
    // 1. Provision a subscriber via API so it exists in subscriptionStore
    const res = await page.request.post('/api/checkout/session', {
      data: {
        plan: 'FOUNDER',
        email: 'founder.e2e@venturestudio.io',
        billingInterval: 'monthly',
        agreedToTerms: true,
      },
    });
    expect(res.ok()).toBeTruthy();

    // 2. Open Founder Settings via navigation button
    const founderSettingsBtn = page.getByRole('button', { name: /Founder Settings/i }).first();
    await expect(founderSettingsBtn).toBeVisible();
    await founderSettingsBtn.click();

    // 3. Verify Modal Header
    const modalHeader = page.locator('text=Founder Settings & Billing').first();
    await expect(modalHeader).toBeVisible();

    // 4. Lookup the provisioned subscriber email
    const emailInput = page.locator('input[placeholder*="founder@venturestudio.io"]');
    await emailInput.fill('founder.e2e@venturestudio.io');
    const lookupBtn = page.getByRole('button', { name: /Lookup/i }).first();
    await lookupBtn.click();

    // 5. Verify Public Beta Lifetime Rate Lock and $0.00 cancellation fee
    await expect(page.locator('text=Public Beta Lifetime Rate Lock Active').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=$0.00 (Zero Fees)').first()).toBeVisible();
    await expect(page.locator('text=Locked for Life').first()).toBeVisible();

    // Capture screenshot of active Founder Settings with rate lock
    const screenshotPathActive = path.join(artifactDir, 'verification_founder_settings_modal.png');
    await page.screenshot({ path: screenshotPathActive, fullPage: false });

    // 6. Execute 1-Click Self-Service Cancellation
    const cancelBtn = page.getByRole('button', { name: /Cancel Subscription/i }).first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Verify cancellation state and zero penalty fee
    await expect(page.locator('text=Cancels on Period End').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=zero penalty fees ($0.00)').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Reactivate Subscription/i }).first()).toBeVisible();

    // Capture screenshot of cancelled state
    const screenshotPathCancelled = path.join(artifactDir, 'verification_founder_settings_cancelled.png');
    await page.screenshot({ path: screenshotPathCancelled, fullPage: false });

    // 7. Execute 1-Click Reactivation
    const reactivateBtn = page.getByRole('button', { name: /Reactivate Subscription/i }).first();
    await reactivateBtn.click();

    // Verify restored active status with rate lock preserved
    await expect(page.locator('text=Active Subscription').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Public Beta Lifetime Rate Lock Active').first()).toBeVisible();
  });

  test('Bug Submission to Durable Store & Admin Triage Cockpit', async ({ page }) => {
    // 1. Submit a bug report via BugReportModal
    const openBugBtn = page.getByRole('button', { name: /Report Bug/i }).first();
    await openBugBtn.click();

    await expect(page.locator('text=Report a Bug & Earn Free Months').first()).toBeVisible({ timeout: 8000 });

    // Fill out bug report
    await page.locator('input[placeholder*="Gate 2 container"]').fill('Playwright E2E Verified Bug Report');
    await page.locator('textarea[placeholder*="What were you doing"]').fill('Container probe timed out in test environment. Verified persistence in data/bug_reports.json.');
    await page.locator('select').first().selectOption('stage_gate');
    await page.locator('input[placeholder*="founder@venture.com"]').fill('bounty.hunter@venturestudio.io');

    const submitBtn = page.getByRole('button', { name: /Submit & Claim Bounty/i }).first();
    await submitBtn.click();

    await expect(page.locator('text=Report Successfully Logged!').first()).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /Close & Return to App/i }).click();

    // 2. Open Admin Triage Dashboard via direct hash /#admin/bugs
    await page.goto('/#admin/bugs');
    await expect(page.locator('text=Admin Bug Triage & Bounty Dashboard').first()).toBeVisible({ timeout: 8000 });

    // Enter admin key and refresh triage queue
    const adminKeyInput = page.locator('input[type="password"]');
    await adminKeyInput.fill('stagegate_admin_key_2026');
    await page.getByRole('button', { name: /Refresh Triage Queue/i }).click();

    // 3. Verify submitted bug appears in triage list
    const reportItem = page.locator('text=Playwright E2E Verified Bug Report').first();
    await expect(reportItem).toBeVisible({ timeout: 8000 });
    await reportItem.click();

    // 4. Update status to "rewarded" and award bounty
    const statusSelect = page.locator('select').filter({ hasText: 'Bounty Credit Approved' });
    await statusSelect.selectOption('rewarded');

    const confirmTriageBtn = page.getByRole('button', { name: /Confirm Triage & Award Bounty/i }).first();
    await confirmTriageBtn.click();

    // 5. Verify the report item now has "rewarded" badge
    await expect(page.locator('span:text("rewarded")').first()).toBeVisible({ timeout: 8000 });

    // Capture screenshot of Admin Bug Triage cockpit
    const screenshotPathAdmin = path.join(artifactDir, 'verification_admin_bug_triage.png');
    await page.screenshot({ path: screenshotPathAdmin, fullPage: false });
  });

  test('Checkout Page: verifies clickable Founder Settings link in continuous renewal terms', async ({ page }) => {
    await page.goto('/#checkout?plan=FOUNDER');
    await expect(page.locator('text=Continuous Subscription & Automatic Renewal Terms').first()).toBeVisible({ timeout: 8000 });

    // Verify Click-to-Cancel Guarantee with clickable link
    const founderSettingsLink = page.locator('a[href="#settings"]:text("Founder Settings")').first();
    await expect(founderSettingsLink).toBeVisible();

    // Capture screenshot of Checkout terms with Founder Settings link
    const screenshotPathCheckout = path.join(artifactDir, 'verification_checkout_click_to_cancel_link.png');
    await page.screenshot({ path: screenshotPathCheckout, fullPage: false });

    // Clicking the link opens Founder Settings modal
    await founderSettingsLink.click();
    await expect(page.locator('text=Founder Settings & Billing').first()).toBeVisible({ timeout: 8000 });
  });
});
