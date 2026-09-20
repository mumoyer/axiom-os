# Project: Axiom OS Autonomous Venture Engine & Founder Platform MVP

## Architecture & System Overview
Axiom OS is an Autonomous Business Operating System that inverts the brittle, hallucination-prone failure modes of AI venture builders (e.g. Polsia) into mathematical, anti-fragile guarantees.

The application is structured as a unified full-stack TypeScript platform:
- **Frontend Layer (`client/`)**: React 19 + Vite 8 + Tailwind CSS + Lucide Icons. Provides high-converting Marketing Landing Page, interactive Venture Validation Grader (VVG), Subscriber Onboarding & Stripe Checkout, Newbie Guided Launchpad Wizard, Serial Entrepreneur Cockpit (BYOK + Instant Git Ejection), and Real-time Stage-Gate Telemetry Dashboard with Embedded Staging Preview.
- **Backend & API Layer (`server/`)**: Node.js + Express + TypeScript serving REST APIs and real-time Server-Sent Events (SSE) telemetry stream on Port 3000.
- **Autonomous Venture Engine (`server/engine/`)**: 5 deterministic stage-gate verification pipelines (Build, Infra/Health, Quad-DoH DNS Quorum, Stripe Checkout, Git Ejection) with 2PC credit escrow ledger, tenant circuit breaker, and deterministic sandbox adapters.
- **Testing & Verification Harness (`tests/` & `e2e/`)**: Playwright e2e synthetic verification suite, Node.js integration tests, zero-charge failure containment unit tests, and regression test vectors.

---

