import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fetch from 'node-fetch';
import { app } from '../../server/app.js';
import type { Server } from 'node:http';

describe('Apex Domain Redirection Middleware', () => {
  let server: Server;
  let port: number;

  test('setup test server', async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          port = addr.port;
        }
        resolve();
      });
    });
    assert.ok(port > 0);
  });

  test('redirects Host: stagegateos.com to https://www.stagegateos.com with 301', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/subscribe/founder?ref=twitter`, {
      headers: {
        Host: 'stagegateos.com',
      },
      redirect: 'manual',
    });

    assert.equal(res.status, 301);
    assert.equal(
      res.headers.get('location'),
      'https://www.stagegateos.com/subscribe/founder?ref=twitter'
    );
  });

  test('passes Host: www.stagegateos.com through without redirect', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/healthz`, {
      headers: {
        Host: 'www.stagegateos.com',
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json() as any;
    assert.equal(body.status, 'healthy');
  });

  test('cleanup test server', async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
