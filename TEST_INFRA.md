# E2E Test Infra: Axiom OS Autonomous Venture Platform

## Test Philosophy
- **Opaque-box & Requirement-Driven**: Derived strictly from `ORIGINAL_REQUEST.md`, `axiom_os_stage_gate_verification_spec.md`, and user-facing contracts. Tests interact with public REST endpoints, CLI ejection artifacts, and frontend DOM elements without relying on implementation internals.
- **Methodology**: Systematic 4-tier testing:
  - **Tier 1**: Category-Partition Functional Verification (>=5 test cases per feature covering happy paths and equivalence partitions).
  - **Tier 2**: Boundary Value Analysis & Error Injection (>=5 tests per feature covering extreme inputs, overflows, negative numbers, timeout skews, and network partitioning).
  - **Tier 3**: Pairwise Combinatorial Testing (cross-feature interactions: Escrow + Concurrency, BYOK + Ejection, Tier Limits + Stage Gates).
  - **Tier 4**: Real-World Application Scenarios (complete founder personas executing end-to-end workflows).
- **Zero-Charge Integrity**: Strict mathematical verification that on any gate abort or retry, the 2PC credit escrow guarantees $\Delta B \equiv 0.00$ and platform COGS absorption is capped at $9.45/mo across 5 failures.

---

## Feature Inventory & Test Coverage Targets
| # | Feature | Source (Requirement) | Tier 1 (Count) | Tier 2 (Count) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|----------------------|:--------------:|:--------------:|:-----------------:|:-----------------:|
| 1 | TypeScript & Build Check (Gate 1) | Spec §2.1 | 5 | 5 | ✓ | ✓ |
| 2 | Environment & Zod Validation (Gate 1) | Spec §2.1 | 5 | 5 | ✓ | ✓ |
| 3 | Container HTTP Health Probe (Gate 2) | Spec §2.2 | 5 | 5 | ✓ | ✓ |
| 4 | RFC 6125 TLS & Dual SAN Check (Gate 2) | Spec §2.2 | 5 | 5 | ✓ | ✓ |
| 5 | Quad-Resolver DoH Quorum (Gate 3) | Spec §2.3 | 5 | 5 | ✓ | ✓ |
| 6 | CNAME Trailing Dot Normalization (Gate 3) | Spec §2.3 | 5 | 5 | ✓ | ✓ |
| 7 | Canonical 301 & HSTS Enforcer (Gate 3) | Spec §2.3 | 5 | 5 | ✓ | ✓ |
| 8 | Stripe Checkout Test Clock Sim (Gate 4) | Spec §2.4 | 5 | 5 | ✓ | ✓ |
| 9 | Webhook Tolerance Override (Gate 4) | Spec §2.4 | 5 | 5 | ✓ | ✓ |
| 10| Concurrent Webhook Idempotency (Gate 4) | Spec §2.4 | 5 | 5 | ✓ | ✓ |
| 11| 100% Full Git Ejection Engine (Gate 5) | Business Plan §4.3 | 5 | 5 | ✓ | ✓ |
| 12| Clean-Room Portability Audit (Gate 5) | Spec §2.5 | 5 | 5 | ✓ | ✓ |
| 13| 2PC Credit Escrow Invariant (Delta B=0) | Spec §17.1 | 5 | 5 | ✓ | ✓ |
| 14| Bounded Self-Healing Retries (max 3) | Spec §17.2 | 5 | 5 | ✓ | ✓ |
| 15| Tenant Failure Circuit Breaker ($9.45 cap) | Spec §17.3 | 5 | 5 | ✓ | ✓ |
| 16| Deterministic Sandbox Mocks | Request §R1 | 5 | 5 | ✓ | ✓ |
| 17| Telemetry SSE Audit Stream | Spec §4.1 | 5 | 5 | ✓ | ✓ |
| 18| High-Converting Marketing Hero | Request §R2 | 5 | 5 | ✓ | ✓ |
| 19| 4 Anti-Fragile Guarantees Display | Business Plan §1.2 | 5 | 5 | ✓ | ✓ |
| 20| 12-Dimension Competitive Matrix | Competitive Matrix | 5 | 5 | ✓ | ✓ |
| 21| 3-Tier Transparent Pricing Table | Financial Model | 5 | 5 | ✓ | ✓ |
| 22| Venture Validation Grader (VVG) Algorithm | Request §R2 | 5 | 5 | ✓ | ✓ |
| 23| Automated Pivot Generator (Score < 60) | Business Plan §3.1 | 5 | 5 | ✓ | ✓ |
| 24| Gated Lead Capture Funnel | Request §R2 | 5 | 5 | ✓ | ✓ |
| 25| Subscriber Onboarding & Checkout | Request §R2 | 5 | 5 | ✓ | ✓ |
| 26| Newbie Guided 4-Step Wizard | Request §R3 | 5 | 5 | ✓ | ✓ |
| 27| Automated Scaffolding Trigger | Request §R3 | 5 | 5 | ✓ | ✓ |
| 28| Visual 5-Milestone Roadmap | Request §R3 | 5 | 5 | ✓ | ✓ |
| 29| Serial Entrepreneur Multi-Venture View | Request §R3 | 5 | 5 | ✓ | ✓ |
| 30| Instant 1-Click Git Ejection UI | Request §R3 | 5 | 5 | ✓ | ✓ |
| 31| BYOK Settings & Connectivity Tests | Request §R3 | 5 | 5 | ✓ | ✓ |
| 32| Headless CLI/API Trigger | Request §R3 | 5 | 5 | ✓ | ✓ |
| 33| Live Venture Status Dashboard | Request §R3 | 5 | 5 | ✓ | ✓ |
| 34| Streaming Audit Log Terminal | Request §R3 | 5 | 5 | ✓ | ✓ |
| 35| Responsive Staging Preview (Desktop/Mobile)| Request §R3 | 5 | 5 | ✓ | ✓ |

