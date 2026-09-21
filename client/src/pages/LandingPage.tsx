import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Terminal,
  Zap,
  Lock,
  GitBranch,
  DollarSign,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Server,
  Layers,
  Award,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate?: (path: string) => void;
  selectedPersona?: 'newbie' | 'serial' | 'enterprise';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
  selectedPersona = 'serial',
}) => {
  // Billing toggle: monthly vs annual
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  // Interactive Live Stage Gate Simulator state
  const [simRunning, setSimRunning] = useState(false);
  const [simMode, setSimMode] = useState<'pass' | 'fail_refund'>('pass');
  const [activeGateIndex, setActiveGateIndex] = useState<number>(4); // Default 4 = all passed
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Competitive matrix filter tab
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'polsia' | 'devtools' | 'studios'>('all');

  // Stage gate demo steps
  const demoGates = [
    {
      id: 1,
      name: 'Gate 1: TypeScript AST & Syntax',
      duration: '42ms',
      detail: '0 type errors, strict null checks, AST bundle budget < 250KB verified',
      icon: Cpu,
    },
    {
      id: 2,
      name: 'Gate 2: Container HTTP & TLS 1.3',
      duration: '18ms',
      detail: '15/15 health probes OK (p95 18ms), RFC 6125 SAN wildcard verified',
      icon: Server,
    },
    {
      id: 3,
      name: 'Gate 3: Quad-DoH DNS Quorum',
      duration: '64ms',
      detail: '4/4 resolver quorum (Cloudflare, Google, AliDNS, AdGuard), Anycast verified',
      icon: Layers,
    },
    {
      id: 4,
      name: 'Gate 4: Stripe Clock & Webhooks',
      duration: '110ms',
      detail: 'Simulated +30d clock advance, concurrent webhook idempotency lock verified',
      icon: DollarSign,
    },
    {
      id: 5,
      name: 'Gate 5: Clean-Room Git Ejection',
      duration: '95ms',
      detail: '100% dual-push to user GitHub repo, 0 proprietary framework imports',
      icon: GitBranch,
    },
  ];

  const runSimulation = (mode: 'pass' | 'fail_refund') => {
    if (simRunning) return;
    setSimMode(mode);
    setSimRunning(true);
    setActiveGateIndex(0);

    const interval = setInterval(() => {
      setActiveGateIndex((prev) => {
        if (mode === 'fail_refund' && prev === 1) {
          // Fail at Gate 2 and trigger refund
          clearInterval(interval);
          setSimRunning(false);
          return 1;
        }
        if (prev >= 4) {
          clearInterval(interval);
          setSimRunning(false);
          return 4;
        }
        return prev + 1;
      });
    }, 600);
  };

  const copyBadgeMarkdown = () => {
    navigator.clipboard.writeText('[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com)');
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  // 12 Foundational Comparison Dimensions
  const competitiveDimensions = [
    {
      id: 1,
      name: 'Core Architecture & Philosophy',
      axiom: { tag: 'OPTIMAL', text: 'Tri-Plane Architecture (Cognitive Agent + Deterministic Verification + 2PC Escrow)' },
      polsia: { tag: 'CRITICAL', text: 'Unchecked Celery/Redis "God Mode" loops with hallucination spirals' },
      devtools: { tag: 'PARTIAL', text: 'Single-agent prompt-response in IDE; zero venture plumbing' },
      studios: { tag: 'FAIL', text: 'Human agency consulting pods, Figma slides, slow manual sprints' },
    },
    {
      id: 2,
      name: 'Verification & Quality Assurance',
      axiom: { tag: 'OPTIMAL', text: 'Deterministic Stage Gates (Headless Playwright DOM, TLS 1.3, DoH quorum, Stripe clock)' },
      polsia: { tag: 'FAIL', text: 'Shallow HTTP 200 curl; false "Done" illusion with broken forms and crashed DBs' },
      devtools: { tag: 'PARTIAL', text: 'Manual developer burden; user writes tests or clicks preview frames' },
      studios: { tag: 'PARTIAL', text: 'Subjective manual steering committee reviews & slow staging QA' },
    },
    {
      id: 3,
      name: 'Monetization & Revenue Share',
      axiom: { tag: 'OPTIMAL', text: 'Predictable SaaS Tiers ($49 / $149 / $999). Strict 0.0% Perpetual Revenue Tax.' },
      polsia: { tag: 'CRITICAL', text: 'Exploitative: $49/mo + $1/credit + 20% to 50% perpetual lifetime revenue tax' },
      devtools: { tag: 'OPTIMAL', text: 'Tool subscription ($20-$50/mo); 0% revenue share' },
      studios: { tag: 'CRITICAL', text: '$500K-$2.5M fixed fee + 15% to 40% equity stake' },
    },
    {
      id: 4,
      name: 'Ad-Spend & Growth Economics',
      axiom: { tag: 'OPTIMAL', text: '0% Ad Markup Pass-Through. Direct OAuth to founder Meta/Google Ads' },
      polsia: { tag: 'CRITICAL', text: 'Predatory 20% platform markup on all managed ad spend' },
      devtools: { tag: 'PARTIAL', text: 'Non-existent (no ad network or marketing automation)' },
      studios: { tag: 'FAIL', text: '$250-$450/hr agency media management fees' },
    },
    {
      id: 5,
      name: 'Billing on Failures (Bug Tax)',
      axiom: { tag: 'OPTIMAL', text: 'Zero-Charge Failure Guarantee. 2PC Escrow: 0 credits debited; ΔB == 0.00' },
      polsia: { tag: 'CRITICAL', text: 'Predatory "Bug Tax". Debits ~$1.00 per credit on every syntax error & broken loop' },
      devtools: { tag: 'FAIL', text: 'Metered token consumption regardless of whether code compiles or crashes' },
      studios: { tag: 'FAIL', text: 'Sunk cost retainers regardless of whether MVP works or fails' },
    },
    {
      id: 6,
      name: 'Code & Data Ownership (Portability)',
      axiom: { tag: 'OPTIMAL', text: '100% Dual-Push Full Git Ejection. Clean Next.js + Supabase; zero lock-in' },
      polsia: { tag: 'CRITICAL', text: 'Walled-garden hostage model. Cancellation wipes DB and terminates hosting' },
      devtools: { tag: 'PARTIAL', text: 'Local git (Cursor) or manual zip export (Lovable); proprietary Nix in Replit' },
      studios: { tag: 'PARTIAL', text: 'Eventual IP transfer, but delivers bespoke agency legacy code' },
    },
    {
      id: 7,
      name: 'Infrastructure Independence',
      axiom: { tag: 'OPTIMAL', text: 'Provider-Agnostic IaC. Deploys to Vercel, Supabase, Cloudflare, Fly.io, or AWS' },
      polsia: { tag: 'CRITICAL', text: 'Bound to Polsia internal Docker cluster and shared reverse proxies' },
      devtools: { tag: 'PARTIAL', text: 'Bound to provider clouds or manual devops configuration' },
      studios: { tag: 'PARTIAL', text: 'Bespoke, expensive manual Terraform to enterprise clouds' },
    },
    {
      id: 8,
      name: 'Execution Autonomy & Control Bounds',
      axiom: { tag: 'OPTIMAL', text: 'Bounded DAG Orchestration. Autonomous with deterministic gate approval gates' },
      polsia: { tag: 'CRITICAL', text: 'Unchecked 7-day "God Mode" causing DB table wipes & hallucinated loops' },
      devtools: { tag: 'PARTIAL', text: 'Prompt-by-prompt diff approval; severe developer fatigue' },
      studios: { tag: 'FAIL', text: 'Slow 6-12 month human sprints with weekly committee slide decks' },
    },
    {
      id: 9,
      name: 'Model Routing & Token Economics',
      axiom: { tag: 'OPTIMAL', text: '5-Tier Dynamic Routing (Flash/Sonnet/R1). $1.43 COGS. Full BYOK 0% markup' },
      polsia: { tag: 'CRITICAL', text: 'Monolithic unoptimized token burn passed to user with hidden margin' },
      devtools: { tag: 'PARTIAL', text: 'Hardcoded model selection with strict rate limits' },
      studios: { tag: 'FAIL', text: 'High human billable hourly rates ($200-$400/hr)' },
    },
    {
      id: 10,
      name: 'Target Persona Alignment',
      axiom: { tag: 'OPTIMAL', text: '3 Dedicated Personas: (1) Aspiring Founder, (2) Serial Hacker, (3) Enterprise Studio' },
      polsia: { tag: 'FAIL', text: 'Low-intent get-rich-quick opportunists; 50%+ monthly churn collapse' },
      devtools: { tag: 'PARTIAL', text: 'Exclusively technical software engineers and technical PMs' },
      studios: { tag: 'PARTIAL', text: 'Fortune 500 C-suite executives seeking brand safety' },
    },
    {
      id: 11,
      name: 'Retention & Net Revenue Retention',
      axiom: { tag: 'OPTIMAL', text: '116.5% - 142.0% NRR. Multi-venture cockpit & stage-gate CI/CD maintain utility' },
      polsia: { tag: 'CRITICAL', text: 'Catastrophic churn (>50%/mo); 1.7 Trustpilot score; widespread chargebacks' },
      devtools: { tag: 'PARTIAL', text: 'Moderate developer retention; high beginner churn at the "Last Mile"' },
      studios: { tag: 'FAIL', text: 'Single-engagement churn (contract ends after 6-12 months)' },
    },
    {
      id: 12,
      name: 'Enterprise Governance & Compliance',
      axiom: { tag: 'OPTIMAL', text: 'Okta SAML 2.0 SSO, SOC 2 Type II audit logs, capital tranches, Zero Data Retention' },
      polsia: { tag: 'CRITICAL', text: 'Zero compliance. Shared multi-tenant vector stores risk IP contamination' },
      devtools: { tag: 'PARTIAL', text: 'Basic team seats; no capital tranche controls or audit receipts' },
      studios: { tag: 'OPTIMAL', text: 'Heavy manual compliance reviews and bespoke enterprise legal contracts' },
    },
  ];

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'OPTIMAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">OPTIMAL</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50">PARTIAL</span>;
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/50">CRITICAL</span>;
      case 'FAIL':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-700/50">FAIL</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Gradient Mesh */}
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-xs text-indigo-300 shadow-glow-indigo">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold tracking-wide">The Autonomous Business Operating System</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Zero Technical Debt</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              From Validated Idea to Live Venture in Hours.{' '}
              <span className="text-gradient-indigo">Zero Technical Debt.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
              Deterministic stage-gates, 100% full Git ejection, and a strict <span className="text-slate-200 font-semibold">Zero-Charge Failure Guarantee</span>. Never pay for broken code or hallucinated agent loops.
            </p>

            {/* Persona Guidance Banner */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-center space-x-2 max-w-lg mx-auto">
              <span className="text-indigo-400 font-semibold">Optimized for:</span>
              <span>
                {selectedPersona === 'newbie' && 'Aspiring Founders — Guardrailed no-code launchpad & automated validation'}
                {selectedPersona === 'serial' && 'Serial Entrepreneurs — Headless CLI, BYOK wholesale tokens & 1-click Git ejection'}
                {selectedPersona === 'enterprise' && 'Corporate Studios — Capital tranche governance, SAML SSO & SOC2 audit trails'}
              </span>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onNavigate('/grader')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-glow-indigo transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Validate Your Idea Free (No Credit Card)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/checkout?plan=serial')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:text-white transition-all flex items-center justify-center space-x-2"
              >
                <span>Launch Venture ($149/mo)</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 text-xs text-slate-500 pt-2">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>0.0% Revenue Tax</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Code Ownership</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2PC Escrow Protection</span>
              </span>
            </div>
          </div>

          {/* INTERACTIVE STAGE-GATE DEMO WIDGET */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-base font-bold text-white font-mono tracking-tight">
                    TRI-PLANE DETERMINISTIC STAGE-GATE PIPELINE
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Synthetic Playwright, RFC 6125 TLS, Quad-DoH quorum & Stripe test-clock settlement in action
                </p>
              </div>

              {/* Demo Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  disabled={simRunning}
                  onClick={() => runSimulation('pass')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900/60 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simRunning ? 'animate-spin' : ''}`} />
                  <span>Simulate Verified Pass</span>
                </button>
                <button
                  disabled={simRunning}
                  onClick={() => runSimulation('fail_refund')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-700/50 hover:bg-rose-900/60 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Simulate $0.00 Refund</span>
                </button>
              </div>
            </div>

            {/* Stepper Grid */}
            <div className="mt-6 space-y-3">
              {demoGates.map((gate, idx) => {
                const isPassed = idx <= activeGateIndex && (simMode === 'pass' || idx < 1);
                const isCurrent = idx === activeGateIndex && simRunning;
                const isFailed = simMode === 'fail_refund' && idx === 1 && !simRunning;

                return (
                  <div
                    key={gate.id}
                    className={`flex items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isFailed
                        ? 'bg-rose-950/40 border-rose-700/70'
                        : isPassed
                        ? 'bg-slate-900/90 border-slate-700/70'
                        : isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500'
                        : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-3.5">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold ${
                          isFailed
                            ? 'bg-rose-600 text-white'
                            : isPassed
                            ? 'bg-emerald-500 text-slate-950'
                            : isCurrent
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isFailed ? '!' : isPassed ? '✓' : gate.id}
                      </div>

                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-200">
                          {gate.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {isFailed ? 'Assertion breach (Container latency > 300ms SLA). 2PC Escrow refunded 100% of credits.' : gate.detail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right shrink-0">
                      <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                        {gate.duration}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          isFailed
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                            : isPassed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : isCurrent
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isFailed ? 'ROLLED BACK ($0.00)' : isPassed ? 'VERIFIED PASS' : isCurrent ? 'RUNNING PROBE' : 'QUEUED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escrow Proof Footnote */}
            <div className="mt-5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>2PC Escrow State: {simMode === 'fail_refund' && !simRunning ? 'REFUNDED_ZERO_CHARGE' : 'COMMITTED_SETTLED'}</span>
              </div>
              <div className="text-emerald-400 font-semibold">
                User Balance Debit: $0.00 on Failure | Delta B == 0.00
              </div>
            </div>
          </div>
        </section>

        {/* 4 ANTI-FRAGILE GUARANTEES SECTION */}
        <section id="guarantees" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              ANTI-FRAGILE ARCHITECTURE
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              The 4 Structural Guarantees
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We inverted competitor failure modes into mathematical, programmatic guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Guarantee 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">1. Zero-Charge Failure Guarantee</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cryptographic 2PC credit escrow boundary. If any build, container health-check, or agent loop fails, 100% of credits are immediately refunded. <span className="text-indigo-300 font-mono font-semibold">Invariant ΔB == 0.00</span>.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono">
                ✓ Up to 3 self-healing retries absorbed as platform COGS
              </div>
            </div>

            {/* Guarantee 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">2. Deterministic Stage Gates</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No false "Done" illusions. Every milestone executes synthetic Playwright browser tests, live TLS 1.3 socket probes, Quad-DoH DNS consensus, and Stripe test clocks before verification.
              </p>
              <div className="pt-2 text-[11px] text-cyan-400 font-mono">
                ✓ True p95 latency &lt; 300ms SLA enforced
              </div>
            </div>

            {/* Guarantee 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-700/50 flex items-center justify-center text-violet-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">3. 100% Full Git Ejection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never held hostage. Continuous dual-push Git engine delivers pure, idiomatic Next.js 15 + Supabase + Prisma code directly to your personal GitHub repo with zero proprietary lock-in.
              </p>
              <div className="pt-2 text-[11px] text-violet-300 font-mono">
                ✓ Clean AST scan guarantees 0 proprietary imports
              </div>
            </div>

            {/* Guarantee 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">4. Transparent SaaS Economics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict 0.0% perpetual revenue tax and 0.0% markup on ad spend. You retain 100% of customer revenue and link directly to your Meta/Google ads account with zero pass-through fees.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono">
                ✓ BYOK mode: 0% token markup wholesale rates
              </div>
            </div>
          </div>
        </section>

        {/* 12-DIMENSION MASTER COMPETITIVE MATRIX */}
        <section id="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              UNAPOLOGETIC COMPARISON
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              The End of Exploitative Venture Platforms
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Why founders migrate from brittle multi-agent toys (Polsia), fragmented IDE tools (Cursor/Lovable), and $1M consulting retainers to Stage Gate OS.
            </p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setMatrixFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  matrixFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All 12 Dimensions
              </button>
              <button
                onClick={() => setMatrixFilter('polsia')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  matrixFilter === 'polsia'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                vs Polsia (Walled Garden)
              </button>
              <button
                onClick={() => setMatrixFilter('devtools')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  matrixFilter === 'devtools'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                vs Cursor / Lovable (IDE Tools)
              </button>
              <button
                onClick={() => setMatrixFilter('studios')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  matrixFilter === 'studios'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                vs Venture Studios ($1M Retainers)
              </button>
            </div>
          </div>

          {/* Master Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80">
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-300 uppercase tracking-wider w-1/4">
                    Dimension
                  </th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-indigo-400 uppercase tracking-wider bg-indigo-950/30 border-x border-indigo-800/40 w-1/4">
                    <div className="flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span>Stage Gate OS (Tri-Plane)</span>
                    </div>
                  </th>
                  {(matrixFilter === 'all' || matrixFilter === 'polsia') && (
                    <th className="py-4 px-4 sm:px-6 font-bold text-rose-400 uppercase tracking-wider w-1/4">
                      Polsia (God Mode Loop)
                    </th>
                  )}
                  {(matrixFilter === 'all' || matrixFilter === 'devtools') && (
                    <th className="py-4 px-4 sm:px-6 font-bold text-amber-400 uppercase tracking-wider w-1/4">
                      AI Dev Tools (Cursor / Lovable)
                    </th>
                  )}
                  {(matrixFilter === 'all' || matrixFilter === 'studios') && (
                    <th className="py-4 px-4 sm:px-6 font-bold text-slate-400 uppercase tracking-wider w-1/4">
                      Corporate Venture Studios
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {competitiveDimensions.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}>
                    <td className="py-4 px-4 sm:px-6 font-medium text-slate-200">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                    </td>

                    {/* Stage Gate OS Column */}
                    <td className="py-4 px-4 sm:px-6 bg-indigo-950/20 border-x border-indigo-800/30">
                      <div className="space-y-1">
                        <div>{getTagBadge(item.axiom.tag)}</div>
                        <div className="text-slate-100 font-medium leading-relaxed">
                          {item.axiom.text}
                        </div>
                      </div>
                    </td>

                    {/* Polsia Column */}
                    {(matrixFilter === 'all' || matrixFilter === 'polsia') && (
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <div className="space-y-1">
                          <div>{getTagBadge(item.polsia.tag)}</div>
                          <div className="text-slate-400 leading-relaxed">{item.polsia.text}</div>
                        </div>
                      </td>
                    )}

                    {/* Dev Tools Column */}
                    {(matrixFilter === 'all' || matrixFilter === 'devtools') && (
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <div className="space-y-1">
                          <div>{getTagBadge(item.devtools.tag)}</div>
                          <div className="text-slate-400 leading-relaxed">{item.devtools.text}</div>
                        </div>
                      </td>
                    )}

                    {/* Venture Studios Column */}
                    {(matrixFilter === 'all' || matrixFilter === 'studios') && (
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <div className="space-y-1">
                          <div>{getTagBadge(item.studios.tag)}</div>
                          <div className="text-slate-400 leading-relaxed">{item.studios.text}</div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 PRICING TIERS SECTION */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              TRANSPARENT VALUE PRICING
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Zero Hidden Taxes. Wholesale Token Unit Economics.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Choose the right tier for your venture velocity. Switch or cancel anytime. All plans backed by the strict Zero-Charge Failure Guarantee.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 mt-4">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  billingInterval === 'annual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Tier 1: Founder */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Tier 1: Founder
                  </span>
                  <h4 className="text-2xl font-bold text-white mt-1">Aspiring Founder</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Launch your first verified business with zero technical overwhelm.
                  </p>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-white">
                    ${billingInterval === 'monthly' ? '49' : '39'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                  {billingInterval === 'annual' && (
                    <span className="text-[11px] text-emerald-400 font-mono">($470 billed annually)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200">Includes Quotas:</div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>3 verified deployments</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>10 minor iterations</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1 active ephemeral preview sandbox</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Deterministic Gates 1–5 Verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero-Charge Failure Guarantee (2PC Escrow)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1-Click Git Ejection to personal GitHub</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>0% Perpetual Revenue Tax</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/checkout?plan=founder&billing=${billingInterval}`)}
                className="w-full py-3 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 transition-all text-center"
              >
                Get Started with Founder
              </button>
            </div>

            {/* Tier 2: Serial Entrepreneur (Featured) */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-slate-900/90 p-7 space-y-6 flex flex-col justify-between shadow-glow-indigo relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                MOST POPULAR / BUILDER CHOICE
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Tier 2: Serial
                  </span>
                  <h4 className="text-2xl font-bold text-white mt-1">Serial Entrepreneur</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    High-velocity multi-venture operations with wholesale token economics.
                  </p>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-white">
                    ${billingInterval === 'monthly' ? '149' : '119'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                  {billingInterval === 'annual' && (
                    <span className="text-[11px] text-indigo-400 font-mono">($1,430 billed annually)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200">Everything in Founder, PLUS:</div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span><strong>15 verified deployments</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span><strong>50 minor iterations</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Up to 5 concurrent active preview sandboxes</span>
                  </div>
                  <div className="flex items-center space-x-2 font-semibold text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>BYOK Mode: Wholesale 0% token markup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Headless CLI (<code>stagegate-cli</code>) & REST API triggers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Multi-Venture Portfolio Cockpit (Aggregated MRR)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Continuous dual-push to GitHub/GitLab orgs</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/checkout?plan=serial&billing=${billingInterval}`)}
                className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-glow-indigo transition-all text-center"
              >
                Launch Serial Tier ($149/mo)
              </button>
            </div>

            {/* Tier 3: Enterprise Studio */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Tier 3: Enterprise
                  </span>
                  <h4 className="text-2xl font-bold text-white mt-1">Enterprise Studio</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Institutional intrapreneurship sandbox with capital tranche governance.
                  </p>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-white">
                    ${billingInterval === 'monthly' ? '999' : '799'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                  {billingInterval === 'annual' && (
                    <span className="text-[11px] text-cyan-400 font-mono">($9,590 billed annually)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200">Everything in Serial, PLUS:</div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>50 complete deployments</strong> (pooled across team)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>250 iterations</strong> / month pooled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Unlimited concurrent preview sandboxes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>Capital Tranche Budget Governance</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Okta SAML 2.0 SSO & granular RBAC</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>SOC 2 Type II audit logs & cryptographic receipts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Dedicated single-tenant VPC with ZDR guarantee</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/checkout?plan=enterprise&billing=${billingInterval}`)}
                className="w-full py-3 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-700/50 transition-all text-center"
              >
                Contact Enterprise Sales
              </button>
            </div>

          </div>
        </section>

        {/* VIRAL BADGE & SOCIAL PROOF */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-bold text-white">The Verified by Stage Gate OS README Badge</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every venture built through Stage Gate OS includes an unencumbered cryptographic verification badge embedded into your GitHub README. Prove to investors and users that your codebase passed synthetic Playwright checks and zero-lock-in clean-room audits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-indigo-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>[![Verified by Stage Gate OS](...)]</span>
              </div>
              <button
                onClick={copyBadgeMarkdown}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 transition-colors"
              >
                {copiedBadge ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBadge ? 'Copied Markdown' : 'Copy Badge'}</span>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
