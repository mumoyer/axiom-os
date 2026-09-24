/**
 * Legal & Regulatory Compliance Unit Tests
 * 
 * Verifies:
 * 1. PII Endpoint Security (CCPA § 1798.150 / GDPR Art. 32):
 *    - Unauthenticated GET /api/messages -> 401 Unauthorized
 *    - Authenticated GET /api/messages with x-admin-key -> 200 OK
 *    - Unauthenticated GET /api/grader/leads -> 401 Unauthorized
 *    - Authenticated GET /api/grader/leads with x-admin-key -> 200 OK
 * 
 * 2. Cryptographic Security for BYOK Credentials (FTC Act § 5):
 *    - Validates AES-256-GCM authenticated envelope encryption round-trip
 *    - Confirms stored keys in memory contain no plaintext
 *    - Confirms authentication tag verification rejects tampered ciphertexts
 * 
 * 3. Operating Entity & Governance:
 *    - Confirms checkout config returns Moyer Ventures LLC
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../../server/app.js';
import { encryptCredential, decryptCredential, EncryptedKeyPayload } from '../../server/routes/byok_routes.js';

describe('Legal & Regulatory Compliance Verifications', () => {
  let server: http.Server;
  let baseUrl: string;

  test('setup test HTTP server', async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  describe('PII Endpoint Authorization (CCPA § 1798.150 & GDPR Art. 32)', () => {
    test('rejects unauthenticated GET /api/messages with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/messages`);
      assert.strictEqual(res.status, 401, 'Unauthenticated message dump must return 401');
      const body = await res.json() as any;
      assert.ok(body.error.includes('Unauthorized'), 'Should return unauthorized error message');
      assert.ok(body.error.includes('x-admin-key'), 'Should cite required x-admin-key');
    });

    test('allows authenticated GET /api/messages with valid x-admin-key', async () => {
      const res = await fetch(`${baseUrl}/api/messages`, {
        headers: { 'x-admin-key': 'stagegate_admin_key_2026' }
      });
      assert.strictEqual(res.status, 200, 'Authenticated admin request must return 200');
      const body = await res.json() as any;
      assert.ok(Array.isArray(body.messages), 'Should return message thread list');
    });

    test('rejects unauthenticated GET /api/grader/leads with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/grader/leads`);
      assert.strictEqual(res.status, 401, 'Unauthenticated lead scraping must return 401');
      const body = await res.json() as any;
      assert.ok(body.error.includes('Unauthorized'), 'Should return unauthorized error message');
    });

    test('allows authenticated GET /api/grader/leads with valid x-admin-key', async () => {
      const res = await fetch(`${baseUrl}/api/grader/leads`, {
        headers: { 'x-admin-key': 'stagegate_admin_key_2026' }
      });
      assert.strictEqual(res.status, 200, 'Authenticated admin request must return 200');
      const body = await res.json() as any;
      assert.ok(Array.isArray(body.leads), 'Should return leads array');
    });
  });

  describe('BYOK Cryptographic Safeguards (AES-256-GCM Authenticated Encryption)', () => {
    const sampleApiKey = 'sk-ant-api03-live-test-key-for-venture-verification-2026';

    test('encrypts API key to authenticated AES-256-GCM ciphertext with IV and 128-bit tag', () => {
      const encrypted = encryptCredential(sampleApiKey);
      assert.ok(encrypted, 'Encryption payload must be defined');
      assert.notStrictEqual(encrypted.ciphertext, sampleApiKey, 'Ciphertext must not match plaintext');
      assert.strictEqual(encrypted.iv.length, 24, 'IV must be 12-byte hex string (24 hex characters)');
      assert.strictEqual(encrypted.tag.length, 32, 'GCM tag must be 16-byte hex string (32 hex characters)');
    });

    test('decrypts valid ciphertext back to original plaintext', () => {
      const encrypted = encryptCredential(sampleApiKey) as EncryptedKeyPayload;
      const decrypted = decryptCredential(encrypted);
      assert.strictEqual(decrypted, sampleApiKey, 'Decrypted key must match original plaintext');
    });

    test('fails decryption and returns undefined if authentication tag is tampered', () => {
      const encrypted = encryptCredential(sampleApiKey) as EncryptedKeyPayload;
      // Tamper with tag while keeping valid 32-hex (16-byte) length
      const tamperedTag = encrypted.tag.slice(0, -2) + (encrypted.tag.slice(-2) === '00' ? 'ff' : '00');
      const tamperedPayload: EncryptedKeyPayload = {
        ...encrypted,
        tag: tamperedTag
      };
      const decrypted = decryptCredential(tamperedPayload);
      assert.strictEqual(decrypted, undefined, 'Tampered tag must fail decryption');
    });

    test('POST /api/byok/keys encrypts credentials and GET /api/byok/:tenantId reports AES-256-GCM', async () => {
      const tenantId = `tenant_legal_${Date.now()}`;
      const postRes = await fetch(`${baseUrl}/api/byok/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          openaiKey: 'sk-proj-test-openai-credential-secret',
          anthropicKey: 'sk-ant-test-anthropic-credential-secret',
        })
      });

      assert.strictEqual(postRes.status, 200);
      const postBody = await postRes.json() as any;
      assert.strictEqual(postBody.encryption, 'AES-256-GCM');

      const getRes = await fetch(`${baseUrl}/api/byok/${tenantId}`);
      assert.strictEqual(getRes.status, 200);
      const getBody = await getRes.json() as any;
      assert.ok(getBody.encryption.includes('AES-256-GCM'));
      assert.strictEqual(getBody.configuredProviders.openai, true);
      assert.strictEqual(getBody.configuredProviders.anthropic, true);
      // Ensure masked values are safe
      assert.ok(getBody.maskedKeys.openai.includes('...'));
      assert.notStrictEqual(getBody.maskedKeys.openai, 'sk-proj-test-openai-credential-secret');
    });
  });

  describe('Merchant Entity Verification', () => {
    test('GET /api/checkout/config confirms operating entity is Moyer Ventures LLC', async () => {
      const res = await fetch(`${baseUrl}/api/checkout/config`);
      assert.strictEqual(res.status, 200);
      const config = await res.json() as any;
      assert.strictEqual(config.organization, 'Moyer Ventures LLC');
    });
  });

  test('teardown test HTTP server', async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });
});
