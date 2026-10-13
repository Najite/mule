import React, { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  TrendingDown,
  Clock,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface RoiCalculatorSectionProps {
  onOpenBriefing: () => void;
  onLaunchPortal: () => void;
}

interface PresetTier {
  id: string;
  name: string;
  badge: string;
  monthlyTxns: number; // in millions
  monthlyMuleLeakage: number; // in millions of Naira
  analystTeamSize: number;
  falsePositiveRate: number; // percentage
}

const PRESETS: PresetTier[] = [
  {
    id: 'tier1',
    name: 'Tier-1 Commercial Bank',
    badge: 'Zenith / Access / GTCO',
    monthlyTxns: 12,
    monthlyMuleLeakage: 580,
    analystTeamSize: 25,
    falsePositiveRate: 94,
  },
  {
    id: 'fintech',
    name: 'High-Velocity Neobank / Rails',
    badge: 'OPay / Kuda / Moniepoint',
    monthlyTxns: 20,
    monthlyMuleLeakage: 720,
    analystTeamSize: 32,
    falsePositiveRate: 96,
  },
  {
    id: 'regional',
    name: 'Mid-Tier / Merchant Acquirer',
    badge: 'Regional Commercial',
    monthlyTxns: 4,
    monthlyMuleLeakage: 180,
    analystTeamSize: 10,
    falsePositiveRate: 91,
  },
];

export const RoiCalculatorSection: React.FC<RoiCalculatorSectionProps> = ({
  onOpenBriefing,
  onLaunchPortal,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('tier1');
  const [monthlyTxns, setMonthlyTxns] = useState<number>(12); // Millions
  const [monthlyLeakage, setMonthlyLeakage] = useState<number>(580); // Millions NGN
  const [analysts, setAnalysts] = useState<number>(25);
  const [falsePositiveRate, setFalsePositiveRate] = useState<number>(94); // %

  const txnsInputId = useId();
  const leakageInputId = useId();
  const analystsInputId = useId();
  const fpInputId = useId();

  const handleApplyPreset = (preset: PresetTier) => {
    setSelectedPreset(preset.id);
    setMonthlyTxns(preset.monthlyTxns);
    setMonthlyLeakage(preset.monthlyMuleLeakage);
    setAnalysts(preset.analystTeamSize);
    setFalsePositiveRate(preset.falsePositiveRate);
  };

  // Calculations
  // FININT in-flight PND freeze intercepts approx 84% of coordinated mule ring fund dispersion
  const annualRecoveredLeakage = Math.round(monthlyLeakage * 12 * 0.84);
  // Manual investigation savings: FININT reduces false-positive investigation time by 78%
  // Assuming an analyst reviews ~160 hours/month, average triage is 35 mins down to 4 mins
  const monthlyHoursSaved = Math.round(analysts * 160 * 0.72);
  const annualHoursSaved = monthlyHoursSaved * 12;
  // Cost savings at avg institutional AML specialist rate (₦3,500/hr)
  const annualLaborSavingsNgn = Math.round(annualHoursSaved * 3500);

  return (
    <section
      id="roi-calculator"
      className="py-24 sm:py-32 border-t border-border-subtle relative bg-canvas-subtle/70"
      aria-labelledby="roi-calculator-heading"
    >
      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none opacity-15 blur-[140px]"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-canvas-raised border border-border-medium text-signal mb-4">
            <Calculator className="size-3.5 text-signal" aria-hidden="true" />
            Institutional Impact Model
          </div>
          <h2
            id="roi-calculator-heading"
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[-0.03em] text-text-primary leading-tight text-balance"
          >
            Quantify your syndicate risk exposure.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed text-pretty">
            Simulate how real-time entity resolution and pre-exit PND enforcement protect capital
            and eliminate false-positive triage across your clearing rails.
          </p>
        </div>

        {/* Institution Preset Pickers */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className="text-xs font-mono uppercase text-text-muted mr-1">
            Institutional Profiles:
          </span>
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-signal/15 border-signal text-signal shadow-md shadow-signal/10'
                    : 'bg-canvas-raised border-border-medium text-text-secondary hover:text-text-primary hover:border-border-strong'
                }`}
              >
                <Building2 className="size-3.5" />
                <span>{preset.name}</span>
                <span className="text-[10px] opacity-75">({preset.badge})</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Calculator Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 Cols) */}
          <div className="lg:col-span-7 bg-canvas-raised border border-border-medium rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-7">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={txnsInputId}
                  className="text-xs sm:text-sm font-semibold text-text-primary flex items-center gap-2"
                >
                  <span>Monthly NIP Clearing Volume</span>
                  <span className="text-[11px] font-mono text-text-muted">(Transactions)</span>
                </label>
                <span className="font-mono text-sm font-bold text-signal">
                  {monthlyTxns}M txns/mo
                </span>
              </div>
              <input
                id={txnsInputId}
                type="range"
                min="1"
                max="30"
                step="1"
                value={monthlyTxns}
                onChange={(e) => {
                  setMonthlyTxns(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                <span>1M (Regional)</span>
                <span>15M (Major)</span>
                <span>30M+ (Tier-1 Scale)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={leakageInputId}
                  className="text-xs sm:text-sm font-semibold text-text-primary flex items-center gap-2"
                >
                  <span>Estimated Mule Smurfing Exposure</span>
                  <span className="text-[11px] font-mono text-text-muted">(Monthly Capital Risk)</span>
                </label>
                <span className="font-mono text-sm font-bold text-signal">
                  ₦{monthlyLeakage} Million / mo
                </span>
              </div>
              <input
                id={leakageInputId}
                type="range"
                min="50"
                max="1500"
                step="25"
                value={monthlyLeakage}
                onChange={(e) => {
                  setMonthlyLeakage(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                <span>₦50M</span>
                <span>₦750M</span>
                <span>₦1.5 Billion+</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={analystsInputId} className="text-xs font-semibold text-text-primary">
                    AML Investigation Officers
                  </label>
                  <span className="font-mono text-xs font-bold text-text-primary">
                    {analysts} FTEs
                  </span>
                </div>
                <input
                  id={analystsInputId}
                  type="range"
                  min="3"
                  max="60"
                  step="1"
                  value={analysts}
                  onChange={(e) => {
                    setAnalysts(Number(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={fpInputId} className="text-xs font-semibold text-text-primary">
                    Legacy False Positive Rate
                  </label>
                  <span className="font-mono text-xs font-bold text-risk">
                    {falsePositiveRate}%
                  </span>
                </div>
                <input
                  id={fpInputId}
                  type="range"
                  min="70"
                  max="99"
                  step="1"
                  value={falsePositiveRate}
                  onChange={(e) => {
                    setFalsePositiveRate(Number(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>

            {/* Regulatory Benchmarks Checklist */}
            <div className="pt-4 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-verified shrink-0" />
                <span>CBN AML/CFT 2022 Sanctions Defense</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-verified shrink-0" />
                <span>NFIU Section 14 Courtroom Audit Trail</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-verified shrink-0" />
                <span>Finacle 11.0 Automated PND Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-verified shrink-0" />
                <span>NDPA 2023 §39 In-VPC Data Sovereignty</span>
              </div>
            </div>
          </div>

          {/* Impact Results Card (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-canvas-raised to-canvas border border-border-strong rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-signal" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
                  Projected Annual Recovery
                </span>
              </div>
              <Badge variant="verified" className="font-mono text-[10px]">
                84% Capture
              </Badge>
            </div>

            {/* Primary Stat: Capital Recovered */}
            <div className="mb-7">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
                Annual Capital Rescued Before Outflow
              </span>
              <div className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-signal tabular-nums tracking-tight">
                ₦{(annualRecoveredLeakage / 1000).toFixed(2)} Billion
              </div>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                Projected syndicate capital intercepted via sub-180s in-flight Post-No-Debit (PND) containment.
              </p>
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-border-subtle mb-6">
              <div className="bg-canvas border border-border-subtle rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Clock className="size-3.5 text-signal" />
                  <span>Analyst Time Saved</span>
                </div>
                <div className="font-heading font-bold text-lg text-text-primary tabular-nums">
                  {monthlyHoursSaved.toLocaleString()} hrs/mo
                </div>
                <span className="text-[10px] text-verified block mt-0.5">
                  ₦{(annualLaborSavingsNgn / 1000000).toFixed(1)}M/yr triage savings
                </span>
              </div>

              <div className="bg-canvas border border-border-subtle rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <TrendingDown className="size-3.5 text-verified" />
                  <span>Time-to-PND Freeze</span>
                </div>
                <div className="font-heading font-bold text-lg text-verified tabular-nums">
                  &lt;180 seconds
                </div>
                <span className="text-[10px] text-text-muted block mt-0.5">
                  vs. 72 hrs legacy
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                variant="default"
                size="lg"
                onClick={onOpenBriefing}
                className="w-full justify-center gap-2 font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-400/40 cursor-pointer"
              >
                <span>Request Custom Institutional Audit</span>
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLaunchPortal}
                className="w-full justify-center gap-2 font-mono text-xs border-border-medium hover:bg-canvas cursor-pointer"
              >
                <span>Test Live Intelligence Engine</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
