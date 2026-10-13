import React from 'react';
import { Button } from '@/components/ui/button';
import { HeroArtwork } from '@/components/HeroArtwork';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onOpenExplore: () => void;
  onOpenHowItWorks: () => void;
  onOpenBlueprint?: () => void;
  onLaunchPortal?: () => void;
  onOpenBriefing?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenExplore,
  onOpenHowItWorks,
  onOpenBlueprint,
  onLaunchPortal,
  onOpenBriefing,
}) => {
  return (
    <section
      className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] pointer-events-none opacity-25 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(239, 68, 68, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Value Narrative (Cols 1-7) */}
          <div className="lg:col-span-7 flex flex-col z-10">
            {/* Eyebrow with category identifier */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase bg-signal/10 border border-signal/30 text-signal shadow-sm">
                <span className="size-2 rounded-full bg-signal animate-pulse" />
                Zenith Bank Zecathon 6.0 &bull; Track 6 Finalist
              </span>
              {onOpenBlueprint && (
                <button
                  type="button"
                  onClick={onOpenBlueprint}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-canvas-raised border border-border-medium hover:border-signal/50 text-text-secondary hover:text-signal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal cursor-pointer"
                  title="View Zenith Bank Zecathon 6.0 Track 6 Integration Blueprint"
                >
                  <ShieldCheck className="size-3.5 text-signal" />
                  <span>Technical Blueprint &rarr;</span>
                </button>
              )}
            </div>

            {/* Editorial Display Headline */}
            <h1
              id="hero-heading"
              className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl xl:text-[4.25rem] leading-[1.08] tracking-[-0.035em] text-text-primary text-balance mb-6"
            >
              <span className="block text-text-primary">Banks Detect Alerts.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-signal via-signal-light to-amber-200">
                FININT Reveals the Syndicate.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl text-pretty mb-8">
              Production-hardened institutional financial intelligence platform that connects
              isolated transaction alerts, hardware fingerprints, BVN identities, and NIP clearing telemetry
              in real time to disrupt money mule rings before funds exit jurisdiction.
            </p>

            {/* Dual CTAs (Marketing composition) */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              {onLaunchPortal ? (
                <Button
                  size="lg"
                  variant="default"
                  onClick={onLaunchPortal}
                  className="gap-2.5 text-base font-semibold px-7 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xl shadow-amber-500/25 border border-amber-400/50 cursor-pointer"
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

              {onOpenBriefing && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onOpenBriefing}
                  className="gap-2 text-base border-border-medium hover:border-signal/50 hover:bg-canvas-raised cursor-pointer"
                >
                  <ShieldCheck className="size-4 text-signal" />
                  <span>Request Briefing</span>
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                onClick={onOpenHowItWorks}
                className="gap-2 text-base border-border-medium hover:bg-canvas-raised cursor-pointer"
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

        {/* Full-Width Institutional Compliance & Integration Marquee Strip */}
        <div className="mt-16 pt-8 border-t border-border-subtle/70">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted shrink-0">
              Institutional Compliance & Clearing Standards
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 sm:gap-8 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle2 className="size-3.5 text-verified" />
                Infosys Finacle 11.0 FI SOAP
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle2 className="size-3.5 text-verified" />
                CBN AML/CFT 2022 PND Protocol
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle2 className="size-3.5 text-verified" />
                NIBSS NIP ISO 20022 pacs.008
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle2 className="size-3.5 text-verified" />
                NFIU UN goAML v5.0 SAR
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle2 className="size-3.5 text-verified" />
                NDPA 2023 §39 In-VPC Data Sovereignty
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
