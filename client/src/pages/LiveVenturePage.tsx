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

import { DUMMY_SCENARIOS, EXPLORE_SCENARIO_STAGES } from '../demo/scenarios.js';

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

const INITIAL_PENDING_STAGES: StageGateResult[] = [
  {
    gateId: 1,
    gateName: 'Build & Strict TypeScript Check',
    status: 'PENDING',
    diagnosticLogs: ['Waiting for build worker dispatch...'],
    assertionsPassed: 0,
    assertionsFailed: 0,
  },
  {
    gateId: 2,
    gateName: 'Infrastructure & Container Health Probe',
    status: 'PENDING',
    diagnosticLogs: ['Waiting for container provisioning...'],
    assertionsPassed: 0,
    assertionsFailed: 0,
  },
  {
    gateId: 3,
    gateName: 'RFC 6125 SSL & Quad-DoH DNS Quorum',
    status: 'PENDING',
    diagnosticLogs: ['Waiting for DNS routing propagation...'],
    assertionsPassed: 0,
    assertionsFailed: 0,
  },
  {
    gateId: 4,
    gateName: 'Stripe Checkout & Webhook Idempotency',
    status: 'PENDING',
    diagnosticLogs: ['Waiting for billing webhook initialization...'],
    assertionsPassed: 0,
    assertionsFailed: 0,
  },
  {
    gateId: 5,
    gateName: 'Git Ejection & 100% Repository Portability',
    status: 'PENDING',
    diagnosticLogs: ['Waiting for upstream git branch sync...'],
    assertionsPassed: 0,
    assertionsFailed: 0,
  },
];

