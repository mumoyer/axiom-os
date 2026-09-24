# Unified Mission Dashboard: Axiom OS Production Readiness & Demo Data Purge

> **Status:** Step 1 — Mission Initialized  
> **Workflow:** Thorough-Swarm Autonomous Engineering Pipeline  
> **Integrity Mode:** production  
> **Working Directory:** `c:\Users\mumoy\Documents\antigravity\adventurous-newton`

---

## 1. Project Overview & Intent

Ensure none of the app except explore functions shows demo/simulated data. Prepare app for real live customer purchases, onboarding, and usage.

- **Quality Bar:** Production-grade
- **Execution Strategy:** Dynamic Swarm

---

## 2. Requirements Specification (What, Not How)

### REQ-8. Bug Reporting System & Tester Incentives
Add prominent Bug Report modal, top beta banner, and floating trigger with genuine encouragement and bounty rewards, backed by server feedback routes and Google Chat notification dispatch.


### REQ-7. Public Beta 20% Pricing & Messaging
Reduce all subscription prices by 20% during Beta (//), preserve regular prices (//) with strikethrough, and add clear explanatory copy for early adopters.


### REQ-6. Server Route Hardening & Explore Isolation
Isolate SEED_VENTURES to explicit explore endpoints; prevent unauthenticated message leakage and admin role spoofing.


### REQ-5. Genuine Live Venture Pipeline State
Remove DEFAULT_STAGES auto-pass fallback and MOCK_NAMES default. Render authentic stage-gate states for real user ventures.


### REQ-4. Clean Newbie Wizard Production Flow
Remove prefilled DocuFlow AI fields, eliminate developer failure injection dropdown, stop saving fake MRR multipliers.


### REQ-3. Dashboard Honest Empty State and Real Portfolio
Remove DEFAULT_VENTURES with fake MRR, blank out fake BYOK API keys, remove fake CLI simulation, render clean onboarding empty state.


### REQ-2. Checkout Real Live Hardening
Remove synthesized fake checkout sessions on error and test card copy widgets. Ensure real purchase flow with authentic error surfacing.


### REQ-1. Strict Demo Data Quarantine to Explore Feature
Confine all simulated demo scenarios to client/src/demo and ExampleScenarioExplorer. Prohibit production pages from importing fixture constants.


*Add requirements using 'add-req' or edit directly.*

---

## 3. Decision Evaluation Matrix (5-Dimension Scorecard)

*Evaluated at critical architecture and design forks via /iterate.*

| Dimension | Idea A | Idea B | Idea C |
| :--- | :---: | :---: | :---: |
| **1. Best Practices** (1-5) | - | - | - |
| **2. Ease of Use** (1-5) | - | - | - |
| **3. Visual Appeal** (1-5) | - | - | - |
| **4. Resource Demands** (1-5) | - | - | - |
| **5. Human End Goals** (1-5) | - | - | - |
| **Total / Weighted Score** | **-** | **-** | **-** |

---

## 4. Objective Acceptance Criteria

### UI
- [x] Beta banner, BETA nav badge, pricing strikethroughs, and bug report triggers render cleanly across desktop and mobile


### Feedback
- [x] Bug reporting endpoint validates submissions, saves report, and dispatches real-time notification to Google Chat webhook and admin email


### Pricing
- [x] Unit tests prove all subscription tiers reflect >= 20% discount during beta with exact 12x annual multiples and correct regular list price comparisons


### Verification
- [x] Full project unit test suite and integration tests execute with zero failures.


### Explore
- [x] Explore Scenarios section (#scenarios) retains full interactive scenario preview and staging demonstration.


### Integrity
- [x] Checkout failure surfaces authentic error instead of synthesizing fake subscription activation.


### Cleanliness
- [x] Zero demo fixture strings (DocuFlow, MetricPulse, 4242, sk-ant-api03) appear on fresh /dashboard or /checkout.


*Every item must be independently verifiable without self-certification.*

### Core Verification
- [x] Initial project build and test suite executes cleanly

---

## 5. Subagent Swarm Registry

| Subagent Role | Type | Assigned Domain / Task | Status | Output Summary |
| :--- | :---: | :--- | :---: | :--- |
| Primary Coordinator | `self` | Architecture & Orchestration | COMPLETED | Full production zero-leak overhaul executed |
| Claude Opus 5.5 | `claude-opus-5` | Architectural Audit & Guard Planning | COMPLETED | Comprehensive safety boundary & quarantine audit |

---

## 6. Verification Evidence Log

*Strict compliance with /verification-before-completion (No claims without fresh logs).*

| Criterion ID | Verification Command | Exit Code / Result | Evidence Summary | Verified? |
| :---: | :--- | :---: | :--- | :---: |
| Init | `node --version` | 0 | Runtime v22.13.1 active | [x] |
| Build-TS | `npm run build` | 0 | `tsc --noEmit` exited 0 with zero compiler errors | [x] |
| Build-Vite | `npm run build:client` | 0 | Vite bundled 1,609 client modules into production dist | [x] |
| Unit-Tests | `npm run test:unit` | 0 | 170 / 170 unit tests passed (including zero demo leaks suite) | [x] |
| Integration | `npm run test:integration` | 0 | 53 / 53 integration tests passed | [x] |
| E2E-All | `npm run test:synthetic` | 0 | 29 / 29 Playwright E2E tests passed across all 7 specs | [x] |
| Visual-Audit | `npx tsx tests/generate_clean_screenshots.ts` | 0 | 5 headless browser verification screenshots captured | [x] |

