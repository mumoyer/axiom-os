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

  // 1. Live Checkout Page (clean credit card and shop pay)
  await page.goto('http://localhost:3000/#/checkout');
  await page.waitForTimeout(800);
  const cardTab = page.getByRole('button', { name: /Credit \/ Debit Card/i });
  await cardTab.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'verification_clean_checkout.png' });
  console.log('Saved verification_clean_checkout.png');

  // 2. Serial Dashboard (clean empty portfolio state)
  await page.goto('http://localhost:3000/#/dashboard');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'verification_clean_dashboard.png' });
  console.log('Saved verification_clean_dashboard.png');

  // 3. Newbie Wizard (blank fields, quick inspiration)
  await page.goto('http://localhost:3000/#/launchpad/newbie');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'verification_clean_wizard.png' });
  console.log('Saved verification_clean_wizard.png');

  // 4. Explore Scenario Inspection (clearly flagged with interactive explore mode banner)
  await page.goto('http://localhost:3000/#/ventures/ven_docuflow_02');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'verification_explore_scenario_view.png' });
  console.log('Saved verification_explore_scenario_view.png');

  // 5. Landing Page Explore Scenarios section
  await page.goto('http://localhost:3000/#scenarios');
  await page.waitForTimeout(800);
  const scenariosElem = page.locator('#scenarios');
  if (await scenariosElem.isVisible()) {
    await scenariosElem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'verification_explore_scenarios_section.png' });
  console.log('Saved verification_explore_scenarios_section.png');

  await browser.close();
  if (server) {
    await new Promise((resolve) => server!.close(resolve));
    console.log('Closed test server');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
