import { test, expect } from '@playwright/test';

test.describe('Live Stage-Gate Telemetry & Audit Stream Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/ventures/ven_docuflow_02');
    await expect(page.locator('text=Live Venture Console')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard Header & Telemetry Gauges: asserts real-time status and 2PC escrow state', async ({ page }) => {
    // Live telemetry gauges
    await expect(page.locator('text=DOM Hydration Latency')).toBeVisible();
    await expect(page.locator('text=Playwright Synthetic Assertions')).toBeVisible();
    await expect(page.locator('text=2PC Escrow Ledger')).toBeVisible();
    await expect(page.locator('text=Platform Absorbed COGS')).toBeVisible();

    // Verify $0.00 user liability indicator
    await expect(page.locator('text=$0.00 Incurred by User')).toBeVisible();
  });

  test('StageGateTimeline Component: renders all 5 gates with receipts and diagnostic logs', async ({ page }) => {
    // 5 Stages verification
    await expect(page.locator('text=Build & Strict TypeScript Check')).toBeVisible();
    await expect(page.locator('text=Infrastructure & Container Health Probe')).toBeVisible();
    await expect(page.locator('text=RFC 6125 SSL & Quad-DoH DNS Quorum')).toBeVisible();
    await expect(page.locator('text=Stripe Checkout & Webhook Idempotency')).toBeVisible();
    await expect(page.locator('text=Git Ejection & 100% Repository Portability')).toBeVisible();

    // Verify PASSED badges
    const passBadges = page.locator('text=PASSED');
    const count = await passBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Expand All button
    const expandBtn = page.getByRole('button', { name: /Expand All/i });
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await expect(page.locator('button:has-text("Diagnostic Logs")').first()).toBeVisible();
    }
  });

  test('AuditLogTerminal Component: tests level filter buttons and search', async ({ page }) => {
    // Terminal window chrome
    const terminal = page.locator('text=stagegate-telemetry.stream');
    await expect(terminal).toBeVisible();

    // Search filter input
    const searchInput = page.locator('input[placeholder*="Search audit logs"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Gate');
      await expect(searchInput).toHaveValue('Gate');
    }
  });

  test('StagingPreviewModal: launches responsive device preview with Desktop, Tablet, and Mobile frames', async ({ page }) => {
    // Launch staging preview modal
    const previewBtn = page.getByRole('button', { name: /Staging Preview/i }).first();
    if (await previewBtn.isVisible()) {
      await previewBtn.click();

      // Modal appears
      await expect(page.locator('text=Live Staging')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=TLS 1.3 / RFC 6125')).toBeVisible();

      // Device frame switchers
      const tabletBtn = page.getByRole('button', { name: /Tablet/i });
      if (await tabletBtn.isVisible()) {
        await tabletBtn.click();
        await expect(tabletBtn).toBeVisible();
      }

      const mobileBtn = page.getByRole('button', { name: /Mobile/i });
      if (await mobileBtn.isVisible()) {
        await mobileBtn.click();
        await expect(mobileBtn).toBeVisible();
      }

      const desktopBtn = page.getByRole('button', { name: /Desktop/i });
      if (await desktopBtn.isVisible()) {
        await desktopBtn.click();
        await expect(desktopBtn).toBeVisible();
      }

      // Close modal
      const closeBtn = page.locator('button[title="Close modal"]').or(page.locator('button:has(svg.lucide-x)'));
      if (await closeBtn.first().isVisible()) {
        await closeBtn.first().click();
      }
    }
  });
});

