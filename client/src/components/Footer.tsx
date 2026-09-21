import React from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Terminal, ExternalLink, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      {/* Live System Gate Telemetry Bar */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium font-mono text-[11px]">
              SYSTEM HEALTH: ALL 5 STAGE-GATES OPERATIONAL (G1–G5)
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>G1: AST Syntax</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>G2: TLS 1.3</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>G3: Quad-DoH</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>G4: Stripe Clock</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>G5: Git Eject</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-mono font-bold text-sm">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-mono">
                STAGEGATE<span className="text-indigo-400">.OS</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              The Autonomous Business Operating System. Inverting brittle AI venture failure modes into mathematical, anti-fragile guarantees with deterministic stage-gates and 100% full Git ejection.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>2PC Escrow Invariant: ΔB == 0.00 Guaranteed</span>
            </div>
          </div>

          {/* Column 1: Core Engine */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">Stage-Gate Engine</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">2PC Credit Escrow</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">100% Dual-Push Git</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">Quad-DoH Quorum</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">BYOK Token Routing</button></li>
            </ul>
          </div>

          {/* Column 2: Guarantees & Tools */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Guarantees & Grader</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/grader')} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Venture Grader (Free)</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">Zero-Charge Failure</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">0.0% Perpetual Rev Tax</button></li>
              <li><button onClick={() => onNavigate('/#guarantees')} className="hover:text-white transition-colors">0.0% Ad Spend Markup</button></li>
              <li><button onClick={() => onNavigate('/#pricing')} className="hover:text-white transition-colors">Transparent Pricing</button></li>
            </ul>
          </div>

          {/* Column 3: Comparison & Governance */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Comparison & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/#matrix')} className="hover:text-white transition-colors">vs Polsia (Walled Garden)</button></li>
              <li><button onClick={() => onNavigate('/#matrix')} className="hover:text-white transition-colors">vs Cursor & Lovable</button></li>
              <li><button onClick={() => onNavigate('/#matrix')} className="hover:text-white transition-colors">vs Corporate Studios</button></li>
              <li><span className="text-slate-500">SOC 2 Type II Certified</span></li>
              <li><span className="text-slate-500">Okta SAML 2.0 SSO</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-3">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} Stage Gate OS Tri-Plane Systems Inc.</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">Build v1.0.0-verified</span>
          </div>

          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Zero Data Retention (ZDR)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
