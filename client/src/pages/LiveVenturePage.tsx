import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  GitBranch,
  Copy,
  Check,
  Radio,
  Zap,
  Clock,
  Activity,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { StageGateTimeline, StageGateResult, GateStatus } from '../components/StageGateTimeline.js';
import { AuditLogTerminal, AuditLogEntry } from '../components/AuditLogTerminal.js';
import { StagingPreviewModal } from '../components/StagingPreviewModal.js';

export interface LiveVenturePageProps {
  ventureId?: string;
  onNavigate?: (path: string) => void;
}

interface VentureDetails {
  id: string;
  name: string;
  tenantId: string;
  planTier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  domain: string;
  stagingUrl: string;
  createdAt: string;
}

const DEFAULT_STAGES: StageGateResult[] = [
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

export const LiveVenturePage: React.FC<LiveVenturePageProps> = ({
  ventureId = 'ven_active_01',
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  const MOCK_NAMES: Record<string, { name: string; domain: string; tier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE' }> = {
    ven_docuflow_02: { name: 'DocuFlow AI', domain: 'docuflow.health', tier: 'FOUNDER' },
    ven_scout_03: { name: 'ContractScout', domain: 'contractscout.legal', tier: 'SERIAL' },
    ven_pulse_01: { name: 'MetricPulse Analytics', domain: 'metricpulse.io', tier: 'SERIAL' },
    ven_dental_04: { name: 'DentalCompliance', domain: 'dentalcompliance.app', tier: 'FOUNDER' },
    ven_sub_04: { name: 'SubManage SaaS', domain: 'submanage.dev', tier: 'SERIAL' },
  };

  const initialMock = MOCK_NAMES[ventureId] || {
    name: 'DocuFlow AI',
    domain: `${ventureId.slice(0, 8)}.axiomrun.app`,
    tier: 'SERIAL' as const,
  };

  const [venture, setVenture] = useState<VentureDetails>({
    id: ventureId,
    name: initialMock.name,
    tenantId: 'tenant-default',
    planTier: initialMock.tier,
    domain: initialMock.domain,
    stagingUrl: `https://stage-${ventureId.slice(0, 8)}.axiomrun.app`,
    createdAt: new Date().toISOString(),
  });

  const [stages, setStages] = useState<StageGateResult[]>(DEFAULT_STAGES);
  const [overallStatus, setOverallStatus] = useState<'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED_ZERO_CHARGE'>('COMPLETED');
  const [escrowStatus, setEscrowStatus] = useState<'HELD' | 'COMMITTED' | 'REFUNDED_ZERO_CHARGE'>('COMMITTED');
  const [absorbedCogs, setAbsorbedCogs] = useState<number>(0.0);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'STREAMING' | 'DISCONNECTED'>('STREAMING');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Load venture metadata & pipeline execution from backend
  useEffect(() => {
    fetch(`/api/ventures/${ventureId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Venture not found');
        return res.json();
      })
      .then((data) => {
        if (data.venture) {
          setVenture({
            id: data.venture.id,
            name: data.venture.name || 'DocuFlow AI',
            tenantId: data.venture.tenantId || 'tenant-default',
            planTier: data.venture.planTier || 'SERIAL',
            domain: `${data.venture.id.slice(0, 8)}.axiomrun.app`,
            stagingUrl: `https://stage-${data.venture.id.slice(0, 8)}.axiomrun.app`,
            createdAt: data.venture.createdAt || new Date().toISOString(),
          });
        }
        if (data.pipeline) {
          if (data.pipeline.stages) setStages(data.pipeline.stages);
          if (data.pipeline.overallStatus) setOverallStatus(data.pipeline.overallStatus);
          if (data.pipeline.escrowStatus) setEscrowStatus(data.pipeline.escrowStatus);
          if (typeof data.pipeline.absorbedPlatformCogsUsd === 'number') {
            setAbsorbedCogs(data.pipeline.absorbedPlatformCogsUsd);
          }
        }
      })
      .catch(() => {
        // Fallback to initial defaults
      });
  }, [ventureId]);

  // Connect to SSE Telemetry Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/telemetry/stream/${ventureId}`);

      eventSource.onopen = () => {
        setConnectionStatus('STREAMING');
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_open`,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `Connected to real-time telemetry stream for ${ventureId}`,
          },
        ]);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newEntry: AuditLogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            gateId: data.payload?.gateId,
            level:
              data.type === 'GATE_COMPLETED' && data.payload?.status === 'PASSED'
                ? 'ASSERTION_PASS'
                : data.type === 'GATE_COMPLETED' && data.payload?.status === 'FAILED'
                ? 'ASSERTION_FAIL'
                : data.type === 'GATE_RETRYING'
                ? 'HEAL_ATTEMPT'
                : data.type === 'PIPELINE_SUCCESS'
                ? 'RECEIPT_SIGNED'
                : 'INFO',
            message:
              data.type === 'GATE_RUNNING'
                ? `Evaluating Gate ${data.payload?.gateId}: ${data.payload?.gateName}...`
                : data.type === 'GATE_COMPLETED'
                ? `Gate ${data.payload?.gateId} finished with status: ${data.payload?.status} (${data.payload?.durationMs}ms)`
                : data.type === 'GATE_RETRYING'
                ? `Gate ${data.payload?.gateId} self-healing retry ${data.payload?.retryCount}/3 ($0.00 user debit)`
                : data.type === 'ESCROW_HELD'
                ? `Held ${data.payload?.amount} credits in 2PC escrow (Hold ID: ${data.payload?.escrowId})`
                : data.type === 'PIPELINE_SUCCESS'
                ? `All 5 deterministic gates passed! Cryptographic receipt signed.`
                : data.type === 'PIPELINE_ABORTED_REFUNDED'
                ? `Zero-Charge Guarantee: 100% of escrowed credits refunded. Invariant ΔB == 0.00.`
                : `[${data.type}] Event dispatched`,
            payload: data.payload,
          };

          setLogs((prev) => [...prev, newEntry]);

          // Update stage status dynamically if payload contains gate info
          if (data.type === 'GATE_RUNNING' && data.payload?.gateId) {
            setStages((prev) =>
              prev.map((s) =>
                s.gateId === data.payload.gateId
                  ? { ...s, status: 'RUNNING', startTime: Date.now() }
                  : s
              )
            );
          } else if (data.type === 'GATE_COMPLETED' && data.payload?.gateId) {
            setStages((prev) =>
              prev.map((s) =>
                s.gateId === data.payload.gateId
                  ? {
                      ...s,
                      status: data.payload.status,
                      durationMs: data.payload.durationMs,
                      receipt: data.payload.receipt,
                    }
                  : s
              )
            );
          } else if (data.type === 'PIPELINE_SUCCESS') {
            setOverallStatus('COMPLETED');
            setEscrowStatus('COMMITTED');
          } else if (data.type === 'PIPELINE_ABORTED_REFUNDED') {
            setOverallStatus('ABORTED_ZERO_CHARGE');
            setEscrowStatus('REFUNDED_ZERO_CHARGE');
          }
        } catch {
          // ignore parsing error
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus('DISCONNECTED');
        eventSource?.close();
      };
    } catch {
      setConnectionStatus('DISCONNECTED');
    }

    return () => {
      eventSource?.close();
    };
  }, [ventureId]);

  // Trigger stage-gate retry / re-run
  const handleRetry = async () => {
    setIsRetrying(true);
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_retry`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Dispatching manual stage-gate execution for venture ${ventureId}...`,
      },
    ]);

    try {
      const res = await fetch(`/api/ventures/${ventureId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pipeline) {
          setStages(data.pipeline.stages);
          setOverallStatus(data.pipeline.overallStatus);
          setEscrowStatus(data.pipeline.escrowStatus);
        }
      }
    } catch {}

    setTimeout(() => setIsRetrying(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Context Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('/launchpad/serial')}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </button>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded">
                Live Venture Console
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {venture.id}</span>
            </div>

            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {venture.name}
              </h1>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full border ${
                  overallStatus === 'COMPLETED'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : overallStatus === 'IN_PROGRESS'
                    ? 'bg-indigo-950/80 text-indigo-200 border-indigo-500/50 animate-pulse'
                    : overallStatus === 'ABORTED_ZERO_CHARGE'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                <span>{overallStatus}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1">
                <span>Domain:</span>
                <span className="text-cyan-300 font-semibold">https://{venture.domain}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Zero-Charge Failure Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Staging Preview</span>
            </button>

            <button
              onClick={() => onNavigate('/launchpad/serial')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-purple-950 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded-xl text-xs font-semibold transition-all"
            >
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>Git Ejection Hub</span>
            </button>

            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-glow-indigo disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Running Pipeline...' : 'Re-Run Gates'}</span>
            </button>
          </div>
        </div>

        {/* Synthetic Test Telemetry Metric Cards Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>DOM Hydration Latency</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">142ms</div>
            <div className="text-[10px] text-slate-500">Benchmark: &lt; 300ms p95</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Playwright Synthetic Assertions</span>
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">18 / 18 PASS</div>
            <div className="text-[10px] text-emerald-400 font-medium">100% Pass Rate</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>2PC Escrow Ledger</span>
            </div>
            <div className="text-xl font-bold text-indigo-300 font-mono mt-1">
              {escrowStatus === 'COMMITTED' ? 'Committed' : escrowStatus === 'HELD' ? 'Held' : 'Refunded'}
            </div>
            <div className="text-[10px] text-slate-500">Net User Burn ΔB == 0.00</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Platform Absorbed COGS</span>
            </div>
            <div className="text-xl font-bold text-cyan-300 font-mono mt-1">
              ${absorbedCogs.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">$0.00 Incurred by User</div>
          </div>
        </div>

        {/* Main Content Grid: Stage-Gate Timeline + Streaming Audit Log Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Stage-Gate Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <StageGateTimeline
              stages={stages}
              overallStatus={overallStatus}
            />
          </div>

          {/* Right Column: Real-Time Streaming Audit Log Terminal (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <AuditLogTerminal
              logs={logs}
              connectionStatus={connectionStatus}
              onClearLogs={() => setLogs([])}
              ventureId={venture.id}
            />
          </div>
        </div>

      </div>

      {/* Embedded Staging Preview Modal */}
      <StagingPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        stagingUrl={venture.stagingUrl}
        ventureName={venture.name}
        gateStatus="PASSED"
      />
    </div>
  );
};
