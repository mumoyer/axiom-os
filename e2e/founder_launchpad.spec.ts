import { test, expect } from '@playwright/test';

test.describe('Founder Launchpad & Multi-Tier Workflows (Newbie + Serial)', () => {
  test.describe('Persona 1: Newbie Guided 4-Step Wizard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/launchpad/newbie');
      await expect(page.locator('text=Aspiring Founder Launchpad')).toBeVisible({ timeout: 10000 });
    });

    test('completes full 4-step wizard from concept preset to scaffolding trigger', async ({ page }) => {
      // Step 1: Concept Ingestion
      await expect(page.locator('text=Step 1: Venture Concept Ingestion')).toBeVisible();

      // Click preset "DocuFlow AI"
      const docuFlowBtn = page.getByRole('button', { name: 'DocuFlow AI' }).first();
      if (await docuFlowBtn.isVisible()) {
        await docuFlowBtn.click();
      }

      // Advance to Step 2
      const nextBtn1 = page.getByRole('button', { name: /Continue to Target Persona/i });
      await nextBtn1.click();

      // Step 2: Target Persona & ICP
      await expect(page.locator('text=Step 2: Target Persona')).toBeVisible({ timeout: 5000 });
      const nextBtn2 = page.getByRole('button', { name: /Continue to Business Model/i });
      await nextBtn2.click();

      // Step 3: Business Model & Monetization
      await expect(page.locator('text=Step 3: Business Model')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Recurring SaaS Subscription')).toBeVisible();
      const nextBtn3 = page.getByRole('button', { name: /Continue to Escrow Authorization/i });
      await nextBtn3.click();

      // Step 4: Blueprint Review & 2PC Escrow Authorization
      await expect(page.locator('text=Step 4: Blueprint Review & 2PC Escrow Authorization')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Zero-Charge Failure Guarantee Protected')).toBeVisible();
      await expect(page.locator('text=5-Milestone Execution Roadmap')).toBeVisible();

      // Trigger Launch
      const launchBtn = page.getByRole('button', { name: /Authorize Escrow & Trigger Autonomous Build/i });
      await expect(launchBtn).toBeVisible();
      await launchBtn.click();

      // Should transition to live venture console
      await expect(page.locator('text=Live Venture Console')).toBeVisible({ timeout: 12000 });
    });
  });

  test.describe('Persona 2: Serial Entrepreneur Cockpit & BYOK Vault', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/launchpad/serial');
      await expect(page.locator('text=Serial Cockpit')).toBeVisible({ timeout: 10000 });
    });

    test('validates multi-venture metrics, BYOK key vault, and 1-click Git ejection', async ({ page }) => {
      // 1. Portfolio Metrics Bar
      await expect(page.locator('text=Active Ventures')).toBeVisible();
      await expect(page.locator('text=Aggregated MRR')).toBeVisible();
      await expect(page.locator('text=System Uptime')).toBeVisible();
      await expect(page.locator('text=Incurred Bug Tax')).toBeVisible();

      // 2. BYOK Key Vault Tab
      const byokTab = page.getByRole('button', { name: /BYOK Key Vault/i });
      await expect(byokTab).toBeVisible();
      await byokTab.click();

      // Verify BYOK section
      await expect(page.locator('text=Bring Your Own Keys (BYOK) Management')).toBeVisible();
      await expect(page.locator('text=0.0% Platform Markup Guaranteed')).toBeVisible();

      // Test key connectivity input
      const anthropicInput = page.locator('input[placeholder*="Anthropic"]');
      if (await anthropicInput.isVisible()) {
        await anthropicInput.fill('sk-ant-api03-sample-key-1234567890');
        const testBtn = page.getByRole('button', { name: /Test Connection/i }).first();
        if (await testBtn.isVisible()) {
          await testBtn.click();
        }
      }

      // 3. Instant Git Ejection UI Tab
      const ejectTab = page.getByRole('button', { name: /Instant Git Ejection/i });
      await expect(ejectTab).toBeVisible();
      await ejectTab.click();

      // Verify clean-room section
      await expect(page.locator('text=Instant 1-Click Full Git Ejection')).toBeVisible();
      await expect(page.locator('text=Zero-Lock-In Clean Room Guarantee')).toBeVisible();

      // Trigger 1-click ejection
      const ejectBtn = page.getByRole('button', { name: /Eject Codebase Now/i });
      if (await ejectBtn.isVisible()) {
        await ejectBtn.click();
        await expect(page.locator('text=Ejection Completed Successfully!')).toBeVisible({ timeout: 6000 });
      }
    });
  });
});

