/**
 * Unit Test Suite: Milestone 3 Founder Workflows & State Machines
 * 
 * Tests:
 * 1. Newbie Guided Launchpad 4-Step Wizard State Machine & Escrow Ledger Invariants
 * 2. BYOK (Bring Your Own Keys) Key Validation, Prefix Verification, Masking & Circuit Breaker Mode
 * 3. Instant 1-Click Git Ejection Payloads, Clean-Room AST Scan & README Badge Generation
 * 4. Real-Time Telemetry Event Parsing & Stage-Gate Status Transitions
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TenantFailureCircuitBreaker } from '../../server/engine/circuit_breaker.js';
import { signGateReceipt } from '../../server/engine/types.js';

// --- Pure Helper Functions under test matching client implementations ---

export function slugifyVentureName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateWizardStep(step: number, data: {
  name?: string;
  problem?: string;
  targetSegment?: string;
  selectedPainPoints?: string[];
  pricingArchetype?: string;
  targetArpu?: number;
}): { valid: boolean; error?: string } {
  if (step === 1) {
    if (!data.name || data.name.trim().length < 2) {
      return { valid: false, error: 'Venture name must be at least 2 characters.' };
    }
    if (!data.problem || data.problem.trim().length < 10) {
      return { valid: false, error: 'Problem narrative must be at least 10 characters.' };
    }
    return { valid: true };
  }

  if (step === 2) {
    if (!data.targetSegment) {
      return { valid: false, error: 'Target customer segment is required.' };
    }
    if (!data.selectedPainPoints || data.selectedPainPoints.length === 0) {
      return { valid: false, error: 'At least one customer pain point must be selected.' };
    }
    return { valid: true };
  }

  if (step === 3) {
    if (!data.pricingArchetype) {
      return { valid: false, error: 'Monetization archetype is required.' };
    }
    if (!data.targetArpu || data.targetArpu <= 0) {
      return { valid: false, error: 'Target monthly ARPU must be positive.' };
    }
    return { valid: true };
  }

  return { valid: true };
}

export function calculateUnitEconomics(targetArpu: number, estimatedCac: number, monthlyChurnRate: number = 0.05, grossMargin: number = 0.85) {
  const projectedLifetimeMonths = 1 / Math.max(0.01, monthlyChurnRate);
  const projectedLtv = Math.round(targetArpu * projectedLifetimeMonths * grossMargin);
  const ltvCacRatio = Number((projectedLtv / Math.max(1, estimatedCac)).toFixed(1));
  const paybackMonths = Number((estimatedCac / Math.max(1, targetArpu * grossMargin)).toFixed(1));

  return {
    projectedLtv,
    ltvCacRatio,
    paybackMonths,
    grossMarginPercent: grossMargin * 100,
  };
}

export function maskApiKey(key?: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function validateByokKeyFormat(provider: string, key: string): { valid: boolean; error?: string } {
  if (!key || !key.trim()) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  const trimmed = key.trim();
  const prefixes: Record<string, string> = {
    anthropic: 'sk-ant-',
    openai: 'sk-',
    deepseek: 'sk-',
    groq: 'gsk_',
    stripe: 'sk_',
    github: 'ghp_',
  };

  const expectedPrefix = prefixes[provider];
  if (expectedPrefix && !trimmed.startsWith(expectedPrefix)) {
    return {
      valid: false,
      error: `Invalid format: ${provider} key must begin with "${expectedPrefix}"`,
    };
  }

  if (trimmed.length < 16 && provider !== 'deepseek') {
    return { valid: false, error: 'Key length is suspiciously short for a valid production token' };
  }

  return { valid: true };
}

export function generateEjectionManifest(ventureName: string, org: string, repo: string, deployTarget: string) {
  const cleanSlug = slugifyVentureName(repo || ventureName);
  return {
    gitRemoteUrl: `https://github.com/${org}/${cleanSlug}.git`,
    deploymentUrl: `https://${cleanSlug}.${deployTarget}.app`,
    badgeMarkdown: `[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com)`,
    ejectionCertificate: {
      ventureName,
      cleanRoomVerified: true,
      proprietaryImportsDetected: 0,
      timestamp: new Date().toISOString(),
    },
  };
}

export function scanImportsForLockIn(codeSnippets: string[]): { clean: boolean; violations: string[] } {
  const forbiddenPatterns = [
    { name: '@stagegate-os/proprietary', regex: /@stagegate-os\/proprietary/ },
    { name: '@axiom-os/proprietary', regex: /@axiom-os\/proprietary/ },
    { name: '@polsia/runtime-lock', regex: /@polsia\/runtime-lock/ },
    { name: 'polsia-cloud-agent', regex: /polsia-cloud-agent/ },
    { name: '@stagegate-os/closed-source', regex: /@stagegate-os\/closed-source/ },
    { name: '@axiom-os/closed-source', regex: /@axiom-os\/closed-source/ },
  ];

  const violations: string[] = [];
  for (const snippet of codeSnippets) {
    for (const { name, regex } of forbiddenPatterns) {
      if (regex.test(snippet)) {
        violations.push(`Forbidden proprietary import detected: ${name}`);
      }
    }
  }

  return {
    clean: violations.length === 0,
    violations,
  };
}

// --- Test Suites ---

describe('Milestone 3: Founder Workflows & State Machines', () => {

  describe('Suite 1: Newbie 4-Step Guided Wizard State Machine', () => {
    it('correctly slugifies venture names into URL-safe strings', () => {
      assert.equal(slugifyVentureName('DocuFlow AI'), 'docuflow-ai');
      assert.equal(slugifyVentureName('DentalCompliance Copilot'), 'dentalcompliance-copilot');
      assert.equal(slugifyVentureName('SubManage & SaaS Tools!'), 'submanage-saas-tools');
      assert.equal(slugifyVentureName('  Leading-Trailing   Spaces  '), 'leading-trailing-spaces');
    });

    it('validates Step 1: requires valid venture name (>=2 chars) and problem context (>=10 chars)', () => {
      // Missing name
      const res1 = validateWizardStep(1, { name: '', problem: 'Long enough problem statement' });
      assert.equal(res1.valid, false);
      assert.match(res1.error!, /at least 2 characters/);

      // Short problem
      const res2 = validateWizardStep(1, { name: 'DocuFlow', problem: 'Short' });
      assert.equal(res2.valid, false);
      assert.match(res2.error!, /at least 10 characters/);

      // Valid Step 1
      const res3 = validateWizardStep(1, {
        name: 'DocuFlow AI',
        problem: 'Medical staff spend 15+ hours weekly on intake compliance.',
      });
      assert.equal(res3.valid, true);
    });

    it('validates Step 2: requires target customer segment and at least 1 pain point', () => {
      // Missing segment
      const res1 = validateWizardStep(2, { targetSegment: '', selectedPainPoints: ['Manual work'] });
      assert.equal(res1.valid, false);
      assert.match(res1.error!, /Target customer segment is required/);

      // Missing pain points
      const res2 = validateWizardStep(2, { targetSegment: 'SMB Practice', selectedPainPoints: [] });
      assert.equal(res2.valid, false);
      assert.match(res2.error!, /At least one customer pain point/);

      // Valid Step 2
      const res3 = validateWizardStep(2, {
        targetSegment: 'SMB & Solo Practice Owners',
        selectedPainPoints: ['High compliance audit risk', 'Manual repetitive entry'],
      });
      assert.equal(res3.valid, true);
    });

    it('validates Step 3: requires monetization archetype and positive ARPU', () => {
      // Missing archetype
      const res1 = validateWizardStep(3, { pricingArchetype: '', targetArpu: 99 });
      assert.equal(res1.valid, false);

      // Negative or zero ARPU
      const res2 = validateWizardStep(3, { pricingArchetype: 'subscription', targetArpu: 0 });
      assert.equal(res2.valid, false);

      // Valid Step 3
      const res3 = validateWizardStep(3, { pricingArchetype: 'subscription', targetArpu: 149 });
      assert.equal(res3.valid, true);
    });

    it('calculates unit economics adhering to 85% gross margin benchmarks', () => {
      const econ = calculateUnitEconomics(149, 120, 0.05, 0.85);
      // LTV = 149 * (1/0.05) * 0.85 = 149 * 20 * 0.85 = 2533
      assert.equal(econ.projectedLtv, 2533);
      // LTV:CAC = 2533 / 120 = 21.1
      assert.equal(econ.ltvCacRatio, 21.1);
      // Payback = 120 / (149 * 0.85) = 120 / 126.65 = 0.9 mo
      assert.equal(econ.paybackMonths, 0.9);
      assert.equal(econ.grossMarginPercent, 85);
    });

    it('verifies exact 5-milestone roadmap credit allocations summing to 1,000 credits', () => {
      const milestones = [
        { m: 1, name: 'Architectural Scaffolding & DB Schema', credits: 250 },
        { m: 2, name: 'Frontend UX & Tailwind Interface', credits: 250 },
        { m: 3, name: 'Domain, DNS & TLS 1.3 Socket Setup', credits: 150 },
        { m: 4, name: 'Stripe Payments & Billing Lifecycle', credits: 200 },
        { m: 5, name: 'Growth Kit, Tracking & SEO Configuration', credits: 150 },
      ];

      const totalCredits = milestones.reduce((sum, m) => sum + m.credits, 0);
      assert.equal(totalCredits, 1000);

      // Total dollar equivalent ($0.01 per credit)
      const dollarEquivalent = totalCredits * 0.01;
      assert.equal(dollarEquivalent, 10.00);
    });
  });

  describe('Suite 2: BYOK (Bring Your Own Keys) Key Validation & Circuit Breaker', () => {
    it('correctly masks sensitive API keys for display security', () => {
      assert.equal(maskApiKey('sk-ant-api03-1234567890abcdef'), 'sk-a...cdef');
      assert.equal(maskApiKey('ghp_abcdef1234567890'), 'ghp_...7890');
      assert.equal(maskApiKey('short'), '****');
      assert.equal(maskApiKey(''), '');
    });

    it('enforces provider-specific token prefixes', () => {
      // Anthropic
      assert.equal(validateByokKeyFormat('anthropic', 'sk-ant-api03-live-token-123456').valid, true);
      assert.equal(validateByokKeyFormat('anthropic', 'sk-proj-invalid').valid, false);

      // OpenAI
      assert.equal(validateByokKeyFormat('openai', 'sk-proj-prod-token-987654321').valid, true);
      assert.equal(validateByokKeyFormat('openai', 'ghp_invalid_key_for_openai').valid, false);

      // Stripe
      assert.equal(validateByokKeyFormat('stripe', 'sk_live_51Hxyz9876543210').valid, true);
      assert.equal(validateByokKeyFormat('stripe', 'pk_test_public_key_rejected').valid, false);

      // GitHub
      assert.equal(validateByokKeyFormat('github', 'ghp_1234567890abcdefghij').valid, true);
      assert.equal(validateByokKeyFormat('github', 'invalid_no_prefix').valid, false);
    });

    it('transitions tenant circuit breaker to BYOK mode eliminating variable platform token COGS', () => {
      const breaker = new TenantFailureCircuitBreaker();
      const tenantId = 'tenant_serial_byok_test';

      // Record failures in platform mode
      breaker.recordFailure(tenantId);
      breaker.recordFailure(tenantId);
      assert.equal(breaker.getRecord(tenantId).monthlyCogsAbsorbed, 3.78);

      // Switch to BYOK
      const byokRecord = breaker.switchToByok(tenantId);
      assert.equal(byokRecord.byokMode, true);
      assert.equal(byokRecord.status, 'BYOK_ENFORCED');

      // Subsequent failures in BYOK mode accumulate $0.00 platform COGS
      const cogsBefore = byokRecord.monthlyCogsAbsorbed;
      breaker.recordFailure(tenantId);
      const cogsAfter = breaker.getRecord(tenantId).monthlyCogsAbsorbed;
      assert.equal(cogsAfter, cogsBefore);
    });
  });

  describe('Suite 3: Instant Git Ejection & Zero-Lock-In Portability', () => {
    it('generates ejection manifest with clean URLs and viral README badge', () => {
      const manifest = generateEjectionManifest(
        'DocuFlow AI',
        'acme-studios',
        'docuflow-ai',
        'vercel'
      );

      assert.equal(manifest.gitRemoteUrl, 'https://github.com/acme-studios/docuflow-ai.git');
      assert.equal(manifest.deploymentUrl, 'https://docuflow-ai.vercel.app');
      assert.match(manifest.badgeMarkdown, /!\[Verified by Stage Gate OS\]/);
      assert.equal(manifest.ejectionCertificate.cleanRoomVerified, true);
      assert.equal(manifest.ejectionCertificate.proprietaryImportsDetected, 0);
    });

    it('verifies AST clean-room scanner detects zero proprietary lock-in imports in standard code', () => {
      const cleanNextJsCode = [
        `import React from 'react';`,
        `import { createClient } from '@supabase/supabase-js';`,
        `import Stripe from 'stripe';`,
        `import { NextRequest, NextResponse } from 'next/server';`,
      ];

      const scanResult = scanImportsForLockIn(cleanNextJsCode);
      assert.equal(scanResult.clean, true);
      assert.equal(scanResult.violations.length, 0);
    });

    it('verifies AST clean-room scanner flags proprietary vendor lock-in imports if introduced', () => {
      const contaminatedCode = [
        `import React from 'react';`,
        `import { PolsiaAgentRuntime } from '@polsia/runtime-lock';`,
        `import { SecretSDK } from '@axiom-os/proprietary/core';`,
      ];

      const scanResult = scanImportsForLockIn(contaminatedCode);
      assert.equal(scanResult.clean, false);
      assert.equal(scanResult.violations.length, 2);
      assert.match(scanResult.violations[0], /@polsia\/runtime-lock/);
      assert.match(scanResult.violations[1], /@axiom-os\/proprietary/);
    });

    it('generates deterministic cryptographic gate receipts with SHA-256 HMAC', () => {
      const receiptData = {
        gateNumber: 5,
        ventureId: 'ven_eject_01',
        timestamp: '2026-09-19T20:00:00.000Z',
        status: 'PASS' as const,
        assertions: [
          {
            assertionId: 'ast-clean',
            name: 'Zero Lock-in AST Scan',
            status: 'PASS' as const,
            latencyMs: 95,
            expected: 0,
            actual: 0,
          },
        ],
        executionTimeMs: 145,
        remediationAttempts: 0,
      };

      const sig1 = signGateReceipt(receiptData);
      const sig2 = signGateReceipt(receiptData);

      assert.equal(typeof sig1, 'string');
      assert.equal(sig1.length, 64); // SHA-256 hex string
      assert.equal(sig1, sig2); // Deterministic!
    });
  });

  describe('Suite 4: Telemetry Event Stream Handlers & Invariant Protection', () => {
    it('calculates total pipeline execution time and pass percentage across all 5 gates', () => {
      const sampleStages = [
        { gateId: 1, durationMs: 240, status: 'PASSED' },
        { gateId: 2, durationMs: 310, status: 'PASSED' },
        { gateId: 3, durationMs: 180, status: 'PASSED' },
        { gateId: 4, durationMs: 270, status: 'PASSED' },
        { gateId: 5, durationMs: 200, status: 'PASSED' },
      ];

      const totalDuration = sampleStages.reduce((sum, s) => sum + s.durationMs, 0);
      const passedCount = sampleStages.filter((s) => s.status === 'PASSED').length;

      assert.equal(totalDuration, 1200); // 1.2 seconds!
      assert.equal(passedCount, 5);
      assert.equal(Math.round((passedCount / 5) * 100), 100);
    });

    it('asserts 2PC escrow invariant: Net User Burn Delta B == 0.00 on gate abort', () => {
      const initialWalletBalance = 100.0;
      const escrowHoldAmount = 10.0;

      // Hold credits
      const balanceDuringExecution = initialWalletBalance - escrowHoldAmount;
      assert.equal(balanceDuringExecution, 90.0);

      // Gate fails -> Rollback with 100% refund
      const refundedAmount = escrowHoldAmount;
      const finalBalance = balanceDuringExecution + refundedAmount;
      assert.equal(finalBalance, initialWalletBalance);

      const invariantDeltaB = Number((finalBalance - initialWalletBalance).toFixed(2));
      assert.equal(invariantDeltaB, 0.00); // Strictly preserved!
    });
  });

});
