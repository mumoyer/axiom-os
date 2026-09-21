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
  Activity,
  Code2,
  Database,
  ExternalLink,
  Sliders,
  Filter,
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
    <div className="min-h-screen bg-[#070B12] text-slate-100 selection:bg-indigo-600 selection:text-white">
      
      {/* Subtle Engineering Background Pattern */}
      <div className="relative isolate overflow-hidden bg-tech-grid">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            
            {/* Devtools Terminal Badge */}
            <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-md bg-[#0e1526] border border-slate-800 text-xs font-mono text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-indigo-400 font-semibold">STAGEGATE.OS</span>
              <span className="text-slate-600">/</span>
              <span>TRI-PLANE ENGINE</span>
              <span className="text-slate-600">/</span>
              <span className="text-emerald-400">ZERO TECH DEBT</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] font-sans">
              Autonomous Venture Engine with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-100 to-sky-300">
                Deterministic Stage Gates
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Playwright DOM assertions, RFC 6125 TLS, Quad-DoH DNS quorum, and a cryptographic{' '}
              <span className="text-slate-200 font-mono font-medium">Zero-Charge Failure Escrow</span>. Never pay for broken code or hallucinated agent loops.
            </p>

            {/* Persona Guidance Banner */}
            <div className="p-2.5 rounded-lg bg-[#0b101d] border border-slate-800/80 text-xs text-slate-300 flex items-center justify-center space-x-2 max-w-xl mx-auto font-mono">
              <span className="text-indigo-400 font-semibold">TARGET ARCHITECTURE:</span>
              <span className="text-slate-300">
                {selectedPersona === 'newbie' && 'Aspiring Founders — Guardrailed no-code launchpad & automated validation'}
                {selectedPersona === 'serial' && 'Serial Entrepreneurs — Headless CLI, BYOK wholesale tokens & 1-click Git ejection'}
                {selectedPersona === 'enterprise' && 'Corporate Studios — Capital tranche governance, SAML SSO & SOC2 audit trails'}
              </span>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('/grader')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs font-mono font-semibold text-slate-950 bg-white hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 border border-slate-300"
              >
                <Code2 className="w-4 h-4 text-slate-950" />
                <span>EXECUTE FREE IDEA AUDIT</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>

              <button
                onClick={() => onNavigate('/checkout?plan=serial')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs font-mono font-semibold text-slate-200 bg-[#0c1220] hover:bg-[#111a30] border border-slate-700/80 transition-all flex items-center justify-center space-x-2"
              >
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>LAUNCH VENTURE ($149/MO)</span>
              </button>
            </div>

            {/* Architectural Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 pt-2 font-mono">
              <span className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>0.0% Perpetual Revenue Tax</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Dual-Push Git Ejection</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>2PC Escrow: Invariant ΔB == 0.00</span>
              </span>
            </div>
          </div>

          {/* INTERACTIVE STAGE-GATE DEVTOOLS CONSOLE */}
          <div className="mt-12 max-w-5xl mx-auto terminal-window overflow-hidden">
            {/* Terminal Top Window Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#0a0f1d] border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <span className="text-slate-400">stagegate-console --pipeline=tri-plane-deterministic</span>
              </div>

              {/* Simulation Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 mr-1 hidden md:inline">TEST BENCH:</span>
                <button
                  disabled={simRunning}
                  onClick={() => runSimulation('pass')}
                  className="px-3 py-1 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/50 border border-emerald-700/60 hover:bg-emerald-900/60 rounded transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${simRunning && simMode === 'pass' ? 'animate-spin' : ''}`} />
                  <span>PASS_SCENARIO</span>
                </button>
                <button
                  disabled={simRunning}
                  onClick={() => runSimulation('fail_refund')}
                  className="px-3 py-1 text-xs font-mono font-medium text-rose-300 bg-rose-950/50 border border-rose-700/60 hover:bg-rose-900/60 rounded transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>REFUND_TEST ($0.00)</span>
                </button>
              </div>
            </div>

            {/* Terminal Body with Monospaced Telemetry */}
            <div className="p-4 sm:p-6 bg-[#060911] space-y-3 font-mono">
              <div className="flex items-center justify-between text-slate-500 text-[11px] pb-1 border-b border-slate-900">
                <span>GATE / TELEMETRY SPECIFICATION</span>
                <span className="hidden sm:inline">VERIFICATION STATUS</span>
              </div>

              {demoGates.map((gate, idx) => {
                const isPassed = idx <= activeGateIndex && (simMode === 'pass' || idx < 1);
                const isCurrent = idx === activeGateIndex && simRunning;
                const isFailed = simMode === 'fail_refund' && idx === 1 && !simRunning;

                return (
                  <div
                    key={gate.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all gap-2 text-xs ${
                      isFailed
                        ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                        : isPassed
                        ? 'bg-[#090e1c] border-slate-800/90 text-slate-300'
                        : isCurrent
                        ? 'bg-indigo-950/30 border-indigo-500/70 text-indigo-200'
                        : 'bg-[#060911] border-slate-900 text-slate-600'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isFailed
                            ? 'bg-rose-600 text-white'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isCurrent
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 animate-pulse'
                            : 'bg-slate-900 text-slate-600'
                        }`}
                      >
                        {isFailed ? 'ERR' : isPassed ? 'PASS' : isCurrent ? 'RUN' : `G0${gate.id}`}
                      </span>

                      <div>
                        <div className="font-semibold text-slate-200">{gate.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isFailed
                            ? 'Assertion breached: Container latency > 300ms SLA. 2PC Escrow triggered automatic rollback.'
                            : gate.detail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right self-end sm:self-center shrink-0">
                      <span className="text-[11px] text-slate-500">{gate.duration}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isFailed
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                            : isPassed
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : isCurrent
                            ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/60 animate-pulse'
                            : 'bg-slate-900 text-slate-600'
                        }`}
                      >
                        {isFailed ? 'ROLLED BACK ($0.00)' : isPassed ? 'VERIFIED_OK' : isCurrent ? 'EXECUTING...' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Cryptographic Escrow Proof Box */}
              <div className="mt-4 p-3 rounded-lg bg-[#080d19] border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>2PC Escrow Invariant:</span>
                  <span className="text-slate-200 font-bold">
                    {simMode === 'fail_refund' && !simRunning ? 'ESCROW_ABORT_ROLLBACK' : 'ESCROW_SETTLED_SUCCESS'}
                  </span>
                </div>
                <div className="text-emerald-400 font-mono text-[11px] bg-emerald-950/30 px-2.5 py-1 rounded border border-emerald-800/40">
                  User Balance Liability: $0.00 | Invariant ΔB == 0.00
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID VALUE ARCHITECTURE SECTION */}
        <section id="guarantees" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
          <div className="space-y-3 mb-12">
            <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>BENTO ARCHITECTURE SPECIFICATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered for Zero Technical Debt
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              We eliminated the failure modes of AI wrappers and consulting agencies through mathematical bounds, clean Git ejection, and deterministic verification.
            </p>
          </div>

          {/* Bento Modular Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Bento Block 1: Large (Span 2) */}
            <div className="md:col-span-2 bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#0e1628] border border-slate-800 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                    INVARIANT ΔB == 0.00
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Zero-Charge Failure Escrow</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Competitors charge you per credit while agent loops crash or hallucinate. Stage Gate OS wraps every build, health-check, and synthetic probe in a 2-Phase Commit (2PC) credit escrow. If any assertion fails, 100% of credits are rolled back instantly.
                </p>
              </div>

              {/* Code Snippet in Bento Card */}
              <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-500">// Atomic Escrow Invariant Check</div>
                <div>assert(wallet.preHold == wallet.postRollback);</div>
                <div className="text-emerald-400">✓ Platform absorbs self-healing retries (up to 3x) as internal COGS</div>
              </div>
            </div>

            {/* Bento Block 2: Standard (Span 1 or 2) */}
            <div className="md:col-span-1 lg:col-span-2 bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#0e1628] border border-slate-800 flex items-center justify-center text-cyan-400">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                    ZERO LOCK-IN
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">100% Dual-Push Git Ejection</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Never held hostage by proprietary runtimes. Every verified commit is dual-pushed directly to your personal or organization GitHub repository as pure Next.js 15, Supabase, and Tailwind CSS.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                <span className="text-slate-300">git remote -v</span>
                <span className="text-indigo-400">github.com/user/venture-prod</span>
              </div>
            </div>

            {/* Bento Block 3: Standard (Span 2) */}
            <div className="md:col-span-2 bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#0e1628] border border-slate-800 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                    0.0% REVENUE TAX
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Strict 0.0% Perpetual Revenue Tax</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Unlike platforms that demand 20% to 50% of your lifetime gross revenue or agency studios that take 25% equity, Stage Gate OS operates on predictable, transparent flat SaaS tiers. You keep 100% of your enterprise value.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-[#060911] border border-slate-800">
                  <div className="text-slate-500">Ad Spend Markup</div>
                  <div className="text-emerald-400 font-bold mt-0.5">0% Direct OAuth</div>
                </div>
                <div className="p-2 rounded bg-[#060911] border border-slate-800">
                  <div className="text-slate-500">Equity Taken</div>
                  <div className="text-emerald-400 font-bold mt-0.5">0.0% Founder Retained</div>
                </div>
              </div>
            </div>

            {/* Bento Block 4: Standard (Span 2) */}
            <div className="md:col-span-2 bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#0e1628] border border-slate-800 flex items-center justify-center text-indigo-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40">
                    QUAD-DOH QUORUM
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Deterministic Stage Gates 1–5</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  No false "Done" illusions. Every production milestone validates AST syntax budgets (&lt;250KB), 15/15 container health probes (p95 &lt; 18ms), Quad-DoH DNS consensus (Cloudflare, Google, AliDNS, AdGuard), and simulated +30d Stripe clocks.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                <span className="text-slate-400">Synthetic SLA Verification</span>
                <span className="text-emerald-400">100% Passed (5/5 Gates)</span>
              </div>
            </div>

          </div>
        </section>

        {/* 12-DIMENSION ARCHITECTURE MATRIX SECTION */}
        <section id="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
          <div className="space-y-3 mb-10">
            <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>UNAPOLOGETIC ARCHITECTURAL COMPARISON</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              The End of Exploitative Venture Platforms
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Why founders migrate from brittle multi-agent toys (Polsia), fragmented IDE tools (Cursor/Lovable), and $1M consulting retainers to Stage Gate OS.
            </p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-3 font-mono">
              <button
                onClick={() => setMatrixFilter('all')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  matrixFilter === 'all'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-[#0a0f1d] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                ALL_12_DIMENSIONS
              </button>
              <button
                onClick={() => setMatrixFilter('polsia')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  matrixFilter === 'polsia'
                    ? 'bg-rose-950/80 text-rose-200 border border-rose-700'
                    : 'bg-[#0a0f1d] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                VS_POLSIA (WALLED_GARDEN)
              </button>
              <button
                onClick={() => setMatrixFilter('devtools')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  matrixFilter === 'devtools'
                    ? 'bg-amber-950/80 text-amber-200 border border-amber-700'
                    : 'bg-[#0a0f1d] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                VS_CURSOR_LOVABLE (IDE_TOOLS)
              </button>
              <button
                onClick={() => setMatrixFilter('studios')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  matrixFilter === 'studios'
                    ? 'bg-slate-800 text-slate-100 border border-slate-600'
                    : 'bg-[#0a0f1d] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                VS_VENTURE_STUDIOS ($1M_RETAINERS)
              </button>
            </div>
          </div>

          {/* Master Comparison Table with Clean Bento Framing */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#080d19]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#060a14] font-mono">
                  <th className="py-3.5 px-4 sm:px-6 font-semibold text-slate-400 uppercase tracking-wider w-1/4">
                    Dimension
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold text-indigo-300 uppercase tracking-wider bg-[#0c1428] border-x border-slate-800 w-1/4">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Stage Gate OS (Tri-Plane)</span>
                    </div>
                  </th>
                  {(matrixFilter === 'all' || matrixFilter === 'polsia') && (
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-rose-400 uppercase tracking-wider w-1/4">
                      Polsia (God Mode Loop)
                    </th>
                  )}
                  {(matrixFilter === 'all' || matrixFilter === 'devtools') && (
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-amber-400 uppercase tracking-wider w-1/4">
                      AI Dev Tools (Cursor / Lovable)
                    </th>
                  )}
                  {(matrixFilter === 'all' || matrixFilter === 'studios') && (
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-slate-400 uppercase tracking-wider w-1/4">
                      Corporate Venture Studios
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {competitiveDimensions.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-[#080d19]' : 'bg-[#060a14]'}>
                    <td className="py-4 px-4 sm:px-6 font-medium text-slate-200">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                    </td>

                    {/* Stage Gate OS Column */}
                    <td className="py-4 px-4 sm:px-6 bg-[#0c1428]/60 border-x border-slate-800">
                      <div className="space-y-1.5">
                        <div>{getTagBadge(item.axiom.tag)}</div>
                        <div className="text-slate-100 font-medium leading-relaxed">
                          {item.axiom.text}
                        </div>
                      </div>
                    </td>

                    {/* Polsia Column */}
                    {(matrixFilter === 'all' || matrixFilter === 'polsia') && (
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <div className="space-y-1.5">
                          <div>{getTagBadge(item.polsia.tag)}</div>
                          <div className="text-slate-400 leading-relaxed">{item.polsia.text}</div>
                        </div>
                      </td>
                    )}

                    {/* Dev Tools Column */}
                    {(matrixFilter === 'all' || matrixFilter === 'devtools') && (
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <div className="space-y-1.5">
                          <div>{getTagBadge(item.devtools.tag)}</div>
                          <div className="text-slate-400 leading-relaxed">{item.devtools.text}</div>
                        </div>
                      </td>
                    )}

                    {/* Venture Studios Column */}
                    {(matrixFilter === 'all' || matrixFilter === 'studios') && (
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <div className="space-y-1.5">
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

        {/* 3 PRICING TIERS SECTION (BENTO CARDS) */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
          <div className="space-y-3 mb-12">
            <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>TRANSPARENT UNIT ECONOMICS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Zero Hidden Taxes. Wholesale Token Pricing.
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Choose the tier calibrated to your venture velocity. Switch or cancel anytime. All plans backed by the strict Zero-Charge Failure Guarantee.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center p-1 rounded-lg bg-[#0a0f1d] border border-slate-800 mt-2 font-mono">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-3.5 py-1.5 rounded text-xs transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-slate-200 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-3.5 py-1.5 rounded text-xs transition-all flex items-center space-x-1.5 ${
                  billingInterval === 'annual'
                    ? 'bg-slate-200 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>ANNUAL</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Bento Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tier 1: Founder */}
            <div className="bento-card p-6 sm:p-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    TIER 01 / ASPIRING FOUNDER
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-1">Founder Launchpad</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Launch your first verified business with zero technical overwhelm.
                  </p>
                </div>

                <div className="flex items-baseline space-x-2 font-mono">
                  <span className="text-4xl font-extrabold text-white">
                    ${billingInterval === 'monthly' ? '49' : '39'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                  {billingInterval === 'annual' && (
                    <span className="text-[11px] text-emerald-400">($470 billed annually)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                  <div className="font-mono text-slate-400 text-[11px]">INCLUDED CAPACITIES:</div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>3 verified deployments</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>10 minor iterations</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1 active ephemeral preview sandbox</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Deterministic Gates 1–5 Verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero-Charge Failure Escrow (2PC)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1-Click Git Ejection to personal GitHub</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>0.0% Perpetual Revenue Tax</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/checkout?plan=founder&billing=${billingInterval}`)}
                className="w-full py-2.5 rounded-lg text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 transition-all text-center"
              >
                SELECT FOUNDER ($49/MO)
              </button>
            </div>

            {/* Tier 2: Serial Entrepreneur (Featured Bento Highlight) */}
            <div className="rounded-xl border border-indigo-500/70 bg-[#0d1424] p-6 sm:p-7 space-y-6 flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                RECOMMENDED ARCHITECTURE
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                    TIER 02 / SERIAL HACKER
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-1">Serial Entrepreneur</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    High-velocity multi-venture operations with wholesale token economics.
                  </p>
                </div>

                <div className="flex items-baseline space-x-2 font-mono">
                  <span className="text-4xl font-extrabold text-white">
                    ${billingInterval === 'monthly' ? '149' : '119'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                  {billingInterval === 'annual' && (
                    <span className="text-[11px] text-indigo-400">($1,430 billed annually)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="font-mono text-slate-400 text-[11px]">EVERYTHING IN FOUNDER, PLUS:</div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span><strong>15 verified deployments</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span><strong>50 minor iterations</strong> / month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Up to 5 concurrent active preview sandboxes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold font-mono">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>BYOK Mode: Wholesale 0% token markup</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Headless CLI (<code>stagegate-cli</code>) & REST API triggers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Multi-Venture Portfolio Cockpit (Aggregated MRR)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Continuous dual-push to GitHub/GitLab orgs</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/checkout?plan=serial&billing=${billingInterval}`)}
                className="w-full py-3 rounded-lg text-xs font-mono font-bold text-slate-950 bg-white hover:bg-slate-200 transition-all text-center"
              >
                LAUNCH SERIAL TIER ($149/MO)
              </button>
            </div>

            {/* Tier 3: Enterprise Studio */}
            <div className="bento-card p-6 sm:p-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    TIER 03 / CORPORATE STUDIO
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-1">Enterprise Studio</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Institutional intrapreneurship sandbox with capital tranche governance.
                  </p>
                </div>

                <div className="flex items-baseline space-x-2 font-mono">
                  <span className="text-4xl font-extrabold text-white">
                    ${billingInterval === 'monthly' ? '999' : '799'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                  {billingInterval === 'annual' && (
                    <span className="text-[11px] text-cyan-400">($9,590 billed annually)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="font-mono text-slate-400 text-[11px]">EVERYTHING IN SERIAL, PLUS:</div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>50 complete deployments</strong> (pooled across team)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>250 iterations</strong> / month pooled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Unlimited concurrent preview sandboxes</span>
                  </div>
                  <div className="flex items-center space-x-2 font-semibold text-cyan-300">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Capital Tranche Budget Governance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Okta SAML 2.0 SSO & granular RBAC</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>SOC 2 Type II audit logs & receipts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Dedicated single-tenant VPC (ZDR)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/checkout?plan=enterprise&billing=${billingInterval}`)}
                className="w-full py-2.5 rounded-lg text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 transition-all text-center"
              >
                CONTACT SALES ($999/MO)
              </button>
            </div>

          </div>
        </section>

        {/* VIRAL BADGE & REPO VERIFICATION SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
          <div className="p-6 sm:p-8 rounded-xl bg-[#080d19] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2 font-mono text-xs text-indigo-400">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">README VERIFICATION BADGE</span>
              </div>
              <h4 className="text-base font-bold text-white">Cryptographic Provenance for Your GitHub Repo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every venture built through Stage Gate OS includes an unencumbered cryptographic verification badge embedded into your GitHub README. Prove to investors and users that your codebase passed synthetic Playwright checks and zero-lock-in clean-room audits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="px-3.5 py-2 rounded-lg bg-[#060911] border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2 w-full sm:w-auto justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">[![Verified by Stage Gate OS](...)]</span>
              </div>
              <button
                onClick={copyBadgeMarkdown}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-200 hover:bg-white text-slate-950 flex items-center justify-center space-x-1.5 transition-colors shrink-0"
              >
                {copiedBadge ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBadge ? 'COPIED_MD' : 'COPY_BADGE'}</span>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
