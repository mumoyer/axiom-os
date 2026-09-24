import React, { useState, useEffect } from 'react';
import {
  Bug,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Gift,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { submitBugReport, SubmitBugPayload } from '../services/api.js';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventureId?: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  ventureId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('stage_gate');
  const [severity, setSeverity] = useState('functional');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    bugId: string;
    bountyReward: string;
    message: string;
  } | null>(null);

  // Close on ESC
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      // Reset state on close
      setSubmittedData(null);
      setErrorMsg('');
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('Please enter a descriptive title (at least 3 characters).');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('Please describe what happened or steps to reproduce (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload: SubmitBugPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        reporterEmail: reporterEmail.trim() || undefined,
        ventureId,
        url: window.location.href,
        systemInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          timestamp: new Date().toISOString(),
        },
      };

      const res = await submitBugReport(payload);
      setSubmittedData({
        bugId: res.bugId,
        bountyReward: res.bountyReward,
        message: res.message,
      });
      // Clear form inputs
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b0f19] border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Bug className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40">
                  PUBLIC BETA BOUNTY
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  24h Review Guarantee
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Report a Bug & Earn Free Months
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedData ? (
          /* Success Screen */
          <div className="py-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Report Successfully Logged!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {submittedData.message}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 max-w-md mx-auto space-y-2 text-left font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Tracking Ref:</span>
                <span className="text-indigo-300 font-bold">{submittedData.bugId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Eligible Reward:</span>
                <span className="text-emerald-400 font-bold">{submittedData.bountyReward}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Review Status:</span>
                <span className="text-amber-400 font-bold">Dispatched to Jason Moyer & Team</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs font-mono transition-all"
              >
                Close & Return to App
              </button>
            </div>
          </div>
        ) : (
          /* Bug Submission Form */
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Encouragement & Bounty Scale Banner */}
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Beta Tester Bounty Rewards — No Report Too Small!</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Found an issue? Every verified bug helps us build an impenetrable autonomous engine.
                You will <strong>never</strong> be penalized for duplicates or false alarms.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block">Cosmetic / Copy:</span>
                  <span className="text-indigo-300 font-semibold">Changelog Credit</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block">Functional Glitch:</span>
                  <span className="text-emerald-400 font-semibold">1 Free Month</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block">Blocking / Security:</span>
                  <span className="text-amber-400 font-semibold">2–3 Free Months + Founder Line</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Issue Summary / Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gate 2 container check failed after retry loop"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Category & Severity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="stage_gate">Stage-Gate Engine (G1–G5)</option>
                  <option value="ui_ux">UI &amp; Dashboard Display</option>
                  <option value="checkout_billing">Checkout &amp; Billing</option>
                  <option value="deployment">DNS &amp; Git Ejection</option>
                  <option value="performance">Performance &amp; Latency</option>
                  <option value="other">Other / Suggestion</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Estimated Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="cosmetic">Cosmetic / Visual (Release notes credit)</option>
                  <option value="functional">Functional Glitch (1 Free Month)</option>
                  <option value="blocking">Blocking Workflow (2 Free Months)</option>
                  <option value="security">Security / Data / Billing (3 Free Months)</option>
                </select>
              </div>
            </div>

            {/* Description & Reproduction Steps */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Detailed Description &amp; Steps <span className="text-amber-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What were you doing when the bug occurred? What was the expected behavior vs what actually happened?"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 resize-none font-mono"
                required
              />
            </div>

            {/* Reporter Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Your Email <span className="text-slate-400 font-normal">(for reward credit &amp; updates)</span>
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="founder@venture.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Auto-Captured Context Notice */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1 font-mono">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                Diagnostic context (current page, browser version, screen size) is automatically attached.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-amber-950/50"
              >
                {submitting ? (
                  <span>Dispatching Report...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit &amp; Claim Bounty</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
