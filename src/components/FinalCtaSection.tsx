import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Network } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenExplore: () => void;
  onOpenHowItWorks: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenExplore,
  onOpenHowItWorks,
}) => {
  return (
    <section
      className="py-24 sm:py-36 border-t border-border-subtle relative bg-canvas-subtle overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background ambient center illumination */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] pointer-events-none opacity-20 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(239, 68, 68, 0.1) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-signal mb-6">
          <Network className="size-3.5 text-signal" aria-hidden="true" />
          Criminal Network Discovery
        </div>

        {/* Heading */}
        <h2
          id="cta-heading"
          className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] text-text-primary leading-[1.1] text-balance mb-6"
        >
          See what individual alerts{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal via-signal-light to-amber-200">
            cannot reveal.
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto text-pretty mb-10">
          Explore how FININT turns fragmented transaction activity into a connected
          view of financial risk.
        </p>

        {/* Dual Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            variant="default"
            onClick={onOpenExplore}
            className="gap-2 text-base font-semibold px-8 shadow-xl shadow-signal/20"
          >
            <span>Explore FININT</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onOpenHowItWorks}
            className="gap-2 text-base border-border-medium hover:bg-canvas-raised"
          >
            <span>View the Investigation Flow</span>
          </Button>
        </div>

        {/* Institutional Assurance */}
        <div className="mt-16 pt-8 border-t border-border-subtle flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-mono text-text-muted">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-verified" />
            SOC 2 Type II Certified Architecture
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-verified" />
            Courtroom-Admissible Evidence Logging
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-verified" />
            ISO 27001 Cryptographic Safeguards
          </span>
        </div>
      </div>
    </section>
  );
};
