import { test, expect } from '@playwright/test';

test.describe('Legal, Regulatory & Consumer Protection E2E Verification', () => {

  test('Checkout: Enforces Clickwrap Checkbox and Displays ARL Disclosures', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=Complete Your Stage Gate OS Subscription')).toBeVisible({ timeout: 10000 });

    // 1. Verify California Automatic Renewal Law (ARL) & FTC Negative Option disclosures
    await expect(page.locator('text=Continuous Subscription & Automatic Renewal Terms').first()).toBeVisible();
    await expect(page.locator('text=Click-to-Cancel Guarantee').first()).toBeVisible();
    await expect(page.locator('text=jason@moyervllc.com').first()).toBeVisible();

    // 2. Switch to Credit / Debit Card mode
    const cardSandboxBtn = page.getByRole('button', { name: /Credit \/ Debit Card/i });
    await cardSandboxBtn.click();
    await page.waitForTimeout(300);

    const submitBtn = page.getByRole('button', { name: /Authorize Subscription/i });
    await expect(submitBtn).toBeVisible();

    // 3. Assert submit button is disabled before checking clickwrap consent
    await expect(submitBtn).toBeDisabled();

    // 4. Assert terms consent checkbox is present and unchecked
    const termsCheckbox = page.locator('input[type="checkbox"][id^="terms-consent-checkbox"]').last();
    await expect(termsCheckbox).not.toBeChecked();

    // 5. Check the box and verify submit button becomes enabled
    await termsCheckbox.check();
    await expect(submitBtn).toBeEnabled();

    // 6. Uncheck and verify it re-disables
    await termsCheckbox.uncheck();
    await expect(submitBtn).toBeDisabled();
  });

  test('Checkout: Opens Terms of Service and Privacy Policy Modals Directly', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=Complete Your Stage Gate OS Subscription')).toBeVisible({ timeout: 10000 });

    // Click Terms of Service link in checkout disclosure
    const termsLink = page.getByRole('button', { name: 'Terms of Service' }).first();
    await termsLink.click();

    // Assert modal header and key Utah governing clauses
    await expect(page.locator('text=MOYER VENTURES LLC • LEGAL POLICIES')).toBeVisible();
    await expect(page.locator('text=100% IP Assignment to You')).toBeVisible();
    await expect(page.locator('text=Moyer Ventures LLC (Utah)').first()).toBeVisible();
    await expect(page.locator('text=Binding Individual Arbitration')).toBeVisible();
    await expect(page.locator('text=Salt Lake City, Utah')).toBeVisible();
    await expect(page.locator('text=jason@moyervllc.com').first()).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: 'Close', exact: true });
    await closeBtn.click();
    await expect(page.locator('text=MOYER VENTURES LLC • LEGAL POLICIES')).not.toBeVisible();

    // Click Privacy Policy link in checkout disclosure
    const privacyLink = page.getByRole('button', { name: 'Privacy Policy' }).first();
    await privacyLink.click();

    await expect(page.locator('text=Data Controller: Moyer Ventures LLC (Utah)')).toBeVisible();
    await expect(page.locator('text=Consumer Rights (GDPR & CCPA)')).toBeVisible();

    await closeBtn.click();
  });

  test('Footer: Verifies Utah Operating Entity, SOC 2 Phrasing, and Enforceable Terms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify entity ownership in footer
    await expect(page.locator('footer').getByText('Moyer Ventures LLC (Utah)')).toBeVisible();

    // 2. Verify FTC-compliant SOC 2 audit-ready architecture claim in footer
    await expect(page.locator('footer').getByText('SOC 2 Audit-Ready Architecture')).toBeVisible();

    // 3. Open full Terms of Service from footer
    const footerTermsBtn = page.getByTestId('footer-terms-btn');
    await footerTermsBtn.scrollIntoViewIfNeeded();
    await footerTermsBtn.click();

    await expect(page.locator('text=Terms of Service & Subscriber Agreement')).toBeVisible();
    await expect(page.locator('text=Moyer Ventures LLC, a Utah limited liability company')).toBeVisible();
    await expect(page.locator('text=100% Intellectual Property Assignment to Subscriber')).toBeVisible();
    await expect(page.locator('text=Federal Arbitration Act (9 U.S.C. § 1 et seq.) and the laws of the State of Utah')).toBeVisible();
    await expect(page.locator('text=Designated Agent: Jason Moyer, Moyer Ventures LLC')).toBeVisible();

    // Close modal
    const returnBtn = page.getByRole('button', { name: /Close & Return/i });
    await returnBtn.click();
    await expect(page.locator('text=Terms of Service & Subscriber Agreement')).not.toBeVisible();
  });

  test('Grader: Verifies California Notice at Collection on Lead Capture Modal', async ({ page }) => {
    await page.goto('/grader');
    await expect(page.locator('text=Feasibility & Time-Commitment Grader').first()).toBeVisible({ timeout: 10000 });

    // Open lead capture modal
    const unlockBtn = page.getByRole('button', { name: /Unlock Report Free/i }).first();
    await unlockBtn.scrollIntoViewIfNeeded();
    await unlockBtn.click();

    // Assert CCPA Notice at Collection is visible
    await expect(page.locator('text=Notice at Collection:')).toBeVisible();
    await expect(page.locator('text=Moyer Ventures LLC').first()).toBeVisible();
    await expect(page.locator('text=unsubscribe at any time')).toBeVisible();
  });

  test('Landing Page: Verifies Moderated Competitor Matrix Claims', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Scroll to competitive matrix
    const matrixHeader = page.locator('text=The End of Exploitative Venture Platforms');
    await matrixHeader.scrollIntoViewIfNeeded();
    await expect(matrixHeader).toBeVisible();

    // Filter to Polsia
    const polsiaFilterBtn = page.getByRole('button', { name: /VS_POLSIA/i });
    if (await polsiaFilterBtn.isVisible()) {
      await polsiaFilterBtn.click();
    }

    // Verify moderated, objective comparative language
    await expect(page.locator('text=Variable 20% intermediary ad spend commission')).toBeVisible();
    await expect(page.locator('text=Credit-deducting build failure model')).toBeVisible();

    // Verify unsubstantiated disparaging phrases are absent
    await expect(page.locator('text=widespread chargebacks')).toHaveCount(0);
    await expect(page.locator('text=1.7 Trustpilot score')).toHaveCount(0);
  });

});
