import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DifferentiationSection: React.FC = () => {
  return (
    <section
      id="differentiation"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas"
      aria-labelledby="differentiation-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-text-secondary mb-4">
            <span className="size-1.5 rounded-full bg-signal inline-block" />
            Strategic Comparison
          </div>
          <h2
            id="differentiation-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            Banks do not need{' '}
            <span className="text-text-secondary font-normal block sm:inline">
              more unexplained alerts.
            </span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            Adding more rules to legacy alert queues creates noise, not clarity.
            FININT shifts financial crime detection from reactive ticket handling to proactive
            syndicate disruption.
          </p>
        </div>

        {/* Side-by-Side Paradigm Contrast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* 1. Traditional Monitoring (The Broken Linear Funnel) */}
          <div className="bg-canvas-raised/50 border border-border-subtle rounded-2xl p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
                <div>
                  <span className="text-[11px] font-mono uppercase text-text-muted font-semibold tracking-wider">
                    Legacy Workflow
                  </span>
                  <h3 className="font-heading font-bold text-xl text-text-primary mt-1">
                    Traditional Monitoring
                  </h3>
                </div>
                <Badge variant="risk" className="font-mono text-xs">
                  Linear & Siloed
                </Badge>
              </div>

              {/* The Pipeline */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-border-subtle text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-slate-800 text-text-muted flex items-center justify-center text-[10px]">1</span>
                  <span className="font-semibold text-text-primary">Transaction</span>
                  <span className="text-text-muted">→ Single isolated debit or credit event</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-border-subtle text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-slate-800 text-text-muted flex items-center justify-center text-[10px]">2</span>
                  <span className="font-semibold text-text-primary">Static Rule</span>
                  <span className="text-text-muted">→ Rigid threshold (e.g. amount &gt; ₦5M)</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-border-subtle text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-slate-800 text-text-muted flex items-center justify-center text-[10px]">3</span>
                  <span className="font-semibold text-text-primary">Alert</span>
                  <span className="text-text-muted">→ 95%+ false positives; no network context</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-border-subtle text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-slate-800 text-text-muted flex items-center justify-center text-[10px]">4</span>
                  <span className="font-semibold text-text-primary">Manual review</span>
                  <span className="text-text-muted">→ Days spent swiveling across disconnected databases</span>
                </div>
              </div>

              {/* Weaknesses */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <XCircle className="size-4 text-risk shrink-0 mt-0.5" />
                  <span>Smurfing and micro-transactions easily circumvent static rules</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <XCircle className="size-4 text-risk shrink-0 mt-0.5" />
                  <span>No visibility into shared hardware, IMEI devices, or common controllers</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <XCircle className="size-4 text-risk shrink-0 mt-0.5" />
                  <span>Analysts suffer severe alert fatigue while coordinated rings operate freely</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle mt-8 text-xs font-mono text-text-muted">
              Outcome: Coordinated rings remain undetected until external police notification.
            </div>
          </div>

          {/* 2. FININT (The Connected Intelligence Architecture) */}
          <div className="bg-canvas-raised border border-signal/40 rounded-2xl p-7 sm:p-9 flex flex-col justify-between shadow-xl relative overflow-hidden">
            {/* Ambient amber warmth */}
            <div
              className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div>
              <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
                <div>
                  <span className="text-[11px] font-mono uppercase text-signal font-semibold tracking-wider">
                    FININT Paradigm
                  </span>
                  <h3 className="font-heading font-bold text-xl text-text-primary mt-1">
                    Connected Intelligence
                  </h3>
                </div>
                <Badge variant="signal" className="font-mono text-xs">
                  Graph-Native
                </Badge>
              </div>

              {/* The Pipeline */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-border-subtle text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-signal text-canvas font-bold flex items-center justify-center text-[10px]">1</span>
                  <span className="font-semibold text-text-primary">Transaction data</span>
                  <span className="text-text-muted">→ Full-stream multi-rail ingestion</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-signal/20 text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-signal text-canvas font-bold flex items-center justify-center text-[10px]">2</span>
                  <span className="font-semibold text-signal">Connected network</span>
                  <span className="text-text-muted">→ Dynamic entity & hardware graph resolution</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-signal/20 text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-signal text-canvas font-bold flex items-center justify-center text-[10px]">3</span>
                  <span className="font-semibold text-signal">Risk evidence</span>
                  <span className="text-text-muted">→ Coordinated typologies surfaced with proof</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-verified/30 text-xs text-text-secondary font-mono">
                  <span className="size-5 rounded-full bg-verified text-canvas font-bold flex items-center justify-center text-[10px]">4</span>
                  <span className="font-semibold text-verified">Investigation intel</span>
                  <span className="text-text-muted">→ Instant evidence-backed SAR package</span>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <CheckCircle2 className="size-4 text-signal shrink-0 mt-0.5" />
                  <span>Unmasks multi-account smurfing regardless of individual transfer sizes</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <CheckCircle2 className="size-4 text-signal shrink-0 mt-0.5" />
                  <span>Binds disparate entities through shared hardware, IP subnets, and KYC links</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <CheckCircle2 className="size-4 text-signal shrink-0 mt-0.5" />
                  <span>Replaces hundreds of isolated alerts with one coherent investigation dossier</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle mt-8 text-xs font-mono text-signal">
              Outcome: Coordinated syndicates uncovered and frozen within minutes of first velocity spike.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
