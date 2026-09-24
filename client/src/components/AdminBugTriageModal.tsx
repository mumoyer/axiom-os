import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, Clock, Award, Filter, RefreshCw, Key, AlertTriangle, ExternalLink } from 'lucide-react';
import type { BugReportRecord } from '../../../server/services/feedback_store.js';

interface AdminBugTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBugTriageModal: React.FC<AdminBugTriageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [bugs, setBugs] = useState<BugReportRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  // Form edit state for selected bug
  const [triageStatus, setTriageStatus] = useState<'open' | 'triaged' | 'rewarded' | 'resolved'>('triaged');
  const [bountyCredit, setBountyCredit] = useState<string>('1 Free Month');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [savingBug, setSavingBug] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('stagegate_admin_key');
      if (stored) {
        setAdminKey(stored);
        fetchBugs(stored);
      }
    }
  }, [isOpen]);

  const fetchBugs = async (keyToUse: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/feedback/bugs', {
        headers: { 'x-admin-key': keyToUse.trim() },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('Invalid admin key. Access restricted to Jason Moyer & core engineering.');
        return;
      }

      const data = await res.json();
      if (res.ok && Array.isArray(data.bugs)) {
        setBugs(data.bugs);
        setIsAuthenticated(true);
        localStorage.setItem('stagegate_admin_key', keyToUse.trim());
      } else {
        setError(data.error || 'Failed to retrieve bug reports');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching bug reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBug = (bug: BugReportRecord) => {
    setSelectedBugId(bug.id);
    setTriageStatus(bug.status);
    setBountyCredit(bug.verifiedBountyCredit || bug.bountyReward || '1 Free Month');
    setAdminNotes(bug.adminNotes || '');
  };

  const handleUpdateBug = async () => {
    if (!selectedBugId) return;
    setSavingBug(true);
    setError('');

    try {
      const res = await fetch(`/api/feedback/bugs/${selectedBugId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          status: triageStatus,
          verifiedBountyCredit: bountyCredit,
          adminNotes,
          reviewedBy: 'jason@moyervllc.com',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.bug) {
        setBugs(bugs.map((b) => (b.id === selectedBugId ? data.bug : b)));
        setSelectedBugId(null);
      } else {
        setError(data.error || 'Failed to update bug status');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSavingBug(false);
    }
  };

  if (!isOpen) return null;

  const filteredBugs = bugs.filter((bug) => {
    if (filterStatus !== 'all' && bug.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && bug.severity !== filterSeverity) return false;
    return true;
  });

  const selectedBug = bugs.find((b) => b.id === selectedBugId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                Admin Bug Triage & Bounty Dashboard
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Direct engineering review cockpit for Jason Moyer (Moyer Ventures LLC). Verify bugs and credit subscription rewards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Key Bar */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono text-slate-400">Admin Key:</span>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={() => fetchBugs(adminKey)}
            disabled={loading}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Triage Queue
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters & Counts */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
            >
              <option value="all">All ({bugs.length})</option>
              <option value="open">Open</option>
              <option value="triaged">Triaged</option>
              <option value="rewarded">Rewarded</option>
              <option value="resolved">Resolved</option>
            </select>

            <span className="text-slate-400 font-mono ml-2">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
            >
              <option value="all">All</option>
              <option value="cosmetic">Cosmetic</option>
              <option value="functional">Functional</option>
              <option value="blocking">Blocking</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div className="text-slate-400 font-mono">
            Showing <strong className="text-amber-300">{filteredBugs.length}</strong> reports
          </div>
        </div>

        {/* Bug Reports Table & Selected Editor */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* List Column */}
          <div className="lg:col-span-2 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredBugs.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No reports found matching the selected filters.
              </div>
            ) : (
              filteredBugs.map((bug) => (
                <div
                  key={bug.id}
                  onClick={() => handleSelectBug(bug)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedBugId === bug.id
                      ? 'bg-slate-800/90 border-amber-500 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-300">{bug.id}</span>
                      <span className="text-xs font-semibold text-slate-100 truncate max-w-[240px]">
                        {bug.title}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        bug.status === 'rewarded'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : bug.status === 'triaged'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : bug.status === 'resolved'
                          ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {bug.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {bug.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {bug.category}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                        {bug.severity}
                      </span>
                    </div>
                    <span>{bug.reporterEmail || 'Anonymous'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Review / Triage Editor Column */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
            {selectedBug ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="font-mono font-bold text-amber-300 text-xs flex items-center justify-between">
                    <span>Triage: {selectedBug.id}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(selectedBug.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{selectedBug.title}</h4>
                  <div className="text-slate-400 mt-1 text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 max-h-24 overflow-y-auto">
                    {selectedBug.description}
                  </div>
                </div>

                {selectedBug.url && (
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    URL: <a href={selectedBug.url} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{selectedBug.url}</a>
                  </div>
                )}

                {/* Status selector */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                    Update Status
                  </label>
                  <select
                    value={triageStatus}
                    onChange={(e: any) => setTriageStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="open">Open</option>
                    <option value="triaged">Triaged (Under Review)</option>
                    <option value="rewarded">Rewarded (Bounty Credit Approved)</option>
                    <option value="resolved">Resolved (Patched in Production)</option>
                  </select>
                </div>

                {/* Bounty Credit */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-amber-400 uppercase mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Verified Bounty Credit
                  </label>
                  <select
                    value={bountyCredit}
                    onChange={(e) => setBountyCredit(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded px-2.5 py-1.5 text-xs text-amber-300 font-mono"
                  >
                    <option value="1 Free Month">1 Free Month</option>
                    <option value="2 Free Months">2 Free Months</option>
                    <option value="3 Free Months + Founder Advisory Session">3 Free Months + Founder Advisory Session</option>
                    <option value="Beta Tester Credit in Release Notes">Beta Tester Credit in Release Notes</option>
                  </select>
                </div>

                {/* Admin notes */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">
                    Internal Engineering Notes
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Verified and deployed in hotfix v1.0.4. Bounty credit applied to Stripe subscriber."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={handleUpdateBug}
                  disabled={savingBug}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  {savingBug ? 'Saving...' : 'Confirm Triage & Award Bounty'}
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <Award className="w-8 h-8 text-slate-700 mb-2" />
                <span>Select a bug report from the left to review details, change status, and grant subscription bounty credits.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
