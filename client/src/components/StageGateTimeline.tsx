import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Cpu,
  Layers,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export type GateStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ROLLED_BACK' | 'SELF_HEALING';

export interface AssertionResult {
  assertionId: string;
  name: string;
  status: 'PASS' | 'FAIL';
  latencyMs: number;
  expected: unknown;
  actual: unknown;
  errorTrace?: string;
}

export interface GateReceipt {
  gateNumber: number;
  ventureId: string;
  timestamp: string;
  status: 'PASS' | 'FAIL';
  assertions: AssertionResult[];
  executionTimeMs: number;
  remediationAttempts: number;
  signature: string;
}

export interface StageGateResult {
  gateId: number;
  gateName: string;
  status: GateStatus;
  startTime: number;
  durationMs: number;
  metrics: Record<string, any>;
  diagnosticLogs: string[];
  assertionsPassed: number;
  assertionsFailed: number;
  error?: string;
  receipt?: GateReceipt;
}

export interface StageGateTimelineProps {
  stages?: StageGateResult[];
  overallStatus?: 'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED_ZERO_CHARGE';
  onSelectGate?: (gateId: number) => void;
  selectedGateId?: number;
}

const DEFAULT_STAGES_METADATA = [
  {
    gateId: 1,
    gateName: 'Build & Strict TypeScript Check',
    subtitle: 'AST validation, strict typing, bundle budget validation (< 250KB)',
    icon: Cpu,
  },
  {
    gateId: 2,
    gateName: 'Infrastructure & Container Health Probe',
    subtitle: '15x HTTP healthz probes (p95 < 300ms) & RFC 6125 TLS SAN verification',
    icon: Layers,
  },
  {
    gateId: 3,
    gateName: 'RFC 6125 SSL & Quad-DoH DNS Quorum',
    subtitle: '3-of-4 DoH consensus, CNAME trailing dot normalization & Anycast pool',
    icon: ShieldCheck,
  },
  {
    gateId: 4,
    gateName: 'Stripe Checkout & Webhook Idempotency',
    subtitle: 'Stripe test clock (+30d) simulation & 3-request flood mutex lock',
    icon: CheckCircle2,
  },
  {
    gateId: 5,
    gateName: 'Git Ejection & 100% Repository Portability',
    subtitle: 'Clean-room AST zero lock-in scan, dual-push GitHub repo & README badge',
    icon: Terminal,
  },
];

