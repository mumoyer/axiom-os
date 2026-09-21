import React, { useState } from 'react';
import { ShieldCheck, Cpu, ArrowRight, Menu, X, Sparkles, User, Terminal, Building2 } from 'lucide-react';

interface NavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  selectedPersona?: 'newbie' | 'serial' | 'enterprise';
  onSelectPersona?: (persona: 'newbie' | 'serial' | 'enterprise') => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPath = '/',
  onNavigate = (path: string) => { window.location.hash = path; },
  selectedPersona = 'serial',
  onSelectPersona = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Guarantees', href: '#guarantees', isPage: false },
    { label: 'Validation Grader', href: '/grader', isPage: true },
    { label: 'Competitive Matrix', href: '#matrix', isPage: false },
    { label: 'Pricing', href: '#pricing', isPage: false },
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
      subtitle: 'Capital Tranches & SOC 2 Audit',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tri-Plane Glyph */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#0e1628] border border-slate-700/80">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-2 h-2 text-slate-950 stroke-[3]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">STAGEGATE<span className="text-indigo-400">.OS</span></span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 rounded-full">
                  Tri-Plane
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Autonomous Venture Engine</p>
            </div>
          </div>

          {/* Persona Switcher Pill */}
          <div className="hidden lg:relative lg:block">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 hover:border-indigo-500/50 transition-colors text-xs text-slate-200"
            >
              <activePersonaObj.icon className={`w-3.5 h-3.5 ${activePersonaObj.color}`} />
              <span className="text-slate-400 font-normal">Persona:</span>
              <span className="font-semibold text-slate-100">{activePersonaObj.label}</span>
              <span className="text-slate-500 text-[10px]">▼</span>
            </button>

            {personaDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-1.5 backdrop-blur-xl z-50">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Founder Profile
                </div>
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPersona(p.id);
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full flex items-start space-x-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      selectedPersona === p.id
                        ? 'bg-indigo-950/60 border border-indigo-800/60'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <p.icon className={`w-4 h-4 mt-0.5 ${p.color}`} />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{p.label}</div>
                      <div className="text-[11px] text-slate-400">{p.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href, link.isPage)}
                className={`text-sm font-medium transition-colors ${
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
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => onNavigate('/grader')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/40 rounded-lg transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Grader Free</span>
            </button>
            <button
              onClick={() => onNavigate('/checkout?plan=serial')}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-lg shadow-glow-indigo transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
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
              Launch Venture ($149/mo)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
