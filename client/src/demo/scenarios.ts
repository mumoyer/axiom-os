/**
 * Isolated Exploration Scenarios & Demo Data Fixtures
 * 
 * NOTE: This module contains simulated demo data strictly reserved for:
 * 1. The interactive "Explore Scenarios" feature (ExampleScenarioExplorer.tsx).
 * 2. Optional "Quick Inspiration" wizard preset templates.
 * 
 * Production surfaces (Checkout, Active Dashboard, Live Ventures, API routes)
 * must NEVER render or default to these dummy records for real users.
 */

import type { StageGateResult } from '../components/StageGateTimeline.js';

export interface DummyScenario {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  targetSegment: string;
  planTier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  mrr: number;
  subscribersCount: number;
  uptime: number;
  cogsPerUser: number;
  stagingUrl: string;
  problem: string;
  solution: string;
  unitEconomics: {
    cac: number;
    ltv: number;
    paybackMonths: number;
    grossMargin: number;
  };
  sampleApiPayload: {
    endpoint: string;
    method: 'GET' | 'POST';
    request: Record<string, any>;
    response: Record<string, any>;
  };
  gatesPassed: number;
  badgeMarkdown: string;
}

export const DUMMY_SCENARIOS: DummyScenario[] = [
  {
    id: 'ven_docuflow_02',
    name: 'DocuFlow AI',
    tagline: 'Autonomous HIPAA-compliant clinical documentation pipeline for independent medical practices',
    industry: 'Healthcare / B2B SaaS',
    targetSegment: 'Private Clinics & Solo Practitioners',
    planTier: 'FOUNDER',
    mrr: 6200,
    subscribersCount: 42,
    uptime: 99.99,
    cogsPerUser: 1.43,
    stagingUrl: 'https://stage-docuflow.axiomrun.app',
    problem: 'Physicians spend 15+ hours each week after hours charting patient records into EHR legacy portals.',
    solution: 'Autonomous voice-to-structured-FHIR extractor running on isolated client microVM with zero data retention.',
    unitEconomics: {
      cac: 180,
      ltv: 2450,
      paybackMonths: 3.5,
      grossMargin: 92.4,
    },
    sampleApiPayload: {
      endpoint: '/api/v1/clinical/extract',
      method: 'POST',
      request: {
        audioSampleSeconds: 120,
        patientId: 'pt_anon_8821',
        encounterType: 'routine_followup',
        redactPhi: true,
      },
      response: {
        status: 'extracted_verified',
        icd10Codes: ['I10', 'E11.9'],
        cptCodes: ['99213'],
        fhirResourceBundleId: 'bundle_99182a',
        gatePassed: 'Gate 1-5 Verified Clean',
      },
    },
    gatesPassed: 5,
    badgeMarkdown: '[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com/ventures/ven_docuflow_02)',
  },
  {
    id: 'ven_scout_03',
    name: 'ContractScout',
    tagline: 'Automated indemnification risk & predatory clause scanner for SMB procurement teams',
    industry: 'LegalTech / B2B Micro-SaaS',
    targetSegment: 'Small Business Owners & Ops Leads',
    planTier: 'SERIAL',
    mrr: 3450,
    subscribersCount: 35,
    uptime: 99.95,
    cogsPerUser: 0.89,
    stagingUrl: 'https://stage-contractscout.axiomrun.app',
    problem: 'SMBs sign vendor contracts with uncapped indemnity and auto-renewals because lawyers charge $450/hr.',
    solution: 'Deterministic AST analysis of MSAs and vendor agreements highlighting high-liability traps in under 8 seconds.',
    unitEconomics: {
      cac: 95,
      ltv: 1890,
      paybackMonths: 2.1,
      grossMargin: 94.2,
    },
    sampleApiPayload: {
      endpoint: '/api/v1/contracts/audit',
      method: 'POST',
      request: {
        documentPages: 14,
        jurisdiction: 'Delaware / US',
        indemnityCapRequirement: true,
      },
      response: {
        riskScore: 'LOW_RISK_APPROVED',
        unfavorableClausesCount: 0,
        indemnityCapFound: '$100,000 max',
        autoRenewNoticePeriodDays: 60,
        verifiedReceipt: 'sha256:4f99182a884',
      },
    },
    gatesPassed: 5,
    badgeMarkdown: '[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com/ventures/ven_scout_03)',
  },
  {
    id: 'ven_pulse_01',
    name: 'MetricPulse Analytics',
    tagline: 'Real-time subscription dunning, smart retention telemetry & involuntary churn recovery',
    industry: 'DevTools / FinTech',
    targetSegment: 'Bootstrapped SaaS & Indie Creators',
    planTier: 'SERIAL',
    mrr: 4850,
    subscribersCount: 68,
    uptime: 99.98,
    cogsPerUser: 1.12,
    stagingUrl: 'https://stage-metricpulse.axiomrun.app',
    problem: 'SaaS companies lose 4% to 9% of ARR every single year to expired credit cards and silent bank declines.',
    solution: 'Smart Stripe-connected recovery agents that test renewal clocks and automate multi-channel customer dunning.',
    unitEconomics: {
      cac: 120,
      ltv: 1650,
      paybackMonths: 2.8,
      grossMargin: 91.8,
    },
    sampleApiPayload: {
      endpoint: '/api/v1/dunning/simulate-renewal',
      method: 'POST',
      request: {
        subscriptionId: 'sub_992419082',
        cardExpiryAdvanceMonths: 1,
        testClockActive: true,
      },
      response: {
        clockAdvancedTimestamp: '2026-10-21T00:00:00Z',
        involuntaryChurnPrevented: true,
        recoveredMrrUsd: 149.0,
        webhookDuplicateEventsIgnored: 2,
      },
    },
    gatesPassed: 5,
    badgeMarkdown: '[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com/ventures/ven_pulse_01)',
  },
  {
    id: 'ven_dental_04',
    name: 'DentalCompliance',
    tagline: 'Audit-ready daily OSHA, sharps & radiation regulatory safety compliance copilot',
    industry: 'Healthcare / Compliance',
    targetSegment: 'Dental Clinics & Dental Service Orgs (DSOs)',
    planTier: 'FOUNDER',
    mrr: 2900,
    subscribersCount: 22,
    uptime: 100.0,
    cogsPerUser: 1.35,
    stagingUrl: 'https://stage-dentalcompliance.axiomrun.app',
    problem: 'Dental offices risk state board fines of up to $25,000 for expired sterilization autoclave biological spore logs.',
    solution: 'Automated equipment spore testing logs with timestamped digital audit certificates dual-pushed to private storage.',
    unitEconomics: {
      cac: 140,
      ltv: 2100,
      paybackMonths: 3.1,
      grossMargin: 93.6,
    },
    sampleApiPayload: {
      endpoint: '/api/v1/compliance/spore-test',
      method: 'POST',
      request: {
        autoclaveSerial: 'AC-90812-B',
        biologicalIndicatorResult: 'NEGATIVE_CLEAN',
        technicianId: 'tech_7718',
      },
      response: {
        complianceStatus: 'AUDIT_READY',
        certificateHash: 'sha256:e198bba401',
        nextInspectionDue: '2026-10-28',
        storedInPersonalRepo: true,
      },
    },
    gatesPassed: 5,
    badgeMarkdown: '[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com/ventures/ven_dental_04)',
  },
];