export const StageGateTimeline: React.FC<StageGateTimelineProps> = ({
  stages,
  overallStatus = 'IN_PROGRESS',
  onSelectGate,
  selectedGateId,
}) => {
  const [expandedGates, setExpandedGates] = useState<Record<number, boolean>>({ 1: true });
  const [copiedSignature, setCopiedSignature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<number, 'logs' | 'assertions' | 'receipt'>>({});
  const [now, setNow] = useState(Date.now());

  // Live timer for currently running gates
  useEffect(() => {
    const hasRunningGate = stages?.some((s) => s.status === 'RUNNING');
    if (!hasRunningGate) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [stages]);

  const toggleGate = (gateId: number) => {
    setExpandedGates((prev) => ({
      ...prev,
      [gateId]: !prev[gateId],
    }));
    if (onSelectGate) {
      onSelectGate(gateId);
    }
  };

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    for (let i = 1; i <= 5; i++) allExpanded[i] = true;
    setExpandedGates(allExpanded);
  };

  const collapseAll = () => {
    setExpandedGates({});
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSignature(text);
    setTimeout(() => setCopiedSignature(null), 2000);
  };

  // Merge default stage definitions with provided stages
  const mergedStages = DEFAULT_STAGES_METADATA.map((def) => {
    const stageData = stages?.find((s) => s.gateId === def.gateId);
    return {
      ...def,
      status: (stageData?.status || 'PENDING') as GateStatus,
      startTime: stageData?.startTime || 0,
      durationMs: stageData?.durationMs || 0,
      metrics: stageData?.metrics || {},
      diagnosticLogs: stageData?.diagnosticLogs || [],
      assertionsPassed: stageData?.assertionsPassed || 0,
      assertionsFailed: stageData?.assertionsFailed || 0,
      error: stageData?.error,
      receipt: stageData?.receipt,
    };
  });

  const passedCount = mergedStages.filter((s) => s.status === 'PASSED').length;
  const progressPercent = Math.round((passedCount / 5) * 100);

  const getStatusBadge = (status: GateStatus, durationMs: number, startTime: number) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PASSED</span>
            <span className="text-emerald-400/70 font-mono text-[11px] ml-1">({durationMs}ms)</span>
          </span>
        );
      case 'RUNNING': {
        const elapsed = startTime > 0 ? Math.max(0, now - startTime) : 0;
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 rounded-full animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>EVALUATING</span>
            <span className="text-indigo-300 font-mono text-[11px]">({elapsed}ms)</span>
          </span>
        );
      }
      case 'SELF_HEALING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-full animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>SELF-HEALING (0 COGS)</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>FAILED</span>
          </span>
        );
      case 'ROLLED_BACK':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-600/30 rounded-full">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>ROLLED BACK (0 CHARGE)</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800 rounded-full">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-xl p-5 shadow-2xl space-y-4">
      {/* Header & Overall Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Deterministic Stage-Gate Timeline</span>
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 rounded">
              5 Gates
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict programmatic pass/fail gates with 2PC credit escrow boundary protection
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xs font-medium text-slate-400">Pipeline Status</div>
            <div className="text-xs font-semibold text-slate-200">
              {passedCount}/5 Gates Passed ({progressPercent}%)
            </div>
          </div>
          <div className="flex items-center space-x-1 border border-slate-800 rounded-lg p-1 bg-slate-900/80">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stage Gates List */}
      <div className="space-y-3 pt-1">
        {mergedStages.map((stage, idx) => {
          const isExpanded = !!expandedGates[stage.gateId];
          const isSelected = selectedGateId === stage.gateId;
          const currentTab = activeTab[stage.gateId] || 'assertions';
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.gateId}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                stage.status === 'PASSED'
                  ? 'border-emerald-900/40 bg-slate-900/40'
                  : stage.status === 'RUNNING'
                  ? 'border-indigo-500/60 bg-indigo-950/20 shadow-glow-indigo'
                  : stage.status === 'FAILED'
                  ? 'border-rose-900/50 bg-rose-950/10'
                  : stage.status === 'SELF_HEALING'
                  ? 'border-amber-700/50 bg-amber-950/10'
                  : 'border-slate-800/60 bg-slate-950/40'
              } ${isSelected ? 'ring-2 ring-indigo-500/50' : ''}`}
            >
              {/* Gate Summary Header */}
              <div
                onClick={() => toggleGate(stage.gateId)}
                className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs font-bold ${
                      stage.status === 'PASSED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : stage.status === 'RUNNING'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 animate-pulse'
                        : stage.status === 'FAILED'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    G{stage.gateId}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-slate-100">{stage.gateName}</span>
                      {stage.assertionsPassed > 0 && (
                        <span className="text-[11px] font-mono text-slate-400">
                          ({stage.assertionsPassed} assertions)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 hidden sm:block">{stage.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(stage.status, stage.durationMs, stage.startTime)}
                  <div className="text-slate-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expandable Diagnostic Drawer */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/80 p-4 space-y-3">
                  {/* Drawer Tab Navigation */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setActiveTab((prev) => ({ ...prev, [stage.gateId]: 'assertions' }))}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          currentTab === 'assertions'
                            ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Assertions ({stage.receipt?.assertions?.length || stage.assertionsPassed || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab((prev) => ({ ...prev, [stage.gateId]: 'logs' }))}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          currentTab === 'logs'
                            ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Diagnostic Logs ({stage.diagnosticLogs.length})
                      </button>
                      {stage.receipt && (
                        <button
                          onClick={() => setActiveTab((prev) => ({ ...prev, [stage.gateId]: 'receipt' }))}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            currentTab === 'receipt'
                              ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/40'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Signed Receipt
                        </button>
                      )}
                    </div>

                    {stage.receipt?.remediationAttempts ? (
                      <span className="text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-700/30">
                        Self-healed ({stage.receipt.remediationAttempts} retries, $0.00 debit)
                      </span>
                    ) : null}
                  </div>

                  {/* Tab: Assertions */}
                  {currentTab === 'assertions' && (
                    <div className="space-y-2">
                      {stage.receipt?.assertions && stage.receipt.assertions.length > 0 ? (
                        stage.receipt.assertions.map((assertion, aIdx) => (
                          <div
                            key={assertion.assertionId || aIdx}
                            className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {assertion.status === 'PASS' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                )}
                                <span className="font-semibold text-slate-200">{assertion.name}</span>
                              </div>
                              <span className="font-mono text-[11px] text-slate-400">
                                {assertion.latencyMs}ms
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                                <span className="text-slate-500">Expected: </span>
                                <span className="text-emerald-300">
                                  {typeof assertion.expected === 'object'
                                    ? JSON.stringify(assertion.expected)
                                    : String(assertion.expected)}
                                </span>
                              </div>
                              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                                <span className="text-slate-500">Actual: </span>
                                <span className={assertion.status === 'PASS' ? 'text-emerald-300' : 'text-rose-300'}>
                                  {typeof assertion.actual === 'object'
                                    ? JSON.stringify(assertion.actual)
                                    : String(assertion.actual)}
                                </span>
                              </div>
                            </div>
                            {assertion.errorTrace && (
                              <div className="text-rose-400 bg-rose-950/40 p-2 rounded text-[11px] font-mono whitespace-pre-wrap">
                                {assertion.errorTrace}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 italic py-2">
                          {stage.status === 'PENDING'
                            ? 'Assertions will be programmatically verified once execution begins.'
                            : 'No assertion breakdown available yet.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Diagnostic Logs */}
                  {currentTab === 'logs' && (
                    <div className="space-y-1">
                      {stage.diagnosticLogs.length > 0 ? (
                        <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1 border border-slate-800">
                          {stage.diagnosticLogs.map((log, lIdx) => (
                            <div key={lIdx} className="leading-relaxed flex items-start space-x-2">
                              <span className="text-slate-600 select-none">{lIdx + 1}</span>
                              <span className={log.includes('FAIL') ? 'text-rose-400' : log.includes('PASS') ? 'text-emerald-400' : 'text-slate-300'}>
                                {log}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic py-2">
                          No diagnostic logs recorded yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Signed Receipt */}
                  {currentTab === 'receipt' && stage.receipt && (
                    <div className="bg-slate-900/80 rounded-lg p-3 border border-indigo-800/30 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between text-indigo-300 font-sans font-semibold">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          Cryptographic Gate Receipt (SHA-256 HMAC)
                        </span>
                        <span className="text-[10px] text-slate-400">{stage.receipt.timestamp}</span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                        <div className="truncate text-slate-300 text-[11px]">
                          <span className="text-slate-500">Signature: </span>
                          <span className="text-cyan-300">{stage.receipt.signature}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(stage.receipt?.signature || '')}
                          className="ml-2 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors flex-shrink-0"
                          title="Copy Signature"
                        >
                          {copiedSignature === stage.receipt.signature ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
                        <div>
                          <span className="text-slate-500">Status:</span>{' '}
                          <span className="text-emerald-400 font-bold">{stage.receipt.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Execution:</span>{' '}
                          <span className="text-slate-200">{stage.receipt.executionTimeMs}ms</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Remediations:</span>{' '}
                          <span className="text-slate-200">{stage.receipt.remediationAttempts}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Assertions:</span>{' '}
                          <span className="text-slate-200">{stage.receipt.assertions.length}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {stage.error && (
                    <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
                      <div className="font-semibold text-rose-200">Error:</div>
                      <div className="font-mono text-[11px] mt-0.5">{stage.error}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