## Code Layout
```
adventurous-newton/
├── client/                               # Frontend Web Application (React 19 + Vite 8)
│   ├── index.html                        # Root HTML template with hydration marker
│   ├── src/
│   │   ├── components/                   # Shared UI Components
│   │   │   ├── Navigation.tsx            # Header navigation & persona switcher
│   │   │   ├── Footer.tsx                # Footer with links & system status
│   │   │   ├── StageGateTimeline.tsx     # Real-time visual stage-gate tracker
│   │   │   ├── AuditLogTerminal.tsx      # Real-time streaming audit log viewer
│   │   │   └── StagingPreviewModal.tsx   # Multi-device responsive preview iframe
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx           # Marketing portal, value prop, competitive matrix, pricing
│   │   │   ├── GraderPage.tsx            # Venture Validation Grader lead magnet
│   │   │   ├── CheckoutPage.tsx          # Subscriber onboarding & Stripe checkout flow
│   │   │   ├── NewbieWizardPage.tsx      # Persona 1: Guided 4-step launchpad wizard
│   │   │   ├── SerialDashboardPage.tsx   # Persona 2: Git ejection, BYOK, headless API
│   │   │   └── LiveVenturePage.tsx       # Live venture dashboard & stage-gate telemetry
│   │   ├── services/
│   │   │   ├── api.ts                    # Typed API client for Axiom OS backend
│   │   │   └── grader.ts                 # Client-side validation math & score helpers
│   │   ├── App.tsx                       # Client application routes & layout
│   │   └── main.tsx                      # Client entry point
│   └── vite.config.ts                    # Vite configuration (port 3000 proxy / build)
├── server/                               # Backend API & Orchestration Engine
│   ├── engine/                           # Stage-Gate Verification Engine
│   │   ├── gates/
│   │   │   ├── gate1_build.ts            # Gate 1: Build & TypeScript syntax check
│   │   │   ├── gate2_infra.ts            # Gate 2: Container HTTP health & RFC 6125 TLS
│   │   │   ├── gate3_dns.ts              # Gate 3: Quad-DoH DNS quorum & Anycast CIDR
│   │   │   ├── gate4_stripe.ts           # Gate 4: Stripe checkout & webhook idempotency
│   │   │   └── gate5_git_eject.ts        # Gate 5: 100% clean-room Git ejection
│   │   ├── stage_gate_runner.ts          # Master stage-gate pipeline runner
│   │   ├── escrow_ledger.ts              # 2PC Credit Escrow state machine (Delta B == 0)
│   │   ├── circuit_breaker.ts            # Tenant Cumulative Failure Circuit Breaker ($9.45 cap)
│   │   └── sandbox_adapters.ts           # Deterministic mocks for Stripe, GitHub, Cloud
│   ├── routes/
│   │   ├── venture_routes.ts             # Venture CRUD, launch, and stage triggers
│   │   ├── grader_routes.ts              # VVG scoring & lead capture API
│   │   ├── checkout_routes.ts            # Stripe checkout session creation & webhooks
│   │   ├── telemetry_routes.ts           # SSE streaming audit logs & gate status
│   │   └── byok_routes.ts                # BYOK validation and settings
│   ├── app.ts                            # Express application configuration
│   └── index.ts                          # Server listener on Port 3000
├── tests/                                # Programmatic Test Suites
│   ├── unit/
│   │   ├── grader_engine.test.ts         # VVG 4-factor scoring mathematical tests
│   │   ├── escrow_ledger.test.ts         # 2PC zero-burn invariant verification
│   │   ├── circuit_breaker.test.ts       # Tenant circuit breaker $9.45 COGS cap tests
│   │   └── sandbox_adapters.test.ts      # Sandbox mock determinism tests
│   └── integration/
│       ├── stage_gates.test.ts           # Programmatic stage-gate pipeline verification
│       ├── checkout_flow.test.ts         # Stripe session & idempotency flood integration
│       └── venture_api.test.ts           # REST API endpoints & venture lifecycle
├── e2e/                                  # Synthetic Playwright Verification Suites
│   ├── playwright.config.ts              # Playwright configuration (Chromium on Port 3000)
│   ├── marketing_portal.spec.ts          # Landing page, pricing table, competitive matrix
│   ├── venture_grader.spec.ts            # Interactive VVG scoring, lead capture, report
│   ├── subscriber_checkout.spec.ts       # Tier selection and Stripe checkout flow
│   ├── newbie_launchpad.spec.ts          # Guided 4-step wizard & scaffolding trigger
│   ├── serial_dashboard.spec.ts          # BYOK key configuration & instant Git ejection
│   └── live_stage_gate.spec.ts           # Real-time stage-gate execution & SSE audit log
├── verification/                         # Preserved Empirical Test Vectors (from M0)
├── package.json                          # Unified project manifest & scripts
├── tsconfig.json                         # Strict TypeScript configuration
└── README.md                             # Comprehensive project documentation
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Strict TypeScript & Build Check | Gate 1: AST validation, strict typing, bundle budget validation | M1 | Spec §2.1 |
| 2 | Environment & Zod Validation | Gate 1: Comprehensive .env schema verification with Zod | M1 | Spec §2.1 |
| 3 | Container HTTP Health Probe | Gate 2: 15 consecutive /api/healthz probes with true p95 < 300ms | M1 | Spec §2.2 |
| 4 | RFC 6125 TLS & SAN Verification | Gate 2: OpenSSL RFC 6125 single-label wildcard & dual DNS/IP SAN validation | M1 | Spec §2.2 |
| 5 | Quad-Resolver DoH Quorum | Gate 3: 3-of-4 DoH consensus (Cloudflare, Google, AliDNS, AdGuard) | M1 | Spec §2.3 |
| 6 | CNAME Trailing Dot Normalization | Gate 3: Wireformat trailing dot removal & Anycast CIDR pool validation | M1 | Spec §2.3 |
| 7 | Canonical 301 & HSTS Enforcer | Gate 3: HTTP->HTTPS 301 redirection, HSTS max-age=31536000, nosniff, DENY | M1 | Spec §2.3 |
| 8 | Stripe Checkout Test Clock Sim | Gate 4: Simulated customer, subscription, and clock advancement (+30 days) | M1 | Spec §2.4 |
| 9 | Webhook Tolerance Override | Gate 4: STRIPE_WEBHOOK_TOLERANCE=31536000 allowing future-dated clock tests | M1 | Spec §2.4 |
| 10| Concurrent Webhook Idempotency | Gate 4: 3-request flood probe testing mutex locking and zero duplicate rows | M1 | Spec §2.4 |
| 11| 100% Full Git Ejection Engine | Gate 5: Continuous dual-push Git engine to user's personal GitHub repo | M1 | Business Plan §4.3 |
| 12| Zero-Lock-In Clean-Room Audit | Gate 5: AST scan verifying 0 proprietary imports and standalone clean build | M1 | Spec §2.5 / Plan §4.3 |
| 13| 2PC Credit Escrow State Machine | Zero-charge guarantee: hold, commit, rollback with invariant Delta B == 0 | M1 | Spec §17.1 |
| 14| Bounded Self-Healing Retries | Maximum 3 self-healing retries per stage with internal COGS absorption | M1 | Spec §17.2 |
| 15| Tenant Failure Circuit Breaker | Cap platform absorbed COGS at $9.45/mo across 5 failures (>=75.8% margin) | M1 | Spec §17.3 |
| 16| Deterministic Sandbox Adapters | Out-of-the-box mocks for Stripe, GitHub, Cloud with live-key override | M1 | Request §R1 |
| 17| Real-Time Stage Telemetry SSE | SSE endpoint streaming real-time stage progress, timings, and audit logs | M1 | Spec §4.1 |
| 18| High-Converting Hero Section | Responsive hero articulating Axiom OS value prop with live stage demo | M2 | Request §R2 |
| 19| 4 Anti-Fragile Guarantees | Zero-Charge Failure, Deterministic Stage Gates, 100% Git Ejection, 0% Tax | M2 | Business Plan §1.2 |
| 20| 12-Dimension Competitive Matrix | Axiom OS vs Polsia vs Cursor/Lovable vs Corporate Venture Studios | M2 | Competitive Matrix |
| 21| 3-Tier Transparent Pricing Table | Founder ($49), Serial ($149), Enterprise ($999) with monthly/annual toggle | M2 | Financial Model |
| 22| Venture Validation Grader (VVG) | Interactive 4-factor scoring engine (Demand 30%, Competitor 25%, Unit Econ 25%, Feasibility 20%) | M2 | Request §R2 |
| 23| Automated Pivot Generator | Synthesizes 3 validated market pivots when VVG score < 60 | M2 | Business Plan §3.1 |
| 24| Gated Lead Capture Modal | Captures founder name, email, industry, timeline; unlocks 5-page report | M2 | Request §R2 |
| 25| Subscriber Onboarding Flow | Tier selection, checkout modal, Stripe sandbox session integration | M2 | Request §R2 |
| 26| Newbie Guided 4-Step Wizard | Concept Ingestion -> Target Persona -> Business Model -> Blueprint Escrow | M3 | Request §R3 |
| 27| Automated Venture Scaffolding | Triggers full project structure generation and stage-gate initiation | M3 | Request §R3 |
| 28| Visual 5-Milestone Roadmap | Visual progress tracker displaying live checkpoint badges | M3 | Request §R3 |
| 29| Serial Entrepreneur Mode Cockpit | Multi-venture dashboard displaying all active ventures, MRR, and health | M3 | Request §R3 |
| 30| Instant 1-Click Git Ejection UI | GitHub/GitLab dual-push trigger with README verification badge | M3 | Request §R3 |
| 31| BYOK Settings & Validation | Key management (OpenAI, Anthropic, DeepSeek, Stripe, GitHub) with ping tests | M3 | Request §R3 |
| 32| Headless CLI/API Trigger | Code snippets & API token generation for headless venture execution | M3 | Request §R3 |
| 33| Live Venture Status Dashboard | Real-time stage timeline, status badges, deployment endpoints, metrics | M3 | Request §R3 |
| 34| Streaming Audit Log Terminal | Real-time log stream with color-coded levels, JSON payload inspection | M3 | Request §R3 |
| 35| Responsive Staging Preview | Live embedded iframe preview with desktop, tablet, and mobile device frames | M3 | Request §R3 |
| 36| Tier 1 Feature Coverage Tests | >=5 test cases per feature across unit and integration suites | M4 | Testing Track |
| 37| Tier 2 Boundary & Corner Tests | Extreme inputs, zero/null/overflow, clock skew, network partition tests | M4 | Testing Track |
| 38| Tier 3 Pairwise Combinations | Pairwise feature interaction tests (e.g. Escrow + Concurrency, BYOK + Ejection)| M4 | Testing Track |
| 39| Tier 4 Real-World E2E Scenarios | End-to-end user journeys (Newbie launch, Serial ejection, Lead funnel) | M4 | Testing Track |
| 40| Synthetic Playwright E2E Suite | Headless Chromium automated verification of all web application views | M4 | Acceptance Criteria |
| 41| Zero-Charge Containment Tests | Unit tests asserting Delta B == 0 and circuit breaker trip at 5 failures | M4 | Acceptance Criteria |
| 42| Production Build & Server Start | npm run build passes cleanly with 0 errors; server runs on Port 3000 | M4 | Acceptance Criteria |
| 43| Multi-Agent Review & Challenge | Independent multi-agent peer review and stress challenge | M5 | Protocol Gate |
| 44| Forensic Integrity Audit Gate | Forensic integrity auditor verifying authentic code and zero dummy facades | M5 | Protocol Gate |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0| Survey & Scope Extraction | Map codebase, specifications, runtime capabilities | none | DONE |
| M1| Autonomous Venture Engine & Stage Gates | Core 5 stage gates, 2PC escrow, circuit breaker, sandbox mocks, REST API | M0 | DONE |
| M2| Marketing Portal & Venture Grader | Landing page, competitive matrix, pricing, VVG algorithm, lead capture, Stripe checkout | M0 | DONE |
| M3| Interactive Launchpad & Founder Cockpit | Newbie wizard, Serial BYOK & Git ejection, live venture dashboard, SSE audit log | M1, M2 | DONE |
| M4| E2E Testing Track & Production Build | Unit, integration, Playwright synthetic e2e suite, zero-charge tests, production build, Port 3000 verification (`TEST_READY.md`) | M1, M2, M3 | DONE |
| M5| Multi-Agent Review, Challenge & Audit | 2 Reviewers, 2 Challengers, 1 Forensic Integrity Auditor (`GATE_STATUS.md`) | M4 | DONE |

---

## Interface Contracts

### 1. Stage-Gate Pipeline Engine (`server/engine/stage_gate_runner.ts`)
```typescript
export interface StageGateResult {
  gateId: number;
  gateName: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ROLLED_BACK';
  startTime: number;
  durationMs: number;
  metrics: Record<string, any>;
  diagnosticLogs: string[];
  assertionsPassed: number;
  assertionsFailed: number;
  error?: string;
}

