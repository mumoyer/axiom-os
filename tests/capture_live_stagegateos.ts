import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

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

  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

  // 1. Visit live production website
  await page.goto('https://www.stagegateos.com/#/');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'verification_live_stagegateos_production.png' });
  console.log('Saved verification_live_stagegateos_production.png');

  // Copy to brain artifacts
  fs.copyFileSync(
    'verification_live_stagegateos_production.png',
    'C:\\Users\\mumoy\\.gemini\\antigravity\\brain\\48b9f3cb-5495-42a3-9f46-06c517ff48de\\verification_live_stagegateos_production.png'
  );

  await browser.close();
  console.log('Done capturing live production screenshot');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
