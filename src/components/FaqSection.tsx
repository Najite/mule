import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Cpu } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'core' | 'regulatory' | 'topology' | 'deployment';
  question: string;
  answer: string;
  technicalNote?: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'finacle-integration',
    category: 'core',
    question: 'How does FININT integrate with Infosys Finacle 11.0 FI SOAP without modifying our core banking switch?',
    answer:
      'FININT deploys as an asynchronous, non-invasive intelligence sidecar. It consumes read-only ISO 20022 pacs.008 clearing messages via Kafka/MQ from the bank’s NIBSS integration broker. When high-confidence syndicate rings are detected, automated or analyst-approved freezes dispatch standard, audited PND_MAINT SOAP envelopes directly to Finacle’s Financial Integration (FI) layer with complete idempotency and cryptographic audit logging.',
    technicalNote: 'Compatible with Finacle 10.x, 11.0, 11.2 FI SOAP web services and Temenos T24 Transact REST APIs.',
  },
  {
    id: 'ndpa-compliance',
    category: 'regulatory',
    question: 'Does cross-bank hardware and telemetry matching violate the Nigeria Data Protection Act (NDPA 2023)?',
    answer:
      'No. In compliance with NDPA 2023 §39 and CBN AML/CFT 2022 Guidelines, FININT operates an in-VPC zero-knowledge matching architecture. Hardware identifiers (IMEI, MAC, canvas fingerprint) and BVNs are salted with institution-specific cryptographic keys and hashed via SHA-256 before inter-bank consortium matching. No unencrypted customer PII, account names, or private keystrokes ever leave the bank’s sovereign perimeter.',
    technicalNote: 'Full compliance certification under NDPA 2023 §39 (Legitimate Interest for AML & Financial Crime Prevention).',
  },
  {
    id: 'automated-pnd',
    category: 'regulatory',
    question: 'Can FININT execute automated Post-No-Debit (PND) account freezes, or is human-in-the-loop mandatory?',
    answer:
      'FININT supports a dual-tier policy configured by each institution’s Chief Risk Officer. For ultra-high-velocity circular rings (risk score > 90 with active outbound velocity under 3 minutes), the system can trigger an automated 30-minute temporary debit hold to preserve capital. Permanent PND filings under CBN regulations require a 1-click human investigator confirmation with full courtroom-admissible audit trails.',
    technicalNote: 'Configurable risk thresholds: automated hold at score ≥ 90; analyst triage queue at score 60-89.',
  },
  {
    id: 'graph-vs-rules',
    category: 'topology',
    question: 'How does graph-native ring detection outperform traditional rule-based transaction monitoring systems?',
    answer:
      'Traditional TMS relies on static thresholds (e.g., transfers exceeding ₦5,000,000). Organized criminal syndicates evade this trivially using "smurfing"—partitioning ₦50M into 1,000 transfers of ₦49,500 across dozens of newly activated student or fintech wallets. FININT executes in-memory Tarjan cyclic pathfinding and fan-out graph algorithms that detect the coordinated cluster topology regardless of individual transaction denominations.',
    technicalNote: 'Detects 4 primary ring typologies: rapid dispersion, circular layering, fan-in/fan-out, and shared-device clusters.',
  },
  {
    id: 'sovereign-deployment',
    category: 'deployment',
    question: 'Can FININT be deployed on-premise in a sovereign Tier-3 data center or air-gapped private VPC?',
    answer:
      'Yes. FININT is containerized via Kubernetes (Helm / OpenShift) and engineered for private, zero-internet-egress deployments. Tier-1 banks can host the entire graph database (Neo4j Enterprise / Memgraph), machine learning inference engines, and telemetry pipelines inside their primary and disaster-recovery (DR) data centers or dedicated sovereign cloud enclaves (Azure Nigeria / AWS GovCloud).',
    technicalNote: 'Requires zero external API dependencies. Fully air-gapped deployment option available.',
  },
  {
    id: 'clearing-latency',
    category: 'topology',
    question: 'What is the end-to-end latency between incoming NIP pacs.008 settlement and syndicate graph resolution?',
    answer:
      'FININT processes high-velocity streams with a median end-to-end latency of 180 to 240 milliseconds. The streaming pipeline utilizes Kafka message buses and optimized graph indices, enabling the intelligence engine to surface coordinated rings and trigger containment before funds are routed downstream into cash-out agents or cryptocurrency off-ramps.',
    technicalNote: 'Benchmarked at 45,000 transactions per second per cluster node on standard 32-core banking hardware.',
  },
];

export const FaqSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'core' | 'regulatory' | 'topology' | 'deployment'>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'finacle-integration': true,
    'ndpa-compliance': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs =
    activeCategory === 'all' ? FAQS : FAQS.filter((item) => item.category === activeCategory);

  return (
    <section
      id="faq"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-signal mb-4">
            <HelpCircle className="size-3.5 text-signal" aria-hidden="true" />
            Institutional Architecture FAQ
          </div>
          <h2
            id="faq-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            Engineering, regulatory, and clearing realities.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            Direct, zero-hallucination answers to the critical technical and legal questions asked by
            Chief Risk Officers, Lead Architects, and Compliance Committees.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 mb-10">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'core', label: 'Core Banking & Finacle' },
            { id: 'regulatory', label: 'NDPA 2023 & CBN Regulations' },
            { id: 'topology', label: 'Graph Topology & Latency' },
            { id: 'deployment', label: 'Sovereign Deployment' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-signal/15 border-signal text-signal font-semibold'
                  : 'bg-canvas-raised border-border-medium text-text-secondary hover:text-text-primary hover:border-border-strong'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4 max-w-4xl">
          {filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-canvas-raised border border-border-medium rounded-xl overflow-hidden transition-colors shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-6 sm:p-7 flex items-start justify-between gap-4 cursor-pointer hover:bg-canvas-overlay/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-heading font-bold text-base sm:text-lg text-text-primary leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`size-7 rounded-lg bg-canvas border border-border-subtle flex items-center justify-center shrink-0 text-text-muted transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-signal border-signal/40' : ''
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-1 border-t border-border-subtle/50 text-sm text-text-secondary leading-relaxed space-y-3.5 animate-in fade-in-50 duration-200">
                    <p>{faq.answer}</p>
                    {faq.technicalNote && (
                      <div className="p-3 rounded-lg bg-canvas border border-border-subtle flex items-center gap-2.5 text-xs font-mono text-text-muted">
                        <Cpu className="size-3.5 text-signal shrink-0" />
                        <span>{faq.technicalNote}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
