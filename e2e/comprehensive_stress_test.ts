import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

// Resolve pre-installed Chromium in $LOCALAPPDATA\ms-playwright\chromium-1200
const localAppData = process.env.LOCALAPPDATA || '';
const localChromium = path.join(
  localAppData,
  'ms-playwright',
  'chromium-1200',
  'chrome-win64',
  'chrome.exe'
);
const chromiumExecutable = fs.existsSync(localChromium) ? localChromium : undefined;

interface Finding {
  category: 'CONSOLE_ERROR' | 'PAGE_ERROR' | 'NETWORK_FAILURE' | 'DEAD_BUTTON' | 'UI_BUG' | 'PERFORMANCE' | 'SPEC_MISMATCH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  description: string;
  evidence: string;
}

const findings: Finding[] = [];

function logFinding(f: Finding) {
  findings.push(f);
  console.log(`[FINDING][${f.severity}][${f.category}] @ ${f.location}: ${f.description}`);
}

async function runStressTest() {
  console.log('=== STARTING HEADLESS STRESS-TEST ENGINE FOR STAGE GATE OS ===');
  console.log(`Chromium Executable: ${chromiumExecutable || 'Default bundled'}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromiumExecutable,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Listeners for errors
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      logFinding({
        category: 'CONSOLE_ERROR',
        severity: 'MEDIUM',
        location: page.url(),
        description: `Console error logged: ${text.slice(0, 300)}`,
        evidence: text,
      });
    } else if (text.toLowerCase().includes('failed') || text.toLowerCase().includes('uncaught')) {
      logFinding({
        category: 'CONSOLE_ERROR',
        severity: 'LOW',
        location: page.url(),
        description: `Suspicious console message: ${text.slice(0, 300)}`,
        evidence: text,
      });
    }
  });

  page.on('pageerror', (err) => {
    logFinding({
      category: 'PAGE_ERROR',
      severity: 'CRITICAL',
      location: page.url(),
      description: `Uncaught Page Exception: ${err.message}`,
      evidence: err.stack || err.message,
    });
  });

  page.on('requestfailed', (req) => {
    // Ignore aborted telemetry, font fails, or SSE streams aborting on route changes
    const url = req.url();
    if (
      !url.includes('google-analytics') &&
      !url.includes('fonts.gstatic') &&
      !url.includes('/api/telemetry/stream')
    ) {
      logFinding({
        category: 'NETWORK_FAILURE',
        severity: 'HIGH',
        location: page.url(),
        description: `HTTP Request Failed: ${req.method()} ${url} - ${req.failure()?.errorText}`,
        evidence: `${req.method()} ${url}: ${req.failure()?.errorText}`,
      });
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      logFinding({
        category: 'NETWORK_FAILURE',
        severity: res.status() >= 500 ? 'CRITICAL' : 'MEDIUM',
        location: page.url(),
        description: `HTTP ${res.status()} response: ${res.url()}`,
        evidence: `Status ${res.status()} ${res.statusText()} on ${res.url()}`,
      });
    }
  });

  const BASE_URL = 'http://localhost:3000';

  console.log('\n--- PHASE 1: Testing Landing Page (/) ---');
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check title
  const title = await page.title();
  console.log(`Page Title: ${title}`);
  if (!title.includes('Stage Gate OS')) {
    logFinding({
      category: 'UI_BUG',
      severity: 'LOW',
      location: '/#/',
      description: `Unexpected page title: ${title}`,
      evidence: title,
    });
  }

  // Test Simulator Buttons
  console.log('Testing Simulator Buttons on Landing Page...');
  const simPassBtn = page.getByRole('button', { name: /PASS_SCENARIO/i });
  if (await simPassBtn.isVisible()) {
    await simPassBtn.click();
    console.log('Clicked PASS_SCENARIO');
    await page.waitForTimeout(3500);
    const gate5Visible = await page.locator('text=Gate 5: Clean-Room Git Ejection').isVisible();
    console.log(`Gate 5 visible after pass simulation: ${gate5Visible}`);
    if (!gate5Visible) {
      logFinding({
        category: 'UI_BUG',
        severity: 'HIGH',
        location: '/#/',
        description: 'Simulate Verified Pass did not advance to Gate 5 as expected',
        evidence: 'Gate 5 not visible after 3.5s',
      });
    }
  } else {
    logFinding({
      category: 'DEAD_BUTTON',
      severity: 'HIGH',
      location: '/#/',
      description: 'Button PASS_SCENARIO not found on Landing Page',
      evidence: 'Locator failed',
    });
  }

  const simRefundBtn = page.getByRole('button', { name: /REFUND_TEST/i });
  if (await simRefundBtn.isVisible()) {
    await simRefundBtn.click();
    console.log('Clicked REFUND_TEST ($0.00)');
    await page.waitForTimeout(2000);
    const refundTextVisible = await page.locator('text=2PC Escrow triggered automatic rollback').or(page.locator('text=ESCROW_ABORT_ROLLBACK')).first().isVisible();
    console.log(`Refund message visible: ${refundTextVisible}`);
    if (!refundTextVisible) {
      logFinding({
        category: 'UI_BUG',
        severity: 'MEDIUM',
        location: '/#/',
        description: 'Simulate $0.00 Refund did not display refund confirmation',
        evidence: 'Refund notice not visible after 2s',
      });
    }
  }

  // Test Matrix Filter Tabs
  console.log('Testing Competitive Matrix filter tabs...');
  const matrixTabs = ['VS_POLSIA', 'VS_CURSOR_LOVABLE', 'VS_VENTURE_STUDIOS', 'ALL_12_DIMENSIONS'];
  for (const tabName of matrixTabs) {
    const tabBtn = page.getByRole('button', { name: new RegExp(tabName, 'i') });
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
      await page.waitForTimeout(300);
      console.log(`Clicked matrix tab: ${tabName}`);
    }
  }

  // Test Staging Preview Modal
  console.log('Testing Staging Preview Modal launch on Landing Page...');
  const previewLaunchBtn = page.getByRole('button', { name: /LAUNCH INTERACTIVE PREVIEW/i }).first();
  if (await previewLaunchBtn.isVisible()) {
    await previewLaunchBtn.click();
    await page.waitForTimeout(600);
    const modalHeading = page.getByText('Live Staging', { exact: true }).first();
    if (await modalHeading.isVisible()) {
      console.log('Staging Preview Modal opened successfully.');
      // Test device toggles
      const tabletBtn = page.getByRole('button', { name: /Tablet/i });
      if (await tabletBtn.isVisible()) await tabletBtn.click();
      const mobileBtn = page.getByRole('button', { name: /Mobile/i });
      if (await mobileBtn.isVisible()) await mobileBtn.click();
      const desktopBtn = page.getByRole('button', { name: /Desktop/i });
      if (await desktopBtn.isVisible()) await desktopBtn.click();
      
      // Close modal
      const closeBtn = page.getByRole('button', { name: /Close Preview/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(400);
        console.log('Staging Preview Modal closed cleanly.');
      }
    } else {
      logFinding({
        category: 'DEAD_BUTTON',
        severity: 'HIGH',
        location: '/#/',
        description: 'LAUNCH INTERACTIVE PREVIEW button clicked but modal did not open',
        evidence: 'Live Staging badge not visible in modal',
      });
    }
  }

  console.log('\n--- PHASE 2: Testing Venture Validation Grader (/grader) ---');
  await page.goto(`${BASE_URL}/#/grader`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Test inputs
  const ventureNameInput = page.locator('input[placeholder*="DocuPulse AI"]');
  if (await ventureNameInput.isVisible()) {
    await ventureNameInput.fill('StressTest Enterprise Cloud');
    console.log('Filled venture name');
  }

  // Test presets
  console.log('Testing Grader presets...');
  const failingPreset = page.getByRole('button', { name: /Low Score \/ Auto-Pivot/i });
  if (await failingPreset.isVisible()) {
    await failingPreset.click();
    await page.waitForTimeout(500);
    const gradeF = await page.locator('text=Grade F').first().isVisible();
    const pivotSection = await page.locator('text=Automated Pivot Generator Triggered').isVisible();
    console.log(`Failing preset: Grade F visible = ${gradeF}, Pivot section visible = ${pivotSection}`);
    if (!gradeF || !pivotSection) {
      logFinding({
        category: 'UI_BUG',
        severity: 'HIGH',
        location: '/#/grader',
        description: 'Low Score preset failed to trigger Grade F or Automated Pivot Generator',
        evidence: `Grade F: ${gradeF}, Pivot: ${pivotSection}`,
      });
    }
  }

  const unicornPreset = page.getByRole('button', { name: /Unicorn|Prime Candidate/i });
  if (await unicornPreset.isVisible()) {
    await unicornPreset.click();
    await page.waitForTimeout(500);
    const gradeA = await page.locator('text=Grade A').first().isVisible();
    console.log(`Unicorn preset: Grade A visible = ${gradeA}`);
  }

  // Test Lead Capture Modal & Validation
  console.log('Testing Gated Lead Capture Modal...');
  const unlockBtn = page.getByRole('button', { name: /Unlock Full 5-Page Feasibility Report/i });
  if (await unlockBtn.isVisible()) {
    await unlockBtn.click();
    await page.waitForTimeout(500);
    
    // Submit empty to test validation
    const submitLeadBtn = page.getByRole('button', { name: /Unlock Report Now/i });
    if (await submitLeadBtn.isVisible()) {
      await submitLeadBtn.click();
      await page.waitForTimeout(300);
      const nameError = await page.locator('text=Please enter your full name').isVisible();
      console.log(`Empty lead validation message visible: ${nameError}`);

      // Fill name but invalid email
      const nameField = page.locator('input[placeholder*="Satoshi Nakamoto"]');
      await nameField.fill('Test Founder');
      const emailField = page.locator('input[placeholder*="founder@venture.com"]');
      await emailField.fill('invalid-email-no-domain');
      await submitLeadBtn.click();
      await page.waitForTimeout(300);
      const emailError = await page.locator('text=Please enter a valid work email address').isVisible();
      console.log(`Invalid email validation message visible: ${emailError}`);

      // Fill valid email
      await emailField.fill('founder@validcompany.io');
      await submitLeadBtn.click();
      await page.waitForTimeout(1000);

      // Verify report unlocked
      const unlockedReport = await page.locator('text=Comprehensive 5-Page Feasibility & Execution Report').isVisible();
      console.log(`5-Page Feasibility Report Unlocked: ${unlockedReport}`);
      if (!unlockedReport) {
        logFinding({
          category: 'UI_BUG',
          severity: 'CRITICAL',
          location: '/#/grader',
          description: 'Lead submission did not unlock the 5-page feasibility report',
          evidence: 'Report section not visible after successful lead submission',
        });
      } else {
        // Test switching pages 1 through 5
        for (let pNum = 1; pNum <= 5; pNum++) {
          const pageTab = page.getByRole('button', { name: `Page ${pNum}` });
          if (await pageTab.isVisible()) {
            await pageTab.click();
            await page.waitForTimeout(200);
            console.log(`Switched to Report Page ${pNum}`);
          }
        }
      }
    }
  }

  console.log('\n--- PHASE 3: Testing Subscriber Checkout (/checkout) ---');
  await page.goto(`${BASE_URL}/#/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Test Plan Selection
  console.log('Testing Plan Selection Cards...');
  const founderCard = page.locator('text=Founder Plan').first();
  if (await founderCard.isVisible()) {
    await founderCard.click();
    await page.waitForTimeout(300);
    const p69 = await page.locator('text=$69').first().isVisible();
    console.log(`Founder Plan selected, $69 visible: ${p69}`);
  }

  const serialCard = page.locator('text=Serial Plan').first();
  if (await serialCard.isVisible()) {
    await serialCard.click();
    await page.waitForTimeout(300);
    const p149 = await page.locator('text=$149').first().isVisible();
    console.log(`Serial Plan selected, $149 visible: ${p149}`);
  }

  const enterpriseCard = page.locator('text=Enterprise Studio Plan').first();
  if (await enterpriseCard.isVisible()) {
    await enterpriseCard.click();
    await page.waitForTimeout(300);
    const p999 = await page.locator('text=$999').first().isVisible();
    console.log(`Enterprise Plan selected, $999 visible: ${p999}`);
  }

  // Test Annual Billing Toggle
  console.log('Testing Annual Billing Toggle...');
  const annualToggle = page.getByRole('button', { name: /Annual/i }).first();
  if (await annualToggle.isVisible()) {
    await annualToggle.click();
    await page.waitForTimeout(300);
    console.log('Toggled to Annual Billing');
  }

  const monthlyToggle = page.getByRole('button', { name: /Monthly/i }).first();
  if (await monthlyToggle.isVisible()) {
    await monthlyToggle.click();
    await page.waitForTimeout(300);
    console.log('Toggled back to Monthly Billing');
  }

  // Test Payment Method Toggle: Shop Pay vs Test Card Sandbox
  console.log('Testing Payment Method Toggle...');
  const cardSandboxBtn = page.getByRole('button', { name: /Test Card Sandbox/i });
  if (await cardSandboxBtn.isVisible()) {
    await cardSandboxBtn.click();
    await page.waitForTimeout(400);
    console.log('Switched to Test Card Sandbox');

    // Verify test card helper
    const testCardSection = page.locator('text=Stripe Sandbox Test Card');
    console.log(`Stripe Sandbox Test Card section visible: ${await testCardSection.isVisible()}`);

    // Test Copy button
    const copyCardBtn = page.getByRole('button', { name: /Copy/i }).first();
    if (await copyCardBtn.isVisible()) {
      await copyCardBtn.click();
      await page.waitForTimeout(300);
      const copiedText = await page.getByRole('button', { name: /Copied/i }).isVisible();
      console.log(`Card copy button feedback visible: ${copiedText}`);
    }

    // Submit Card Sandbox Checkout
    const checkoutEmail = page.locator('input[type="email"]').first();
    if (await checkoutEmail.isVisible()) {
      await checkoutEmail.fill('automated.stress.test@moyer-ventures.com');
    }
    const authSubBtn = page.getByRole('button', { name: /Authorize Subscription/i });
    if (await authSubBtn.isVisible()) {
      await authSubBtn.click();
      console.log('Submitted Authorize Subscription in Card Sandbox...');
      await page.waitForTimeout(3000);

      const successConfirm = await page.locator('text=Subscription Activated Successfully!').isVisible();
      console.log(`Subscription confirmation rendered: ${successConfirm}`);
      if (!successConfirm) {
        logFinding({
          category: 'UI_BUG',
          severity: 'CRITICAL',
          location: '/#/checkout',
          description: 'Sandbox subscription submission did not render activation confirmation',
          evidence: 'Subscription Activated Successfully! not visible after 3s',
        });
      }
    }
  }

  console.log('\n--- PHASE 4: Testing Newbie Wizard (/launchpad/newbie) ---');
  await page.goto(`${BASE_URL}/#/launchpad/newbie`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check Step 1
  const step1Title = await page.locator('text=Step 1: Venture Concept Ingestion').isVisible();
  console.log(`Newbie Wizard Step 1 loaded: ${step1Title}`);

  // Select Preset "DocuFlow AI"
  const docuFlowBtn = page.getByRole('button', { name: 'DocuFlow AI' }).first();
  if (await docuFlowBtn.isVisible()) await docuFlowBtn.click();

  const nextBtn1 = page.getByRole('button', { name: /Continue to Target Persona/i });
  if (await nextBtn1.isVisible()) {
    await nextBtn1.click();
    await page.waitForTimeout(600);
    const step2Title = await page.locator('text=Step 2: Target Persona').isVisible();
    console.log(`Advanced to Step 2: ${step2Title}`);

    const nextBtn2 = page.getByRole('button', { name: /Continue to Business Model/i });
    if (await nextBtn2.isVisible()) {
      await nextBtn2.click();
      await page.waitForTimeout(600);
      const step3Title = await page.locator('text=Step 3: Business Model').isVisible();
      console.log(`Advanced to Step 3: ${step3Title}`);

      const nextBtn3 = page.getByRole('button', { name: /Continue to Clean-Room Review|Continue to Review/i });
      if (await nextBtn3.isVisible()) {
        await nextBtn3.click();
        await page.waitForTimeout(600);
        const step4Title = await page.locator('text=Step 4: Clean-Room Review').isVisible();
        console.log(`Advanced to Step 4: ${step4Title}`);

        // Test Launch Venture button
        const deployBtn = page.getByRole('button', { name: /Trigger Tri-Plane Scaffolding|Launch & Verify/i });
        if (await deployBtn.isVisible()) {
          await deployBtn.click();
          console.log('Clicked Launch & Verify in Wizard');
          await page.waitForTimeout(1500);
        }
      }
    }
  }

  console.log('\n--- PHASE 5: Testing Serial Dashboard (/launchpad/serial) ---');
  await page.goto(`${BASE_URL}/#/launchpad/serial`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const dashHeading = await page.locator('text=Multi-Venture Portfolio & BYOK Console').isVisible();
  console.log(`Serial Dashboard loaded: ${dashHeading}`);

  // Test BYOK Vault
  console.log('Testing BYOK Vault interactions...');
  const keyInput = page.locator('input[placeholder*="sk-"]').first();
  if (await keyInput.isVisible()) {
    await keyInput.fill('sk-test-stress-key-0123456789abcdef');
    const saveKeyBtn = page.getByRole('button', { name: /Save Key|Update Key|Save/i }).first();
    if (await saveKeyBtn.isVisible()) {
      await saveKeyBtn.click();
      await page.waitForTimeout(500);
      console.log('Saved BYOK test key');
    }
  }

  // Test 1-Click Git Ejection button
  const gitEjectBtn = page.getByRole('button', { name: /Eject Repository|Dual-Push Git|Eject to Personal GitHub/i }).first();
  if (await gitEjectBtn.isVisible()) {
    await gitEjectBtn.click();
    console.log('Clicked Git Eject button');
    await page.waitForTimeout(1000);
  }

  console.log('\n--- PHASE 6: Testing Live Venture Monitor (/ventures/ven_docuflow_02) ---');
  await page.goto(`${BASE_URL}/#/ventures/ven_docuflow_02`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const ventureMonitorLoaded = await page.locator('text=Live Venture Console').isVisible();
  console.log(`Live Venture Monitor loaded: ${ventureMonitorLoaded}`);

  // Click on each gate in StageGateTimeline to test receipt and log drawer
  for (let g = 1; g <= 5; g++) {
    const gateCard = page.locator(`text=Gate ${g}:`).first();
    if (await gateCard.isVisible()) {
      await gateCard.click();
      await page.waitForTimeout(300);
      console.log(`Clicked Gate ${g} in timeline`);
    }
  }

  // Test Audit Log Terminal filters
  console.log('Testing Audit Log Terminal filter buttons...');
  const filterLevels = ['ALL', 'INFO', 'WARN', 'PASS', 'ERROR'];
  for (const lvl of filterLevels) {
    const lvlBtn = page.getByRole('button', { name: new RegExp(`^${lvl}`, 'i') });
    if (await lvlBtn.isVisible()) {
      await lvlBtn.click();
      await page.waitForTimeout(200);
    }
  }

  console.log('\n--- PHASE 7: Testing Global Modals ---');
  // Return to home page for modal tests
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Test Project Messenger
  console.log('Testing Project Chat floating button...');
  const chatLauncher = page.getByRole('button', { name: /Project Chat/i }).first();
  if (await chatLauncher.isVisible()) {
    await chatLauncher.click();
    await page.waitForTimeout(500);
    const chatModal = page.locator('text=Project Messaging & Collaboration');
    console.log(`Project Chat Modal visible: ${await chatModal.isVisible()}`);

    // Test sending a message
    const msgInput = page.locator('input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]').first();
    if (await msgInput.isVisible()) {
      await msgInput.fill('Automated headless stress-test ping');
      const sendBtn = page.getByRole('button', { name: /Send/i }).first();
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        await page.waitForTimeout(800);
        console.log('Sent message in Project Chat');
      }
    }

    // Close chat modal
    const closeChatBtn = page.getByRole('button', { name: /Close|✕/i }).first();
    if (await closeChatBtn.isVisible()) {
      await closeChatBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Test Auth Modal
  console.log('Testing Auth Modal...');
  const signInBtn = page.getByRole('button', { name: /Sign In/i }).first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    await page.waitForTimeout(500);
    const authModal = page.locator('text=Founder Passwordless Access');
    console.log(`Auth Modal visible: ${await authModal.isVisible()}`);

    const authEmailInput = page.locator('input[placeholder*="founder@venture.com"]').first();
    if (await authEmailInput.isVisible()) {
      await authEmailInput.fill('founder.auth@test.com');
      const sendLinkBtn = page.getByRole('button', { name: /Send Magic Link/i });
      if (await sendLinkBtn.isVisible()) {
        await sendLinkBtn.click();
        await page.waitForTimeout(1000);
        const otpHeader = await page.locator('text=Enter 6-Digit Code').isVisible();
        console.log(`OTP step reached: ${otpHeader}`);
      }
    }

    // Close auth modal
    const closeAuthBtn = page.getByRole('button', { name: /Close/i }).first();
    if (await closeAuthBtn.isVisible()) {
      await closeAuthBtn.click();
      await page.waitForTimeout(300);
    }
  }

  console.log('\n--- PHASE 8: Dead Button & Broken Link Sweep ---');
  // Check all routes for dead links / buttons
  const routesToCheck = ['/', '/grader', '/checkout', '/launchpad/newbie', '/launchpad/serial', '/ventures/ven_docuflow_02'];
  for (const r of routesToCheck) {
    await page.goto(`${BASE_URL}/#${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Collect all buttons on the page
    const buttons = await page.locator('button').all();
    console.log(`Route /#${r}: Auditing ${buttons.length} buttons...`);
    let deadCount = 0;

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      try {
        const isVis = await btn.isVisible();
        if (!isVis) continue;
        const btnText = (await btn.innerText()).trim();
        const hasOnClick = await btn.evaluate((el) => {
          return Boolean(el.onclick || el.getAttribute('onclick') || (el as any).__reactFiber$ || (el as any).__reactProps$);
        });
        const isDisabled = await btn.isDisabled();
        if (!hasOnClick && !isDisabled && btnText) {
          // Verify if it's a type="submit" in form or has an event handler
          const typeAttr = await btn.getAttribute('type');
          if (typeAttr !== 'submit') {
            deadCount++;
          }
        }
      } catch (err) {
        // Ignored
      }
    }
    console.log(`Route /#${r}: ${deadCount} potentially unhandled buttons detected.`);
  }

  await browser.close();

  console.log('\n=== STRESS TEST EXECUTION COMPLETE ===');
  console.log(`Total Findings Recorded: ${findings.length}`);

  // Write findings to JSON for inspection
  fs.writeFileSync(
    path.resolve(process.cwd(), 'scratch_stress_test_findings.json'),
    JSON.stringify(findings, null, 2),
    'utf8'
  );
}

runStressTest().catch((err) => {
  console.error('Fatal error during stress test execution:', err);
  process.exit(1);
});
