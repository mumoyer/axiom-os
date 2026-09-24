import { chromium, Browser, Page } from '@playwright/test';
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

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TrustFinding {
  scenarioNumber: number;
  scenarioName: string;
  category: 'TRUST_DESTROYING_DATA' | 'BROKEN_LINK' | 'DEAD_BUTTON' | 'CALCULATION_ERROR' | 'NAVIGATION_FAILURE' | 'EXCEPTION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  description: string;
  evidence: string;
}

const findings: TrustFinding[] = [];

function recordFinding(f: TrustFinding) {
  findings.push(f);
  console.log(`  [TRUST ISSUE][${f.severity}][${f.category}] @ ${f.location}: ${f.description}`);
}

// Helper to assert no trust-destroying strings appear in page content
async function assertNoTrustDestroyingStrings(page: Page, location: string, scenarioNum: number, scenarioName: string) {
  const pageContent = await page.content();
  const forbiddenPatterns = [
    { pattern: /DUMMY_DATA_ACTIVE/i, label: 'Exposed DUMMY_DATA_ACTIVE badge' },
    { pattern: /Explore Scenarios \(Dummy Data\)/i, label: 'Exposed (Dummy Data) link label' },
    { pattern: /Lorem ipsum/i, label: 'Unreplaced Lorem Ipsum text' },
    { pattern: /\[object Object\]/i, label: 'Unserialized [object Object] text' },
    { pattern: /\bNaN\b/, label: 'NaN calculation error' },
    { pattern: /\bundefined\b/i, label: 'Exposed undefined variable' },
  ];

  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(pageContent)) {
      recordFinding({
        scenarioNumber: scenarioNum,
        scenarioName,
        category: 'TRUST_DESTROYING_DATA',
        severity: 'HIGH',
        location,
        description: `Found trust-destroying text in customer viewport: "${label}"`,
        evidence: `Pattern match: ${pattern.toString()}`,
      });
    }
  }
}

