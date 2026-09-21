import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../server/app.js';
import http from 'node:http';

describe('Founder Plan $69 Pricing Verification Suite', () => {
  it('GET /api/checkout/config returns FOUNDER tier at $69/month', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/checkout/config`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.supportedTiers), 'Expected supportedTiers array');
      const founder = data.supportedTiers.find((t: any) => t.id === 'FOUNDER');
      assert.ok(founder, 'FOUNDER tier must exist');
      assert.equal(founder.priceUsd, 69, 'FOUNDER monthly price must be $69');
      assert.equal(founder.name, 'Founder Plan');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/checkout/session with FOUNDER plan charges $69', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'FOUNDER',
          email: 'test-founder@example.com',
          paymentProvider: 'Stripe',
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.plan, 'FOUNDER');
      assert.equal(data.amountUsd, 69, 'Checkout session amountUsd for FOUNDER must be $69');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
