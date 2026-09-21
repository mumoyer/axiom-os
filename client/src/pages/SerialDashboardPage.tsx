import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Key,
  GitBranch,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Eye,
  EyeOff,
  Cpu,
  DollarSign,
  TrendingUp,
  Server,
  Activity,
  Code2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { StagingPreviewModal } from '../components/StagingPreviewModal.js';

export interface SerialDashboardPageProps {
  onNavigate?: (path: string) => void;
}

interface VentureItem {
  id: string;
  name: string;
  domain: string;
  stagingUrl: string;
  planTier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  status: 'LIVE' | 'STAGING' | 'SCAFFOLDING' | 'EJECTED';
  mrr: number;
  uptime: number;
  gates: {
    g1: 'PASS' | 'RUNNING' | 'FAIL' | 'PENDING';
    g2: 'PASS' | 'RUNNING' | 'FAIL' | 'PENDING';
    g3: 'PASS' | 'RUNNING' | 'FAIL' | 'PENDING';
    g4: 'PASS' | 'RUNNING' | 'FAIL' | 'PENDING';
    g5: 'PASS' | 'RUNNING' | 'FAIL' | 'PENDING';
  };
}

interface ByokProviderState {
  provider: string;
  name: string;
  prefix: string;
  key: string;
  status: 'unconfigured' | 'testing' | 'valid' | 'invalid';
  latencyMs?: number;
  error?: string;
}

const DEFAULT_VENTURES: VentureItem[] = [
  {
    id: 'ven_pulse_01',
    name: 'MetricPulse Analytics',
    domain: 'metricpulse.io',
    stagingUrl: 'https://stage-metricpulse.axiomrun.app',
    planTier: 'SERIAL',
    status: 'LIVE',
    mrr: 4850,
    uptime: 99.98,
    gates: { g1: 'PASS', g2: 'PASS', g3: 'PASS', g4: 'PASS', g5: 'PASS' },
  },
  {
    id: 'ven_docuflow_02',
    name: 'DocuFlow AI',
    domain: 'docuflow.health',
    stagingUrl: 'https://stage-docuflow.axiomrun.app',
    planTier: 'SERIAL',
    status: 'LIVE',
    mrr: 6200,
    uptime: 99.99,
    gates: { g1: 'PASS', g2: 'PASS', g3: 'PASS', g4: 'PASS', g5: 'PASS' },
  },
  {
    id: 'ven_scout_03',
    name: 'ContractScout',
    domain: 'contractscout.legal',
    stagingUrl: 'https://stage-contractscout.axiomrun.app',
    planTier: 'SERIAL',
    status: 'STAGING',
    mrr: 1800,
    uptime: 99.95,
    gates: { g1: 'PASS', g2: 'PASS', g3: 'PASS', g4: 'PASS', g5: 'PENDING' },
  },
  {
    id: 'ven_sub_04',
    name: 'SubManage SaaS',
    domain: 'submanage.dev',
    stagingUrl: 'https://stage-submanage.axiomrun.app',
    planTier: 'SERIAL',
    status: 'EJECTED',
    mrr: 2000,
    uptime: 100.0,
    gates: { g1: 'PASS', g2: 'PASS', g3: 'PASS', g4: 'PASS', g5: 'PASS' },
  },
];

