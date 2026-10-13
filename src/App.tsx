import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ProblemSection } from '@/components/ProblemSection';
import { FinintShiftSection } from '@/components/FinintShiftSection';
import { FlagshipCapabilitySection } from '@/components/FlagshipCapabilitySection';
import { InvestigationWorkbench } from '@/components/workbench/InvestigationWorkbench';
import { ProductPreviewSection } from '@/components/ProductPreviewSection';
import { CoreCapabilitiesSection } from '@/components/CoreCapabilitiesSection';
import { DifferentiationSection } from '@/components/DifferentiationSection';
import { FinalCtaSection } from '@/components/FinalCtaSection';
import { Footer } from '@/components/Footer';
import { InvestigationModal } from '@/components/InvestigationModal';
import { FinintAppPortal } from '@/components/portal/FinintAppPortal';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'portal' | 'landing'>('portal');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'explore' | 'flow' | 'blueprint'>('explore');

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
    return <FinintAppPortal onSwitchToLanding={() => setViewMode('landing')} />;
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
          onClick={() => setViewMode('portal')}
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
        onLaunchPortal={() => setViewMode('portal')}
      />

      {/* Main Content Landmark */}
      <main id="main-content">
        {/* 1. Hero */}
        <HeroSection
          onOpenExplore={handleOpenExplore}
          onOpenHowItWorks={handleOpenHowItWorks}
          onOpenBlueprint={handleOpenBlueprint}
          onLaunchPortal={() => setViewMode('portal')}
        />

        {/* 2. Problem */}
        <ProblemSection />

        {/* 3. The FININT Shift */}
        <FinintShiftSection />

        {/* 4. Flagship Capability: Fraud Ring Intelligence */}
        <FlagshipCapabilitySection />

        {/* 5. Live Functional Forensic Workbench */}
        <InvestigationWorkbench />

        {/* 6. Static Canvas Reference Preview */}
        <ProductPreviewSection onOpenExplore={handleOpenExplore} />

        {/* 7. Core Capabilities */}
        <CoreCapabilitiesSection />

        {/* 8. Differentiation */}
        <DifferentiationSection />

        {/* 9. Final CTA */}
        <FinalCtaSection
          onOpenExplore={handleOpenExplore}
          onOpenHowItWorks={handleOpenHowItWorks}
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
    </div>
  );
};

export default App;
