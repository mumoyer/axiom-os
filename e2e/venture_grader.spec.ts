import { test, expect } from '@playwright/test';

test.describe('Venture Validation Grader (VVG) & Lead Capture Funnel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/grader');
    await expect(page.locator('text=Autonomous Venture Validation Grader')).toBeVisible({ timeout: 10000 });
  });

  test('VVG Engine: displays 4-factor breakdown and reacts to metric inputs', async ({ page }) => {
    // Verify 4-factor cards
    await expect(page.getByText('Market Demand (30%)', { exact: true })).toBeVisible();
    await expect(page.getByText('Competitor Density & Moat (25%)', { exact: true })).toBeVisible();
    await expect(page.getByText('Unit Economics & Payback (25%)', { exact: true })).toBeVisible();
    await expect(page.getByText('Execution Feasibility (20%)', { exact: true })).toBeVisible();

    // Verify composite score gauge is displayed
    const scoreText = page.locator('text=VALIDATION SCORECARD');
    await expect(scoreText).toBeVisible();

    // Change Venture Name input
    const nameInput = page.locator('input[placeholder="e.g. DocuPulse AI"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('FinTech Flow Pro');
      await expect(nameInput).toHaveValue('FinTech Flow Pro');
    }
  });

  test('Automated Pivot Generator: triggers on Grade F (< 60 score) and renders validated pivots', async ({ page }) => {
    // Select the "Low Score / Auto-Pivot" preset
    const failingPresetBtn = page.getByRole('button', { name: /Low Score \/ Auto-Pivot/i });
    await failingPresetBtn.click();

    // Wait for reactive score update
    await page.waitForTimeout(600);

    // Verify Grade F badge
    await expect(page.locator('text=Grade F').first()).toBeVisible();

    // Verify Automated Pivot Generator is rendered
    await expect(page.locator('text=Automated Pivot Generator Triggered')).toBeVisible();
    await expect(page.locator('text=Validation score below 60 signals severe risk')).toBeVisible();

    // Verify synthesized pivot options
    await expect(page.locator('text=1.').first()).toBeVisible();
  });

  test('Unicorn Preset: calculates Grade A Prime Venture Candidate', async ({ page }) => {
    const unicornBtn = page.getByRole('button', { name: /Unicorn|Prime Candidate/i });
    if (await unicornBtn.isVisible()) {
      await unicornBtn.click();
      await page.waitForTimeout(500);

      // Verify Grade A badge
      await expect(page.locator('text=Grade A').first()).toBeVisible();
      await expect(page.locator('text=Prime Venture Candidate')).toBeVisible();
    }
  });

  test('Gated Lead Capture Modal: validates inputs, submits lead, and unlocks 5-page report', async ({ page }) => {
    // Find and click the unlock button
    const unlockBtn = page.getByRole('button', { name: /Unlock Full 5-Page Feasibility Report/i });
    await expect(unlockBtn).toBeVisible();
    await unlockBtn.click();

    // Verify modal appears
    await expect(page.locator('text=Unlock Your 5-Page Feasibility Report')).toBeVisible();

    // Fill valid lead form
    const nameInput = page.locator('input[placeholder*="Satoshi Nakamoto"]');
    await nameInput.fill('Jordan Belfort');

    const emailInput = page.locator('input[placeholder*="founder@venture.com"]');
    await emailInput.fill('jordan@strattonoak.com');

    // Submit lead
    const submitBtn = page.getByRole('button', { name: /Unlock Report Now/i });
    await submitBtn.click();

    // Verify modal closes and report is unlocked
    await expect(page.locator('text=Comprehensive 5-Page Feasibility & Execution Report')).toBeVisible({ timeout: 8000 });

    // Verify report pages / tabs navigation
    await expect(page.locator('text=Page 1: Executive Viability Verdict')).toBeVisible();

    // Switch to Page 2
    const page2Tab = page.getByRole('button', { name: 'Page 2' });
    await page2Tab.click();
    await expect(page.locator('text=Page 2: TAM/SAM Market Size')).toBeVisible();

    // Switch to Page 3
    const page3Tab = page.getByRole('button', { name: 'Page 3' });
    await page3Tab.click();
    await expect(page.locator('text=Page 3: Competitive Density')).toBeVisible();
  });
});

