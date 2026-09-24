import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { app } from '../../server/app.js';

describe('Zero Demo Leaks & Production Readiness Guard Suite', () => {
  it('GET /api/ventures?scope=live returns strictly 0 seed dummy ventures', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const port = (server.address() as any).port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ventures?scope=live`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.ventures), 'Expected ventures array');

      const seedIds = ['ven_docuflow_02', 'ven_scout_03', 'ven_pulse_01', 'ven_dental_04', 'seed-venture-001'];
      for (const venture of data.ventures) {
        assert.ok(!seedIds.includes(venture.id), `Found leaked seed venture in live query: ${venture.id}`);
        assert.equal(venture.isExplore, false, `Live venture must not be flagged as explore: ${venture.id}`);
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/ventures/explore returns dedicated exploration scenarios', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const port = (server.address() as any).port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ventures/explore`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.ventures), 'Expected ventures array');
      assert.ok(data.ventures.length >= 4, 'Expected at least 4 explore scenarios');
      for (const venture of data.ventures) {
        assert.equal(venture.isExplore, true, `Explore scenario should be flagged as isExplore: ${venture.id}`);
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/ventures creates a live venture visible under scope=live', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const port = (server.address() as any).port;

    try {
      const createRes = await fetch(`http://localhost:${port}/api/ventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Real User SaaS',
          tenantId: 'tenant-real-user-123',
          planTier: 'SERIAL',
          description: 'Authentic venture with no demo data',
        }),
      });
      assert.equal(createRes.status, 201);
      const createData = await createRes.json();
      const newVentureId = createData.venture?.id;
      assert.ok(newVentureId, 'Expected venture id to be returned');

      // Query live ventures for this tenant
      const liveRes = await fetch(`http://localhost:${port}/api/ventures?scope=live&tenantId=tenant-real-user-123`);
      assert.equal(liveRes.status, 200);
      const liveData = await liveRes.json();
      assert.equal(liveData.ventures.length, 1);
      assert.equal(liveData.ventures[0].id, newVentureId);
      assert.equal(liveData.ventures[0].name, 'Real User SaaS');
      assert.equal(liveData.ventures[0].isExplore, false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/ventures/:id returns 404 for unknown or uninitialized ventures', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const port = (server.address() as any).port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ventures/ven_nonexistent_xyz99`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.ok(data.error, 'Expected error message for 404 venture');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('Static Source Code Zero-Leak Audits', () => {
    const rootDir = path.resolve(__dirname, '../../client/src');

    it('CheckoutPage.tsx has zero demo credit card badges, sandbox helper buttons, or mockSession fallbacks', () => {
      const content = fs.readFileSync(path.join(rootDir, 'pages/CheckoutPage.tsx'), 'utf-8');
      assert.ok(!content.includes('4242 •••• •••• 4242'), 'Found leaked test credit card number in CheckoutPage');
      assert.ok(!content.includes('mockSession'), 'Found fake mockSession fallback in CheckoutPage');
      assert.ok(!content.includes('Stripe Sandbox Test Mode Active'), 'Found sandbox badge in CheckoutPage');
      assert.ok(!content.includes('Provisioning Stripe Sandbox Session...'), 'Found sandbox wording in CheckoutPage');
    });

    it('SerialDashboardPage.tsx has zero fake DEFAULT_VENTURES portfolio array or fake BYOK secrets', () => {
      const content = fs.readFileSync(path.join(rootDir, 'pages/SerialDashboardPage.tsx'), 'utf-8');
      assert.ok(!content.includes('const DEFAULT_VENTURES'), 'Found DEFAULT_VENTURES in SerialDashboardPage');
      assert.ok(!content.includes('sk-ant-api03-live-48201948'), 'Found fake Anthropic key in SerialDashboardPage');
      assert.ok(!content.includes('ghp_9842109482019482019482019482'), 'Found fake GitHub key in SerialDashboardPage');
      assert.ok(content.includes('scope=live'), 'SerialDashboardPage must fetch with scope=live');
    });

    it('NewbieWizardPage.tsx has zero default pre-filled demo data, zero developer failure toggle, and zero fake MRR multiplication', () => {
      const content = fs.readFileSync(path.join(rootDir, 'pages/NewbieWizardPage.tsx'), 'utf-8');
      assert.ok(!content.includes("name: 'DocuFlow AI'"), 'NewbieWizardPage must not default form state to DocuFlow AI');
      assert.ok(!content.includes('Stage-Gate Execution Mode:'), 'NewbieWizardPage must not expose developer simulation toggle');
      assert.ok(!content.includes('formData.targetArpu * 10'), 'NewbieWizardPage must not fabricate fake MRR revenue');
    });

    it('LiveVenturePage.tsx has zero hardcoded DEFAULT_STAGES with passed status and no MOCK_NAMES defaulting to DocuFlow AI', () => {
      const content = fs.readFileSync(path.join(rootDir, 'pages/LiveVenturePage.tsx'), 'utf-8');
      assert.ok(!content.includes('const MOCK_NAMES'), 'LiveVenturePage must not contain MOCK_NAMES mapping');
      assert.ok(content.includes('INITIAL_PENDING_STAGES'), 'LiveVenturePage must initialize live stages with INITIAL_PENDING_STAGES');
      assert.ok(content.includes('Venture Pipeline Not Initialized'), 'LiveVenturePage must display authentic not-found screen');
    });

    it('ExampleScenarioExplorer.tsx is the sole designated home for DUMMY_SCENARIOS and is quarantined in demo/scenarios.ts', () => {
      const explorerContent = fs.readFileSync(path.join(rootDir, 'components/ExampleScenarioExplorer.tsx'), 'utf-8');
      assert.ok(explorerContent.includes("from '../demo/scenarios.js'"), 'ExampleScenarioExplorer must import from quarantined demo/scenarios module');
      
      const scenariosPath = path.join(rootDir, 'demo/scenarios.ts');
      assert.ok(fs.existsSync(scenariosPath), 'demo/scenarios.ts quarantine module must exist');
    });
  });
});