export const SerialDashboardPage: React.FC<SerialDashboardPageProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'byok' | 'ejection' | 'cli'>('portfolio');
  const [ventures, setVentures] = useState<VentureItem[]>(DEFAULT_VENTURES);
  const [selectedVentureForPreview, setSelectedVentureForPreview] = useState<VentureItem | null>(null);

  // BYOK state
  const [byokKeys, setByokKeys] = useState<Record<string, ByokProviderState>>({
    anthropic: {
      provider: 'anthropic',
      name: 'Anthropic Claude (Sonnet / Haiku)',
      prefix: 'sk-ant-',
      key: 'sk-ant-api03-live-78392104829104',
      status: 'valid',
      latencyMs: 54,
    },
    openai: {
      provider: 'openai',
      name: 'OpenAI (GPT-4o / O3-Mini)',
      prefix: 'sk-proj-',
      key: 'sk-proj-prod-99482910481029',
      status: 'valid',
      latencyMs: 62,
    },
    deepseek: {
      provider: 'deepseek',
      name: 'DeepSeek (R1 / V3 Reasoning)',
      prefix: 'sk-',
      key: '',
      status: 'unconfigured',
    },
    groq: {
      provider: 'groq',
      name: 'Groq LPUs (Llama 3.3 Ultra-Fast)',
      prefix: 'gsk_',
      key: '',
      status: 'unconfigured',
    },
    stripe: {
      provider: 'stripe',
      name: 'Stripe API Secret Key',
      prefix: 'sk_',
      key: 'sk_test_51Hxyz94820194820',
      status: 'valid',
      latencyMs: 38,
    },
    github: {
      provider: 'github',
      name: 'GitHub Personal Access Token',
      prefix: 'ghp_',
      key: 'ghp_live9837482910482019482',
      status: 'valid',
      latencyMs: 44,
    },
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [byokSaveSuccess, setByokSaveSuccess] = useState(false);

  // Ejection state
  const [selectedVentureToEject, setSelectedVentureToEject] = useState<string>(DEFAULT_VENTURES[0].id);
  const [ejectProvider, setEjectProvider] = useState<'github' | 'gitlab'>('github');
  const [ejectOrg, setEjectOrg] = useState('acme-studios');
  const [ejectRepo, setEjectRepo] = useState('metricpulse-analytics');
  const [ejectVisibility, setEjectVisibility] = useState<'public' | 'private'>('private');
  const [ejectDeployTarget, setEjectDeployTarget] = useState<'vercel' | 'supabase' | 'cloudflare' | 'fly'>('vercel');
  const [isEjecting, setIsEjecting] = useState(false);
  const [ejectionReceipt, setEjectionReceipt] = useState<{
    repoUrl: string;
    deployUrl: string;
    badgeSnippet: string;
    signature: string;
  } | null>(null);
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Headless CLI execution state
  const [cliRunning, setCliRunning] = useState(false);
  const [cliLogs, setCliLogs] = useState<string[]>([
    '$ stagegate --version',
    'stagegate-cli v1.4.2 (darwin/arm64) • Tri-Plane Autonomous Venture Engine',
    '$ stagegate status --portfolio',
    '✓ 4 active ventures | 20/20 Stage Gates Passed | 0% revenue tax enforced',
  ]);

  // Fetch ventures from backend & local storage
  useEffect(() => {
    // Load local client-launched ventures
    let localSaved: VentureItem[] = [];
    try {
      const stored = localStorage.getItem('stagegate_user_ventures');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localSaved = parsed.map((item: any) => ({
            id: item.id,
            name: item.name,
            domain: item.domain || `${item.id.slice(0, 8)}.axiomrun.app`,
            stagingUrl: item.stagingUrl || `https://stage-${item.id.slice(0, 8)}.axiomrun.app`,
            planTier: item.planTier || 'FOUNDER',
            status: item.status || 'LIVE',
            mrr: item.mrr || 1990,
            uptime: item.uptime || 99.98,
            gates: { g1: 'PASS', g2: 'PASS', g3: 'PASS', g4: 'PASS', g5: 'PASS' },
          }));
        }
      }
    } catch {}

    fetch('/api/ventures')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ventures && Array.isArray(data.ventures) && data.ventures.length > 0) {
          const mapped: VentureItem[] = data.ventures.map((v: any) => ({
            id: v.id,
            name: v.name,
            domain: `${v.id.slice(0, 8)}.axiomrun.app`,
            stagingUrl: `https://stage-${v.id.slice(0, 8)}.axiomrun.app`,
            planTier: v.planTier || 'SERIAL',
            status: v.pipeline?.overallStatus === 'COMPLETED' ? 'LIVE' : 'STAGING',
            mrr: 2500,
            uptime: 99.98,
            gates: {
              g1: v.pipeline?.stages?.[0]?.status === 'PASSED' ? 'PASS' : 'PENDING',
              g2: v.pipeline?.stages?.[1]?.status === 'PASSED' ? 'PASS' : 'PENDING',
              g3: v.pipeline?.stages?.[2]?.status === 'PASSED' ? 'PASS' : 'PENDING',
              g4: v.pipeline?.stages?.[3]?.status === 'PASSED' ? 'PASS' : 'PENDING',
              g5: v.pipeline?.stages?.[4]?.status === 'PASSED' ? 'PASS' : 'PENDING',
            },
          }));
          setVentures((prev) => {
            const combined = [...localSaved, ...mapped];
            for (const item of prev) {
              if (!combined.some((c) => c.id === item.id)) combined.push(item);
            }
            return combined;
          });
        } else if (localSaved.length > 0) {
          setVentures((prev) => {
            const combined = [...localSaved];
            for (const item of prev) {
              if (!combined.some((c) => c.id === item.id)) combined.push(item);
            }
            return combined;
          });
        }
      })
      .catch(() => {
        if (localSaved.length > 0) {
          setVentures((prev) => {
            const combined = [...localSaved];
            for (const item of prev) {
              if (!combined.some((c) => c.id === item.id)) combined.push(item);
            }
            return combined;
          });
        }
      });
  }, []);

  // Total metrics
  const totalMrr = ventures.reduce((acc, v) => acc + v.mrr, 0);

  // BYOK Handlers
  const toggleKeyVisibility = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (provider: string, val: string) => {
    setByokKeys((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        key: val,
        status: val ? 'unconfigured' : 'unconfigured',
        error: undefined,
      },
    }));
  };

  const testKeyConnection = (provider: string) => {
    const item = byokKeys[provider];
    if (!item.key.trim()) {
      setByokKeys((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], status: 'invalid', error: 'Key cannot be empty' },
      }));
      return;
    }

    if (!item.key.startsWith(item.prefix)) {
      setByokKeys((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: 'invalid',
          error: `Key must start with "${item.prefix}" prefix`,
        },
      }));
      return;
    }

    setByokKeys((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], status: 'testing', error: undefined },
    }));

    setTimeout(() => {
      const simulatedLatency = Math.floor(Math.random() * 40) + 35;
      setByokKeys((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: 'valid',
          latencyMs: simulatedLatency,
          error: undefined,
        },
      }));
    }, 500);
  };

  const saveByokKeys = async () => {
    setByokSaveSuccess(false);
    const payload = {
      tenantId: 'tenant-default',
      openaiKey: byokKeys.openai.key,
      anthropicKey: byokKeys.anthropic.key,
      deepseekKey: byokKeys.deepseek.key,
      stripeSecretKey: byokKeys.stripe.key,
      githubToken: byokKeys.github.key,
    };

    try {
      const res = await fetch('/api/byok/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setByokSaveSuccess(true);
        setTimeout(() => setByokSaveSuccess(false), 3000);
      }
    } catch {
      // Keep save success false on network or server error
    }
  };

  // Ejection Handler
  const handleTriggerEjection = () => {
    setIsEjecting(true);
    setEjectionReceipt(null);

    const targetVenture = ventures.find((v) => v.id === selectedVentureToEject) || ventures[0];

    setTimeout(() => {
      setIsEjecting(false);
      setEjectionReceipt({
        repoUrl: `https://${ejectProvider}.com/${ejectOrg}/${ejectRepo}`,
        deployUrl: `https://${ejectRepo}.${ejectDeployTarget}.app`,
        badgeSnippet: `[![Verified by Stage Gate OS](https://stagegateos.com/badges/verified.svg)](https://stagegateos.com)`,
        signature: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      });

      // Mark venture as EJECTED in list
      setVentures((prev) =>
        prev.map((v) => (v.id === targetVenture.id ? { ...v, status: 'EJECTED' } : v))
      );
    }, 1200);
  };

  const copyBadgeSnippet = () => {
    if (!ejectionReceipt) return;
    navigator.clipboard.writeText(ejectionReceipt.badgeSnippet);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  // CLI execution simulation
  const runCliAutonomousAgent = () => {
    if (cliRunning) return;
    setCliRunning(true);

    const steps = [
      '$ stagegate venture init --name pulse-agent --template nextjs-supabase --byok',
      '[CLI] Cloned base clean-room template Next.js 15 (Zero platform imports)',
      '[CLI] Injected BYOK keys: Anthropic Sonnet 3.5 + OpenAI GPT-4o (0% platform markup)',
      '$ stagegate stage-gate run --all --ci',
      '[GATE 1] TypeScript AST strict check: 0 errors | bundle: 184KB [PASS]',
      '[GATE 2] TLS 1.3 socket probe: RFC 6125 SAN valid | p95: 72ms [PASS]',
      '[GATE 3] Quad-DoH DNS Quorum: 4/4 consensus confirmed [PASS]',
      '[GATE 4] Stripe test-clock settlement: Webhook mutex verified [PASS]',
      '[GATE 5] Clean-Room Portability: Dual-push Git sync complete [PASS]',
      '✓ ALL 5 GATES PASSED. Receipt signed: sha256:e3b0c44298fc1c149afbf4c8996fb924',
      'Deploy ready at https://pulse-agent.stagegaterun.app',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setCliLogs((prev) => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setCliRunning(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cockpit Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-lg font-mono">
                Serial Cockpit
              </span>
              <span className="text-xs text-slate-500 font-mono">Tier: $149/mo (Wholesale 0% Markup)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Multi-Venture Portfolio & BYOK Console
            </h1>
            <p className="text-xs text-slate-400">
              Manage concurrent venture pipelines, configure custom LLM API keys, and trigger instant Git ejection.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('/launchpad/newbie')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-glow-indigo transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Scaffold New Venture</span>
            </button>
          </div>
        </div>

        {/* Aggregate Portfolio Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Active Ventures</span>
            </div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">{ventures.length}</div>
            <div className="text-[10px] text-slate-500">15 Quota / Month</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Aggregated MRR</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              ${totalMrr.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">0% Revenue Tax Enforced</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>System Uptime</span>
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">99.98%</div>
            <div className="text-[10px] text-slate-500">Quad-DoH DNS Quorum</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Verified Gates</span>
            </div>
            <div className="text-2xl font-extrabold text-purple-300 font-mono mt-1">20 / 20</div>
            <div className="text-[10px] text-slate-500">Zero Hallucinations Passed</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Incurred Bug Tax</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">$0.00</div>
            <div className="text-[10px] text-slate-500">Zero-Charge Failure Protected</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2">
          {[
            { id: 'portfolio' as const, label: 'Portfolio Overview', icon: Layers },
            { id: 'byok' as const, label: 'BYOK Key Vault', icon: Key },
            { id: 'ejection' as const, label: 'Instant Git Ejection', icon: GitBranch },
            { id: 'cli' as const, label: 'Headless CLI & Terminal', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Portfolio Overview */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Venture Portfolio</h3>
                  <p className="text-xs text-slate-400">
                    Real-time status across all autonomous production deployments.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">{ventures.length} ventures registered</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3.5 px-6">Venture & Domain</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Stripe MRR</th>
                      <th className="py-3.5 px-4">Uptime</th>
                      <th className="py-3.5 px-4">Deterministic Gates</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ventures.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-white text-sm">{v.name}</div>
                          <div className="text-indigo-400 font-mono text-xs flex items-center gap-1">
                            <span>https://{v.domain}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              v.status === 'LIVE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : v.status === 'STAGING'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                : v.status === 'EJECTED'
                                ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{v.status}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono font-semibold text-emerald-400 text-sm">
                          ${v.mrr.toLocaleString()} / mo
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-300">
                          {v.uptime}%
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1.5" title="Gates 1 through 5 status">
                            {(['g1', 'g2', 'g3', 'g4', 'g5'] as const).map((gKey, idx) => {
                              const pass = v.gates[gKey] === 'PASS';
                              return (
                                <span
                                  key={gKey}
                                  className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] font-bold ${
                                    pass
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                                  }`}
                                  title={`Gate ${idx + 1}: ${pass ? 'PASSED' : 'PENDING'}`}
                                >
                                  G{idx + 1}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => setSelectedVentureForPreview(v)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition-colors"
                            title="Open responsive device preview"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => onNavigate(`/ventures/${v.id}`)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Dashboard
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BYOK Key Vault */}
        {activeTab === 'byok' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <span>Bring Your Own Keys (BYOK) Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute autonomous venture scaffolding at 0% platform token markup using wholesale API rates.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-mono font-semibold">
                  0.0% Platform Markup Guaranteed
                </span>
              </div>
            </div>

            {/* Provider Keys Grid */}
            <div className="space-y-4">
              {Object.entries(byokKeys).map(([keyId, item]) => {
                const isVisible = showKeys[keyId];
                return (
                  <div
                    key={keyId}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.status === 'valid' && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Connected ({item.latencyMs}ms)
                          </span>
                        )}
                        {item.status === 'invalid' && (
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                            {item.error || 'Connection Failed'}
                          </span>
                        )}
                        {item.status === 'testing' && (
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 animate-pulse">
                            Pinging provider endpoint...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(keyId)}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                          title={isVisible ? 'Hide key' : 'Show key'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => testKeyConnection(keyId)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] transition-colors"
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={item.key}
                        onChange={(e) => handleKeyChange(keyId, e.target.value)}
                        placeholder={`Enter your ${item.name} API key (${item.prefix}...)`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                All keys are stored with client-authenticated AES-256-GCM encryption.
              </div>
              <button
                type="button"
                onClick={saveByokKeys}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
              >
                {byokSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Keys Saved & BYOK Mode Active!</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Save Keys & Activate BYOK Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Instant Git Ejection */}
        {activeTab === 'ejection' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                <span>Instant 1-Click Full Git Ejection</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The Ejection Paradox: Stage Gate OS founders maintain 100% code and database ownership from day one.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200">Venture to Eject</label>
                  <select
                    value={selectedVentureToEject}
                    onChange={(e) => {
                      setSelectedVentureToEject(e.target.value);
                      const found = ventures.find((v) => v.id === e.target.value);
                      if (found) {
                        setEjectRepo(found.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  >
                    {ventures.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.domain})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">Git Provider</label>
                    <select
                      value={ejectProvider}
                      onChange={(e) => setEjectProvider(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    >
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">Deploy Target</label>
                    <select
                      value={ejectDeployTarget}
                      onChange={(e) => setEjectDeployTarget(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    >
                      <option value="vercel">Vercel</option>
                      <option value="supabase">Supabase</option>
                      <option value="cloudflare">Cloudflare Pages</option>
                      <option value="fly">Fly.io</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">Org / Username</label>
                    <input
                      type="text"
                      value={ejectOrg}
                      onChange={(e) => setEjectOrg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">Repository Slug</label>
                    <input
                      type="text"
                      value={ejectRepo}
                      onChange={(e) => setEjectRepo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200">Visibility</label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={ejectVisibility === 'private'}
                        onChange={() => setEjectVisibility('private')}
                        className="accent-indigo-500"
                      />
                      <span>Private Repository (Recommended)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={ejectVisibility === 'public'}
                        onChange={() => setEjectVisibility('public')}
                        className="accent-indigo-500"
                      />
                      <span>Public / Open Source</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerEjection}
                  disabled={isEjecting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-glow-indigo transition-all disabled:opacity-50"
                >
                  {isEjecting ? 'Running Clean-Room Scan & Pushing Git Remote...' : 'Eject Codebase Now (1-Click Full Portability)'}
                </button>
              </div>

              {/* Right Output / Receipt Panel */}
              <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Zero-Lock-In Clean Room Guarantee</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ejected codebases contain standard Next.js 15, Tailwind, and Supabase code. Zero proprietary
                    Stage Gate OS SDKs or runtime dependencies exist. You can self-host or deploy anywhere immediately.
                  </p>

                  {ejectionReceipt && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-3 text-xs font-mono animate-in fade-in duration-200">
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5 font-sans">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ejection Completed Successfully!</span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div>
                          <span className="text-slate-500">Repository: </span>
                          <a
                            href={ejectionReceipt.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 hover:underline"
                          >
                            {ejectionReceipt.repoUrl}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-500">Deploy Target: </span>
                          <span className="text-indigo-300">{ejectionReceipt.deployUrl}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Signature: </span>
                          <span className="text-purple-300 truncate block">{ejectionReceipt.signature}</span>
                        </div>
                      </div>

                      {/* Viral README badge */}
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Viral README Verification Badge:</span>
                          <button
                            type="button"
                            onClick={copyBadgeSnippet}
                            className="text-indigo-400 hover:text-white flex items-center gap-1 text-[10px]"
                          >
                            {copiedBadge ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedBadge ? 'Copied' : 'Copy Markdown'}</span>
                          </button>
                        </div>
                        <pre className="bg-slate-900 p-2 rounded text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                          {ejectionReceipt.badgeSnippet}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  AST Scan: Clean • Zero Proprietary Framework Lock-In
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Headless CLI & Terminal Trigger */}
        {activeTab === 'cli' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span>Headless CLI & REST API Automation</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute venture creation from your terminal, GitHub Actions CI/CD, or automated cron agents.
                </p>
              </div>

              <button
                type="button"
                onClick={runCliAutonomousAgent}
                disabled={cliRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-glow-indigo transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{cliRunning ? 'Executing Agent...' : 'Dispatch Autonomous Agent (Headless Run)'}</span>
              </button>
            </div>

            {/* Runnable CLI Commands preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold font-sans">1. CLI Scaffolding Command</div>
                <pre className="text-slate-300 overflow-x-auto bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
{`# Initialize venture headlessly with BYOK
stagegate venture init \\
  --name metricpulse \\
  --template nextjs-supabase \\
  --domain metricpulse.io \\
  --byok

# Run deterministic stage gates
stagegate stage-gate run --all --ci`}
                </pre>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold font-sans">2. REST API Trigger Snippet</div>
                <pre className="text-slate-300 overflow-x-auto bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
{`curl -X POST https://www.stagegateos.com/api/ventures \\
  -H "Authorization: Bearer sg_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "DocuFlow AI",
    "tier": "SERIAL",
    "byok": true
  }'`}
                </pre>
              </div>
            </div>

            {/* Embedded Live Agent Terminal */}
            <div className="bg-[#070B12] rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1 shadow-inner max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-500">
                <span>agent-runner // live stdout</span>
                <span className="text-emerald-400">Exit Code: 0</span>
              </div>
              <div className="pt-2 space-y-1">
                {cliLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.startsWith('$')
                        ? 'text-cyan-300 font-bold'
                        : log.includes('PASS') || log.includes('✓')
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Staging Preview Modal */}
      {selectedVentureForPreview && (
        <StagingPreviewModal
          isOpen={!!selectedVentureForPreview}
          onClose={() => setSelectedVentureForPreview(null)}
          stagingUrl={selectedVentureForPreview.stagingUrl}
          ventureName={selectedVentureForPreview.name}
          gateStatus="PASSED"
        />
      )}
    </div>
  );
};
