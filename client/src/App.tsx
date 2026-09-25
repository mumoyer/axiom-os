import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation.js';
import { Footer } from './components/Footer.js';
import { LandingPage } from './pages/LandingPage.js';
import { GraderPage } from './pages/GraderPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { NewbieWizardPage } from './pages/NewbieWizardPage.js';
import { SerialDashboardPage } from './pages/SerialDashboardPage.js';
import { LiveVenturePage } from './pages/LiveVenturePage.js';
import { ProjectMessengerModal } from './components/ProjectMessengerModal.js';
import { AuthModal } from './components/AuthModal.js';
import { BetaBanner } from './components/BetaBanner.js';
import { BugReportModal } from './components/BugReportModal.js';
import { FounderSettingsModal } from './components/FounderSettingsModal.js';
import { AdminBugTriageModal } from './components/AdminBugTriageModal.js';
import { BrandAssetsPage } from './pages/BrandAssetsPage.js';
import { MessageSquare, Bug, Settings } from 'lucide-react';
import { getAuthProfile, verifyAuthToken, logoutAuth, AuthSessionData } from './services/api.js';
import { trackPageView } from './services/gtag.js';


export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedPersona, setSelectedPersona] = useState<'newbie' | 'serial' | 'enterprise'>('serial');
  const [currentVentureId, setCurrentVentureId] = useState<string>('');
  const [messengerOpen, setMessengerOpen] = useState<boolean>(false);
  const [bugReportModalOpen, setBugReportModalOpen] = useState<boolean>(false);
  const [founderSettingsOpen, setFounderSettingsOpen] = useState<boolean>(false);
  const [adminTriageOpen, setAdminTriageOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<{ email: string; tenantId: string; role?: string } | null>(null);

  // Load existing session or verify URL magic token
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for token in URL hash / query: /#verify?token=...
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : search.slice(1));
      const token = params.get('token');

      if (token) {
        try {
          const res = await verifyAuthToken(token);
          if (res.success && res.session) {
            localStorage.setItem('stagegate_auth_session', JSON.stringify(res.session));
            setAuthUser(res.session);
            // Clean URL and redirect to dashboard
            window.location.hash = '/dashboard';
            return;
          }
        } catch {}
      }

      // 2. Check localStorage
      try {
        const stored = localStorage.getItem('stagegate_auth_session');
        if (stored) {
          const parsed: AuthSessionData = JSON.parse(stored);
          if (parsed.sessionToken) {
            const profile = await getAuthProfile(parsed.sessionToken);
            if (profile.authenticated && profile.user) {
              setAuthUser(profile.user);
            } else {
              localStorage.removeItem('stagegate_auth_session');
            }
          }
        }
      } catch {}
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const stored = localStorage.getItem('stagegate_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionToken) {
          await logoutAuth(parsed.sessionToken);
        }
      }
    } catch {}
    localStorage.removeItem('stagegate_auth_session');
    setAuthUser(null);
  };

  // Parse path and query/hash
  const resolveRoute = (rawPath: string) => {
    let clean = rawPath.replace(/^#\/?/, '/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    if (!clean || clean === '') clean = '/';

    // Remove query params for route matching
    const pathnameOnly = clean.split('?')[0];

    if (pathnameOnly === '/settings' || pathnameOnly === '/founder-settings' || pathnameOnly === '/account') {
      setFounderSettingsOpen(true);
      return;
    } else if (pathnameOnly === '/admin/bugs' || pathnameOnly === '/admin') {
      setAdminTriageOpen(true);
      return;
    }

    if (pathnameOnly === '/launchpad/newbie') {
      setCurrentPath('/launchpad/newbie');
      setSelectedPersona('newbie');
    } else if (pathnameOnly === '/launchpad/serial' || pathnameOnly === '/dashboard') {
      setCurrentPath('/launchpad/serial');
      setSelectedPersona('serial');
    } else if (pathnameOnly.startsWith('/ventures/')) {
      const vid = pathnameOnly.replace('/ventures/', '');
      setCurrentVentureId(vid || '');
      setCurrentPath('/ventures');
    } else if (pathnameOnly.startsWith('/grader')) {
      setCurrentPath('/grader');
    } else if (pathnameOnly.startsWith('/brand') || pathnameOnly.startsWith('/logo') || pathnameOnly.startsWith('/assets')) {
      setCurrentPath('/brand');
    } else if (pathnameOnly.startsWith('/checkout') || pathnameOnly.startsWith('/subscribe')) {
      setCurrentPath('/checkout');
    } else {
      setCurrentPath('/');
    }
  };

  // Sync route from window location hash or pathname
  useEffect(() => {
    const handleRouteSync = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && hash !== '/') {
        resolveRoute(hash);
      } else {
        resolveRoute(window.location.pathname);
      }
    };

    handleRouteSync();
    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);

    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, []);

  // Virtual page view tracking for client-side route changes
  const entryHitReported = React.useRef(false);
  useEffect(() => {
    if (!entryHitReported.current) {
      entryHitReported.current = true;
      return;
    }
    const routePath =
      currentPath === '/ventures' && currentVentureId
        ? `/ventures/${currentVentureId}`
        : currentPath;
    trackPageView(routePath);
  }, [currentPath, currentVentureId]);


  const navigateTo = (path: string) => {
    window.location.hash = path;
    resolveRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePersonaChange = (persona: 'newbie' | 'serial' | 'enterprise') => {
    setSelectedPersona(persona);
    if (persona === 'newbie') {
      navigateTo('/launchpad/newbie');
    } else if (persona === 'serial') {
      navigateTo('/launchpad/serial');
    } else {
      navigateTo('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080C14] text-slate-100 antialiased font-sans">
      <BetaBanner onOpenBugReport={() => setBugReportModalOpen(true)} />

      <Navigation
        currentPath={currentPath}
        onNavigate={navigateTo}
        selectedPersona={selectedPersona}
        onSelectPersona={handlePersonaChange}
        authUser={authUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenBugReport={() => setBugReportModalOpen(true)}
        onOpenSettings={() => setFounderSettingsOpen(true)}
        onOpenAdminTriage={() => setAdminTriageOpen(true)}
      />

      <main className="flex-1">
        {currentPath === '/launchpad/newbie' && <NewbieWizardPage onNavigate={navigateTo} />}
        {currentPath === '/launchpad/serial' && <SerialDashboardPage onNavigate={navigateTo} />}
        {currentPath === '/ventures' && (
          <LiveVenturePage ventureId={currentVentureId} onNavigate={navigateTo} />
        )}
        {currentPath === '/grader' && <GraderPage onNavigate={navigateTo} />}
        {currentPath === '/brand' && <BrandAssetsPage onNavigate={navigateTo} />}
        {currentPath === '/checkout' && <CheckoutPage onNavigate={navigateTo} />}
        {currentPath === '/' && (
          <LandingPage
            onNavigate={navigateTo}
            selectedPersona={selectedPersona}
            onOpenBugReport={() => setBugReportModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Action Launchers */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        {/* Founder Settings Floating Button */}
        <button
          onClick={() => setFounderSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-medium shadow-xl shadow-black/60 border border-slate-700/60 transition-all hover:scale-105 active:scale-95 text-xs backdrop-blur-sm group"
          title="Manage active subscription, continuous renewal terms & 1-click cancellation"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-45 transition-transform" />
          <span className="font-semibold tracking-wide">Founder Settings</span>
        </button>

        {/* Bug Bounty Floating Quick-Action */}
        <button
          onClick={() => setBugReportModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-medium shadow-xl shadow-black/60 border border-amber-500/40 transition-all hover:scale-105 active:scale-95 text-xs backdrop-blur-sm group"
          title="Report a bug and earn Bug Bounty subscription credit"
        >
          <Bug className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="font-semibold tracking-wide">Report Bug <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 ml-1">Bounty</span></span>
        </button>

        {/* Project Messenger Launcher */}
        <button
          onClick={() => setMessengerOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium shadow-xl shadow-cyan-950/60 border border-cyan-400/40 transition-all hover:scale-105 active:scale-95 group"
          title="Direct Project Communication & Founder Support"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-cyan-100 group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse border-2 border-[#080C14]" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Project Chat</span>
        </button>
      </div>

      {/* Direct In-Product Messenger Modal */}
      <ProjectMessengerModal
        isOpen={messengerOpen}
        onClose={() => setMessengerOpen(false)}
        ventureId={currentVentureId}
      />

      {/* Bug Report & Bounty Modal */}
      <BugReportModal
        isOpen={bugReportModalOpen}
        onClose={() => setBugReportModalOpen(false)}
      />

      {/* Founder Settings & Click-to-Cancel Portal */}
      <FounderSettingsModal
        isOpen={founderSettingsOpen}
        onClose={() => setFounderSettingsOpen(false)}
        initialEmail={authUser?.email}
      />

      {/* Admin Bug Triage Cockpit (Jason Moyer) */}
      <AdminBugTriageModal
        isOpen={adminTriageOpen}
        onClose={() => setAdminTriageOpen(false)}
      />

      {/* Passwordless Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(session) => {
          setAuthUser(session);
        }}
      />

      <Footer onNavigate={navigateTo} onOpenBugReport={() => setBugReportModalOpen(true)} />
    </div>
  );
}

export default App;