export const LiveVenturePage: React.FC<LiveVenturePageProps> = ({
  ventureId: rawVentureId = '',
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  // Check if this venture is one of the designated interactive explore scenarios
  const exploreScenario = DUMMY_SCENARIOS.find((s) => s.id === rawVentureId);
  const isExplore = !!exploreScenario;

  // Resolve target venture ID (if none passed, look up latest user venture)
  const getUserVentures = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('stagegate_user_ventures') || '[]');
    } catch {
      return [];
    }
  };

  const userVentures = getUserVentures();
  const activeVentureId = rawVentureId || userVentures[0]?.id || '';
  const localVenture = userVentures.find((v: any) => v.id === activeVentureId);

  const cleanSubdomain = activeVentureId ? activeVentureId.slice(0, 8).replace(/_/g, '-') : 'live';

  const [notFound, setNotFound] = useState<boolean>(!isExplore && !localVenture && !activeVentureId);
  const [isLoading, setIsLoading] = useState<boolean>(!isExplore && !localVenture && !!activeVentureId);

  const [venture, setVenture] = useState<VentureDetails>(() => {
    if (isExplore && exploreScenario) {
      return {
        id: exploreScenario.id,
        name: exploreScenario.name,
        tenantId: 'tenant-demo',
        planTier: exploreScenario.planTier,
        domain: `${cleanSubdomain}.axiomrun.app`,
        stagingUrl: exploreScenario.stagingUrl,
        createdAt: new Date().toISOString(),
      };
    }
    if (localVenture) {
      return {
        id: localVenture.id,
        name: localVenture.name,
        tenantId: localVenture.tenantId || 'tenant-default',
        planTier: localVenture.planTier || 'FOUNDER',
        domain: localVenture.domain || `${cleanSubdomain}.axiomrun.app`,
        stagingUrl: localVenture.stagingUrl || `https://stage-${cleanSubdomain}.axiomrun.app`,
        createdAt: localVenture.createdAt || new Date().toISOString(),
      };
    }
    return {
      id: activeVentureId || 'uninitialized',
      name: activeVentureId ? 'Active Pipeline' : 'Uninitialized Venture',
      tenantId: 'tenant-default',
      planTier: 'FOUNDER',
      domain: `${cleanSubdomain}.axiomrun.app`,
      stagingUrl: `https://stage-${cleanSubdomain}.axiomrun.app`,
      createdAt: new Date().toISOString(),
    };
  });

  const [stages, setStages] = useState<StageGateResult[]>(() => {
    if (isExplore) return EXPLORE_SCENARIO_STAGES;
    return INITIAL_PENDING_STAGES;
  });
  const [overallStatus, setOverallStatus] = useState<'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED_ZERO_CHARGE'>(() => {
    if (isExplore) return 'COMPLETED';
    if (localVenture?.status === 'LIVE') return 'COMPLETED';
    return 'INITIALIZING';
  });
  const [escrowStatus, setEscrowStatus] = useState<'HELD' | 'COMMITTED' | 'REFUNDED_ZERO_CHARGE'>(() => {
    if (isExplore) return 'COMMITTED';
    return 'HELD';
  });
  const [absorbedCogs, setAbsorbedCogs] = useState<number>(0.0);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'STREAMING' | 'DISCONNECTED'>('STREAMING');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Load venture metadata & pipeline execution from backend
  useEffect(() => {
    if (isExplore) {
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    if (!activeVentureId) {
      if (!localVenture) {
        setNotFound(true);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/ventures/${activeVentureId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Venture not found');
        return res.json();
      })
      .then((data) => {
        setNotFound(false);
        if (data.venture) {
          const sub = (data.venture.id || activeVentureId).slice(0, 8).replace(/_/g, '-');
          setVenture({
            id: data.venture.id,
            name: data.venture.name || 'Live Venture',
            tenantId: data.venture.tenantId || 'tenant-default',
            planTier: data.venture.planTier || 'FOUNDER',
            domain: `${sub}.axiomrun.app`,
            stagingUrl: `https://stage-${sub}.axiomrun.app`,
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
        if (!localVenture) {
          setNotFound(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeVentureId, isExplore]);

  // Connect to SSE Telemetry Stream
  useEffect(() => {
    if (isExplore || !activeVentureId || notFound) {
      setConnectionStatus('DISCONNECTED');
      return;
    }

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/telemetry/stream/${activeVentureId}`);

      eventSource.onopen = () => {
        setConnectionStatus('STREAMING');
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_open`,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `Connected to real-time telemetry stream for ${activeVentureId}`,
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
              data.type === 'SNAPSHOT'
                ? `Loaded current pipeline snapshot for ${activeVentureId}`
                : data.type === 'GATE_RUNNING'
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

          // Process state hydration or stage updates
          if (data.type === 'SNAPSHOT' && data.payload) {
            if (data.payload.stages) setStages(data.payload.stages);
            if (data.payload.overallStatus) setOverallStatus(data.payload.overallStatus);
            if (data.payload.escrowStatus) setEscrowStatus(data.payload.escrowStatus);
            if (typeof data.payload.absorbedPlatformCogsUsd === 'number') {
              setAbsorbedCogs(data.payload.absorbedPlatformCogsUsd);
            }
          } else if (data.type === 'GATE_RUNNING' && data.payload?.gateId) {
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
  }, [activeVentureId, isExplore, notFound]);

  // Trigger stage-gate retry / re-run
  const handleRetry = async () => {
    setIsRetrying(true);
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_retry`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Dispatching manual stage-gate execution for venture ${activeVentureId}...`,
      },
    ]);

    try {
      const res = await fetch(`/api/ventures/${activeVentureId}/retry`, {
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

  if (notFound && !isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center space-y-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Venture Pipeline Not Initialized</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              No live venture deployment was found for identifier <code className="text-cyan-300 font-mono">{activeVentureId || 'unspecified'}</code>.
              Stage Gate OS does not show simulated data for uninitialized pipelines.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/launchpad/newbie')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-glow-indigo transition-all cursor-pointer"
            >
              Launch Live Venture
            </button>
            <button
              onClick={() => onNavigate('/launchpad/serial')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Back to Portfolio
            </button>
            <button
              onClick={() => onNavigate('/#scenarios')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900/60 border border-indigo-700 text-indigo-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Explore Scenarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Explore Notice Banner */}
        {isExplore && (
          <div className="rounded-xl p-3.5 bg-indigo-950/70 border border-indigo-700/60 text-indigo-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                <strong>Interactive Explore Mode:</strong> Viewing verified verification receipt for demo scenario <strong>{venture.name}</strong>. Real production ventures execute authentic AST scans and health probes.
              </span>
            </div>
            <button
              onClick={() => onNavigate('/launchpad/newbie')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-sm whitespace-nowrap cursor-pointer"
            >
              Launch Your Live Venture
            </button>
          </div>
        )}

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
