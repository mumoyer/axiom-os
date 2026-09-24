import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Terminal, ExternalLink, Lock, X } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
  onOpenBugReport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
  onOpenBugReport = () => {},
}) => {
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'zdr' | null>(null);

  useEffect(() => {
    if (activePolicy) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActivePolicy(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activePolicy]);
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
              <li><button onClick={() => { onNavigate('/'); setTimeout(() => document.getElementById('scenarios')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Explore Example Ventures</button></li>
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
              <li><button onClick={onOpenBugReport} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Report a Bug &amp; Earn Bounty</button></li>
            </ul>
          </div>

          {/* Column 3: Comparison & Governance */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Comparison & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/#matrix')} className="hover:text-white transition-colors">vs Polsia (Walled Garden)</button></li>
              <li><button onClick={() => onNavigate('/#matrix')} className="hover:text-white transition-colors">vs Cursor & Lovable</button></li>
              <li><button onClick={() => onNavigate('/#matrix')} className="hover:text-white transition-colors">vs Corporate Studios</button></li>
              <li><span className="text-slate-400">SOC 2 Audit-Ready Architecture</span></li>
              <li><span className="text-slate-500">Okta SAML 2.0 SSO (Enterprise)</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-3">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} Stage Gate OS. Operated by Moyer Ventures LLC (Utah). All rights reserved.</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">Build v1.0.0-verified</span>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActivePolicy('terms')}
              data-testid="footer-terms-btn"
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActivePolicy('privacy')}
              data-testid="footer-privacy-btn"
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActivePolicy('zdr')}
              data-testid="footer-zdr-btn"
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Zero Data Retention (ZDR)
            </button>
          </div>
        </div>
      </div>

      {/* Informational Policy Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl space-y-5 text-slate-100">
            <button
              onClick={() => setActivePolicy(null)}
              aria-label="Close Policy Dialog"
              title="Close"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MOYER VENTURES LLC • STAGE GATE OS LEGAL POLICIES</span>
            </div>

            <h3 className="text-xl font-bold text-white">
              {activePolicy === 'terms' && 'Terms of Service & Subscriber Agreement'}
              {activePolicy === 'privacy' && 'Privacy Policy & Data Protection Disclosures'}
              {activePolicy === 'zdr' && 'Zero Data Retention (ZDR) & Security Protocol'}
            </h3>

            <div className="text-xs text-slate-300 leading-relaxed space-y-4 font-sans max-h-[55vh] overflow-y-auto pr-2">
              {activePolicy === 'terms' && (
                <>
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200">
                    <strong>Governing Entity:</strong> Stage Gate OS is owned and operated by <strong>Moyer Ventures LLC</strong>, a Utah limited liability company (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;). These Terms govern all subscriptions, API use, and venture deployments.
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">1. 100% Intellectual Property Assignment to Subscriber</h4>
                    <p className="mt-1 text-slate-300">
                      You retain full, exclusive ownership of all prompts, specifications, venture business models, and customer data submitted to the platform. <strong>Company hereby irrevocably assigns to you all right, title, and interest</strong> in and to all source code, software artifacts, database schemas, and ejected Git repositories generated specifically for your venture. Stage Gate OS claims 0.0% perpetual revenue tax, 0.0% equity, and 0 proprietary runtime lock-in.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">2. Subscriptions, Automatic Renewal & Click-to-Cancel</h4>
                    <p className="mt-1 text-slate-300">
                      Paid plans during Public Beta ($55/mo Founder [regular list $69], $119/mo Serial [regular list $149], $799/mo Enterprise [regular list $999], or annual equivalents discounted 20%) are billed on a recurring continuous subscription basis. <strong>Subscribers during public beta receive a lifetime rate lock guarantee ensuring their rate will not increase to regular list price for the life of their active subscription.</strong> <strong>Your payment method will be charged automatically at the start of each billing cycle unless and until you cancel.</strong> You may cancel online at any time via your account settings or by emailing <a href="mailto:jason@moyervllc.com" className="text-indigo-400 underline">jason@moyervllc.com</a>. Cancellations take effect at the conclusion of the paid billing period with zero cancellation fees.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">3. Two-Phase Commit Zero-Charge Invariant</h4>
                    <p className="mt-1 text-slate-300">
                      Platform credit consumption is strictly governed by our Two-Phase Commit (2PC) Credit Escrow ledger. In the event of a verification gate failure, syntax error, or infrastructure SLA breach, held credits are rolled back automatically with zero net charge (<code className="text-emerald-400">ΔB == 0.00</code>).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">4. Limitation of Liability & Damages Cap</h4>
                    <p className="mt-1 text-slate-300 uppercase font-semibold text-[10px] tracking-wide text-slate-400">
                      TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, IN NO EVENT SHALL MOYER VENTURES LLC, ITS MANAGERS, MEMBERS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, LOSS OF PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION. COMPANY&apos;S TOTAL AGGREGATE LIABILITY ARISING FROM OR RELATING TO THE SERVICE SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO COMPANY IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">5. Disclaimer of Warranties</h4>
                    <p className="mt-1 text-slate-300 uppercase font-semibold text-[10px] tracking-wide text-slate-400">
                      THE SERVICE AND ALL VENTURE DELIVERABLES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">6. Mandatory Binding Individual Arbitration & Class Action Waiver</h4>
                    <p className="mt-1 text-slate-300">
                      Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall be resolved by <strong>binding individual arbitration</strong> administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, governed by the <strong>Federal Arbitration Act (9 U.S.C. § 1 et seq.)</strong> and the laws of the <strong>State of Utah</strong>, without regard to conflict of law principles. Seat of arbitration: Salt Lake City, Utah. <strong>YOU AND MOYER VENTURES LLC WAIVE ANY RIGHT TO COMMENCE OR PARTICIPATE IN A CLASS ACTION, COLLECTIVE ACTION, OR PRIVATE ATTORNEY GENERAL PROCEEDING.</strong> You have the right to opt out of this arbitration agreement within 30 days of first accepting these Terms by emailing written notice to <a href="mailto:jason@moyervllc.com" className="text-indigo-400 underline">jason@moyervllc.com</a>.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">7. DMCA Section 512 Designated Copyright Agent</h4>
                    <p className="mt-1 text-slate-300">
                      If you believe any content on the platform infringes your copyright, please dispatch a notice pursuant to 17 U.S.C. § 512(c) to our Designated Copyright Agent:
                      <br />
                      <strong>Designated Agent:</strong> Jason Moyer, Moyer Ventures LLC
                      <br />
                      <strong>Email:</strong> <a href="mailto:jason@moyervllc.com" className="text-indigo-400 underline">jason@moyervllc.com</a>
                      <br />
                      <strong>Jurisdiction:</strong> State of Utah, United States
                    </p>
                  </div>
                </>
              )}

              {activePolicy === 'privacy' && (
                <>
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200">
                    <strong>Data Controller:</strong> Moyer Ventures LLC (Utah). Contact: <a href="mailto:jason@moyervllc.com" className="underline">jason@moyervllc.com</a>. This Privacy Policy details our handling of personal information in compliance with GDPR, CCPA/CPRA, and US privacy laws.
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">1. Information We Collect</h4>
                    <p className="mt-1 text-slate-300">
                      We collect account contact information (name, email), billing records via Stripe/Shopify, and technical metadata necessary to execute stage-gate verification pipelines. We do not sell, rent, or monetize your personal information or business specifications.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">2. Lawful Basis for Processing (GDPR Article 6)</h4>
                    <p className="mt-1 text-slate-300">
                      Processing is conducted under: (a) Performance of a contract to deliver venture builds; (b) Compliance with legal obligations; and (c) Legitimate business interests in platform security and fraud prevention.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">3. Consumer Rights (GDPR & CCPA/CPRA)</h4>
                    <p className="mt-1 text-slate-300">
                      Regardless of your location, you have the right to: (a) Request access to personal information collected; (b) Request deletion / erasure of your data; (c) Correct inaccurate records; and (d) Opt-out of any commercial marketing communications. We do not &quot;sell&quot; or &quot;share&quot; personal information as defined by California Civil Code § 1798.140. To exercise any right, email <a href="mailto:jason@moyervllc.com" className="text-indigo-400 underline">jason@moyervllc.com</a>.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">4. Founder Data Isolation & Model Training</h4>
                    <p className="mt-1 text-slate-300">
                      We never train foundational machine learning models on customer source code, business ideas, or private venture deliverables. All code ejection outputs remain strictly proprietary to you.
                    </p>
                  </div>
                </>
              )}

              {activePolicy === 'zdr' && (
                <>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">Zero Data Retention (ZDR) Execution Protocol</h4>
                    <p className="mt-1 text-slate-300">
                      Ephemeral build containers, sandbox environments, and AST memory caches are cryptographically shredded and wiped upon gate receipt issuance. Verification logs retain only cryptographic hashes (<code className="text-emerald-400">SHA-256</code>) and gate assertion statuses.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">Encrypted BYOK Vault</h4>
                    <p className="mt-1 text-slate-300">
                      Customer-supplied API credentials (Anthropic, OpenAI, DeepSeek, Stripe, GitHub) are protected with authenticated AES-256-GCM envelope encryption and in-memory credential scrubbing, never logged to persistent disk or shared across tenant environments.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActivePolicy(null)}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close &amp; Return
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
