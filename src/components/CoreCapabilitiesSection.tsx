import React from 'react';
import { Network, ShieldAlert, FileText, Briefcase, Check } from 'lucide-react';

export const CoreCapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      number: '01',
      title: 'Network Discovery',
      description:
        'Reveal relationships between accounts, devices, identities, locations, and beneficiaries.',
      details:
        'Traverse multi-hop transactional pathways to link seemingly disconnected retail profiles, identifying common hardware UUIDs, shared residential IP clusters, and synthetic identification footprints.',
      highlights: [
        'Multi-entity graph linkage across 6 telemetry tiers',
        'Hardware & device fingerprint resolution',
        'Beneficiary & offshore remittance nexus tracking',
      ],
      icon: Network,
    },
    {
      number: '02',
      title: 'Fraud Ring Intelligence',
      description:
        'Surface coordinated patterns across transaction networks.',
      details:
        'Detect structural topologies characteristic of money-mule rings, smurfing syndicates, and circular transaction laundering before funds escape jurisdiction.',
      highlights: [
        'Real-time cyclic and circular path algorithms',
        'Rapid dispersion & smurfing velocity heuristics',
        'Coordinated syndicate risk scoring & probability indices',
      ],
      icon: ShieldAlert,
    },
    {
      number: '03',
      title: 'Investigation Explanation',
      description:
        'Turn analytical signals into clear and evidence-linked summaries.',
      details:
        'Bridge the gap between complex algorithmic graph metrics and courtroom-admissible clarity. FININT synthesizes multi-account timelines into plain, objective forensic narratives.',
      highlights: [
        'Automated evidence-linked investigation summaries',
        'Chronological fund-movement timeline reconstruction',
        'Objective evidentiary source citations for compliance audits',
      ],
      icon: FileText,
    },
    {
      number: '04',
      title: 'Case Intelligence',
      description:
        'Organise entities, transaction paths, findings, and risk indicators into a reviewable case.',
      details:
        'Assemble all resolved nodes, transaction receipts, audit logs, and risk indicators into an operational dossier structured for compliance committees and law enforcement referral.',
      highlights: [
        'Comprehensive SAR-ready case dossier generation',
        'Entity freeze recommendations & asset tracking',
        'Chain-of-custody evidentiary audit logging',
      ],
      icon: Briefcase,
    },
  ];

  return (
    <section
      id="capabilities"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas-subtle/50"
      aria-labelledby="capabilities-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-signal mb-4">
            <span className="size-1.5 rounded-full bg-signal inline-block" />
            Core Platform Architecture
          </div>
          <h2
            id="capabilities-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            Four pillars of connected intelligence.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            Engineered specifically for financial intelligence units and criminal investigators,
            without the bloat of generic SaaS feature lists.
          </p>
        </div>

        {/* 4 Composed Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.number}
                className="bg-canvas-raised border border-border-medium hover:border-signal/40 rounded-2xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-lg group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
                    <div className="size-11 rounded-xl bg-canvas-overlay border border-border-medium flex items-center justify-center text-signal group-hover:bg-signal group-hover:text-canvas transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-text-muted">
                      {cap.number}
                    </span>
                  </div>

                  {/* Title & Core Proposition */}
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm font-medium text-signal/90 mb-4 leading-snug">
                    {cap.description}
                  </p>

                  {/* Detailed Description */}
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                    {cap.details}
                  </p>
                </div>

                {/* Substantive Highlights */}
                <div className="pt-6 border-t border-border-subtle">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-3 font-semibold">
                    Evidentiary Outputs
                  </div>
                  <ul className="space-y-2">
                    {cap.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-text-secondary"
                      >
                        <Check className="size-3.5 text-signal shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