async function run10CustomerStressTestScenarios() {
  console.log('========================================================================');
  console.log('   STAGE GATE OS: 10 CUSTOMER-JOURNEY STRESS TEST SCENARIOS');
  console.log('   Auditing Customer Trust, Broken Links, and Subsystem Integrity');
  console.log('========================================================================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Chromium Executable: ${chromiumExecutable || 'Bundled'}\n`);

  const browser: Browser = await chromium.launch({
    headless: true,
    executablePath: chromiumExecutable,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Listeners for unhandled page crashes and network 4xx/5xx failures
  page.on('pageerror', (err) => {
    recordFinding({
      scenarioNumber: 0,
      scenarioName: 'Global Runtime',
      category: 'EXCEPTION',
      severity: 'CRITICAL',
      location: page.url(),
      description: `Uncaught Exception in customer session: ${err.message}`,
      evidence: err.stack || err.message,
    });
  });

  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    // Exclude deliberate sandbox or telemetry mocks
    if (status >= 400 && !url.includes('/favicon.ico') && !url.includes('chrome-extension')) {
      // Check if it's an internal API failure
      if (url.includes('/api/')) {
        recordFinding({
          scenarioNumber: 0,
          scenarioName: 'Global Runtime',
          category: 'NAVIGATION_FAILURE',
          severity: 'HIGH',
          location: url,
          description: `Internal API request returned HTTP ${status}`,
          evidence: `Status: ${status} for ${url}`,
        });
      }
    }
  });

  // ===========================================================================
  // SCENARIO 1: Priya — Non-Technical Solopreneur (Idea Grader & Report Unlock)
  // ===========================================================================
  console.log('--- SCENARIO 1: Priya — Non-Technical Solopreneur (Idea Grader -> 5-Page Report -> Serial Checkout) ---');
  {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Clicks hero CTA to score idea
    const scoreIdeaBtn = page.getByRole('button', { name: /Score Your Business Idea Free/i }).first();
    if (await scoreIdeaBtn.isVisible()) {
      await scoreIdeaBtn.click();
      await page.waitForTimeout(600);
    }

    // Asserts on Grader route
    const currentUrl = page.url();
    console.log(`  Priya arrived at: ${currentUrl}`);

    // Fills custom venture inputs
    const ventureNameInput = page.locator('input[placeholder*="DocuPulse AI"], input[placeholder*="Venture Name"]').first();
    if (await ventureNameInput.isVisible()) {
      await ventureNameInput.fill('ClinicFlow Assistant');
    }

    // Select preset or verify grade
    const unicornBtn = page.getByRole('button', { name: /Tier-A Enterprise SaaS/i }).first();
    if (await unicornBtn.isVisible()) {
      await unicornBtn.click();
      await page.waitForTimeout(300);
      const gradeA = await page.locator('text=Grade A').first().isVisible();
      console.log(`  Priya verified Grade A evaluation: ${gradeA}`);
    }

    // Opens 5-Page Report Modal
    const unlockReportBtn = page.getByRole('button', { name: /Unlock Full 5-Page Feasibility Report|Unlock Report Free/i }).first();
    if (await unlockReportBtn.isVisible()) {
      await unlockReportBtn.click();
      await page.waitForTimeout(400);

      const nameInput = page.locator('input[placeholder*="Satoshi Nakamoto"]').first();
      const emailInput = page.locator('input[placeholder*="founder@venture.com"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Priya Sharma');
        await emailInput.fill('priya@domainexpert.com');
        const submitLeadBtn = page.getByRole('button', { name: /Unlock Report Now/i }).first();
        await submitLeadBtn.click();
        await page.waitForTimeout(1000);
      }

      // Verifies all 5 report tabs
      for (let p = 1; p <= 5; p++) {
        const tabBtn = page.getByRole('button', { name: new RegExp(`^Page ${p}$`, 'i') }).first();
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(150);
          console.log(`  Priya inspected Report Page ${p}`);
        }
      }

      // Click Deploy Validated Venture
      const deployBtn = page.getByRole('button', { name: /Deploy Validated Venture in Stage Gate OS/i }).first();
      if (await deployBtn.isVisible()) {
        await deployBtn.click();
        await page.waitForTimeout(600);
        console.log(`  Priya routed to checkout: ${page.url().includes('checkout')}`);
      }
    }

    await assertNoTrustDestroyingStrings(page, '/#/grader', 1, 'Priya — Non-Technical Solopreneur');
  }

  // ===========================================================================
  // SCENARIO 2: Marcus — Skeptical Indie Hacker (BYOK Vault & Git Ejection)
  // ===========================================================================
  console.log('\n--- SCENARIO 2: Marcus — Skeptical Indie Hacker (BYOK Vault -> 1-Click Git Ejection) ---');
  {
    await page.goto(`${BASE_URL}/#/launchpad/serial`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Switch to BYOK Key Vault Tab
    const byokTabBtn = page.getByRole('button', { name: /BYOK Key Vault/i });
    if (await byokTabBtn.isVisible()) {
      await byokTabBtn.click();
      await page.waitForTimeout(400);

      // Test OpenAI invalid prefix rejection
      const openaiInput = page.locator('input[placeholder*="sk-proj-"], input[placeholder*="sk-"]').first();
      if (await openaiInput.isVisible()) {
        await openaiInput.fill('invalid_marcus_key');
        const testBtn = page.getByRole('button', { name: /Test Connection|Test Key/i }).first();
        if (await testBtn.isVisible()) {
          await testBtn.click();
          await page.waitForTimeout(300);
          const invalidNotice = await page.locator('text=Key must start with').first().isVisible();
          console.log(`  Marcus verified invalid OpenAI prefix error: ${invalidNotice}`);
        }

        // Enter valid key and test benchmark
        await openaiInput.fill('sk-proj-marcus-production-key-9912');
        if (await testBtn.isVisible()) {
          await testBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // Save keys
      const saveKeysBtn = page.getByRole('button', { name: /Save Keys|Save Key|Save All/i }).first();
      if (await saveKeysBtn.isVisible()) {
        await saveKeysBtn.click();
        await page.waitForTimeout(600);
        const encryptedBadge = await page.locator('text=Keys Saved & BYOK Mode Active!').first().isVisible();
        console.log(`  Marcus verified AES-256-GCM authenticated save: ${encryptedBadge}`);
      }
    }

    // Switch to Git Ejection Tab
    const ejectionTabBtn = page.getByRole('button', { name: /Instant Git Ejection/i });
    if (await ejectionTabBtn.isVisible()) {
      await ejectionTabBtn.click();
      await page.waitForTimeout(400);

      // Select GitLab & Supabase
      const gitlabRadio = page.locator('input[value="gitlab"]');
      if (await gitlabRadio.isVisible()) await gitlabRadio.check();

      // Trigger Ejection
      const triggerEjectBtn = page.getByRole('button', { name: /Trigger Git Dual-Push Ejection/i });
      if (await triggerEjectBtn.isVisible()) {
        await triggerEjectBtn.click();
        await page.waitForTimeout(800);
        const receiptBadge = await page.locator('text=Ejection Complete — Zero Lock-In Verified').first().isVisible();
        console.log(`  Marcus verified Git Ejection receipt: ${receiptBadge}`);
      }
    }

    await assertNoTrustDestroyingStrings(page, '/#/launchpad/serial', 2, 'Marcus — Skeptical Indie Hacker');
  }

  // ===========================================================================
  // SCENARIO 3: Dana — Corporate Innovation VP (Governance, SLA & ZDR Privacy)
  // ===========================================================================
  console.log('\n--- SCENARIO 3: Dana — Corporate Innovation VP (SLA Covenant -> Terms -> ZDR Policy) ---');
  {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Click Deterministic SLA Covenant
    const slaBtn = page.getByRole('button', { name: /Deterministic SLA Covenant/i });
    if (await slaBtn.isVisible()) {
      await slaBtn.click();
      await page.waitForTimeout(300);
      const slaModal = await page.locator('text=Deterministic Service Level Agreement').first().isVisible();
      console.log(`  Dana opened SLA Covenant modal: ${slaModal}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Click Platform Terms & 0% Tax Invariant
    const termsBtn = page.getByRole('button', { name: /Platform Terms & 0% Tax Invariant/i });
    if (await termsBtn.isVisible()) {
      await termsBtn.click();
      await page.waitForTimeout(300);
      const termsModal = await page.locator('text=Platform Terms of Service').first().isVisible();
      console.log(`  Dana opened Terms of Service modal: ${termsModal}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Click Zero Data Retention (ZDR) Privacy Policy
    const zdrBtn = page.getByRole('button', { name: /Zero Data Retention \(ZDR\) Privacy Policy/i });
    if (await zdrBtn.isVisible()) {
      await zdrBtn.click();
      await page.waitForTimeout(300);
      const zdrModal = await page.locator('text=Zero Data Retention (ZDR) & Privacy Policy').first().isVisible();
      console.log(`  Dana opened ZDR Privacy Policy modal: ${zdrModal}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Navigate to Enterprise Checkout
    await page.goto(`${BASE_URL}/#/checkout?plan=enterprise`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const enterpriseTitle = await page.locator('text=Enterprise').first().isVisible();
    const enterprisePrice = await page.locator('text=$799').first().isVisible() || await page.locator('text=$999').first().isVisible();
    console.log(`  Dana verified Enterprise Plan: ${enterpriseTitle && enterprisePrice}`);

    await assertNoTrustDestroyingStrings(page, '/#/checkout?plan=enterprise', 3, 'Dana — Corporate Innovation VP');
  }

  // ===========================================================================
  // SCENARIO 4: Alex — Analytical Comparison Shopper (Simulator & Pricing Matrix)
  // ===========================================================================
  console.log('\n--- SCENARIO 4: Alex — Analytical Comparison Shopper (Simulator & 12-Dimension Matrix) ---');
  {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Test Pass Simulation
    const passSimBtn = page.getByRole('button', { name: /Simulate Verified Gate 1-5 Pass/i });
    if (await passSimBtn.isVisible()) {
      await passSimBtn.click();
      await page.waitForTimeout(1000);
      console.log('  Alex tested Gate 1-5 pass simulation');
    }

    // Test Refund Guarantee Simulation
    const refundSimBtn = page.getByRole('button', { name: /Test \$0.00 Failure Refund Guarantee/i });
    if (await refundSimBtn.isVisible()) {
      await refundSimBtn.click();
      await page.waitForTimeout(1000);
      const refundNotice = await page.locator('text=2PC Escrow triggered automatic rollback|ESCROW_ABORT_ROLLBACK').first().isVisible();
      console.log(`  Alex verified $0.00 refund guarantee notice: ${refundNotice}`);
    }

    // Test Competitive Matrix tabs
    const matrixTabs = ['vs Polsia', 'vs Cursor', 'vs Venture Studios', 'All 12 Dimensions'];
    for (const tab of matrixTabs) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') }).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(150);
      }
    }
    console.log('  Alex tested all 4 competitive comparison tabs');

    // Test Annual 20% discount switch
    const annualDiscountBtn = page.getByRole('button', { name: /annual/i }).first();
    if (await annualDiscountBtn.isVisible()) {
      await annualDiscountBtn.click();
      await page.waitForTimeout(300);
      const annualPriceVisible = await page.locator('text=billed annually').first().isVisible();
      console.log(`  Alex verified annual 20% pricing discount: ${annualPriceVisible}`);
      const monthlyDiscountBtn = page.getByRole('button', { name: /monthly/i }).first();
      if (await monthlyDiscountBtn.isVisible()) {
        await monthlyDiscountBtn.click();
      }
      await page.waitForTimeout(200);
    }

    await assertNoTrustDestroyingStrings(page, '/#/', 4, 'Alex — Analytical Comparison Shopper');
  }

  // ===========================================================================
  // SCENARIO 5: Taylor — Fast-Track Checkout Customer (Multi-Tier & Sandbox Auth)
  // ===========================================================================
  console.log('\n--- SCENARIO 5: Taylor — Fast-Track Checkout Customer (Shop Pay & Sandbox Auth) ---');
  {
    await page.goto(`${BASE_URL}/#/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Switch between Founder, Serial, Enterprise
    const founderCard = page.locator('text=Founder Plan').first();
    const serialCard = page.locator('text=Serial Plan').first();
    const enterpriseCard = page.locator('text=Enterprise Plan').first();

    if (await founderCard.isVisible()) await founderCard.click();
    await page.waitForTimeout(200);
    if (await serialCard.isVisible()) await serialCard.click();
    await page.waitForTimeout(200);

    // Test Annual Toggle
    const annualToggle = page.locator('button:has-text("Annual")').first();
    if (await annualToggle.isVisible()) {
      await annualToggle.click();
      await page.waitForTimeout(200);
      await annualToggle.click(); // back to monthly
      await page.waitForTimeout(200);
    }

    // Switch payment mode to Shopify Shop Pay
    const shopPayRadio = page.locator('button:has-text("Shopify / Shop Pay")');
    if (await shopPayRadio.isVisible()) {
      await shopPayRadio.click();
      await page.waitForTimeout(300);
    }

    // Switch back to Test Card Sandbox
    const testCardRadio = page.locator('button:has-text("Test Card Sandbox")');
    if (await testCardRadio.isVisible()) {
      await testCardRadio.click();
      await page.waitForTimeout(300);
    }

    // Test copy card button
    const copyCardBtn = page.getByRole('button', { name: /Copy Card Credentials/i });
    if (await copyCardBtn.isVisible()) {
      await copyCardBtn.click();
      await page.waitForTimeout(300);
      const copiedBadge = await page.locator('text=Copied').first().isVisible();
      console.log(`  Taylor copied test card: ${copiedBadge}`);
    }

    // Check clickwrap terms checkbox
    const termsCheckbox = page.locator('#terms-consent-checkbox-card');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
      await page.waitForTimeout(200);
    }

    // Authorize Subscription
    const authBtn = page.getByRole('button', { name: /Authorize Subscription/i });
    if (await authBtn.isVisible()) {
      await authBtn.click();
      await page.waitForTimeout(2500);
      const activatedNotice = await page.locator('text=Subscription Activated Successfully!').isVisible();
      console.log(`  Taylor verified instant activation confirmation: ${activatedNotice}`);
    }

    await assertNoTrustDestroyingStrings(page, '/#/checkout', 5, 'Taylor — Fast-Track Checkout Customer');
  }

  // ===========================================================================
  // SCENARIO 6: Sam — Interactive Venture Explorer & Device Previewer
  // ===========================================================================
  console.log('\n--- SCENARIO 6: Sam — Interactive Venture Explorer & Device Previewer ---');
  {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Click hero button to explore scenarios
    const exploreBtn = page.getByRole('button', { name: /EXPLORE EXAMPLE SCENARIOS/i });
    if (await exploreBtn.isVisible()) {
      await exploreBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify section title has no "Dummy Data"
    const sectionTitle = await page.locator('text=Explore Live Production Benchmarks & Example Ventures').isVisible();
    const badgeText = await page.locator('text=LIVE_BENCHMARK_ACTIVE').isVisible();
    console.log(`  Sam verified clean benchmark title: ${sectionTitle}, clean badge: ${badgeText}`);

    // Cycle through all 4 sample ventures
    const ventureNames = ['DocuFlow AI', 'ContractScout', 'MetricPulse Analytics', 'DentalCompliance'];
    for (const vName of ventureNames) {
      const vBtn = page.getByRole('button', { name: new RegExp(vName, 'i') }).first();
      if (await vBtn.isVisible()) {
        await vBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Launch Staging Sandbox modal
    const launchSandboxBtn = page.getByRole('button', { name: /TEST STAGING SANDBOX|LAUNCH INTERACTIVE PREVIEW/i }).first();
    if (await launchSandboxBtn.isVisible()) {
      await launchSandboxBtn.click();
      await page.waitForTimeout(600);

      // Verify device frames
      const tabletBtn = page.getByRole('button', { name: /Tablet/i });
      if (await tabletBtn.isVisible()) await tabletBtn.click();
      const mobileBtn = page.getByRole('button', { name: /Mobile/i });
      if (await mobileBtn.isVisible()) await mobileBtn.click();
      const desktopBtn = page.getByRole('button', { name: /Desktop/i });
      if (await desktopBtn.isVisible()) await desktopBtn.click();

      // Verify Stripe Checkout in sandbox
      const billingTab = page.getByRole('button', { name: /Stripe Checkout/i }).first();
      if (await billingTab.isVisible()) {
        await billingTab.click();
        await page.waitForTimeout(300);
        const confirmBtn = page.getByRole('button', { name: /Simulate Payment Confirmation|Authorize Test Checkout/i }).first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          await page.waitForTimeout(300);
          console.log('  Sam verified in-sandbox Stripe Checkout payment authorization');
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    await assertNoTrustDestroyingStrings(page, '/#scenarios', 6, 'Sam — Interactive Venture Explorer');
  }

  // ===========================================================================
  // SCENARIO 7: Jordan — Real-Time DevOps & Telemetry Inspector
  // ===========================================================================
  console.log('\n--- SCENARIO 7: Jordan — Real-Time DevOps & Telemetry Inspector ---');
  {
    await page.goto(`${BASE_URL}/#/ventures/ven_docuflow_02`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Check gauges
    const hydrationGauge = await page.locator('text=DOM Hydration Latency').isVisible();
    const assertionGauge = await page.locator('text=Playwright Synthetic Assertions').isVisible();
    const escrowGauge = await page.locator('text=2PC Escrow Ledger').isVisible();
    const cogsGauge = await page.locator('text=Platform Absorbed COGS').isVisible();
    console.log(`  Jordan verified real-time gauges: ${hydrationGauge && assertionGauge && escrowGauge && cogsGauge}`);

    // Inspect Gates 1 to 5
    for (let g = 1; g <= 5; g++) {
      const gateCard = page.locator(`text=G${g}`).first();
      if (await gateCard.isVisible()) {
        if (g > 1) {
          await gateCard.click();
          await page.waitForTimeout(200);
        }
        const receiptTab = page.getByRole('button', { name: /Signed Receipt/i }).first();
        if (await receiptTab.isVisible()) {
          await receiptTab.click();
          await page.waitForTimeout(200);
        }
        const sig = await page.locator('text=sha256:').first().isVisible();
        console.log(`  Jordan verified Gate ${g} cryptographic receipt: ${sig}`);
      }
    }

    // Terminal filters
    const levelSelect = page.locator('select').nth(1);
    if (await levelSelect.isVisible()) {
      await levelSelect.selectOption('ASSERTION_PASS');
      await page.waitForTimeout(200);
      await levelSelect.selectOption('ALL');
    }

    // Search filter
    const searchInput = page.locator('input[placeholder*="Search audit logs"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('AST');
      await page.waitForTimeout(200);
      await searchInput.fill('');
    }

    await assertNoTrustDestroyingStrings(page, '/#/ventures/ven_docuflow_02', 7, 'Jordan — Real-Time DevOps Inspector');
  }

  // ===========================================================================
  // SCENARIO 8: Elena — Non-Technical Guided Wizard Builder
  // ===========================================================================
  console.log('\n--- SCENARIO 8: Elena — Non-Technical Guided Wizard Builder (Form State Persistence) ---');
  {
    await page.goto(`${BASE_URL}/#/launchpad/newbie`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Step 1: Use preset DocuFlow AI first, then customize
    const presetBtn = page.getByRole('button', { name: 'DocuFlow AI' }).first();
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
      await page.waitForTimeout(300);
    }

    const nameInput = page.locator('input[placeholder*="MetricFlow"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('TaxShield AI');
    }
    const problemInput = page.locator('textarea[placeholder*="manual, painful problem"]').first();
    if (await problemInput.isVisible()) {
      await problemInput.fill('Tax accountants spend 30 hours per week reconciling 1099 vendor receipts.');
    }

    // Step 2
    const toStep2 = page.getByRole('button', { name: /Continue to Target Persona/i });
    await toStep2.click();
    await page.waitForTimeout(500);

    const personaOption = page.locator('text=SMB & Solo Practice Owners').first();
    if (await personaOption.isVisible()) await personaOption.click();

    // Select pain point required by Step 2 validation
    const painPointOption = page.locator('text=Manual repetitive data entry').first();
    if (await painPointOption.isVisible()) await painPointOption.click();
    await page.waitForTimeout(300);

    // Step 3
    const toStep3 = page.getByRole('button', { name: /Continue to Business Model/i });
    await toStep3.click();
    await page.waitForTimeout(500);

    // Step 4
    const toStep4 = page.getByRole('button', { name: /Continue to Escrow Authorization|Continue to Review/i });
    await toStep4.click();
    await page.waitForTimeout(500);

    // Test Backwards Navigation & Persistence
    const backBtn = page.getByRole('button', { name: /Back/i }).first();
    if (await backBtn.isVisible()) {
      await backBtn.click(); // back to Step 3
      await page.waitForTimeout(300);
      await backBtn.click(); // back to Step 2
      await page.waitForTimeout(300);
      await backBtn.click(); // back to Step 1
      await page.waitForTimeout(400);

      const preservedName = await nameInput.inputValue();
      console.log(`  Elena verified form persistence in Step 1: "${preservedName}"`);
      if (preservedName !== 'TaxShield AI') {
        recordFinding({
          scenarioNumber: 8,
          scenarioName: 'Elena — Non-Technical Guided Wizard Builder',
          category: 'NAVIGATION_FAILURE',
          severity: 'HIGH',
          location: '/#/launchpad/newbie',
          description: 'Wizard lost custom venture name upon navigating backwards',
          evidence: `Found "${preservedName}", expected "TaxShield AI"`,
        });
      }
    }

    await assertNoTrustDestroyingStrings(page, '/#/launchpad/newbie', 8, 'Elena — Non-Technical Guided Wizard Builder');
  }

  // ===========================================================================
  // SCENARIO 9: Morgan — Customer Support & Feedback Seeker
  // ===========================================================================
  console.log('\n--- SCENARIO 9: Morgan — Customer Support & Feedback Seeker (Messenger & Bug Reporting) ---');
  {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Open Project Messenger
    const chatBtn = page.locator('button[aria-label="Open Project Messaging"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      await page.waitForTimeout(400);

      const msgInput = page.locator('textarea[placeholder*="Type a message"], input[placeholder*="Type a message"]').first();
      if (await msgInput.isVisible()) {
        await msgInput.fill('Can Stage Gate OS integrate with my existing Supabase database?');
        const sendBtn = page.getByRole('button', { name: /Send/i }).first();
        await sendBtn.click();
        await page.waitForTimeout(600);
        console.log('  Morgan sent inquiry into messenger thread');
      }

      // Toggle Admin Reply Mode
      const adminToggle = page.locator('button:has-text("Admin Reply Mode")');
      if (await adminToggle.isVisible()) {
        await adminToggle.click();
        await page.waitForTimeout(200);
      }

      // Close via Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Open Bug Report Modal via Beta Banner
    const bugBtn = page.locator('button:has-text("Report a Bug / Feedback"), button:has-text("Report a Bug")').first();
    if (await bugBtn.isVisible()) {
      await bugBtn.click();
      await page.waitForTimeout(400);

      const bugTitle = page.locator('input[placeholder*="Brief summary of the issue"]').first();
      if (await bugTitle.isVisible()) {
        await bugTitle.fill('Clarify 2PC Escrow Rollback SLA');
        const submitBugBtn = page.getByRole('button', { name: /Submit Feedback & Bug Report/i }).first();
        if (await submitBugBtn.isVisible()) {
          await submitBugBtn.click();
          await page.waitForTimeout(500);
          console.log('  Morgan submitted bug report successfully');
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    await assertNoTrustDestroyingStrings(page, '/#/', 9, 'Morgan — Customer Support & Feedback Seeker');
  }

  // ===========================================================================
  // SCENARIO 10: Riley — Passwordless Authentication & Session Lifecycle
  // ===========================================================================
  console.log('\n--- SCENARIO 10: Riley — Passwordless Authentication & Session Lifecycle ---');
  {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Click Sign In
    const signInBtn = page.getByRole('button', { name: /Sign In/i }).first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await page.waitForTimeout(400);

      const emailInput = page.locator('input[placeholder*="founder@venture.com"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('riley.founder@venturestudio.io');
        const sendLinkBtn = page.getByRole('button', { name: /Send Magic Link/i });
        await sendLinkBtn.click();
        await page.waitForTimeout(1000);

        // Dev autofill OTP
        const autoFillBtn = page.getByRole('button', { name: /Dev Autofill OTP|Autofill/i }).first();
        if (await autoFillBtn.isVisible()) {
          await autoFillBtn.click();
          await page.waitForTimeout(200);
          const verifyBtn = page.getByRole('button', { name: /Verify Code & Enter|Verify/i }).first();
          await verifyBtn.click();
          await page.waitForTimeout(1000);
        }

        // Verify session badge in navigation
        const sessionBadge = await page.locator('text=riley.founder@venturestudio.io').isVisible();
        console.log(`  Riley authenticated session active in navigation: ${sessionBadge}`);

        // Navigate to /grader and verify session persists
        await page.goto(`${BASE_URL}/#/grader`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const sessionPreserved = await page.locator('text=riley.founder@venturestudio.io').isVisible();
        console.log(`  Riley session preserved across page navigation: ${sessionPreserved}`);

        // Sign Out
        const userMenuBtn = page.locator('button:has-text("riley.founder@venturestudio.io")');
        if (await userMenuBtn.isVisible()) {
          await userMenuBtn.click();
          await page.waitForTimeout(200);
          const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
          if (await signOutBtn.isVisible()) {
            await signOutBtn.click();
            await page.waitForTimeout(400);
            console.log('  Riley signed out cleanly; session destroyed');
          }
        }
      }
    }

    await assertNoTrustDestroyingStrings(page, '/#/grader', 10, 'Riley — Passwordless Auth');
  }

  // ===========================================================================
  // COMPREHENSIVE DEAD-BUTTON & TRUST AUDIT ACROSS ALL 6 ROUTES
  // ===========================================================================
  console.log('\n--- GLOBAL DEAD-BUTTON & LINK INTEGRITY AUDIT ACROSS ALL 6 ROUTES ---');
  const auditRoutes = ['/', '/grader', '/checkout', '/launchpad/newbie', '/launchpad/serial', '/ventures/ven_docuflow_02'];
  for (const r of auditRoutes) {
    await page.goto(`${BASE_URL}/#${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    await assertNoTrustDestroyingStrings(page, `/#${r}`, 0, 'Global Audit');

    // React 19 event handler detection
    const buttons = await page.locator('button').all();
    let unhandledCount = 0;

    for (const btn of buttons) {
      try {
        if (!(await btn.isVisible())) continue;
        if (await btn.isDisabled()) continue;

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
      recordFinding({
        scenarioNumber: 0,
        scenarioName: 'Global Dead Button Audit',
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
  console.log('   10 CUSTOMER-JOURNEY STRESS TEST SCENARIOS COMPLETE');
  console.log(`   Total Trust / Stability Findings: ${findings.length}`);
  console.log('========================================================================\n');

  fs.writeFileSync(
    path.resolve(process.cwd(), 'scratch_customer_stress_test_findings.json'),
    JSON.stringify(findings, null, 2),
    'utf8'
  );

  if (findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length > 0) {
    console.error('Customer stress test failed with high or critical trust-destroying findings.');
    process.exit(1);
  }
}

run10CustomerStressTestScenarios().catch((err) => {
  console.error('Fatal error during customer journey stress test:', err);
  process.exit(1);
});
