import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Calendar, ArrowRight, Lock, DollarSign } from 'lucide-react';
import { PRICING_TIERS, BETA_CONFIG, TierId } from '../../../shared/pricing.js';

interface FounderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

interface SubscriberData {
  email: string;
  plan: TierId;
  billingInterval: 'monthly' | 'annual';
  status: string;
  rateLockedUsd: number;
  listPriceUsd: number;
  savingsUsd: number;
  monthlySavingsUsd: number;
  isBetaRateLocked: boolean;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancellationFeeUsd: number;
  cancellationReason?: string;
}

export const FounderSettingsModal: React.FC<FounderSettingsModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('Project pivoted / Taking a break');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const storedEmail =
        initialEmail ||
        localStorage.getItem('founder_email') ||
        localStorage.getItem('stagegate_subscriber_email') ||
        '';
      if (storedEmail) {
        setEmail(storedEmail);
        fetchSubscription(storedEmail);
      }
    }
  }, [isOpen, initialEmail]);

  const fetchSubscription = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes('@')) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/subscription/me?email=${encodeURIComponent(targetEmail.trim())}`);
      const data = await res.json();
      if (res.ok && data.found && data.subscription) {
        setSubscriber(data.subscription);
        localStorage.setItem('stagegate_subscriber_email', targetEmail.trim());
      } else {
        setSubscriber(null);
        if (data.error) {
          setErrorMessage(data.error);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriber) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscriber.email,
          reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscriber({
          ...subscriber,
          cancelAtPeriodEnd: true,
          cancellationReason: cancelReason,
        });
        setSuccessMessage(data.message || 'Subscription successfully cancelled with $0.00 penalty fees.');
      } else {
        setErrorMessage(data.error || 'Failed to cancel subscription');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing cancellation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscriber) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscriber.email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscriber({
          ...subscriber,
          cancelAtPeriodEnd: false,
          cancellationReason: undefined,
        });
        setSuccessMessage(data.message || 'Subscription reactivated with Beta Lifetime Rate Lock preserved!');
      } else {
        setErrorMessage(data.error || 'Failed to reactivate subscription');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error reactivating subscription');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const tierInfo = subscriber ? PRICING_TIERS[subscriber.plan] || PRICING_TIERS.FOUNDER : null;
  const renewalDateFormatted = subscriber?.currentPeriodEnd
    ? new Date(subscriber.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                Founder Settings & Billing
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Self-service subscription management, 1-click cancellation, and Beta Lifetime Rate Lock guarantee.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Lookup Bar */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
            Subscriber Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. founder@venturestudio.io"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => fetchSubscription(email)}
              disabled={loading || !email}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Lookup
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Subscription Details Card */}
        {subscriber ? (
          <div className="mt-6 space-y-5">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden">
              
              {/* Top Row: Plan & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-mono">
                      {tierInfo?.name || subscriber.plan}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {subscriber.billingInterval}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{subscriber.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {subscriber.cancelAtPeriodEnd ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Cancels on Period End
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Subscription
                    </span>
                  )}
                </div>
              </div>

              {/* Public Beta Rate Lock Banner */}
              {subscriber.isBetaRateLocked && (
                <div className="mt-4 p-3.5 rounded-lg bg-gradient-to-r from-amber-950/40 to-indigo-950/40 border border-amber-500/40 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 font-mono font-bold text-xs text-amber-300 uppercase tracking-wider">
                      Public Beta Lifetime Rate Lock Active
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Your current rate of <strong className="text-white">${subscriber.rateLockedUsd}/{subscriber.billingInterval === 'annual' ? 'yr' : 'mo'}</strong> is locked for the continuous lifetime of your subscription. Regular list price is <span className="line-through text-slate-400">${subscriber.listPriceUsd}</span>. You save <strong className="text-amber-300">${subscriber.savingsUsd}/{subscriber.billingInterval === 'annual' ? 'yr' : 'mo'}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid: Dates, Fees, Renewal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{subscriber.cancelAtPeriodEnd ? 'Access Until' : 'Next Renewal'}</span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">{renewalDateFormatted || '30 days'}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cancellation Fee</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    ${(subscriber.cancellationFeeUsd || 0).toFixed(2)} (Zero Fees)
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rate Lock Status</span>
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {subscriber.isBetaRateLocked ? 'Locked for Life' : 'Standard Rate'}
                  </div>
                </div>
              </div>

              {/* Cancellation Reason if cancelled */}
              {subscriber.cancelAtPeriodEnd && subscriber.cancellationReason && (
                <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400">Scheduled Cancellation Reason: </span>
                  <span className="text-slate-200 font-mono">{subscriber.cancellationReason}</span>
                </div>
              )}
            </div>

            {/* Actions: Cancel or Reactivate */}
            {subscriber.cancelAtPeriodEnd ? (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="text-xs text-indigo-200 leading-relaxed">
                  Changed your mind? You can reactivate before your billing period concludes on <strong>{renewalDateFormatted}</strong> and keep your <strong>Public Beta Lifetime Rate Lock (${subscriber.rateLockedUsd}/{subscriber.billingInterval === 'annual' ? 'yr' : 'mo'})</strong> intact.
                </div>
                <button
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                  Reactivate Subscription & Restore Rate Lock
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-200 font-mono">1-Click Self-Service Cancellation</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Cancel anytime with $0.00 fees. Access continues seamlessly through {renewalDateFormatted}.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <div className="sm:col-span-2">
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="Project pivoted / Taking a break">Project pivoted / Taking a break</option>
                      <option value="Missing a specific feature">Missing a specific feature</option>
                      <option value="Budget constraints">Budget constraints</option>
                      <option value="Exploring alternative solutions">Exploring alternative solutions</option>
                      <option value="Other / General feedback">Other / General feedback</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                      className="w-full py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 hover:border-rose-500/60 text-rose-300 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Cancel Subscription'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="mt-8 text-center p-8 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-300 font-mono">No Active Subscription Found</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active plan associated with <span className="font-mono text-slate-400">{email || 'this email'}</span>. Check your email or join during the Public Beta for 20% lifetime savings.
              </p>
              <button
                onClick={() => {
                  onClose();
                  window.location.hash = '/#pricing';
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
              >
                View Beta Pricing & Plans
              </button>
            </div>
          )
        )}

        {/* Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Need direct assistance? Contact <a href="mailto:jason@moyervllc.com" className="text-indigo-400 underline">jason@moyervllc.com</a></span>
          <span className="font-mono text-[10px] text-slate-600">FTC Negative Option Compliant • Zero Dark Patterns</span>
        </div>

      </div>
    </div>
  );
};
