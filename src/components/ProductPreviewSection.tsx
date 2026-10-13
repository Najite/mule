import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  Landmark,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProductPreviewSectionProps {
  onOpenExplore: () => void;
}

export const ProductPreviewSection: React.FC<ProductPreviewSectionProps> = ({
  onOpenExplore,
}) => {
  const [activeNode, setActiveNode] = useState<'acc1' | 'acc2' | 'dev1' | 'hub'>('hub');

  const nodeDetails = {
    hub: {
      title: 'Circular Mule Ring #04',
      type: 'Syndicate Network Cluster',
      riskScore: 92,
      exposure: '₦14,250,000',
      entities: '5 Accounts • 2 Devices • 1 Offshore Destination',
      narrative:
        'Coordinated circular layering detected. Capital routed across 4 intermediary accounts within 22 minutes to simulate legitimate commercial turnover before consolidating into offshore account BEN-OFFSHORE-09.',
      evidence: [
        'Rapid fund dispersion under 5m velocity',
        'Device IMEI shared across 3 unrelated retail accounts',
        'No matching commercial invoice recorded in clearing registry',
      ],
      recommendation: 'Recommend immediate account freeze and filing SAR Category 4 (Laundering Layering).',
    },
    acc1: {
      title: 'Account ACC-4891',
      type: 'Mule Influx Node',
      riskScore: 84,
      exposure: '₦4,200,000',
      entities: 'Retail Checking • Opened 12 days ago',
      narrative:
        'Primary inbound entry point. Received 14 micro-transfers (₦250k–₦400k) from mobile money agents within 40 minutes. Immediate outward push to ACC-8204.',
      evidence: [
        'Dormant account activated with high-frequency velocity',
        'Outward transfer within 120 seconds of inward credit',
        'Authenticated via shared iPhone DEV-IOS-22',
      ],
      recommendation: 'Flag for mule recruitment review; request source of wealth documentation.',
    },
    acc2: {
      title: 'Account ACC-8204',
      type: 'Intermediary Layering Node',
      riskScore: 78,
      exposure: '₦3,850,000',
      entities: 'Corporate SME Account',
      narrative:
        'Purported logistics vendor account acting as pass-through bridge. Retained zero balance overnight; immediately forwarded 98% of inbound funds.',
      evidence: [
        'Zero business operational overhead expenses',
        'Pass-through retention ratio < 2%',
        'Concurrent IP login with ACC-4891',
      ],
      recommendation: 'Perform emergency corporate registry audit and beneficial ownership review.',
    },
    dev1: {
      title: 'Device DEV-IOS-22',
      type: 'Hardware Anchor Signature',
      riskScore: 96,
      exposure: '₦14,250,000 Aggregate',
      entities: 'Apple iPhone 15 Pro • IMEI Fingerprint 8821..04',
      narrative:
        'Single physical device authenticated 3 distinct retail bank accounts within 14 minutes across disparate registered account owner names.',
      evidence: [
        'Geolocation ping: Ikeja, Lagos (all 3 logins)',
        '3 distinct KYC holder profiles operated concurrently',
        'VPN proxy evasion detected on 2 sessions',
      ],
      recommendation: 'Blacklist hardware token signature across core banking gateway.',
    },
  };

  const current = nodeDetails[activeNode];

  return (
    <section
      id="preview"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas"
      aria-labelledby="preview-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-text-secondary mb-4">
            <Layers className="size-3.5 text-signal" aria-hidden="true" />
            Forensic Intelligence Interface
          </div>
          <h2
            id="preview-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            The intelligence canvas in action.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            A restrained look at how FININT resolves fragmented data points into a unified,
            evidence-linked investigative narrative.
          </p>
        </div>

        {/* Integrated Product Canvas */}
        <div className="bg-canvas-raised border border-border-medium rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Top Window Chrome Bar */}
          <div className="px-5 py-3.5 border-b border-border-subtle bg-canvas-overlay/70 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="size-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="size-2.5 rounded-full bg-slate-700 inline-block" />
              </div>
              <div className="h-4 w-[1px] bg-border-subtle" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-text-primary">
                  CASE-2026-089
                </span>
                <span className="text-xs text-text-muted">/</span>
                <span className="text-xs text-text-secondary font-medium">
                  Apex Circular Syndicate Ring
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Badge variant="risk" className="font-mono text-xs gap-1">
                <ShieldAlert className="size-3" />
                Risk Score: 92
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                ₦14,250,000 Exposure
              </Badge>
            </div>
          </div>

          {/* Main Workspace: Left Interactive Graph + Right Evidence Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
            {/* Left Graph Visualization Area (7 Cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 bg-canvas-subtle/70 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle relative select-none">
              {/* Filter / Interaction Prompt */}
              <div className="flex items-center justify-between text-xs text-text-muted mb-4 z-10">
                <span>Select an entity node to inspect evidence:</span>
                <span className="font-mono text-[11px] text-signal">Interactive Topology</span>
              </div>

              {/* Schematic Network Layout */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-canvas/60 rounded-xl border border-border-subtle p-4 flex items-center justify-center">
                {/* Visual Connector Lines */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 500 300"
                  fill="none"
                >
                  {/* Flow 1: Acc1 to Acc2 */}
                  <path
                    d="M 120 80 Q 250 50 380 90"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Flow 2: Acc1 to Hub */}
                  <path
                    d="M 120 80 Q 180 160 250 180"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                  />
                  {/* Flow 3: Acc2 to Hub */}
                  <path
                    d="M 380 90 Q 320 150 250 180"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                  />
                  {/* Hardware links */}
                  <path
                    d="M 250 60 L 120 80"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <path
                    d="M 250 60 L 380 90"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </svg>

                {/* Node 1: DEV-IOS-22 (Top Center) */}
                <button
                  type="button"
                  onClick={() => setActiveNode('dev1')}
                  className={`absolute top-[8%] sm:top-[10%] left-[50%] -translate-x-1/2 p-1.5 sm:p-2 rounded-lg border text-[11px] sm:text-xs font-mono transition-all btn-press focus-visible:ring-2 focus-visible:ring-signal ${
                    activeNode === 'dev1'
                      ? 'bg-signal text-canvas border-signal font-bold shadow-lg shadow-signal/20'
                      : 'bg-canvas-raised border-border-medium text-text-primary hover:border-signal/50'
                  }`}
                  aria-label="Inspect Shared Device DEV-IOS-22"
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="size-3 sm:size-3.5" />
                    <span>DEV-IOS-22</span>
                  </div>
                </button>

                {/* Node 2: ACC-4891 (Left) */}
                <button
                  type="button"
                  onClick={() => setActiveNode('acc1')}
                  className={`absolute top-[28%] left-[4%] sm:left-[16%] p-1.5 sm:p-2.5 rounded-lg border text-[11px] sm:text-xs font-mono transition-all btn-press focus-visible:ring-2 focus-visible:ring-signal ${
                    activeNode === 'acc1'
                      ? 'bg-signal text-canvas border-signal font-bold shadow-lg shadow-signal/20'
                      : 'bg-canvas-raised border-border-medium text-text-primary hover:border-signal/50'
                  }`}
                  aria-label="Inspect Account ACC-4891"
                >
                  <div className="flex items-center gap-1.5">
                    <Landmark className="size-3 sm:size-3.5" />
                    <span>ACC-4891</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 tabular-nums">₦4.2M out</div>
                </button>

                {/* Node 3: ACC-8204 (Right) */}
                <button
                  type="button"
                  onClick={() => setActiveNode('acc2')}
                  className={`absolute top-[28%] right-[4%] sm:right-[16%] p-1.5 sm:p-2.5 rounded-lg border text-[11px] sm:text-xs font-mono transition-all btn-press focus-visible:ring-2 focus-visible:ring-signal ${
                    activeNode === 'acc2'
                      ? 'bg-signal text-canvas border-signal font-bold shadow-lg shadow-signal/20'
                      : 'bg-canvas-raised border-border-medium text-text-primary hover:border-signal/50'
                  }`}
                  aria-label="Inspect Account ACC-8204"
                >
                  <div className="flex items-center gap-1.5">
                    <Landmark className="size-3 sm:size-3.5" />
                    <span>ACC-8204</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 tabular-nums">₦3.8M out</div>
                </button>

                {/* Node 4: The Central Syndicate Hub (Center-Bottom) */}
                <button
                  type="button"
                  onClick={() => setActiveNode('hub')}
                  className={`absolute bottom-[10%] sm:bottom-[16%] left-[50%] -translate-x-1/2 p-2 sm:p-3.5 rounded-xl border text-[11px] sm:text-xs font-mono transition-all btn-press focus-visible:ring-2 focus-visible:ring-signal text-center ${
                    activeNode === 'hub'
                      ? 'bg-risk text-white border-risk-hover shadow-xl shadow-risk/20 font-bold'
                      : 'bg-canvas-overlay border-risk/40 text-text-primary hover:border-risk'
                  }`}
                  aria-label="Inspect Central Syndicate Hub #04"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <ShieldAlert className="size-3.5 sm:size-4" />
                    <span>HUB-RING-04</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono tabular-nums opacity-90">
                    ₦14.25M Exposure
                  </div>
                </button>
              </div>

              {/* Status bar */}
              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-verified" />
                  Graph Engine: Real-time Multigraph Active
                </span>
                <span>Latency: 18ms</span>
              </div>
            </div>

            {/* Right Evidence Inspector Sidebar (5 Cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-canvas-raised">
              <div>
                {/* Node Header */}
                <div className="pb-4 border-b border-border-subtle mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-signal font-semibold tracking-wider">
                      {current.type}
                    </span>
                    <Badge variant="risk" className="font-mono text-xs tabular-nums">
                      Score: {current.riskScore}
                    </Badge>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">
                    {current.title}
                  </h3>
                  <div className="text-xs font-mono text-text-secondary mt-1 tabular-nums">
                    Exposure: <span className="text-text-primary font-medium">{current.exposure}</span>
                  </div>
                </div>

                {/* AI Investigation Explanation Summary */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-text-muted mb-2 font-semibold">
                    <Sparkles className="size-3.5 text-signal" />
                    <span>Investigation Summary</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed bg-canvas p-3 rounded-lg border border-border-subtle">
                    {current.narrative}
                  </p>
                </div>

                {/* Forensic Evidence Items */}
                <div className="mb-5">
                  <div className="text-xs font-mono uppercase text-text-muted mb-2 font-semibold">
                    Supporting Evidence Chain
                  </div>
                  <div className="space-y-1.5">
                    {current.evidence.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-text-secondary"
                      >
                        <CheckCircle2 className="size-3.5 text-verified shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regulatory / SAR Action Recommendation */}
                <div className="p-3 rounded-lg bg-signal/10 border border-signal/20 text-xs text-text-primary">
                  <strong className="text-signal">Action Plan: </strong>
                  {current.recommendation}
                </div>
              </div>

              {/* Bottom Action Trigger */}
              <div className="mt-6 pt-5 border-t border-border-subtle flex items-center justify-between">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onOpenExplore}
                  className="w-full justify-center gap-2"
                >
                  <span>Open Full Investigation Dossier</span>
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
