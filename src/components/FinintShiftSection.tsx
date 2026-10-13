import React from 'react';
import { GitFork } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const FinintShiftSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Fragmented transactions',
      subtitle: 'Raw Ingestion',
      description:
        'Individual transaction logs, isolated wire transfers, and localized payment events enter the pipeline without relational context.',
      tag: 'Raw Data',
      visual: (
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-canvas border border-border-subtle font-mono text-[11px] text-text-muted">
          <div className="flex justify-between items-center text-text-secondary">
            <span>TXN-8819</span>
            <span className="tabular-nums text-text-primary">₦2,400,000</span>
          </div>
          <div className="flex justify-between items-center text-text-secondary">
            <span>TXN-8820</span>
            <span className="tabular-nums text-text-primary">₦1,850,000</span>
          </div>
          <div className="flex justify-between items-center text-text-secondary">
            <span>TXN-8821</span>
            <span className="tabular-nums text-text-primary">₦980,000</span>
          </div>
        </div>
      ),
    },
    {
      step: '02',
      title: 'Connected entities',
      subtitle: 'Entity Resolution',
      description:
        'FININT extracts and binds hardware signatures, phone telemetry, shared IPs, and KYC anchors to unify distinct transaction endpoints.',
      tag: 'Entity Graph',
      visual: (
        <div className="p-3 rounded-lg bg-canvas border border-border-subtle flex flex-col gap-2 font-mono text-[11px]">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-signal">DEV-IOS-22</span>
            <span className="text-[10px] text-text-muted">Hardware Anchor</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-canvas-raised border border-border-subtle text-text-primary">ACC-4891</span>
            <span>↔</span>
            <span className="px-1.5 py-0.5 rounded bg-canvas-raised border border-border-subtle text-text-primary">ACC-8204</span>
          </div>
        </div>
      ),
    },
    {
      step: '03',
      title: 'Suspicious network',
      subtitle: 'Topology Detection',
      description:
        'Graph algorithms expose coordinated structures: rapid fund dispersion, circular layering loops, and multi-account mule clusters.',
      tag: 'Syndicate Ring',
      visual: (
        <div className="p-3 rounded-lg bg-canvas border border-signal/30 flex flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-risk font-semibold">RING-ALPHA-04</span>
            <span className="text-[10px] text-risk px-1.5 py-0.2 rounded bg-risk/10">Score 92</span>
          </div>
          <div className="text-[10px] text-text-secondary">
            Circular Velocity: 4 hops / 18 mins
          </div>
        </div>
      ),
    },
    {
      step: '04',
      title: 'Investigation intelligence',
      subtitle: 'Actionable Case',
      description:
        'Analytical signals transform into an evidence-linked case package with verifiable entity dossiers and regulatory SAR audit trails.',
      tag: 'Enforcement Ready',
      visual: (
        <div className="p-3 rounded-lg bg-canvas border border-verified/30 flex flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-verified">
            <span className="font-semibold">CASE-DOSSIER-04</span>
            <span className="text-[10px] uppercase font-bold text-verified">Ready</span>
          </div>
          <div className="text-[10px] text-text-secondary truncate">
            18 accounts linked • ₦14.2M exposure
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      id="shift"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas"
      aria-labelledby="shift-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-signal mb-4">
            <GitFork className="size-3.5 text-signal" aria-hidden="true" />
            The Architectural Shift
          </div>
          <h2
            id="shift-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            From isolated alerts{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal to-amber-200">
              to connected intelligence.
            </span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            Rather than processing millions of transactions in isolation, FININT synthesizes
            disparate telemetry into an ongoing graph intelligence pipeline.
          </p>
        </div>

        {/* Editorial Sequential Pipeline (Connected Horizontal on Desktop, Stacking on Mobile) */}
        <div className="relative">
          {/* Subtle Horizontal Connector Bar (Desktop) */}
          <div
            className="hidden lg:block absolute top-[52px] left-[6%] right-[6%] h-[1px] bg-gradient-to-r from-border-subtle via-signal/40 to-border-subtle -z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((item, index) => (
              <div
                key={index}
                className="bg-canvas-raised border border-border-medium hover:border-signal/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-md group"
              >
                <div>
                  {/* Step Badge & Step Index */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="size-10 rounded-xl bg-canvas-overlay border border-border-medium flex items-center justify-center font-mono font-bold text-sm text-signal group-hover:bg-signal group-hover:text-canvas transition-colors">
                      {item.step}
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {item.tag}
                    </Badge>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1">
                    {item.subtitle}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-text-primary mb-3">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Micro Visual Artifact */}
                <div className="mt-auto pt-4 border-t border-border-subtle">
                  {item.visual}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
