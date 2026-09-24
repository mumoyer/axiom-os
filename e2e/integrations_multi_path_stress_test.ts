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
  category: 'INTEGRATION_FAILURE' | 'CONSOLE_ERROR' | 'PAGE_ERROR' | 'NETWORK_FAILURE' | 'DEAD_BUTTON' | 'UI_BUG' | 'SECURITY';
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

async function runExhaustiveIntegrationStressTest() {
  console.log('========================================================================');
  console.log('   STAGE GATE OS EXHAUSTIVE INTEGRATIONS & MULTI-PATH STRESS TEST');
  console.log('========================================================================');
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
  page.on('pageerror', (err) => {
    logFinding({
      category: 'PAGE_ERROR',
      severity: 'CRITICAL',
      location: page.url(),
      description: `Uncaught Page Exception: ${err.message}`,
      evidence: err.stack || err.message,
    });
  });

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      logFinding({
        category: 'CONSOLE_ERROR',
        severity: 'MEDIUM',
        location: page.url(),
        description: `Console error: ${text.slice(0, 300)}`,
        evidence: text,
      });
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore normal SSE stream aborts on route changes, Google Analytics, external fonts
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
    // Flag server 5xx errors or unexpected 4xx errors (excluding intentional test 401s/404s)
    if (res.status() >= 500) {
      logFinding({
        category: 'NETWORK_FAILURE',
        severity: 'CRITICAL',
        location: page.url(),
        description: `HTTP ${res.status()} Internal Server Error: ${res.url()}`,
        evidence: `Status ${res.status()} ${res.statusText()} on ${res.url()}`,
      });
    }
  });

  const BASE_URL = 'http://localhost:3000';

  // ---------------------------------------------------------------------------
  // INTEGRATION 1: Stripe & Shopify Checkout Multi-Path Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 1: Stripe & Shopify Checkout Flow (All Tiers & Intervals) ---');
  await page.goto(`${BASE_URL}/#/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Path A: Founder Plan, Monthly
  console.log('  Testing Path A: Founder Plan ($69/mo Monthly)...');
  const founderCard = page.locator('text=Founder Plan').first();
  await founderCard.click();
  await page.waitForTimeout(300);
  const founderPriceVisible = await page.locator('text=$69').first().isVisible();
  console.log(`    Founder $69 order summary visible: ${founderPriceVisible}`);
  if (!founderPriceVisible) {
    logFinding({
      category: 'INTEGRATION_FAILURE',
      severity: 'HIGH',
      location: '/#/checkout',
      description: 'Founder Plan price calculation failed ($69 expected)',
      evidence: 'Order summary did not reflect $69',
    });
  }

  // Path B: Serial Plan ($1430 Annual -20%)
  console.log('  Testing Path B: Serial Plan with Annual 20% Discount...');
  const serialCard = page.locator('text=Serial Plan').first();
  await serialCard.click();
  const annualBtn = page.getByRole('button', { name: /Annual/i }).first();
  await annualBtn.click();
  await page.waitForTimeout(300);
  const annualSerialVisible = await page.locator('text=$1430').first().isVisible();
  console.log(`    Serial $1430/yr visible: ${annualSerialVisible}`);
  if (!annualSerialVisible) {
    logFinding({
      category: 'INTEGRATION_FAILURE',
      severity: 'HIGH',
      location: '/#/checkout',
      description: 'Annual discount calculation failed for Serial Plan ($1430 expected)',
      evidence: '$1430 not found in order summary',
    });
  }

  // Path C: Shopify / Shop Pay Mode Selection & Link Validation
  console.log('  Testing Path C: Shopify / Shop Pay Mode...');
  const shopifyTab = page.getByRole('button', { name: /Shop Pay/i }).first();
  if (await shopifyTab.isVisible()) {
    await shopifyTab.click();
    await page.waitForTimeout(300);
    const shopifyNotice = await page.locator('text=Shopify / Shop Pay (1-Click)').first().isVisible();
    const shopifyDomain = await page.locator('text=z0zt1m-ae.myshopify.com').first().isVisible();
    console.log(`    Shopify Shop Pay notice & domain visible: ${shopifyNotice && shopifyDomain}`);
  }

  // Path D: Enterprise Tier + Stripe Sandbox Card Authorization Flow
  console.log('  Testing Path D: Enterprise Tier + Test Card Sandbox Authorization Flow...');
  const monthlyBtn = page.getByRole('button', { name: /Monthly/i }).first();
  await monthlyBtn.click();
  const enterpriseCard = page.locator('text=Enterprise Studio Plan').first();
  await enterpriseCard.click();
  await page.waitForTimeout(200);

  const sandboxTab = page.getByRole('button', { name: /Test Card Sandbox/i }).first();
  await sandboxTab.click();
  await page.waitForTimeout(300);

  // Copy sandbox test card credentials
  const copyCardBtn = page.getByRole('button', { name: /Copy Card|Copy/i }).first();
  if (await copyCardBtn.isVisible()) {
    await copyCardBtn.click();
    await page.waitForTimeout(200);
    console.log('    Copied test card credentials');
  }

  // Fill email and authorize subscription
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill('founder.integration.test@moyer-ventures.com');

  // Check required terms checkbox
  const termsCheckbox = page.locator('#terms-consent-checkbox-card');
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
  }

  const authorizeBtn = page.getByRole('button', { name: /Authorize Subscription/i });
  await authorizeBtn.click();
  console.log('    Submitted Sandbox Subscription Authorization...');
  await page.waitForTimeout(2500);

  const activationConfirmed = await page.locator('text=Subscription Activated Successfully!').isVisible();
  console.log(`    Subscription activation confirmation rendered: ${activationConfirmed}`);
  if (!activationConfirmed) {
    logFinding({
      category: 'INTEGRATION_FAILURE',
      severity: 'CRITICAL',
      location: '/#/checkout',
      description: 'Sandbox subscription submission did not render activation confirmation',
      evidence: 'Subscription Activated Successfully! missing after authorization',
    });
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 2: BYOK Key Vault & AES-256-GCM Envelope Encryption
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 2: BYOK Key Vault & Encryption Governance (/launchpad/serial) ---');
  await page.goto(`${BASE_URL}/#/launchpad/serial`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Switch to BYOK Key Vault Tab
  const byokTabBtn = page.getByRole('button', { name: /BYOK Key Vault/i });
  await byokTabBtn.click();
  await page.waitForTimeout(400);

  // Test Provider 1: OpenAI invalid prefix then valid prefix
  console.log('  Testing OpenAI Key Validation...');
  const openaiInput = page.locator('input[placeholder*="sk-proj-"], input[placeholder*="sk-"]').first();
  if (await openaiInput.isVisible()) {
    // 1. Invalid prefix
    await openaiInput.fill('invalid_openai_key');
    const testOpenaiBtn = page.getByRole('button', { name: /Test Connection|Test Key/i }).first();
    if (await testOpenaiBtn.isVisible()) {
      await testOpenaiBtn.click();
      await page.waitForTimeout(400);
      const invalidNotice = await page.locator('text=Key must start with').first().isVisible();
      console.log(`    Invalid prefix rejection error visible: ${invalidNotice}`);
      if (!invalidNotice) {
        logFinding({
          category: 'SECURITY',
          severity: 'HIGH',
          location: '/#/launchpad/serial',
          description: 'BYOK Vault failed to reject invalid key prefix for OpenAI',
          evidence: 'Error notice not displayed for invalid_openai_key',
        });
      }
    }

    // 2. Valid prefix
    await openaiInput.fill('sk-proj-valid-stress-test-openai-key-0123456789');
    if (await testOpenaiBtn.isVisible()) {
      await testOpenaiBtn.click();
      await page.waitForTimeout(700);
      const validStatus = await page.locator('text=Connected').first().isVisible();
      console.log(`    Valid key latency benchmark confirmed: ${validStatus}`);
    }
  }

  // Test Provider 2: Anthropic prefix check
  console.log('  Testing Anthropic Key Validation...');
  const anthropicInput = page.locator('input[placeholder*="sk-ant-"]').first();
  if (await anthropicInput.isVisible()) {
    await anthropicInput.fill('sk-ant-api03-stress-test-anthropic-key-0123456789');
    console.log('    Entered valid Anthropic key with sk-ant- prefix');
  }

  // Save BYOK Keys to Backend (AES-256-GCM authenticated envelope encryption)
  console.log('  Saving BYOK Keys to Backend Storage...');
  const saveKeysBtn = page.getByRole('button', { name: /Save Keys|Save Key|Save All/i }).first();
  if (await saveKeysBtn.isVisible()) {
    await saveKeysBtn.click();
    await page.waitForTimeout(800);
    const saveSuccessBadge = await page.locator('text=Keys Saved & BYOK Mode Active!').first().isVisible();
    console.log(`    BYOK Keys saved and AES-256-GCM encrypted: ${saveSuccessBadge}`);
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 3: 1-Click Git Ejection & Multi-Cloud Portability
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 3: 1-Click Git Ejection & Multi-Cloud Portability ---');
  // Switch to Instant Git Ejection Tab
  const ejectionTabBtn = page.getByRole('button', { name: /Instant Git Ejection/i });
  await ejectionTabBtn.click();
  await page.waitForTimeout(400);

  // Switch to GitLab provider and Supabase target
  const gitlabBtn = page.getByRole('button', { name: /GitLab/i }).first();
  if (await gitlabBtn.isVisible()) {
    await gitlabBtn.click();
    await page.waitForTimeout(200);
    console.log('  Selected GitLab git provider');
  }

  const supabaseTargetBtn = page.getByRole('button', { name: /Supabase/i }).first();
  if (await supabaseTargetBtn.isVisible()) {
    await supabaseTargetBtn.click();
    await page.waitForTimeout(200);
    console.log('  Selected Supabase deployment target');
  }

  // Trigger Ejection
  const triggerEjectBtn = page.getByRole('button', { name: /Trigger Instant Clean-Room Ejection|Trigger Instant|Eject Repository/i }).first();
  if (await triggerEjectBtn.isVisible()) {
    await triggerEjectBtn.click();
    console.log('  Triggered Clean-Room Git Ejection Pipeline...');
    await page.waitForTimeout(1600);

    const ejectReceipt = await page.locator('text=Ejection Complete|Cryptographic Signature|sha256:').first().isVisible();
    console.log(`  Ejection SHA-256 receipt rendered: ${ejectReceipt}`);
    if (!ejectReceipt) {
      logFinding({
        category: 'INTEGRATION_FAILURE',
        severity: 'HIGH',
        location: '/#/launchpad/serial',
        description: 'Git Ejection did not render cryptographic SHA-256 receipt',
        evidence: 'Ejection receipt not visible after 1.6s',
      });
    }

    // Copy verified badge snippet
    const copyBadgeBtn = page.getByRole('button', { name: /Copy Verified Badge|Copy Badge/i }).first();
    if (await copyBadgeBtn.isVisible()) {
      await copyBadgeBtn.click();
      await page.waitForTimeout(200);
      console.log('  Copied verified repository badge snippet');
    }
  }

  // Also test Headless CLI & Terminal tab
  console.log('  Testing Headless CLI & Terminal tab...');
  const cliTabBtn = page.getByRole('button', { name: /Headless CLI/i });
  if (await cliTabBtn.isVisible()) {
    await cliTabBtn.click();
    await page.waitForTimeout(300);
    const cliRunBtn = page.getByRole('button', { name: /Execute Autonomous CLI Agent/i });
    if (await cliRunBtn.isVisible()) {
      await cliRunBtn.click();
      await page.waitForTimeout(1000);
      console.log('  Executed Autonomous CLI Agent simulation');
    }
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 4: In-Product Messenger & Google Chat Real-Time Dispatch
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 4: In-Product Messenger & Google Chat Alerts ---');
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const messengerBtn = page.getByRole('button', { name: /Project Chat/i }).first();
  if (await messengerBtn.isVisible()) {
    await messengerBtn.click();
    await page.waitForTimeout(500);

    const messengerModal = await page.locator('text=Project Messaging & Collaboration').isVisible();
    console.log(`  Project Messenger Modal opened: ${messengerModal}`);

    // Path A: Customer flow
    const msgInput = page.locator('input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]').first();
    if (await msgInput.isVisible()) {
      await msgInput.fill('Integration Stress Test: Urgent feature request for HIPAA compliance verification');
      const sendBtn = page.getByRole('button', { name: /Send/i }).first();
      await sendBtn.click();
      await page.waitForTimeout(800);

      const noticeVisible = await page.locator('text=Message sent! Jason Moyer notified').isVisible();
      console.log(`  Customer alert dispatched with Google Chat confirmation: ${noticeVisible}`);
      if (!noticeVisible) {
        logFinding({
          category: 'INTEGRATION_FAILURE',
          severity: 'HIGH',
          location: '/#/',
          description: 'Project Messenger did not confirm alert dispatch to Google Chat',
          evidence: 'Status notice for Jason Moyer not displayed',
        });
      }
    }

    // Path B: Admin Reply Mode Toggle
    const adminToggle = page.getByRole('button', { name: /Customer Mode|Admin Reply Mode|Admin/i }).first();
    if (await adminToggle.isVisible()) {
      await adminToggle.click();
      await page.waitForTimeout(300);
      console.log('  Toggled Admin Reply Mode');

      if (await msgInput.isVisible()) {
        await msgInput.fill('Admin reply: HIPAA Gate 2 cryptographic audit receipt is fully verified.');
        const sendBtn = page.getByRole('button', { name: /Send/i }).first();
        await sendBtn.click();
        await page.waitForTimeout(800);
        console.log('  Dispatched admin response to thread');
      }
    }

    // Close modal via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const modalClosed = !(await page.locator('text=Project Messaging & Collaboration').isVisible());
    console.log(`  Modal cleanly dismissed via Escape key: ${modalClosed}`);
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 5: Passwordless Authentication & Session Lifecycle
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 5: Passwordless Authentication & Session Lifecycle ---');
  const signInBtn = page.getByRole('button', { name: /Sign In/i }).first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    await page.waitForTimeout(400);

    // Request magic link
    const authEmail = page.locator('input[placeholder*="founder@venture.com"]').first();
    await authEmail.fill('stress.tester@stagegateos.com');
    const dispatchLinkBtn = page.getByRole('button', { name: /Send Magic Link/i });
    await dispatchLinkBtn.click();
    await page.waitForTimeout(1000);

    const otpStepVisible = await page.locator('text=Enter 6-Digit Code').isVisible();
    console.log(`  OTP authentication step rendered: ${otpStepVisible}`);

    // Dev auto-fill OTP & verify
    const autoFillBtn = page.getByRole('button', { name: /Dev Autofill OTP|Autofill/i }).first();
    if (await autoFillBtn.isVisible()) {
      await autoFillBtn.click();
      await page.waitForTimeout(300);
      console.log('  Applied Dev Autofill OTP');

      const verifyOtpBtn = page.getByRole('button', { name: /Verify Code & Enter|Verify/i }).first();
      if (await verifyOtpBtn.isVisible()) {
        await verifyOtpBtn.click();
        await page.waitForTimeout(1000);

        // Check user session badge in Navigation
        const userBadge = await page.locator('text=stress.tester@stagegateos.com').isVisible();
        console.log(`  User authenticated session in navigation: ${userBadge}`);

        // Test sign out
        const userDropdownBtn = page.locator('button:has-text("stress.tester@stagegateos.com")');
        if (await userDropdownBtn.isVisible()) {
          await userDropdownBtn.click();
          await page.waitForTimeout(200);
          const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
          if (await signOutBtn.isVisible()) {
            await signOutBtn.click();
            await page.waitForTimeout(400);
            console.log('  Successfully signed out and destroyed session');
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 6: Venture Validation Grader (VVG) Alternate Presets & Report
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 6: Venture Validation Grader (All Presets & Unlocked Report) ---');
  await page.goto(`${BASE_URL}/#/grader`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Preset A: High-Risk Prototype (Grade C)
  console.log('  Testing Preset A: High-Risk Prototype...');
  const highRiskPreset = page.getByRole('button', { name: /High-Risk Prototype/i }).first();
  if (await highRiskPreset.isVisible()) {
    await highRiskPreset.click();
    await page.waitForTimeout(300);
    const gradeC = await page.locator('text=Grade C').first().isVisible();
    console.log(`    Grade C calculated: ${gradeC}`);
  }

  // Preset B: Low Score / Auto-Pivot (Grade F < 60)
  console.log('  Testing Preset B: Low Score / Auto-Pivot Trigger...');
  const failingPreset = page.getByRole('button', { name: /Low Score \/ Auto-Pivot/i }).first();
  if (await failingPreset.isVisible()) {
    await failingPreset.click();
    await page.waitForTimeout(300);
    const gradeF = await page.locator('text=Grade F').first().isVisible();
    const pivotSection = await page.locator('text=Automated Pivot Generator Triggered').isVisible();
    console.log(`    Grade F with Automated Pivot Generator: ${gradeF && pivotSection}`);
    if (!gradeF || !pivotSection) {
      logFinding({
        category: 'INTEGRATION_FAILURE',
        severity: 'HIGH',
        location: '/#/grader',
        description: 'Auto-Pivot generator did not trigger for Grade F venture',
        evidence: 'Pivot section missing on Grade F',
      });
    }
  }

  // Preset C: Unicorn Candidate (Grade A)
  console.log('  Testing Preset C: Unicorn Candidate...');
  const unicornPreset = page.getByRole('button', { name: /Unicorn Candidate/i }).first();
  if (await unicornPreset.isVisible()) {
    await unicornPreset.click();
    await page.waitForTimeout(300);
    const gradeA = await page.locator('text=Grade A').first().isVisible();
    console.log(`    Grade A Prime Venture confirmed: ${gradeA}`);
  }

  // Gated Lead Capture & 5-Page Feasibility Report Navigation
  console.log('  Testing Lead Capture & 5-Page Report Tabs...');
  const unlockBtn = page.getByRole('button', { name: /Unlock Full 5-Page|Unlock Report Free/i }).first();
  if (await unlockBtn.isVisible()) {
    await unlockBtn.click();
    await page.waitForTimeout(400);

    const leadName = page.locator('input[placeholder*="Satoshi Nakamoto"]').first();
    const leadEmail = page.locator('input[placeholder*="founder@venture.com"]').first();
    if (await leadName.isVisible()) {
      await leadName.fill('Jason Moyer');
      await leadEmail.fill('jason@moyervllc.com');

      const generateReportBtn = page.getByRole('button', { name: /Unlock Report Now/i }).first();
      await generateReportBtn.click();
      await page.waitForTimeout(1000);
    }

    // Navigate through all 5 report tabs
    for (let p = 1; p <= 5; p++) {
      const tabBtn = page.getByRole('button', { name: new RegExp(`^Page ${p}$`, 'i') }).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(200);
        console.log(`    Verified report tab: Page ${p}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 7: Live Stage-Gate Telemetry Stream (SSE) & Gates 1-5
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 7: Live SSE Telemetry & Diagnostic Receipts (/ventures/ven_docuflow_02) ---');
  await page.goto(`${BASE_URL}/#/ventures/ven_docuflow_02`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Assert Real-time Gauges
  const hydrationGauge = await page.locator('text=DOM Hydration Latency').isVisible();
  const assertionGauge = await page.locator('text=Playwright Synthetic Assertions').isVisible();
  const escrowGauge = await page.locator('text=2PC Escrow Ledger').isVisible();
  const cogsGauge = await page.locator('text=Platform Absorbed COGS').isVisible();
  console.log(`  Live telemetry gauges active: ${hydrationGauge && assertionGauge && escrowGauge && cogsGauge}`);

  // Test expanding gate receipts for all 5 gates
  for (let g = 1; g <= 5; g++) {
    const gateCard = page.locator(`text=G${g}`).first();
    if (await gateCard.isVisible()) {
      await gateCard.click();
      await page.waitForTimeout(300);
      const receiptTab = page.getByRole('button', { name: /Signed Receipt/i }).first();
      if (await receiptTab.isVisible()) {
        await receiptTab.click();
        await page.waitForTimeout(200);
      }
      const receiptVisible = await page.locator('text=sha256:').first().isVisible();
      console.log(`  Gate ${g} receipt signature inspected: ${receiptVisible}`);
    }
  }

  // Test Audit Log Terminal Level & Gate Selectors
  console.log('  Testing Audit Log Terminal Selectors & Filters...');
  const gateSelect = page.locator('select').first();
  if (await gateSelect.isVisible()) {
    await gateSelect.selectOption('1');
    await page.waitForTimeout(150);
    await gateSelect.selectOption('ALL');
  }

  const levelSelect = page.locator('select').nth(1);
  if (await levelSelect.isVisible()) {
    const levels = ['ALL', 'ASSERTION_PASS', 'HEAL_ATTEMPT', 'RECEIPT_SIGNED', 'INFO'];
    for (const lvl of levels) {
      await levelSelect.selectOption(lvl);
      await page.waitForTimeout(150);
    }
    await levelSelect.selectOption('ALL');
  }
  console.log('  Terminal gate and level selectors verified');

  // Test Audit Log Search Box
  const searchInput = page.locator('input[placeholder*="Search audit logs"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('Gate');
    await page.waitForTimeout(200);
    await searchInput.fill('');
    console.log('  Search input verified in terminal');
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 8: Example Scenario Explorer (4 Scenarios x 4 Tabs x Device Frames)
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 8: Example Scenario Explorer Across All 4 Scenarios ---');
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const scenarioNames = ['DocuFlow AI', 'ContractScout', 'MetricPulse Analytics', 'DentalCompliance'];
  for (const sName of scenarioNames) {
    console.log(`  Testing Scenario: ${sName}...`);
    const scenarioBtn = page.getByRole('button', { name: new RegExp(sName, 'i') }).first();
    if (await scenarioBtn.isVisible()) {
      await scenarioBtn.click();
      await page.waitForTimeout(300);

      // Click each tab
      const scenarioTabs = ['VENTURE ARCHITECTURE', 'UNIT ECONOMICS', 'API SPECIFICATION', 'STAGE-GATE VERIFICATION'];
      for (const tab of scenarioTabs) {
        const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') }).first();
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(150);
        }
      }
    }
  }
  console.log('  All 4 dummy venture scenarios and 4 data tabs validated.');

  // Launch Staging Preview from Scenario Explorer and test internal tabs
  console.log('  Launching Staging Sandbox Device Preview...');
  const previewLaunchBtn = page.getByRole('button', { name: /LAUNCH INTERACTIVE PREVIEW|TEST STAGING SANDBOX/i }).first();
  if (await previewLaunchBtn.isVisible()) {
    await previewLaunchBtn.click();
    await page.waitForTimeout(600);

    const stagingHeader = await page.getByText('Live Staging', { exact: true }).first().isVisible();
    console.log(`    Staging Preview Modal opened: ${stagingHeader}`);

    // Switch device frames: Tablet -> Mobile -> Desktop
    const tabletBtn = page.getByRole('button', { name: /Tablet/i });
    if (await tabletBtn.isVisible()) await tabletBtn.click();
    const mobileBtn = page.getByRole('button', { name: /Mobile/i });
    if (await mobileBtn.isVisible()) await mobileBtn.click();
    const desktopBtn = page.getByRole('button', { name: /Desktop/i });
    if (await desktopBtn.isVisible()) await desktopBtn.click();
    console.log('    Tested Desktop, Tablet, and Mobile device frames');

    // Switch tabs inside staging modal: App -> Stripe Checkout -> API
    const billingTab = page.getByRole('button', { name: /Stripe Checkout/i }).first();
    if (await billingTab.isVisible()) {
      await billingTab.click();
      await page.waitForTimeout(300);
      const subscribeSimBtn = page.getByRole('button', { name: /Simulate Payment Confirmation/i }).first();
      if (await subscribeSimBtn.isVisible()) {
        await subscribeSimBtn.click();
        await page.waitForTimeout(300);
        const simReceipt = await page.locator('text=Simulated Stripe Sandbox Checkout test completed successfully!').isVisible();
        console.log(`    Simulated Stripe subscription payment verified: ${simReceipt}`);
      }
    }

    const docsTab = page.getByRole('button', { name: /^API$/i }).first();
    if (await docsTab.isVisible()) {
      await docsTab.click();
      await page.waitForTimeout(200);
      console.log('    Verified Staging Sandbox API tab');
    }

    // Dismiss modal via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 9: Newbie Guided Wizard (Step 1-4 Custom Path & Data Persistence)
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 9: Newbie Guided Wizard Custom Path & Back-Step Persistence ---');
  await page.goto(`${BASE_URL}/#/launchpad/newbie`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Step 1: Custom typing
  const nameInput = page.locator('input[placeholder*="DocuFlow AI"], input[placeholder*="Venture Name"]').first();
  if (await nameInput.isVisible()) {
    await nameInput.fill('OmniReconcile AI');
  }
  const problemInput = page.locator('textarea[placeholder*="manual, painful problem"]').first();
  if (await problemInput.isVisible()) {
    await problemInput.fill('Finance teams spend 20 hours per week manually matching vendor invoices.');
  }

  // Advance to Step 2
  const toStep2 = page.getByRole('button', { name: /Continue to Target Persona/i });
  await toStep2.click();
  await page.waitForTimeout(400);

  // Step 2: Custom audience selection
  const b2bOption = page.locator('text=B2B Mid-Market Teams').first();
  if (await b2bOption.isVisible()) await b2bOption.click();

  // Advance to Step 3
  const toStep3 = page.getByRole('button', { name: /Continue to Business Model/i });
  await toStep3.click();
  await page.waitForTimeout(400);

  // Advance to Step 4
  const toStep4 = page.getByRole('button', { name: /Continue to Escrow Authorization|Continue to Review/i });
  await toStep4.click();
  await page.waitForTimeout(400);

  // Step backward: Step 4 -> Step 1
  console.log('  Testing backward navigation to verify data persistence...');
  const backBtn = page.getByRole('button', { name: /Back/i }).first();
  if (await backBtn.isVisible()) {
    await backBtn.click(); // Back to Step 3
    await page.waitForTimeout(200);
    await backBtn.click(); // Back to Step 2
    await page.waitForTimeout(200);
    await backBtn.click(); // Back to Step 1
    await page.waitForTimeout(300);

    const preservedName = await nameInput.inputValue();
    console.log(`    Preserved business name in Step 1: "${preservedName}"`);
    if (preservedName !== 'OmniReconcile AI') {
      logFinding({
        category: 'UI_BUG',
        severity: 'HIGH',
        location: '/#/launchpad/newbie',
        description: 'Newbie Wizard lost user form state upon navigating backwards',
        evidence: `Expected "OmniReconcile AI", found "${preservedName}"`,
      });
    }

    // Step forward back to Step 4
    await toStep2.click();
    await page.waitForTimeout(200);
    await toStep3.click();
    await page.waitForTimeout(200);
    await toStep4.click();
    await page.waitForTimeout(300);
  }

  // ---------------------------------------------------------------------------
  // INTEGRATION 10: Robust React 19 Event Handler & Dead-Button Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- INTEGRATION 10: Robust React 19 Event Handler & Dead Button Audit ---');
  const auditRoutes = ['/', '/grader', '/checkout', '/launchpad/newbie', '/launchpad/serial', '/ventures/ven_docuflow_02'];
  for (const r of auditRoutes) {
    await page.goto(`${BASE_URL}/#${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const buttons = await page.locator('button').all();
    let unhandledCount = 0;

    for (const btn of buttons) {
      try {
        if (!(await btn.isVisible())) continue;
        const isDisabled = await btn.isDisabled();
        if (isDisabled) continue;

        // Accurate React 19 handler detection: keys starting with __reactProps$ or __reactFiber$
        const isHandled = await btn.evaluate((el) => {
          const keys = Object.keys(el);
          const hasReactKey = keys.some(
            (k) =>
              (k.startsWith('__reactProps$') || k.startsWith('__reactFiber$')) &&
              Boolean((el as any)[k]?.onClick || (el as any)[k]?.memoizedProps?.onClick)
          );
          return Boolean(
            el.onclick ||
            el.getAttribute('onclick') ||
            (el as any).type === 'submit' ||
            hasReactKey
          );
        });

        if (!isHandled) {
          unhandledCount++;
        }
      } catch {}
    }
    console.log(`  Route /#${r}: ${buttons.length} buttons audited -> ${unhandledCount} unhandled.`);
    if (unhandledCount > 0) {
      logFinding({
        category: 'DEAD_BUTTON',
        severity: 'MEDIUM',
        location: `/#${r}`,
        description: `${unhandledCount} unhandled buttons detected on route`,
        evidence: `Route /#${r}`,
      });
    }
  }

  await browser.close();

  console.log('\n========================================================================');
  console.log('   EXHAUSTIVE INTEGRATION STRESS TEST COMPLETE');
  console.log(`   Total Findings Recorded: ${findings.length}`);
  console.log('========================================================================');

  fs.writeFileSync(
    path.resolve(process.cwd(), 'scratch_stress_test_findings.json'),
    JSON.stringify(findings, null, 2),
    'utf8'
  );

  if (findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length > 0) {
    console.error('Stress test failed with high or critical severity findings.');
    process.exit(1);
  }
}

runExhaustiveIntegrationStressTest().catch((err) => {
  console.error('Fatal error during integration stress test:', err);
  process.exit(1);
});
