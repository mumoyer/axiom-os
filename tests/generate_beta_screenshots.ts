import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { app } from '../server/app.js';
import type { Server } from 'node:http';

async function main() {
  let server: Server | null = null;
  try {
    const res = await fetch('http://localhost:3000/api/healthz');
    if (res.ok) {
      console.log('Reusing existing server on port 3000');
    }
  } catch {
    server = await new Promise((resolve) => {
      const s = app.listen(3000, () => resolve(s));
    });
    console.log('Started test server on port 3000');
  }

  const localAppData = process.env.LOCALAPPDATA || '';
  const localChromium = path.join(
    localAppData,
    'ms-playwright',
    'chromium-1200',
    'chrome-win64',
    'chrome.exe'
  );
  const chromiumExecutable = fs.existsSync(localChromium) ? localChromium : undefined;

  const browser = await chromium.launch({
    executablePath: chromiumExecutable,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

  // 1. Landing Page with Beta Banner & Nav Badge
  await page.goto('http://localhost:3000/#/');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification_beta_banner_hero.png' });
  console.log('Saved verification_beta_banner_hero.png');

  // 2. Pricing Section with Beta Rates & Strikethrough List Prices
  const pricingSection = page.locator('#pricing');
  await pricingSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'verification_beta_pricing_section.png' });
  console.log('Saved verification_beta_pricing_section.png');

  // 3. Open Bug Report Modal
  const bannerBugBtn = page.getByRole('button', { name: /Report a Bug & Earn 1–3 Free Months/i }).first();
  await bannerBugBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'verification_bug_report_modal.png' });
  console.log('Saved verification_bug_report_modal.png');

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 4. Checkout Page with Beta Rate Lock & Comparison
  await page.goto('http://localhost:3000/#checkout?plan=FOUNDER');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification_beta_checkout.png' });
  console.log('Saved verification_beta_checkout.png');

  await browser.close();
  if (server) server.close();
  console.log('All verification screenshots captured successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