export interface ConceptPreset {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  industry: string;
  targetSegment: string;
  painPoints: string[];
  valueVector: string;
  pricingArchetype: 'subscription' | 'usage' | 'freemium' | 'enterprise';
  targetArpu: number;
  estimatedCac: number;
}

export const CONCEPT_PRESETS: ConceptPreset[] = [
  {
    name: 'DocuFlow AI',
    tagline: 'Automated HIPAA-compliant document intelligence for medical practices',
    problem: 'Medical staff spend 15+ hours weekly manually reviewing patient intake charts and compliance records.',
    solution: 'Autonomous AI extractor that validates, indexes, and syncs patient records into EHR systems with zero human latency.',
    industry: 'Healthcare',
    targetSegment: 'SMB & Solo Practice Owners',
    painPoints: ['Manual repetitive data entry', 'High compliance audit risk', 'Slow patient turnaround'],
    valueVector: 'compliance',
    pricingArchetype: 'subscription',
    targetArpu: 149,
    estimatedCac: 120,
  },
  {
    name: 'DentalCompliance',
    tagline: 'Audit-ready OSHA & HIPAA compliance copilot for dentists',
    problem: 'Independent dental practices face catastrophic fines due to out-of-date chemical disposal and safety logs.',
    solution: 'Automated daily compliance checks with instant digital audit certificates and inspection checklists.',
    industry: 'Healthcare',
    targetSegment: 'SMB & Solo Practice Owners',
    painPoints: ['High compliance audit risk', 'Fragmented legacy tooling', 'Lack of dedicated compliance officer'],
    valueVector: 'compliance',
    pricingArchetype: 'subscription',
    targetArpu: 199,
    estimatedCac: 150,
  },
  {
    name: 'SubManage SaaS',
    tagline: 'Proactive churn prevention and failed payment recovery for micro-SaaS',
    problem: 'Bootstrapped founders lose 4-8% of MRR every month to avoidable involuntary credit card churn.',
    solution: 'Smart smart-dunning workflows and customer retention telemetry connected directly to Stripe.',
    industry: 'DevTools',
    targetSegment: 'SaaS Founders & Solo Creators',
    painPoints: ['Lost revenue from churn', 'No automated dunning', 'Lack of visibility into customer drop-off'],
    valueVector: 'revenue',
    pricingArchetype: 'subscription',
    targetArpu: 79,
    estimatedCac: 60,
  },
  {
    name: 'ContractScout',
    tagline: 'Instant contract risk and indemnity liability scanner for SMBs',
    problem: 'Small businesses sign vendor contracts without legal counsel because attorney reviews cost $500/hour.',
    solution: 'Deterministic clause scanner highlighting unfavorable indemnities, auto-renewals, and non-competes in 10 seconds.',
    industry: 'LegalTech',
    targetSegment: 'B2B Mid-Market Teams',
    painPoints: ['Expensive legal counsel fees', 'Slow 2-week contract turnaround', 'Hidden predatory clauses'],
    valueVector: 'speed',
    pricingArchetype: 'usage',
    targetArpu: 99,
    estimatedCac: 75,
  },
];

