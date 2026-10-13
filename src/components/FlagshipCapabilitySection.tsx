import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Share2, Repeat, Smartphone, ShieldAlert, Info } from 'lucide-react';

export const FlagshipCapabilitySection: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState(0);

  const patterns = [
    {
      id: 'dispersion',
      code: 'TYP-01',
      title: 'Rapid fund dispersion',
      tagline: 'Velocity splintering to evade reporting thresholds',
      icon: Zap,
      description:
        'Large incoming deposits are partitioned into dozens of sub-threshold transfers within minutes, rapidly fanning out across multiple downstream mule accounts to frustrate traditional static rules.',
      indicators: [
        'Time-to-dispersion under 8 minutes from primary credit',
        'Systematic amount quantization (e.g., ₦49,500 just below ₦50k thresholds)',
        'Immediate withdrawal or secondary forward transfers',
      ],
      investigationNote:
        'Risk indicator requiring investigation. While characteristic of laundering layering, legitimate payroll runs or vendor disbursements can display similar velocity.',
      metric: '8m median velocity window',
    },
    {
      id: 'fan',
      code: 'TYP-02',
      title: 'Fan-in and fan-out activity',
      tagline: 'Multi-source aggregation followed by coordinated distribution',
      icon: Share2,
      description:
        'Dozens of peripheral funding sources channel liquidity into a central hub (fan-in), which immediately initiates coordinated outgoing transfers to disparate beneficiary targets (fan-out).',
      indicators: [
        'High in-degree centrality coupled with immediate out-degree surge',
        'Transient hub balance holding liquidity for less than 1 hour',
        'Geographic divergence between originators and beneficiaries',
      ],
      investigationNote:
        'Risk indicator requiring investigation. Requires cross-referencing with registered merchant category codes and verified corporate invoices.',
      metric: '32-to-1 aggregation ratio',
    },
    {
      id: 'circular',
      code: 'TYP-03',
      title: 'Circular movement',
      tagline: 'Closed-loop fund rotation to fabricate legitimate turnover',
      icon: Repeat,
      description:
        'Capital hops through 3 or more intermediary accounts across different institutions before returning to an entity closely connected to the original sender, generating fake trade volume.',
      indicators: [
        'Cyclic path detected in directed multigraph (A → B → C → A)',
        'Capital retention > 94% across complete cycle loop',
        'Absence of corresponding commercial invoices or goods transport',
      ],
      investigationNote:
        'High-confidence risk indicator. Requires checking for circular escrow or affiliated group corporate structures prior to escalation.',
      metric: '4-node closed cycle',
    },
    {
      id: 'device',
      code: 'TYP-04',
      title: 'Shared devices or identities',
      tagline: 'Hardware and biometric convergence across distinct accounts',
      icon: Smartphone,
      description:
        'Seemingly unrelated individuals operate accounts registered with distinct names and addresses, yet authenticate through identical mobile device IDs, browser fingerprints, or synthetic KYC traits.',
      indicators: [
        'Single device UUID associated with 5+ distinct retail account sessions',
        'Concurrent login timestamps from conflicting physical GPS coordinates',
        'Recycled identity elements (e.g., matching phone prefix or national ID fragments)',
      ],
      investigationNote:
        'Strong syndicate correlation. Requires eliminating shared household family hardware or community rural access points.',
      metric: '1 device : 6 active accounts',
    },
  ];

  const current = patterns[selectedPattern];
  const CurrentIcon = current.icon;

  return (
    <section
      id="flagship"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas-subtle/40"
      aria-labelledby="flagship-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-signal/10 border border-signal/30 text-signal mb-4">
            <ShieldAlert className="size-3.5 text-signal" aria-hidden="true" />
            Flagship Capability
          </div>
          <h2
            id="flagship-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            Fraud Ring Intelligence
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            FININT reconstructs implicit relationships across financial entities, surfacing
            structural topologies characteristic of coordinated criminal networks.
          </p>

          {/* Legal / Investigative Nuance Disclaimer */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-canvas-raised border border-border-medium text-xs text-text-secondary">
            <Info className="size-4 text-signal shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-text-primary">Investigative Principle:</strong> These patterns
              are presented as <em>risk indicators requiring human investigation</em>, never as
              automated or incontrovertible proof of criminal guilt. FININT provides the contextual
              evidence so investigators can act with complete evidentiary integrity.
            </p>
          </div>
        </div>

        {/* Pattern Exploration Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Pattern Navigation Selector List (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            {patterns.map((item, index) => {
              const Icon = item.icon;
              const isSelected = selectedPattern === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPattern(index)}
                  className={`text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                    isSelected
                      ? 'bg-canvas-raised border-signal/50 shadow-md shadow-signal/5'
                      : 'bg-canvas/60 border-border-subtle hover:border-border-medium hover:bg-canvas-raised/50'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-signal text-canvas'
                        : 'bg-canvas-overlay text-text-secondary'
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono text-text-muted">{item.code}</span>
                      {isSelected && (
                        <span className="size-1.5 rounded-full bg-signal inline-block" />
                      )}
                    </div>
                    <div
                      className={`text-sm font-heading font-semibold truncate ${
                        isSelected ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {item.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Pattern Forensic Deep-Dive Canvas (8 Cols) */}
          <div className="lg:col-span-8 bg-canvas-raised border border-border-medium rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              {/* Header of Active Pattern */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-border-subtle mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
                    <CurrentIcon className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase text-signal font-semibold tracking-wider">
                      {current.code} • Pattern Topology
                    </span>
                    <h3 className="font-heading font-bold text-xl text-text-primary">
                      {current.title}
                    </h3>
                  </div>
                </div>

                <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                  {current.metric}
                </Badge>
              </div>

              {/* Tagline & Detailed Narrative */}
              <p className="text-sm font-medium text-text-primary mb-3">
                {current.tagline}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Key Risk Indicators */}
              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3 font-semibold">
                  Observable Forensic Indicators
                </div>
                <div className="space-y-2">
                  {current.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-text-secondary bg-canvas p-2.5 rounded-lg border border-border-subtle"
                    >
                      <span className="size-1.5 rounded-full bg-signal shrink-0 mt-1.5" />
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Forensic Note */}
            <div className="pt-5 border-t border-border-subtle mt-4">
              <div className="p-3.5 rounded-xl bg-canvas-overlay border border-border-subtle flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
                <Info className="size-4 text-text-secondary shrink-0 mt-0.5" />
                <span>{current.investigationNote}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