export interface VenturePipelineExecution {
  ventureId: string;
  ventureName: string;
  tenantId: string;
  planTier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  stages: StageGateResult[];
  overallStatus: 'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED_ZERO_CHARGE';
  escrowStatus: 'HELD' | 'COMMITTED' | 'REFUNDED_ZERO_CHARGE';
  absorbedPlatformCogsUsd: number;
  circuitBreakerTripped: boolean;
}
```

### 2. 2PC Credit Escrow Ledger (`server/engine/escrow_ledger.ts`)
```typescript
export interface EscrowHold {
  escrowId: string;
  tenantId: string;
  ventureId: string;
  creditsHeld: number;
  stageIndex: number;
  state: 'HELD' | 'COMMITTED' | 'REFUNDED';
  timestamp: string;
}

export interface CreditLedger {
  holdCredits(tenantId: string, ventureId: string, credits: number, stage: number): Promise<EscrowHold>;
  commitCredits(escrowId: string): Promise<{ success: boolean; newBalance: number }>;
  refundZeroCharge(escrowId: string, reason: string): Promise<{ refunded: boolean; invariantDeltaB: 0.00 }>;
  getBalance(tenantId: string): Promise<number>;
}
```

### 3. Venture Validation Grader (`client/src/services/grader.ts` & `server/routes/grader_routes.ts`)
```typescript
export interface GraderInput {
  ventureName: string;
  industry: string;
  tamUsd: number;               // Total Addressable Market in USD
  samUsd: number;               // Serviceable Addressable Market in USD
  directCompetitorsCount: number;// Number of known direct competitors
  differentiationFactor: number; // 1 to 5 scale
  estimatedCacUsd: number;      // Customer Acquisition Cost
  estimatedLtvUsd: number;      // Lifetime Value
  paybackMonths: number;        // Months to recover CAC
  techComplexity: number;       // 1 (no-code) to 5 (deep tech / hardware)
  regulatoryRisk: number;       // 1 (low) to 5 (high regulatory)
  founderExperienceYears: number;
}

export interface GraderScoreResult {
  overallScore: number;         // 0 - 100
  gradeBracket: 'A' | 'B' | 'C' | 'F';
  factorScores: {
    marketDemand: number;       // 0 - 100 (Weight: 30%)
    competitorDensity: number;  // 0 - 100 (Weight: 25%)
    unitEconomics: number;      // 0 - 100 (Weight: 25%)
    technicalFeasibility: number;// 0 - 100 (Weight: 20%)
  };
  keyRisks: string[];
  recommendations: string[];
  suggestedPivots?: string[];   // Generated when overallScore < 60
}
```

### 4. Deterministic Sandbox Adapters (`server/engine/sandbox_adapters.ts`)
```typescript
export interface SandboxAdapterConfig {
  useSandbox: boolean;
  stripeMock: boolean;
  githubMock: boolean;
  cloudMock: boolean;
  liveKeyOverrides?: {
    stripeApiKey?: string;
    githubToken?: string;
    anthropicApiKey?: string;
    openaiApiKey?: string;
  };
}
```
