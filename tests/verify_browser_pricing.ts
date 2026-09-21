import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Check Landing Page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const landingText = await page.innerText('body');
  const hasFounder69Btn = landingText.includes('START FOUNDER PLAN ($69/MO)');
  const hasFounderOld49 = landingText.includes('START FOUNDER PLAN ($49/MO)');
  const hasFounder69Card = landingText.includes('$69');

  console.log('Landing has START FOUNDER PLAN ($69/MO):', hasFounder69Btn);
  console.log('Landing has START FOUNDER PLAN ($49/MO):', hasFounderOld49);
  console.log('Landing has $69 in pricing card:', hasFounder69Card);

  await page.screenshot({ path: 'verification_landing_69.png' });

  // 2. Check Checkout Page Monthly
  await page.goto('http://localhost:3000/checkout?plan=founder');
  await page.waitForLoadState('networkidle');

  const checkoutMonthlyText = await page.innerText('body');
  const hasCheckout69 = checkoutMonthlyText.includes('$69');
  console.log('Checkout page (monthly) has $69:', hasCheckout69);

  // 3. Click Annual billing toggle
  await page.click('button:has-text("Annual")');
  await page.waitForTimeout(500);

  const checkoutAnnualText = await page.innerText('body');
  const hasCheckout660 = checkoutAnnualText.includes('$660');
  console.log('Checkout page (annual) has $660:', hasCheckout660);

  await page.screenshot({ path: 'verification_checkout_69.png' });

  await browser.close();
  console.log('Browser verification completed.');
}

run().catch((err) => {
  console.error('Browser check failed:', err);
  process.exit(1);
});
