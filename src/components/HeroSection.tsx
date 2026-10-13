import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HeroArtwork } from '@/components/HeroArtwork';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onOpenExplore: () => void;
  onOpenHowItWorks: () => void;
  onOpenBlueprint?: () => void;
  onLaunchPortal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenExplore,
  onOpenHowItWorks,
  onOpenBlueprint,
  onLaunchPortal,
}) => {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const headlines = [
    {
      line1: 'Banks Detect Alerts.',
      line2: 'FININT Reveals the Network.',
    },
    {
      line1: 'See the Network',
      line2: 'Behind Financial Crime.',
    },
  ];

  const currentHeadline = headlines[headlineIndex];

  return (
    <section
      className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] pointer-events-none opacity-25 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(239, 68, 68, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Value Narrative (Cols 1-7) */}
          <div className="lg:col-span-7 flex flex-col z-10">
            {/* Eyebrow with category identifier */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-medium tracking-wider uppercase bg-signal/10 border border-signal/30 text-signal">
                <span className="size-1.5 rounded-full bg-signal inline-block" />
                Financial Criminal Intelligence
              </span>
              {onOpenBlueprint && (
                <button
                  type="button"
                  onClick={onOpenBlueprint}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-medium tracking-wide bg-canvas-raised border border-border-medium hover:border-signal/50 text-text-secondary hover:text-signal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal cursor-pointer"
                  title="View Zenith Bank Zecathon 6.0 Track 6 Integration Blueprint"
                >
                  <ShieldCheck className="size-3 text-signal" />
                  <span>Zenith Zecathon 6.0 Track 6</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setHeadlineIndex((prev) => (prev === 0 ? 1 : 0))}
                className="text-[10px] sm:text-[11px] font-mono text-text-muted hover:text-text-secondary underline decoration-dotted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal rounded px-1"
                title="Switch headline phrasing"
                aria-label="Toggle alternative headline"
              >
                Toggle headline
              </button>
            </div>

            {/* Editorial Display Headline */}
            <h1
              id="hero-heading"
              className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl xl:text-[4.25rem] leading-[1.08] tracking-[-0.035em] text-text-primary text-balance mb-6"
            >
              <span className="block text-text-primary">{currentHeadline.line1}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-signal via-signal-light to-amber-200">
                {currentHeadline.line2}
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl text-pretty mb-8">
              FININT connects transactions, accounts, devices, identities, and money
              flows to help investigators uncover coordinated fraud and turn
              fragmented signals into actionable intelligence.
            </p>

            {/* Dual CTAs (Marketing composition) */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              {onLaunchPortal ? (
                <Button
                  size="lg"
                  variant="default"
                  onClick={onLaunchPortal}
                  className="gap-2.5 text-base font-semibold px-7 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xl shadow-amber-500/25 border border-amber-400/50"
                >
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Launch AML Operations Portal</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="default"
                  onClick={onOpenExplore}
                  className="gap-2 text-base font-semibold px-7 shadow-lg shadow-signal/15"
                >
                  <span>Explore FININT</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                onClick={onOpenHowItWorks}
                className="gap-2 text-base border-border-medium hover:bg-canvas-raised"
              >
                <span>See How It Works</span>
              </Button>
            </div>

            {/* Substantive Intelligence Telemetry Strip */}
            <div className="pt-8 border-t border-border-subtle grid grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                  04
                </span>
                <span className="text-xs text-text-muted mt-0.5 leading-snug">
                  Coordinated ring typologies
                </span>
              </div>
              <div className="flex flex-col border-l border-border-subtle pl-4 sm:pl-6">
                <span className="font-heading text-xl sm:text-2xl font-bold text-signal tabular-nums">
                  ₦14.2M
                </span>
                <span className="text-xs text-text-muted mt-0.5 leading-snug">
                  Uncovered syndicate exposure
                </span>
              </div>
              <div className="flex flex-col border-l border-border-subtle pl-4 sm:pl-6">
                <span className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                  6-Tier
                </span>
                <span className="text-xs text-text-muted mt-0.5 leading-snug">
                  Multi-entity graph resolution
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Artwork Visual (Cols 8-12) */}
          <div className="lg:col-span-5 relative z-10">
            <HeroArtwork />
          </div>
        </div>
      </div>
    </section>
  );
};
