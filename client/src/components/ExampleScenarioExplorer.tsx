import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Database,
  Layers,
  Cpu,
  Server,
  DollarSign,
  Activity,
  Check,
  Code2,
  Lock,
  Play,
} from 'lucide-react';
import { StagingPreviewModal } from './StagingPreviewModal.js';

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

interface ExampleScenarioExplorerProps {
  onNavigate?: (path: string) => void;
}

export const ExampleScenarioExplorer: React.FC<ExampleScenarioExplorerProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DUMMY_SCENARIOS[0].id);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'economics' | 'api' | 'telemetry'>('overview');

  const currentScenario = DUMMY_SCENARIOS.find((s) => s.id === selectedScenarioId) || DUMMY_SCENARIOS[0];

  return (
    <section id="scenarios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold uppercase tracking-wider">LIVE EXAMPLE SCENARIOS</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400">ZERO RISK EXPLORATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Explore Live Example Ventures &amp; Dummy Data
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            See exactly how real software ventures operate inside Stage Gate OS. Test live staging sandboxes, inspect
            realistic unit economics, examine sample API responses, and review deterministic stage-gate receipts.
          </p>
        </div>

        {/* Global Explorer Quick CTA */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigate('/launchpad/serial')}
            className="px-4 py-2.5 rounded-lg bg-[#0e1628] hover:bg-[#142038] text-slate-200 border border-slate-700/80 text-xs font-mono font-medium transition-all flex items-center space-x-2"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>OPEN FULL PORTFOLIO COCKPIT</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {DUMMY_SCENARIOS.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;
          return (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenarioId(scenario.id)}
              className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/70 to-[#080d1a] border-indigo-500/80 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                  : 'bg-[#080d19] hover:bg-[#0c1322] border-slate-800/90 text-slate-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                    {scenario.industry.split('/')[0].trim()}
                  </span>
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>${scenario.mrr.toLocaleString()}/mo</span>
                  </span>
                </div>
                <div className="font-bold text-white text-base tracking-tight">{scenario.name}</div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {scenario.tagline}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{scenario.subscribersCount} active seats</span>
                <span className="text-emerald-400 font-semibold">{scenario.gatesPassed}/5 Gates OK</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Interactive Deep-Dive Canvas */}
      <div className="rounded-2xl border border-slate-800 bg-[#080d19] overflow-hidden shadow-2xl">
        {/* Top Banner Bar */}
        <div className="px-6 py-4 bg-[#0a1020] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-md font-mono">
              {currentScenario.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{currentScenario.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  DUMMY_DATA_ACTIVE
                </span>
                <span className="text-slate-500 font-mono text-xs hidden sm:inline">({currentScenario.id})</span>
              </div>
              <p className="text-xs text-slate-400">{currentScenario.tagline}</p>
            </div>
          </div>

          {/* Primary Action Buttons for this Scenario */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-mono flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-950/50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>TEST STAGING SANDBOX</span>
            </button>

            <button
              onClick={() => onNavigate(`/ventures/${currentScenario.id}`)}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-mono font-medium flex items-center space-x-1.5 transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE GATES TELEMETRY</span>
            </button>

            <button
              onClick={() => onNavigate('/grader')}
              className="px-3.5 py-2 rounded-lg bg-[#0e1628] hover:bg-[#142038] border border-indigo-700/40 text-indigo-300 text-xs font-mono font-medium flex items-center space-x-1.5 transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>VIEW IN IDEA GRADER</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800/80 bg-[#060a14] flex items-center space-x-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all font-semibold ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            01. VENTURE ARCHITECTURE &amp; SCOPE
          </button>
          <button
            onClick={() => setActiveTab('economics')}
            className={`py-3 border-b-2 transition-all font-semibold ${
              activeTab === 'economics'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            02. DUMMY UNIT ECONOMICS &amp; P&amp;L
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 border-b-2 transition-all font-semibold ${
              activeTab === 'api'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            03. SYNTHETIC API SPECIFICATION
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 border-b-2 transition-all font-semibold ${
              activeTab === 'telemetry'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            04. STAGE-GATE VERIFICATION AUDIT
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                    TARGET PROBLEM STATEMENT
                  </div>
                  <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-sm text-slate-300 leading-relaxed">
                    {currentScenario.problem}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                    AUTONOMOUS SOLUTION DELIVERED
                  </div>
                  <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-sm text-slate-300 leading-relaxed">
                    {currentScenario.solution}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">Target Segment</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{currentScenario.targetSegment}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">Plan Tier</div>
                    <div className="text-xs font-bold text-indigo-400 mt-1">{currentScenario.planTier} Plan</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">Production Uptime</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 font-mono">{currentScenario.uptime}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">Platform Tax</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 font-mono">0.0% Kept</div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Staging sandbox callout */}
              <div className="p-5 rounded-xl bg-gradient-to-b from-[#0c1428] to-[#080d19] border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-mono text-indigo-300">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold">LIVE STAGING SANDBOX</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Interact With This Venture Now</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Launch a device-frame interactive mockup of <strong className="text-white">{currentScenario.name}</strong>. Test simulated customer onboarding, explore the app interface, and simulate a zero-risk $69.00 Stripe subscription flow.
                  </p>
                  <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
                    URL: {currentScenario.stagingUrl}
                  </div>
                </div>

                <button
                  onClick={() => setPreviewOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>LAUNCH INTERACTIVE PREVIEW</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'economics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#060911] border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">Monthly Recurring Revenue</div>
                  <div className="text-2xl font-bold text-white font-mono mt-1">
                    ${currentScenario.mrr.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                    ${(currentScenario.mrr * 12).toLocaleString()} ARR Run-Rate
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#060911] border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">Gross Profit Margin</div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                    {currentScenario.unitEconomics.grossMargin}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Token COGS: ${currentScenario.cogsPerUser.toFixed(2)}/user
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#060911] border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">LTV / CAC Ratio</div>
                  <div className="text-2xl font-bold text-indigo-300 font-mono mt-1">
                    {(currentScenario.unitEconomics.ltv / currentScenario.unitEconomics.cac).toFixed(1)}x
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    CAC ${currentScenario.unitEconomics.cac} • LTV ${currentScenario.unitEconomics.ltv}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#060911] border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">Payback Period</div>
                  <div className="text-2xl font-bold text-cyan-300 font-mono mt-1">
                    {currentScenario.unitEconomics.paybackMonths} Mo
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono">0.0% Perpetual Revenue Tax</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-slate-300 font-bold flex items-center justify-between">
                  <span>DUMMY P&amp;L BREAKDOWN (30-DAY RUN-RATE)</span>
                  <span className="text-[11px] text-slate-500">SAMPLE SIMULATION</span>
                </div>
                <div className="space-y-2 text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Gross Customer Subscriptions ({currentScenario.subscribersCount} seats)</span>
                    <span className="text-white font-semibold">+${currentScenario.mrr.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Model Routing COGS (5-Tier Dynamic Flash/Sonnet Router)</span>
                    <span className="text-rose-400">-${(currentScenario.subscribersCount * currentScenario.cogsPerUser).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Stage Gate OS Platform Fee (Flat SaaS, no % revenue tax)</span>
                    <span className="text-rose-400">-$69.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Stripe Card Processing Fees (2.9% + 30¢ direct payout)</span>
                    <span className="text-rose-400">-${((currentScenario.mrr * 0.029) + (currentScenario.subscribersCount * 0.30)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-emerald-400 font-bold text-sm bg-emerald-950/20 px-2 rounded">
                    <span>Net Monthly Cash Retained by Founder</span>
                    <span>
                      +${(
                        currentScenario.mrr -
                        (currentScenario.subscribersCount * currentScenario.cogsPerUser) -
                        69.0 -
                        ((currentScenario.mrr * 0.029) + (currentScenario.subscribersCount * 0.30))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    {currentScenario.sampleApiPayload.method}
                  </span>
                  <span className="text-indigo-300 font-semibold">{currentScenario.sampleApiPayload.endpoint}</span>
                </div>
                <span className="text-slate-500 text-[11px]">HTTP 200 OK • Latency: 24ms</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    SAMPLE CLIENT REQUEST PAYLOAD
                  </div>
                  <pre className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-indigo-200 overflow-x-auto text-[11px] leading-relaxed">
                    {JSON.stringify(currentScenario.sampleApiPayload.request, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    SAMPLE AUTONOMOUS RESPONSE
                  </div>
                  <pre className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                    {JSON.stringify(currentScenario.sampleApiPayload.response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-slate-100 font-bold">Deterministic Stage Gate Receipts: 5 of 5 PASSED</div>
                    <div className="text-[11px] text-slate-400">
                      Dual-pushed to user GitHub organization • Cryptographic ECDSA receipt signed
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(`/ventures/${currentScenario.id}`)}
                  className="px-3.5 py-1.5 rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-medium transition-colors self-start sm:self-center"
                >
                  Inspect Full Pipeline Audit →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] text-slate-500">GATE 1</div>
                  <div className="font-bold text-emerald-400">0 TS Errors</div>
                  <div className="text-[10px] text-slate-400">AST &lt; 250KB</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] text-slate-500">GATE 2</div>
                  <div className="font-bold text-emerald-400">18ms p95</div>
                  <div className="text-[10px] text-slate-400">15/15 Probes</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] text-slate-500">GATE 3</div>
                  <div className="font-bold text-emerald-400">4/4 Quorum</div>
                  <div className="text-[10px] text-slate-400">Quad-DoH Anycast</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] text-slate-500">GATE 4</div>
                  <div className="font-bold text-emerald-400">+30d Clock</div>
                  <div className="text-[10px] text-slate-400">Mutex Lock OK</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] text-slate-500">GATE 5</div>
                  <div className="font-bold text-emerald-400">100% Dual-Push</div>
                  <div className="text-[10px] text-slate-400">0 Lock-In</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Staging Preview Modal for Live Exploration */}
      <StagingPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        stagingUrl={currentScenario.stagingUrl}
        ventureName={currentScenario.name}
        gateStatus="PASSED"
      />
    </section>
  );
};
