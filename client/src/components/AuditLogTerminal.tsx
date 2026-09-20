import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Search,
  Filter,
  Download,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Copy,
  Check,
  X,
  Code2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  gateId?: number;
  level: 'INFO' | 'ASSERTION_PASS' | 'ASSERTION_FAIL' | 'HEAL_ATTEMPT' | 'RECEIPT_SIGNED' | 'WARN';
  message: string;
  payload?: any;
}

export interface AuditLogTerminalProps {
  logs: AuditLogEntry[];
  connectionStatus?: 'CONNECTED' | 'STREAMING' | 'RECONNECTING' | 'DISCONNECTED' | 'COMPLETED';
  onClearLogs?: () => void;
  maxHeight?: string;
  ventureId?: string;
}

export const AuditLogTerminal: React.FC<AuditLogTerminalProps> = ({
  logs,
  connectionStatus = 'CONNECTED',
  onClearLogs,
  maxHeight = '480px',
  ventureId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGate, setSelectedGate] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<{ title: string; data: any } | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter((entry) => {
    // Filter by gate
    if (selectedGate !== 'ALL') {
      const gateNum = parseInt(selectedGate, 10);
      if (entry.gateId !== gateNum) return false;
    }

    // Filter by level
    if (selectedLevel !== 'ALL') {
      if (entry.level !== selectedLevel) return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchMsg = entry.message.toLowerCase().includes(query);
      const matchLevel = entry.level.toLowerCase().includes(query);
      const matchPayload = entry.payload
        ? JSON.stringify(entry.payload).toLowerCase().includes(query)
        : false;
      if (!matchMsg && !matchLevel && !matchPayload) return false;
    }

    return true;
  });

  const handleExportLogs = () => {
    const exportData = {
      ventureId: ventureId || 'unspecified',
      exportedAt: new Date().toISOString(),
      totalEntries: logs.length,
      logs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axiom_audit_logs_${ventureId || 'stream'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPayloadToClipboard = () => {
    if (!selectedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(selectedPayload.data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getLevelBadge = (level: AuditLogEntry['level']) => {
    switch (level) {
      case 'ASSERTION_PASS':
        return <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">[PASS]</span>;
      case 'ASSERTION_FAIL':
        return <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">[FAIL]</span>;
      case 'HEAL_ATTEMPT':
        return <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">[HEAL]</span>;
      case 'RECEIPT_SIGNED':
        return <span className="text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">[SIG]</span>;
      case 'WARN':
        return <span className="text-yellow-400 font-bold bg-yellow-950/60 px-1.5 py-0.5 rounded border border-yellow-800/40">[WARN]</span>;
      case 'INFO':
      default:
        return <span className="text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">[INFO]</span>;
    }
  };

  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'STREAMING':
      case 'CONNECTED':
        return (
          <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SSE LIVE</span>
          </span>
        );
      case 'RECONNECTING':
        return (
          <span className="flex items-center space-x-1.5 text-xs text-amber-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>RECONNECTING</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center space-x-1.5 text-xs text-indigo-300 font-mono">
            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            <span>STREAM FINISHED</span>
          </span>
        );
      case 'DISCONNECTED':
      default:
        return (
          <span className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
            <span className="h-2 w-2 rounded-full bg-slate-600"></span>
            <span>OFFLINE</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-[#070B12] shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-[#070B12]/95 backdrop-blur-xl' : ''
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          {/* macOS window traffic lights */}
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">axiom-telemetry.stream</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{ventureId || 'active-pipeline'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getConnectionIndicator()}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Terminal'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Action & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-xs">
        {/* Left: Search input */}
        <div className="flex items-center space-x-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {/* Gate Selector */}
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Gates</option>
            <option value="1">Gate 1 (Build)</option>
            <option value="2">Gate 2 (Infra/TLS)</option>
            <option value="3">Gate 3 (DNS/Quorum)</option>
            <option value="4">Gate 4 (Stripe)</option>
            <option value="5">Gate 5 (Git Eject)</option>
          </select>

          {/* Level Selector */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Levels</option>
            <option value="ASSERTION_PASS">Passed Assertions</option>
            <option value="ASSERTION_FAIL">Failed Assertions</option>
            <option value="HEAL_ATTEMPT">Self-Healing Retries</option>
            <option value="RECEIPT_SIGNED">Signed Receipts</option>
            <option value="INFO">Informational</option>
          </select>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              autoScroll
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
            title="Toggle sticky scroll to bottom"
          >
            {autoScroll ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span className="hidden sm:inline">Auto-Scroll</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportLogs}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md text-xs transition-colors"
            title="Download JSON audit log file"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Logs Button */}
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="flex items-center space-x-1 px-2 py-1 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-md text-xs transition-colors"
              title="Clear terminal buffer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Logs Window */}
      <div
        ref={terminalContainerRef}
        style={{ maxHeight: isFullscreen ? 'calc(100vh - 140px)' : maxHeight }}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1.5 selection:bg-indigo-500 selection:text-white"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-slate-500 italic space-y-2">
            <Radio className="w-6 h-6 text-slate-600 animate-pulse" />
            <span>Waiting for real-time telemetry stream events...</span>
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start space-x-2.5 py-0.5 hover:bg-slate-900/60 px-2 rounded -mx-2 group transition-colors"
            >
              <span className="text-slate-600 select-none text-[11px] whitespace-nowrap">
                {entry.timestamp.split('T')[1]?.slice(0, 12) || entry.timestamp}
              </span>

              <div className="flex-shrink-0 text-[10px]">{getLevelBadge(entry.level)}</div>

              {entry.gateId && (
                <span className="text-indigo-400/80 font-bold text-[11px] select-none flex-shrink-0">
                  [G{entry.gateId}]
                </span>
              )}

              <span
                className={`flex-1 break-words leading-relaxed ${
                  entry.level === 'ASSERTION_FAIL'
                    ? 'text-rose-300 font-semibold'
                    : entry.level === 'ASSERTION_PASS'
                    ? 'text-emerald-300'
                    : entry.level === 'HEAL_ATTEMPT'
                    ? 'text-amber-300'
                    : entry.level === 'RECEIPT_SIGNED'
                    ? 'text-purple-300'
                    : 'text-slate-300'
                }`}
              >
                {entry.message}
              </span>

              {/* Payload inspection button */}
              {entry.payload && (
                <button
                  onClick={() =>
                    setSelectedPayload({
                      title: `[G${entry.gateId || 0}] ${entry.message}`,
                      data: entry.payload,
                    })
                  }
                  className="opacity-60 group-hover:opacity-100 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-indigo-900 transition-all flex-shrink-0"
                  title="Inspect raw JSON payload"
                >
                  <Code2 className="w-3 h-3" />
                  <span>JSON</span>
                </button>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Status Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-500">
        <div>
          <span>Total events: </span>
          <span className="text-slate-300 font-semibold">{logs.length}</span>
          {filteredLogs.length !== logs.length && (
            <span className="text-indigo-400 ml-1.5">({filteredLogs.length} matching filter)</span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span>Zero-Charge Invariant: ΔB == 0.00</span>
          <span>•</span>
          <span className="text-slate-400">RFC 6125 Audit Trail</span>
        </div>
      </div>

      {/* JSON Payload Inspection Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-semibold text-slate-200 truncate max-w-md">
                  {selectedPayload.title}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyPayloadToClipboard}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedPayload(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-slate-950/90 text-cyan-300">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedPayload.data, null, 2)}
              </pre>
            </div>

            <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
