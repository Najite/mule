import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ProblemSection } from '@/components/ProblemSection';
import { FinintShiftSection } from '@/components/FinintShiftSection';
import { FlagshipCapabilitySection } from '@/components/FlagshipCapabilitySection';
import { ProductPreviewSection } from '@/components/ProductPreviewSection';
import { CoreCapabilitiesSection } from '@/components/CoreCapabilitiesSection';
import { RoiCalculatorSection } from '@/components/RoiCalculatorSection';
import { DifferentiationSection } from '@/components/DifferentiationSection';
import { FaqSection } from '@/components/FaqSection';
import { FinalCtaSection } from '@/components/FinalCtaSection';
import { Footer } from '@/components/Footer';
import { InvestigationModal } from '@/components/InvestigationModal';
import { DemoRequestModal } from '@/components/DemoRequestModal';
import { FinintAppPortal } from '@/components/portal/FinintAppPortal';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'portal' | 'landing'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'portal' || window.location.hash === '#portal') {
        return 'portal';
      }
    }
    return 'landing';
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'explore' | 'flow' | 'blueprint'>('explore');
  const [briefingOpen, setBriefingOpen] = useState(false);

  const handleSwitchToPortal = () => {
    setViewMode('portal');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'portal');
      window.history.pushState({ view: 'portal' }, '', url.toString());
    }
  };

  const handleSwitchToLanding = () => {
    setViewMode('landing');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.hash = '';
      window.history.pushState({ view: 'landing' }, '', url.pathname);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'portal' || window.location.hash === '#portal') {
        setViewMode('portal');
      } else {
        setViewMode('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenExplore = () => {
    setModalMode('explore');
    setModalOpen(true);
  };

  const handleOpenHowItWorks = () => {
    setModalMode('flow');
    setModalOpen(true);
  };

  const handleOpenBlueprint = () => {
    setModalMode('blueprint');
    setModalOpen(true);
  };

  if (viewMode === 'portal') {
    return <FinintAppPortal onSwitchToLanding={handleSwitchToLanding} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary selection:bg-signal selection:text-canvas">
      {/* Top Banner to Return to AML Portal */}
      <div className="bg-[#0B0F17] border-b border-[#1E293B] px-4 py-2 text-center text-xs font-mono text-slate-300 flex items-center justify-center gap-3 relative z-50">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">
          ZENITH BANK & NFIU REGULATORY TIER-1 ENFORCEMENT &bull; SUPABASE CLOUD ACTIVE
        </span>
        <button
          onClick={handleSwitchToPortal}
          className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
        >
          Launch AML Operations Portal &rarr;
        </button>
      </div>

      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-signal text-canvas font-semibold rounded-lg shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas"
      >
        Skip to content
      </a>

      {/* Navigation Header */}
      <Navbar
        onOpenExplore={handleOpenExplore}
        onOpenHowItWorks={handleOpenHowItWorks}
        onOpenBlueprint={handleOpenBlueprint}
        onLaunchPortal={handleSwitchToPortal}
        onOpenBriefing={() => setBriefingOpen(true)}
      />

      {/* Main Content Landmark */}
      <main id="main-content">
        {/* 1. Hero */}
        <HeroSection
          onOpenExplore={handleOpenExplore}
          onOpenHowItWorks={handleOpenHowItWorks}
          onOpenBlueprint={handleOpenBlueprint}
          onLaunchPortal={handleSwitchToPortal}
          onOpenBriefing={() => setBriefingOpen(true)}
        />

        {/* 2. Problem */}
        <ProblemSection />

        {/* 3. The FININT Shift */}
        <FinintShiftSection />

        {/* 4. Flagship Capability: Fraud Ring Intelligence */}
        <FlagshipCapabilitySection />

        {/* 5. Forensic Canvas Preview Showcase */}
        <ProductPreviewSection
          onOpenExplore={handleOpenExplore}
          onLaunchPortal={handleSwitchToPortal}
        />

        {/* 6. Core Capabilities */}
        <CoreCapabilitiesSection />

        {/* 7. Institutional Syndicate Loss & ROI Model */}
        <RoiCalculatorSection
          onOpenBriefing={() => setBriefingOpen(true)}
          onLaunchPortal={handleSwitchToPortal}
        />

        {/* 8. Differentiation */}
        <DifferentiationSection />

        {/* 9. Institutional Architecture & Compliance FAQ */}
        <FaqSection />

        {/* 10. Final CTA */}
        <FinalCtaSection
          onOpenExplore={handleOpenExplore}
          onOpenHowItWorks={handleOpenHowItWorks}
          onLaunchPortal={handleSwitchToPortal}
          onOpenBriefing={() => setBriefingOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Case Dossier & Flow Modal */}
      <InvestigationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />

      {/* Executive Briefing & Live Sandbox Request Modal */}
      <DemoRequestModal
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        onLaunchPortal={() => {
          setBriefingOpen(false);
          handleSwitchToPortal();
        }}
      />
    </div>
  );
};

export default App;
