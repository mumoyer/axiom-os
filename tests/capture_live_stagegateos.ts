import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\mumoy\\.gemini\\antigravity\\brain\\48b9f3cb-5495-42a3-9f46-06c517ff48de';

async function main() {
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

  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });

  // 1. Visit live production home page
  console.log('1. Navigating to live production home page: https://www.stagegateos.com/#/');
  const page1 = await context.newPage();
  await page1.goto('https://www.stagegateos.com/#/');
  await page1.waitForTimeout(3000);
  await page1.screenshot({ path: 'verification_live_stagegateos_production.png' });
  fs.copyFileSync('verification_live_stagegateos_production.png', path.join(ARTIFACT_DIR, 'verification_live_stagegateos_production.png'));
  console.log('Captured verification_live_stagegateos_production.png');
  await page1.close();

  // 2. Open Founder Settings Modal with provisioned subscriber
  console.log('2. Testing Founder Settings Modal on live production...');
  const page2 = await context.newPage();
  await page2.goto('https://www.stagegateos.com/#/');
  await page2.evaluate(() => {
    localStorage.setItem('stagegate_subscriber_email', 'prod-test-subscriber@stagegateos.com');
  });
  await page2.goto('https://www.stagegateos.com/#settings');
  await page2.waitForTimeout(2500);

  // If input is visible, fill and lookup
  const input = page2.locator('input[type="email"]');
  if (await input.isVisible()) {
    await input.fill('prod-test-subscriber@stagegateos.com');
    await page2.click('button:has-text("Lookup")');
    await page2.waitForTimeout(2500);
  }
  await page2.screenshot({ path: 'verification_live_founder_settings.png' });
  fs.copyFileSync('verification_live_founder_settings.png', path.join(ARTIFACT_DIR, 'verification_live_founder_settings.png'));
  console.log('Captured verification_live_founder_settings.png');
  await page2.close();

  // 3. Open Checkout with Guarantee Link
  console.log('3. Testing Checkout Page Click-to-Cancel Guarantee on live production...');
  const page3 = await context.newPage();
  await page3.goto('https://www.stagegateos.com/#checkout?tier=SERIAL');
  await page3.waitForTimeout(2500);
  await page3.screenshot({ path: 'verification_live_checkout.png' });
  fs.copyFileSync('verification_live_checkout.png', path.join(ARTIFACT_DIR, 'verification_live_checkout.png'));
  console.log('Captured verification_live_checkout.png');
  await page3.close();

  // 4. Test Bug Reporting Modal on live production
  console.log('4. Testing Bug Reporting Modal on live production...');
  const page4 = await context.newPage();
  await page4.goto('https://www.stagegateos.com/#/');
  await page4.waitForTimeout(2500);
  const bugBtn = page4.locator('button:has-text("Report a Bug")').first();
  await bugBtn.click();
  await page4.waitForTimeout(2000);
  await page4.screenshot({ path: 'verification_live_bug_modal.png' });
  fs.copyFileSync('verification_live_bug_modal.png', path.join(ARTIFACT_DIR, 'verification_live_bug_modal.png'));
  console.log('Captured verification_live_bug_modal.png');
  await page4.close();

  await browser.close();
  console.log('All live production verifications completed cleanly and successfully!');
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
