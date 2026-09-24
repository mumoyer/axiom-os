import React, { useState } from 'react';
import { ShieldCheck, Cpu, ArrowRight, Menu, X, Sparkles, User, Terminal, Building2, Bug, Settings, ShieldAlert } from 'lucide-react';

interface NavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  selectedPersona?: 'newbie' | 'serial' | 'enterprise';
  onSelectPersona?: (persona: 'newbie' | 'serial' | 'enterprise') => void;
  authUser?: { email: string; tenantId: string } | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenBugReport?: () => void;
  onOpenSettings?: () => void;
  onOpenAdminTriage?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPath = '/',
  onNavigate = (path: string) => { window.location.hash = path; },
  selectedPersona = 'serial',
  onSelectPersona = () => {},
  authUser = null,
  onOpenAuth = () => {},
  onLogout = () => {},
  onOpenBugReport = () => {},
  onOpenSettings = () => {},
  onOpenAdminTriage = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Explore Scenarios', href: '#scenarios', isPage: false },
    { label: 'Guarantees', href: '#guarantees', isPage: false },
    { label: 'Validation Grader', href: '/grader', isPage: true },
    { label: 'Competitive Matrix', href: '#matrix', isPage: false },
    { label: 'Pricing', href: '#pricing', isPage: false },
    { label: 'My Ventures', href: '/dashboard', isPage: true },
  ];

  const personas = [
    {
      id: 'newbie' as const,
      label: 'Busy 9-to-5 Professional',
      subtitle: 'Turnkey 15 Min/Day & Grader',
      icon: User,
      color: 'text-emerald-400',
    },
    {
      id: 'serial' as const,
      label: 'Serial Indie Hacker',
      subtitle: 'Headless CLI, BYOK & Git Eject',
      icon: Terminal,
      color: 'text-indigo-400',
    },
    {
      id: 'enterprise' as const,
      label: 'Corporate Innovation Studio',
      subtitle: 'Capital Tranches & SOC 2 Ready',
      icon: Building2,
      color: 'text-cyan-400',
    },
  ];

  const activePersonaObj = personas.find((p) => p.id === selectedPersona) || personas[1];

  const handleLinkClick = (href: string, isPage: boolean) => {
    setMobileMenuOpen(false);
    if (isPage) {
      onNavigate(href);
    } else {
      if (currentPath !== '/') {
        onNavigate('/');
        setTimeout(() => {
          const el = document.querySelector(href);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Autonomous Engine Glyph */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => onNavigate('/')}>
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0e1628] border border-slate-700/80 shrink-0">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-2 h-2 text-slate-950 stroke-[3]" />
              </div>
            </div>
            <div className="shrink-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white font-mono whitespace-nowrap">STAGEGATE<span className="text-indigo-400">.OS</span></span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded shadow-sm">
                  BETA
                </span>
                <span className="hidden xl:inline-flex px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 rounded-full whitespace-nowrap shrink-0">
                  Autonomous Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block whitespace-nowrap">Deterministic Venture Platform</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-5 shrink-0">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href, link.isPage)}
                className={`text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                  (link.isPage && currentPath === link.href)
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-2.5 shrink-0">
            {authUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 transition-all text-xs text-slate-200"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {authUser.email.slice(0, 1)}
                  </div>
                  <span className="font-mono text-xs text-slate-300 max-w-[120px] truncate">{authUser.email}</span>
                  <span className="text-slate-500 text-[10px]">▼</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-2 backdrop-blur-xl z-50 space-y-1">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400">
                      Signed in as <strong className="text-slate-200 block truncate">{authUser.email}</strong>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      My Ventures Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      Founder Settings & Billing
                    </button>
                    {authUser.email.toLowerCase().includes('jason@moyervllc.com') && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdminTriage();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:bg-amber-950/40 rounded-lg flex items-center gap-2"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        Admin Bug Triage
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Founder Settings Self-Service Launcher */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-mono font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all hover:scale-102 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
              title="Founder Settings, Continuous Renewal Terms & 1-Click Cancellation"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline">Founder Settings</span>
            </button>

            <button
              onClick={onOpenBugReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-mono font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg transition-all hover:scale-102 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
              title="Report a Bug & Earn 1–3 Free Months"
            >
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Report Bug</span>
            </button>

            <button
              onClick={() => onNavigate('/checkout?plan=serial')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-lg shadow-glow-indigo transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              title={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              className="p-2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href, link.isPage)}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 rounded-lg"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-xs text-slate-400 px-3 font-semibold uppercase">Switch Persona</div>
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPersona(p.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs ${
                  selectedPersona === p.id ? 'bg-indigo-950 text-indigo-300 font-semibold' : 'text-slate-300'
                }`}
              >
                <p.icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBugReport();
              }}
              className="w-full py-2.5 text-xs font-mono font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-lg text-center flex items-center justify-center space-x-2"
            >
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Bug (Earn 1–3 Free Months)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/grader');
              }}
              className="w-full py-2.5 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-700/50 rounded-lg text-center"
            >
              Test Venture Validation Grader
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/checkout?plan=serial');
              }}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg text-center"
            >
              Launch Venture ($119/mo Beta)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
