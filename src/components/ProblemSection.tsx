import React from 'react';
import { AlertCircle, EyeOff, Layers, Smartphone, Users, Split, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ProblemSection: React.FC = () => {
  const blindspots = [
    {
      icon: Users,
      title: 'Connected accounts',
      description:
        'Syndicates disperse capital across dozens of retail accounts that appear totally unrelated to single-account rule thresholds.',
    },
    {
      icon: Smartphone,
      title: 'Shared devices & identities',
      description:
        'Multiple accounts operated by the same criminal cell share subtle hardware identifiers, IMEI fingerprints, or synthetic IDs.',
    },
    {
      icon: Split,
      title: 'Movement of funds',
      description:
        'Funds are rapidly split into micro-amounts (smurfing) and aggregated downstream, hiding the holistic velocity trajectory.',
    },
    {
      icon: Layers,
      title: 'Central and peripheral entities',
      description:
        'Disposable mules trigger false-positive alerts while core syndicate hubs, coordinators, and cash-out points remain invisible.',
    },
    {
      icon: RefreshCw,
      title: 'Coordinated behavioural patterns',
      description:
        'Synchronized timings, repetitive circular transfers, and fan-out motions cannot be spotted by evaluating transactions in isolation.',
    },
  ];

  return (
    <section
      id="problem"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas-subtle/50"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-text-secondary mb-4">
            <EyeOff className="size-3.5 text-signal" aria-hidden="true" />
            The Investigation Dilemma
          </div>
          <h2
            id="problem-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary text-balance leading-tight"
          >
            Alerts identify events.{' '}
            <span className="text-text-secondary font-normal block sm:inline">
              They rarely explain the operation.
            </span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            Modern transaction-monitoring systems generate millions of isolated notifications.
            Without a coherent network view, investigators are forced to inspect disconnected
            data points while sophisticated criminal operations stay hidden in plain sight.
          </p>
        </div>

        {/* Editorial Comparative Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: The Slogan / Dilemma Representation (5 Cols) */}
          <div className="lg:col-span-5 bg-canvas-raised border border-border-medium rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
              <span className="text-xs font-mono font-semibold uppercase text-text-muted tracking-wider">
                Current State: Legacy Monitoring
              </span>
              <Badge variant="risk" className="font-mono text-[10px]">
                Fragmented Signal
              </Badge>
            </div>

            <div className="space-y-3.5">
              <div className="bg-canvas border border-border-subtle rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-risk/10 border border-risk/30 flex items-center justify-center text-risk text-xs font-mono">
                    #01
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Alert: High Velocity Transfer</div>
                    <div className="text-[11px] text-text-muted font-mono">ACC-4891 • ₦2.4M outgoing</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase">Siloed</span>
              </div>

              <div className="bg-canvas border border-border-subtle rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-risk/10 border border-risk/30 flex items-center justify-center text-risk text-xs font-mono">
                    #02
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Alert: Dormant Account Inflow</div>
                    <div className="text-[11px] text-text-muted font-mono">ACC-8204 • ₦1.8M incoming</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase">Siloed</span>
              </div>

              <div className="bg-canvas border border-border-subtle rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-risk/10 border border-risk/30 flex items-center justify-center text-risk text-xs font-mono">
                    #03
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Alert: New Device Registered</div>
                    <div className="text-[11px] text-text-muted font-mono">DEV-IOS-22 • IMEI Mismatch</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase">Siloed</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-risk/5 border border-risk/20">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-4 text-risk shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">The Missing Link:</strong> These three alerts were treated by three different analysts as unrelated false positives, failing to recognize they belong to the exact same money-mule syndicate.
                </p>
              </div>
            </div>
          </div>

          {/* Right: The 5 Blindspots (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="text-xs font-mono font-semibold uppercase text-signal tracking-wider mb-1">
              Coordinated Network Blindspots Resolved by FININT
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blindspots.slice(0, 4).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="bg-canvas-raised/60 hover:bg-canvas-raised border border-border-subtle hover:border-border-medium rounded-xl p-5 transition-colors duration-150 flex flex-col"
                  >
                    <div className="size-9 rounded-lg bg-canvas-overlay border border-border-subtle flex items-center justify-center text-signal mb-3.5">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="font-heading font-semibold text-sm text-text-primary mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 5th Wide Item */}
            <div className="bg-canvas-raised/60 hover:bg-canvas-raised border border-border-subtle hover:border-border-medium rounded-xl p-5 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="size-9 rounded-lg bg-canvas-overlay border border-border-subtle flex items-center justify-center text-signal shrink-0">
                <RefreshCw className="size-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-sm text-text-primary mb-1">
                  {blindspots[4].title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {blindspots[4].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