---

## Test Architecture & Invocation Commands
- **Unit & Algorithmic Tests**:
  - Command: `npm run test:unit`
  - Runner: Node.js native test runner via `tsx --test`
  - Targets: Grader math, 2PC escrow invariant, circuit breaker economics, sandbox mocks.
- **API & Integration Tests**:
  - Command: `npm run test:integration`
  - Runner: `tsx --test` against Express routes and mock adapters.
  - Targets: Stage-gate pipeline execution, webhook flood idempotency, venture CRUD.
- **Synthetic Playwright E2E Tests**:
  - Command: `npm run test:synthetic`
  - Runner: `@playwright/test` using pre-installed Chromium headless browser (`$LOCALAPPDATA\ms-playwright\chromium-1200`).
  - Targets: DOM assertions on Landing Page, Grader calculations, Lead capture submission, Checkout flow, Newbie wizard, Serial cockpit, live stage-gate timeline.
- **Full Test Suite Execution**:
  - Command: `npm test`
  - Success Criteria: Exit code 0, 100% tests passing, zero regressions.

---

## Real-World Application Scenarios (Tier 4)
1. **Scenario 1 (Newbie Non-Technical Founder)**:
   Aspiring founder inputs non-technical concept -> completes VVG Grader -> views score and pivot recommendations -> submits lead form -> triggers 4-step Newbie wizard -> initiates venture scaffolding with 2PC escrow authorization -> observes real-time Gates 1-5 progress in dashboard.
2. **Scenario 2 (Serial Entrepreneur Fast Eject & BYOK)**:
   Serial founder navigates directly to Serial Cockpit -> inputs BYOK Anthropic/Stripe keys and validates connectivity -> selects venture -> triggers instant 1-click Git ejection -> confirms dual-push repository creation, verification badge embed, and clean-room buildability.
3. **Scenario 3 (Zero-Charge Failure Containment Stress Test)**:
   Simulated malformed venture injected -> triggers Gate 2 / Gate 4 failure -> asserts bounded retry (3 attempts) -> asserts abort with diagnostic logs -> asserts user wallet balance change is exactly 0.00 ($\Delta B \equiv 0.00$) -> asserts 5 consecutive failures trip tenant circuit breaker at $9.45 platform COGS.
4. **Scenario 4 (Stripe Sandbox Subscriber Onboarding)**:
   Prospective subscriber selects Serial Plan ($149/mo) -> toggles Annual discount -> clicks checkout -> enters sandbox test card (`tok_visa`) -> receives webhook -> confirms tenant activation and increased deployment quota.
5. **Scenario 5 (Adversarial Multi-Vector Concurrency Flood)**:
   3 simultaneous webhook calls with identical payload dispatched -> verifies database mutex prevents duplicate subscription entries -> verifies idempotency response 200/409.

---

## Coverage Thresholds
- **Tier 1**: $\ge 175$ functional test assertions across unit, API, and e2e suites.
- **Tier 2**: $\ge 175$ boundary and error injection assertions.
- **Tier 3**: Pairwise coverage of all major feature pairings.
- **Tier 4**: 5 complete real-world user persona end-to-end flows.
- **Acceptance Gate**: 100% pass rate with zero skips or failures.
