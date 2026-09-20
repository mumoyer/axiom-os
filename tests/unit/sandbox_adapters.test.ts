/**
 * Unit Test Suite: Deterministic Sandbox Adapters (Stripe, GitHub, Cloud DNS)
 * 
 * Tests:
 * - Stripe Sandbox: checkout session, test clock +30d advance, tolerance override, concurrent idempotency
 * - GitHub Sandbox: repo creation, AST proprietary scan, verification badge
 * - Cloud DNS Sandbox: trailing dot, Anycast CIDR, RFC 6125 TLS SAN, discrete quantile p95, DoH quorum
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  StripeSandboxAdapter,
  GitHubSandboxAdapter,
  CloudDnsSandboxAdapter,
} from '../../server/engine/sandbox_adapters.js';

describe('Deterministic Sandbox Adapters Unit Tests', () => {
  // ==========================================================================
  // STRIPE SANDBOX TESTS
  // ==========================================================================
  describe('Stripe Sandbox Adapter', () => {
    const stripe = new StripeSandboxAdapter();
    const secret = 'whsec_unit_test_secret_2026';

    it('creates deterministic customers and checkout sessions', async () => {
      const customer = await stripe.createCustomer('founder@example.com', 'Alice Founder');
      assert.ok(customer.id.startsWith('cus_mock_'));
      assert.equal(customer.email, 'founder@example.com');

      const session = await stripe.createCheckoutSession({
        plan: 'PRO',
        email: customer.email,
        successUrl: 'https://venture.com/dashboard',
        cancelUrl: 'https://venture.com/pricing',
      });
      assert.ok(session.id.startsWith('cs_test_'));
      assert.ok(session.url.includes(session.id));
      assert.equal(session.customer, customer.id);
    });

    it('creates and advances Stripe test clock', async () => {
      const now = Math.floor(Date.now() / 1000);
      const clock = await stripe.createTestClock(now);
      assert.ok(clock.id.startsWith('clock_test_'));
      assert.equal(clock.frozenTime, now);

      const advanced = await stripe.advanceTestClock(clock.id, 2_592_000); // +30 days
      assert.equal(advanced.frozenTime, now + 2_592_000);
    });

    it('generates and verifies HMAC SHA-256 webhook signatures', () => {
      const payload = '{"id":"evt_test_100","type":"checkout.session.completed"}';
      const now = Math.floor(Date.now() / 1000);
      const header = stripe.generateWebhookHeader(payload, secret, now);

      assert.ok(header.startsWith('t=') && header.includes(',v1='));
      assert.doesNotThrow(() => {
        stripe.verifyWebhookSignature(payload, header, secret, 300, now);
      });
    });

    it('rejects tampered payloads and tampered signatures', () => {
      const payload = '{"id":"evt_test_100","type":"checkout.session.completed"}';
      const now = Math.floor(Date.now() / 1000);
      const header = stripe.generateWebhookHeader(payload, secret, now);

      // Tampered payload
      assert.throws(
        () => stripe.verifyWebhookSignature(payload + 'evil', header, secret, 300, now),
        /ERR_G4_WEBHOOK_SIG_FAILED/
      );

      // Tampered signature
      const badHeader = header.slice(0, -4) + '0000';
      assert.throws(
        () => stripe.verifyWebhookSignature(payload, badHeader, secret, 300, now),
        /ERR_G4_WEBHOOK_SIG_FAILED/
      );
    });

    it('enforces webhook tolerance override for +30 days test clock advancement', () => {
      const payload = '{"id":"evt_renewal","type":"invoice.paid"}';
      const now = Math.floor(Date.now() / 1000);
      const futureTime = now + 30 * 24 * 3600; // +30 days
      const futureHeader = stripe.generateWebhookHeader(payload, secret, futureTime);

      // Standard tolerance (300s) fails
      assert.throws(
        () => stripe.verifyWebhookSignature(payload, futureHeader, secret, 300, now),
        /Timestamp outside tolerance zone/
      );

      // 1-year tolerance override (31,536,000s) succeeds
      assert.doesNotThrow(() => {
        stripe.verifyWebhookSignature(payload, futureHeader, secret, 31_536_000, now);
      });
    });

    it('processes concurrent webhook flood with mutex lock, preventing double-spending', async () => {
      const eventId = `evt_concurrency_${Date.now()}`;
      let dbRowsProvisioned = 0;

      // Launch 10 simultaneous concurrent webhook calls
      const tasks = Array.from({ length: 10 }, () =>
        stripe.processWebhookIdempotent(eventId, async () => {
          dbRowsProvisioned++;
          return { success: true, count: dbRowsProvisioned };
        })
      );

      const results = await Promise.all(tasks);
      const successCount = results.filter((r) => r.message === 'PROVISIONED_SUCCESS').length;
      const duplicateCount = results.filter((r) => r.message === 'DUPLICATE_IDEMPOTENT_IGNORED').length;

      assert.equal(dbRowsProvisioned, 1, 'Database row must be provisioned strictly once');
      assert.equal(successCount, 1);
      assert.equal(duplicateCount, 9);
    });
  });

  // ==========================================================================
  // GITHUB / EJECTION SANDBOX TESTS
  // ==========================================================================
  describe('GitHub Sandbox Adapter', () => {
    const github = new GitHubSandboxAdapter();

    it('creates mock repository with clone and html URLs', async () => {
      const repo = await github.createRepo('quantum-saas', true);
      assert.equal(repo.name, 'quantum-saas');
      assert.equal(repo.isPrivate, true);
      assert.ok(repo.cloneUrl.includes('quantum-saas.git'));
    });

    it('scans codebase for proprietary imports and detects lock-in patterns', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'axiom-ast-test-'));

      // 1. Clean file
      fs.writeFileSync(path.join(tempDir, 'clean.ts'), 'import express from "express"; export const app = express();');
      const cleanScan = github.scanForProprietaryDependencies(tempDir);
      assert.equal(cleanScan.clean, true);
      assert.equal(cleanScan.violations.length, 0);

      // 2. Polluted file
      fs.writeFileSync(
        path.join(tempDir, 'polluted.ts'),
        'import { lock } from "@axiom-os/proprietary-runtime"; console.log(lock);'
      );
      const dirtyScan = github.scanForProprietaryDependencies(tempDir);
      assert.equal(dirtyScan.clean, false);
      assert.ok(dirtyScan.violations.length >= 1);
      assert.ok(dirtyScan.violations[0].includes('@axiom-os/proprietary-runtime'));

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('generates cryptographic README verification badge', () => {
      const badge = github.generateVerificationBadgeMarkdown('ven_123', 'rcpt_456');
      assert.ok(badge.includes('https://axiomrun.app/badges/ven_123.svg'));
      assert.ok(badge.includes('https://axiomrun.app/verify/rcpt_456'));
    });
  });

  // ==========================================================================
  // CLOUD INFRASTRUCTURE & DNS SANDBOX TESTS
  // ==========================================================================
  describe('Cloud DNS Sandbox Adapter', () => {
    const cloudDns = new CloudDnsSandboxAdapter();

    it('correctly calculates Anycast CIDR membership with bitmasks', () => {
      const allowedCidrs = ['76.76.21.0/24', '172.67.0.0/16', '104.16.0.0/12'];

      assert.equal(cloudDns.isIpInCidr('76.76.21.21', '76.76.21.0/24'), true);
      assert.equal(cloudDns.isIpInCidr('76.76.22.21', '76.76.21.0/24'), false);
      assert.equal(cloudDns.isIpInCidr('172.67.180.20', '172.67.0.0/16'), true);
      assert.equal(cloudDns.isIpInCidr('104.21.34.10', '104.16.0.0/12'), true);
      assert.equal(cloudDns.isIpInCidr('198.51.100.5', '104.16.0.0/12'), false);
    });

    it('strips wireformat trailing dot and enforces exact match vs subdomain attack', () => {
      const expected = 'cname.axiomrun.app';

      // Trailing dot normalized
      assert.equal(cloudDns.matchesTarget('cname.axiomrun.app.', expected), true);

      // Subdomain takeover attack strictly rejected
      assert.equal(cloudDns.matchesTarget('cname.axiomrun.app.adversary.com', expected), false);

      // CIDR pool match
      assert.equal(cloudDns.matchesTarget('172.67.180.20', expected, ['172.67.0.0/16']), true);
    });

    it('enforces RFC 6125 TLS SAN validation rules', () => {
      const certSans: [string, string][] = [
        ['DNS', '*.axiomrun.app'],
        ['DNS', 'axiomrun.app'],
        ['IP Address', '10.0.0.1'],
      ];

      // Exact match
      assert.equal(cloudDns.verifyRfc6125TlsSan('axiomrun.app', certSans, 60).valid, true);

      // Valid single-label wildcard match
      assert.equal(cloudDns.verifyRfc6125TlsSan('sub.axiomrun.app', certSans, 60).valid, true);

      // Multi-level subdomain under single-label wildcard MUST BE REJECTED per RFC 6125
      const multiSub = cloudDns.verifyRfc6125TlsSan('deep.nested.sub.axiomrun.app', certSans, 60);
      assert.equal(multiSub.valid, false);

      // Illegal TLD wildcard (*.com) must not match arbitrary domain
      const badCertSans: [string, string][] = [['DNS', '*.com']];
      assert.equal(cloudDns.verifyRfc6125TlsSan('bankofamerica.com', badCertSans, 60).valid, false);

      // IPv4 SAN support
      assert.equal(cloudDns.verifyRfc6125TlsSan('10.0.0.1', certSans, 60).valid, true);

      // Expiration check fails if < 30 days
      const expired = cloudDns.verifyRfc6125TlsSan('sub.axiomrun.app', certSans, 25);
      assert.equal(expired.valid, false);
      assert.ok(expired.reason?.includes('ERR_G2_TLS_EXPIRED'));
    });

    it('calculates true discrete quantile p95 index: max(0, ceil(0.95*N) - 1)', () => {
      // For N=15: ceil(14.25) - 1 = 14
      const latencies15 = Array.from({ length: 15 }, (_, i) => (i + 1) * 10);
      assert.equal(cloudDns.calculateDiscreteQuantileP95(latencies15), 150);

      // For N=20: ceil(19.0) - 1 = 18 (19th element)
      const latencies20 = Array.from({ length: 20 }, (_, i) => 10 + i * 2);
      assert.equal(cloudDns.calculateDiscreteQuantileP95(latencies20), latencies20[18]);

      // For N=100: ceil(95.0) - 1 = 94 (95th element)
      const latencies100 = Array.from({ length: 100 }, (_, i) => i + 1);
      assert.equal(cloudDns.calculateDiscreteQuantileP95(latencies100), 95);
    });

    it('evaluates Quad-DoH quorum consensus (requires >= 3-of-4)', async () => {
      // Full consensus: 4/4 match
      const res4 = await cloudDns.queryQuadDoH('venture.com', 'A', '76.76.21.21', ['76.76.21.0/24'], 0);
      assert.equal(res4.quorumPassed, true);
      assert.equal(res4.matchCount, 4);

      // 1 resolver fails -> 3/4 match -> quorum still passes
      const res3 = await cloudDns.queryQuadDoH('venture.com', 'A', '76.76.21.21', ['76.76.21.0/24'], 1);
      assert.equal(res3.quorumPassed, true);
      assert.equal(res3.matchCount, 3);

      // 2 resolvers fail -> 2/4 match -> quorum fails (< 3)
      const res2 = await cloudDns.queryQuadDoH('venture.com', 'A', '76.76.21.21', ['76.76.21.0/24'], 2);
      assert.equal(res2.quorumPassed, false);
      assert.equal(res2.matchCount, 2);
    });
  });
});
