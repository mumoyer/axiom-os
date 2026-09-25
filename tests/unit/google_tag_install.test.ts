import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { app } from '../../server/app.js';
import type { Server } from 'node:http';

const GOOGLE_TAG_ID = 'AW-18468934435';
const LOADER_URL = 'googletagmanager.com/gtag/js';
const rootDir = process.cwd();

describe('Google Tag (AW-18468934435) Installation & Verification', () => {
  const targetHtmlFiles = [
    'client/index.html',
    'brand-assets/index.html',
    'client/public/brand/index.html',
  ];

  for (const relPath of targetHtmlFiles) {
    test(`${relPath} has Google Tag installed correctly immediately in <head>`, () => {
      const filePath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(filePath), `File exists: ${relPath}`);

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Ensure <head> exists
      const headOpenIndex = content.indexOf('<head');
      const headCloseIndex = content.indexOf('</head>');
      assert.ok(headOpenIndex !== -1, `${relPath} contains <head>`);
      assert.ok(headCloseIndex !== -1, `${relPath} contains </head>`);
      
      const headContent = content.slice(headOpenIndex, headCloseIndex);

      // Verify loader count: exactly ONE loader in <head>
      const loaderCountInHead = headContent.split(LOADER_URL).length - 1;
      assert.equal(loaderCountInHead, 1, `${relPath} must have exactly one gtag loader in <head>`);

      // Verify no loader outside <head>
      const totalLoaderCount = content.split(LOADER_URL).length - 1;
      assert.equal(totalLoaderCount, 1, `${relPath} must not contain loaders outside <head>`);

      // Verify correct Google Tag ID in loader src and gtag config call
      assert.ok(
        headContent.includes(`googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`),
        `${relPath} must reference id=${GOOGLE_TAG_ID} in loader src`
      );
      assert.ok(
        headContent.includes(`gtag('config', '${GOOGLE_TAG_ID}')`),
        `${relPath} must call gtag('config', '${GOOGLE_TAG_ID}')`
      );

      // Verify loader script is not a module
      assert.ok(
        !/googletagmanager\.com\/gtag\/js[^>]*type=["']module["']/i.test(headContent),
        `${relPath} gtag loader must not have type="module"`
      );

      // Verify position: loader appears before viewport meta or stylesheet links
      const loaderPos = headContent.indexOf(LOADER_URL);
      const firstMetaPos = headContent.indexOf('<meta');
      assert.ok(
        loaderPos < firstMetaPos,
        `${relPath} Google Tag must be placed immediately after <head> before other meta tags`
      );
    });
  }

  test('brand-assets/index.html and client/public/brand/index.html remain synchronized', () => {
    const brandAssetsContent = fs.readFileSync(path.join(rootDir, 'brand-assets/index.html'), 'utf-8');
    const publicBrandContent = fs.readFileSync(path.join(rootDir, 'client/public/brand/index.html'), 'utf-8');
    assert.equal(brandAssetsContent, publicBrandContent, 'Public brand page matches brand-assets source of truth');
  });

  describe('Ad Traffic Attribution & Query Parameter Preservation', () => {
    let server: Server;
    let baseUrl: string;

    test('setup express test server', async () => {
      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const address = server.address() as any;
          baseUrl = `http://127.0.0.1:${address.port}`;
          resolve();
        });
      });
    });

    test('GET /subscribe/founder preserves gclid and query parameters on 302 redirect', async () => {
      const resp = await fetch(`${baseUrl}/subscribe/founder?gclid=Cj0KCQjw123&utm_source=google`, {
        redirect: 'manual',
      });
      assert.equal(resp.status, 302);
      const location = resp.headers.get('location');
      assert.equal(location, '/#checkout?plan=FOUNDER&gclid=Cj0KCQjw123&utm_source=google');
    });

    test('GET /subscribe/serial preserves gclid on 302 redirect', async () => {
      const resp = await fetch(`${baseUrl}/subscribe/serial?gclid=TestGclidSerial`, {
        redirect: 'manual',
      });
      assert.equal(resp.status, 302);
      const location = resp.headers.get('location');
      assert.equal(location, '/#checkout?plan=SERIAL&gclid=TestGclidSerial');
    });

    test('GET /subscribe/enterprise preserves gclid on 302 redirect', async () => {
      const resp = await fetch(`${baseUrl}/subscribe/enterprise?gclid=TestGclidEnterprise`, {
        redirect: 'manual',
      });
      assert.equal(resp.status, 302);
      const location = resp.headers.get('location');
      assert.equal(location, '/#checkout?plan=ENTERPRISE&gclid=TestGclidEnterprise');
    });

    test('GET /subscribe preserves query string on 302 redirect', async () => {
      const resp = await fetch(`${baseUrl}/subscribe?gclid=DirectSubscribeGclid`, {
        redirect: 'manual',
      });
      assert.equal(resp.status, 302);
      const location = resp.headers.get('location');
      assert.equal(location, '/#checkout?gclid=DirectSubscribeGclid');
    });

    test('GET /subscribe/founder with no query string preserves original clean route', async () => {
      const resp = await fetch(`${baseUrl}/subscribe/founder`, {
        redirect: 'manual',
      });
      assert.equal(resp.status, 302);
      const location = resp.headers.get('location');
      assert.equal(location, '/#checkout?plan=FOUNDER');
    });

    test('teardown server', async () => {
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });
});