export const EXPLORE_SCENARIO_STAGES: StageGateResult[] = [
  {
    gateId: 1,
    gateName: 'Build & Strict TypeScript Check',
    status: 'PASSED',
    startTime: Date.now() - 3200,
    durationMs: 245,
    metrics: { bundleSizeKb: 184, tsErrors: 0 },
    diagnosticLogs: [
      '[AST Scan] Initializing Next.js 15 App Router type-checker...',
      '[Bundle Check] Client bundle: 184KB (< 250KB limit) - PASS',
      '[Zod Schema] .env schema validated against strict runtime definition - PASS',
      '[Gate 1 Result] TypeScript strict AST validated cleanly. 0 errors.',
    ],
    assertionsPassed: 3,
    assertionsFailed: 0,
    receipt: {
      gateNumber: 1,
      ventureId: 'ven_active',
      timestamp: new Date(Date.now() - 3000).toISOString(),
      status: 'PASS',
      executionTimeMs: 245,
      remediationAttempts: 0,
      signature: 'sha256:d8b2e1f49a837482019482710482019482019482019482019482019482019482',
      assertions: [
        {
          assertionId: 'ast-strict-check',
          name: 'Strict TypeScript AST Compilation',
          status: 'PASS',
          latencyMs: 140,
          expected: '0 compiler errors',
          actual: '0 compiler errors',
        },
        {
          assertionId: 'bundle-budget-check',
          name: 'Bundle Size Budget (< 250KB)',
          status: 'PASS',
          latencyMs: 65,
          expected: '< 250KB',
          actual: '184KB',
        },
        {
          assertionId: 'zod-env-check',
          name: 'Environment Variable Zod Schema Validation',
          status: 'PASS',
          latencyMs: 40,
          expected: 'Zod.valid',
          actual: 'Zod.valid',
        },
      ],
    },
  },
  {
    gateId: 2,
    gateName: 'Infrastructure & Container Health Probe',
    status: 'PASSED',
    startTime: Date.now() - 2800,
    durationMs: 312,
    metrics: { p95LatencyMs: 48, probesPassed: 15 },
    diagnosticLogs: [
      '[Socket Probe] Connecting to ephemeral container socket at TLS 1.3...',
      '[RFC 6125] Validating SAN wildcard and dual DNS/IP SAN entries - PASS',
      '[Probe Burst] 15 consecutive /api/healthz probes executed. True p95: 48ms (< 300ms threshold) - PASS',
    ],
    assertionsPassed: 2,
    assertionsFailed: 0,
    receipt: {
      gateNumber: 2,
      ventureId: 'ven_active',
      timestamp: new Date(Date.now() - 2500).toISOString(),
      status: 'PASS',
      executionTimeMs: 312,
      remediationAttempts: 0,
      signature: 'sha256:9f83a21b48201948201948201948201948201948201948201948201948201948',
      assertions: [
        {
          assertionId: 'rfc6125-san-check',
          name: 'RFC 6125 SAN Wildcard Verification',
          status: 'PASS',
          latencyMs: 110,
          expected: 'Valid SAN *.axiomrun.app',
          actual: 'Valid SAN *.axiomrun.app',
        },
        {
          assertionId: 'healthz-probe-p95',
          name: '15x HTTP Healthz Probes (p95 < 300ms)',
          status: 'PASS',
          latencyMs: 202,
          expected: '< 300ms',
          actual: '48ms',
        },
      ],
    },
  },
  {
    gateId: 3,
    gateName: 'RFC 6125 SSL & Quad-DoH DNS Quorum',
    status: 'PASSED',
    startTime: Date.now() - 2300,
    durationMs: 188,
    metrics: { dohConsensus: '4/4', cnameNormalized: true },
    diagnosticLogs: [
      '[Quad-DoH] Querying Cloudflare, Google, AliDNS, and AdGuard over HTTPS...',
      '[Consensus] 4 of 4 resolvers reached quorum match for Anycast CIDR - PASS',
      '[CNAME Check] Wireformat trailing dot stripped. Subdomain takeover prevented - PASS',
      '[Redirects] Canonical HTTP -> HTTPS 301 and HSTS header verified - PASS',
    ],
    assertionsPassed: 3,
    assertionsFailed: 0,
    receipt: {
      gateNumber: 3,
      ventureId: 'ven_active',
      timestamp: new Date(Date.now() - 2100).toISOString(),
      status: 'PASS',
      executionTimeMs: 188,
      remediationAttempts: 0,
      signature: 'sha256:3a71bc9842019482019482019482019482019482019482019482019482019482',
      assertions: [
        {
          assertionId: 'quad-doh-consensus',
          name: 'Quad-DoH 3-of-4 Multi-Resolver Quorum',
          status: 'PASS',
          latencyMs: 95,
          expected: '>= 3 consensus matches',
          actual: '4 consensus matches',
        },
        {
          assertionId: 'cname-trailing-dot',
          name: 'CNAME Wireformat Trailing Dot Normalization',
          status: 'PASS',
          latencyMs: 45,
          expected: 'cname.axiomrun.app (dot stripped)',
          actual: 'cname.axiomrun.app (dot stripped)',
        },
        {
          assertionId: 'hsts-301-redirect',
          name: 'Canonical 301 & HSTS Enforcer',
          status: 'PASS',
          latencyMs: 48,
          expected: '301 Moved Permanently with HSTS',
          actual: '301 Moved Permanently with HSTS',
        },
      ],
    },
  },
  {
    gateId: 4,
    gateName: 'Stripe Checkout & Webhook Idempotency',
    status: 'PASSED',
    startTime: Date.now() - 1900,
    durationMs: 275,
    metrics: { testClockAdvancedDays: 30, duplicateEventsHandled: 0 },
    diagnosticLogs: [
      '[Stripe Test Clock] Simulated clock advanced +30 days with tolerance override - PASS',
      '[Webhook Flood] Dispatched 3 concurrent identical webhook payloads under mutex lock...',
      '[Idempotency Mutex] Exactly 1 record inserted; 2 redundant events absorbed cleanly - PASS',
    ],
    assertionsPassed: 2,
    assertionsFailed: 0,
    receipt: {
      gateNumber: 4,
      ventureId: 'ven_active',
      timestamp: new Date(Date.now() - 1600).toISOString(),
      status: 'PASS',
      executionTimeMs: 275,
      remediationAttempts: 0,
      signature: 'sha256:6e18f0a738201948201948201948201948201948201948201948201948201948',
      assertions: [
        {
          assertionId: 'stripe-clock-sim',
          name: 'Stripe Test Clock (+30d Advance)',
          status: 'PASS',
          latencyMs: 125,
          expected: '+30 days subscription active',
          actual: '+30 days subscription active',
        },
        {
          assertionId: 'webhook-mutex-lock',
          name: 'Concurrent Webhook Flood Mutex Lock (0 Duplicates)',
          status: 'PASS',
          latencyMs: 150,
          expected: 'Single DB row inserted (mutex hold)',
          actual: 'Single DB row inserted (mutex hold)',
        },
      ],
    },
  },
  {
    gateId: 5,
    gateName: 'Git Ejection & 100% Repository Portability',
    status: 'PASSED',
    startTime: Date.now() - 1400,
    durationMs: 210,
    metrics: { proprietaryImportsCount: 0, gitPushStatus: 'OK' },
    diagnosticLogs: [
      '[Clean-Room AST Scan] Inspecting all imports across client and server packages...',
      '[Zero Lock-In] Verified 0 proprietary Stage Gate OS framework dependencies - PASS',
      '[GitHub Dual-Push] Continuous push to user remote repository complete - PASS',
      '[Viral Badge] Injected verified README badge and signed cryptographic pass receipt.',
    ],
    assertionsPassed: 2,
    assertionsFailed: 0,
    receipt: {
      gateNumber: 5,
      ventureId: 'ven_active',
      timestamp: new Date(Date.now() - 1100).toISOString(),
      status: 'PASS',
      executionTimeMs: 210,
      remediationAttempts: 0,
      signature: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      assertions: [
        {
          assertionId: 'clean-room-zero-lockin',
          name: 'Zero-Lock-In Clean-Room Import Scan',
          status: 'PASS',
          latencyMs: 110,
          expected: '0 proprietary dependencies',
          actual: '0 proprietary dependencies',
        },
        {
          assertionId: 'dual-push-git-sync',
          name: '100% Continuous Dual-Push Git Sync',
          status: 'PASS',
          latencyMs: 100,
          expected: 'Remote Git push 200 OK',
          actual: 'Remote Git push 200 OK',
        },
      ],
    },
  },
];
