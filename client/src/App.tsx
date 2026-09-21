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
import { MessageSquare } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedPersona, setSelectedPersona] = useState<'newbie' | 'serial' | 'enterprise'>('serial');
  const [currentVentureId, setCurrentVentureId] = useState<string>('ven_docuflow_02');
  const [messengerOpen, setMessengerOpen] = useState<boolean>(false);

  // Parse path and query/hash
  const resolveRoute = (rawPath: string) => {
    let clean = rawPath.replace(/^#/, '');
    if (!clean || clean === '') clean = '/';

    // Remove query params for route matching
    const pathnameOnly = clean.split('?')[0];

    if (pathnameOnly === '/launchpad/newbie') {
      setCurrentPath('/launchpad/newbie');
      setSelectedPersona('newbie');
    } else if (pathnameOnly === '/launchpad/serial' || pathnameOnly === '/dashboard') {
      setCurrentPath('/launchpad/serial');
      setSelectedPersona('serial');
    } else if (pathnameOnly.startsWith('/ventures/')) {
      const vid = pathnameOnly.replace('/ventures/', '');
      setCurrentVentureId(vid || 'ven_docuflow_02');
      setCurrentPath('/ventures');
    } else if (pathnameOnly.startsWith('/grader')) {
      setCurrentPath('/grader');
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
      <Navigation
        currentPath={currentPath}
        onNavigate={navigateTo}
        selectedPersona={selectedPersona}
        onSelectPersona={handlePersonaChange}
      />

      <main className="flex-1">
        {currentPath === '/launchpad/newbie' && <NewbieWizardPage onNavigate={navigateTo} />}
        {currentPath === '/launchpad/serial' && <SerialDashboardPage onNavigate={navigateTo} />}
        {currentPath === '/ventures' && (
          <LiveVenturePage ventureId={currentVentureId} onNavigate={navigateTo} />
        )}
        {currentPath === '/grader' && <GraderPage onNavigate={navigateTo} />}
        {currentPath === '/checkout' && <CheckoutPage onNavigate={navigateTo} />}
        {currentPath === '/' && (
          <LandingPage
            onNavigate={navigateTo}
            selectedPersona={selectedPersona}
          />
        )}
      </main>

      {/* Floating Project Messenger Launcher */}
      <div className="fixed bottom-6 right-6 z-40">
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

      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default App;
