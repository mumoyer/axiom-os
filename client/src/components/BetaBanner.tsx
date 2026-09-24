import React, { useState } from 'react';
import { Sparkles, Bug, ArrowRight, X } from 'lucide-react';

interface BetaBannerProps {
  onOpenBugReport: () => void;
}

export const BetaBanner: React.FC<BetaBannerProps> = ({ onOpenBugReport }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Public Beta Announcement"
      className="relative z-50 w-full bg-gradient-to-r from-[#0d1424] via-[#111c38] to-[#0d1424] border-b border-indigo-500/30 text-xs py-2 px-3 sm:px-6 transition-all"
    >
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Beta Announcement & 20% Discount */}
        <div className="flex items-center space-x-2.5 flex-1 min-w-[280px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            PUBLIC BETA
          </span>
          <p className="text-slate-200 text-[11px] sm:text-xs">
            <strong className="text-white font-semibold">20% Early Adopter Discount Active:</strong>{' '}
            <span className="text-slate-300 hidden md:inline">
              Lock in early access rates for the life of your subscription.
            </span>
          </p>
        </div>

        {/* Right: Bug Bounty CTA & Dismiss */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onOpenBugReport}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium font-mono text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 transition-all hover:scale-102 cursor-pointer shadow-sm group"
            title="Report a bug and earn 1–3 free months"
          >
            <Bug className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Report a Bug & Earn 1–3 Free Months</span>
            <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
