import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../server/app.js';
import http from 'node:http';

describe('Landing Page Dummy Scenarios Exploration Suite', () => {
  it('GET /api/ventures returns pre-seeded dummy scenarios', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ventures`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.ventures), 'Expected ventures array');

      const expectedIds = ['ven_docuflow_02', 'ven_scout_03', 'ven_pulse_01', 'ven_dental_04'];
      for (const id of expectedIds) {
        const found = data.ventures.find((v: any) => v.id === id);
        assert.ok(found, `Expected dummy scenario ${id} to be seeded`);
        assert.ok(found.name, `Expected name for ${id}`);
        assert.ok(found.planTier, `Expected planTier for ${id}`);
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/ventures/:id returns individual dummy venture metadata', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/ventures/ven_docuflow_02`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.venture, 'Expected venture object');
      assert.equal(data.venture.id, 'ven_docuflow_02');
      assert.equal(data.venture.name, 'DocuFlow AI');
      assert.equal(data.venture.planTier, 'FOUNDER');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
