import React, { useState, useEffect, useRef } from 'react';
import { CrossBankRelayEvent } from '@/lib/services/cross-bank-consortium';
import { DataProtectionService } from '@/lib/security/data-protection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shuffle,
  Smartphone,
  ArrowRight,
  Clock,
  Lock,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Building2,
  Zap,
  Layers,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface CrossBankRelayVisualizerProps {
  relay: CrossBankRelayEvent;
  privacyMaskingEnabled?: boolean;
  onExecutePnd?: (account: string) => void;
  onExportEvidence?: (relay: CrossBankRelayEvent) => void;
}

export const CrossBankRelayVisualizer: React.FC<CrossBankRelayVisualizerProps> = ({
  relay,
  privacyMaskingEnabled = true,
  onExecutePnd,
  onExportEvidence,
}) => {
  // Playback stages (0 to 5)
  // 0: Inflow to Source Bank
  // 1: Source Mobile Authentication
  // 2: NIBSS NIP Interbank Transit
  // 3: Destination App Launch & Session Match
  // 4: Destination Inbound Settlement & Rapid Outflow Attempt
  // 5: Consortium Interdiction & Dual PND Lockout
  const [currentStep, setCurrentStep] = useState<number>(5); // default to fully analyzed state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Auto playback loop
  useEffect(() => {
    if (isPlaying) {
      const stepDuration = 2200;
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          return prev + 1;
        });
      }, stepDuration);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handlePlayToggle = () => {
    if (currentStep >= 5) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(relay.amount);

  const displaySourceAcc = privacyMaskingEnabled
    ? DataProtectionService.maskAccountNumber(relay.sourceAccount, true)
    : relay.sourceAccount;

  const displayDestAcc = privacyMaskingEnabled
    ? DataProtectionService.maskAccountNumber(relay.destinationAccount, true)
    : relay.destinationAccount;

  const displayDevice = privacyMaskingEnabled
    ? DataProtectionService.maskDeviceId(relay.sharedDeviceFingerprint, true)
    : relay.sharedDeviceFingerprint;

  const stepsDescriptions = [
    {
      title: '1. Inflow Settlement (Source Node)',
      desc: `${formattedAmount} settled into ${relay.sourceBankName} (${displaySourceAcc}) via NIP instant clearing rails.`,
      activeNode: 'source',
      wireState: 'idle',
      deviceState: 'standby',
    },
    {
      title: '2. Physical Device Authentication',
      desc: `Hardware token (${displayDevice}) authenticated into ${relay.sourceBankName} Mobile App via AS29465 Lagos LTE subnet.`,
      activeNode: 'source',
      wireState: 'source-armed',
      deviceState: 'source-linked',
    },
    {
      title: '3. NIBSS NIP Switch Transit',
      desc: `30-Digit NIP Session ID (${relay.nipSessionId}) routed through NIBSS central settlement clearing switch.`,
      activeNode: 'nibss',
      wireState: 'in-transit',
      deviceState: 'relaying',
    },
    {
      title: '4. Destination App Session Handshake',
      desc: `Identical physical handset (${displayDevice}) authenticated into ${relay.destinationBankName} app ${relay.deltaSeconds}s post-settlement. Consortium ThreatMetrix hash verified.`,
      activeNode: 'dest',
      wireState: 'settling',
      deviceState: 'dest-linked',
    },
    {
      title: '5. Rapid Outflow / Smurfing Intercept',
      desc: `Immediate onward dispersion attempted to POS/Crypto off-ramp within ${relay.deltaSeconds}s. High-velocity pass-through flagged (>90% volume retention).`,
      activeNode: 'egress',
      wireState: 'outflow-flagged',
      deviceState: 'flagged',
    },
    {
      title: '6. Bilateral CFIS Interdiction Order',
      desc: `NIBSS CFIS Category 08 broadcast triggered. Bilateral statutory PND freeze directives enforced on ${relay.sourceBankName} and ${relay.destinationBankName}.`,
      activeNode: 'locked',
      wireState: 'locked',
      deviceState: 'interdicted',
    },
  ];

  return (
    <div className="rounded-2xl border border-border-medium bg-[#0A0E17] shadow-2xl p-6 space-y-6 text-slate-200">
      
      {/* Header & Interception Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-signal/10 border border-signal/30 text-signal">
            <Shuffle className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-heading text-white">
                Dual-Plane Forensic Telemetry & Interdiction Reconstruction
              </h3>
              <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-500/10 text-[10px] font-mono">
                {relay.threatSeverity}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-400">
              RELAY ID: <span className="text-signal font-bold">{relay.id}</span> | NIP PACs.008 CLEARING BATCH:{' '}
              <span className="text-slate-300">{relay.nipSessionId}</span>
            </p>
          </div>
        </div>

        {/* Forensic Reconstruction Controls */}
        <div className="flex items-center gap-2 bg-[#0E131F] p-1.5 rounded-xl border border-[#1E293B]">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePlayToggle}
            className="h-7 px-2.5 text-xs text-signal hover:text-white hover:bg-white/5 font-mono gap-1"
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            <span>{isPlaying ? 'Pause' : currentStep >= 5 ? 'Replay Sequence' : 'Reconstruct'}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentStep(5)}
            className="h-7 px-2.5 text-xs text-red-400 hover:text-white hover:bg-red-500/20 font-mono"
            title="Jump directly to final interdiction verdict"
          >
            Verdict
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-white/5"
            title="Reset to Step 1"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Step Progress Bar & Phase Navigation */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <span className="text-signal font-bold flex items-center gap-1.5">
            <Clock className="size-3.5" /> Investigation Phase {currentStep + 1} of 6: {stepsDescriptions[currentStep].title}
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Session Hop Delta: <strong className="text-red-400 tabular-nums">{relay.deltaSeconds}s</strong>
            </span>
            <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Pass-Through Smurfing Alert (&lt; 180s)
            </span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2 h-2">
          {stepsDescriptions.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Jump to investigation phase ${idx + 1}: ${s.title}`}
              onClick={() => setCurrentStep(idx)}
              className={`h-full rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                idx <= currentStep
                  ? idx === 5
                    ? 'bg-red-500 shadow-sm shadow-red-500/50'
                    : 'bg-signal shadow-sm shadow-signal/50'
                  : 'bg-[#1E293B] hover:bg-[#334155]'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-300 font-sans pt-1 leading-relaxed">
          {stepsDescriptions[currentStep].desc}
        </p>
      </div>

      {/* THE DUAL-PLANE INTER-INSTITUTIONAL PIPELINE STAGE */}
      <div className="relative rounded-xl border border-[#1E293B] bg-[#070A10] p-6 overflow-hidden">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* TOP PLANE: Financial Rail Topology */}
        <div className="relative z-10 space-y-3 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <Layers className="size-3 text-amber-400" />
              1. Interbank Financial Rail Plane (NIBSS Instant Payment Rails)
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Clearance Volume: {formattedAmount}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            
            {/* HOP 1: Source Bank (Zenith Bank Plc) */}
            <div
              className={`rounded-xl p-4 border transition-all ${
                currentStep >= 0
                  ? currentStep >= 5
                    ? 'border-red-500/60 bg-red-950/20 shadow-lg shadow-red-500/10'
                    : 'border-amber-500/50 bg-[#0E1524] shadow-lg shadow-amber-500/10'
                  : 'border-[#1E293B] bg-[#0A0E17]/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{relay.sourceBankName}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Code: {relay.sourceBankCode}</span>
                  </div>
                </div>
                {currentStep >= 5 ? (
                  <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-500/10 text-[9px] gap-1">
                    <Lock className="size-2.5" /> PND FROZEN
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[9px]">
                    HOP 1: INFLOW
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 font-mono text-xs pt-1 border-t border-[#1E293B]">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px]">ACCOUNT:</span>
                  <span className="text-slate-200 font-bold">{displaySourceAcc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px]">TIME:</span>
                  <span className="text-slate-300 text-[11px]">
                    {new Date(relay.inflowTimestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px]">STATUS:</span>
                  <span className={currentStep >= 5 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    {currentStep >= 5 ? 'POST-NO-DEBIT' : currentStep >= 1 ? 'NIP Dispatched' : 'Credited'}
                  </span>
                </div>
              </div>
            </div>

            {/* CENTRAL BRIDGE: NIBSS Clearing Switch */}
            <div
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                currentStep >= 2
                  ? currentStep >= 5
                    ? 'border-red-500/50 bg-red-950/20'
                    : 'border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                  : 'border-[#1E293B] bg-[#0A0E17]/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                    <Zap className="size-3.5" />
                    <span>NIBSS Instant Payment Rail</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[9px]">
                    SWITCH HOP
                  </Badge>
                </div>
                <div className="text-[10px] font-mono text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-500 block">30-DIGIT NIP SESSION ID:</span>
                    <span className="text-amber-300 font-bold break-all">{relay.nipSessionId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SETTLEMENT AMOUNT:</span>
                    <span className="text-white font-bold">{formattedAmount}</span>
                  </div>
                </div>
              </div>

              {/* Animated fund transfer beam indicator */}
              <div className="relative pt-3">
                <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentStep >= 2
                        ? currentStep >= 5
                          ? 'w-full bg-red-500'
                          : 'w-full bg-emerald-500 animate-pulse'
                        : 'w-0'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1">
                  <span>Zenith Host (057)</span>
                  <ArrowRight className="size-3 text-emerald-400 animate-bounce" />
                  <span>{relay.destinationBankName}</span>
                </div>
              </div>
            </div>

            {/* HOP 2: Destination Bank (e.g. OPay / Kuda) */}
            <div
              className={`rounded-xl p-4 border transition-all ${
                currentStep >= 3
                  ? currentStep >= 5
                    ? 'border-red-500/60 bg-red-950/20 shadow-lg shadow-red-500/10'
                    : 'border-blue-500/50 bg-[#0E1524] shadow-lg shadow-blue-500/10'
                  : 'border-[#1E293B] bg-[#0A0E17]/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{relay.destinationBankName}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Code: {relay.destinationBankCode}</span>
                  </div>
                </div>
                {currentStep >= 5 ? (
                  <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-500/10 text-[9px] gap-1">
                    <Lock className="size-2.5" /> CFIS FREEZE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[9px]">
                    HOP 2: BENEFICIARY
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 font-mono text-xs pt-1 border-t border-[#1E293B]">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px]">ACCOUNT:</span>
                  <span className="text-slate-200 font-bold">{displayDestAcc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px]">TIME:</span>
                  <span className="text-slate-300 text-[11px]">
                    {new Date(relay.crossBankLoginTimestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px]">EGRESS:</span>
                  <span className={currentStep >= 5 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                    {currentStep >= 5 ? 'BLOCKED BY CFIS' : 'POS Cashout Attempt'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM PLANE: The Physical Hardware Telemetry & Consortium Correlation Plane */}
        <div className="relative z-10 pt-4 border-t border-[#1E293B]/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <Smartphone className="size-3 text-emerald-400" />
              2. Physical Hardware & Device Consortium Plane (Unified ThreatMetrix / CFIS Telemetry)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Identical Handset Fingerprint Verified
            </span>
          </div>

          {/* Centralized Hardware Intercept Box */}
          <div className="rounded-xl border border-emerald-500/30 bg-[#0C1524] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Phone Identity */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Smartphone className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-mono font-bold text-white">{displayDevice}</h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    SINGLE PHYSICAL DEVICE
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  IMEI Salt + WebGL Canvas Hash • Android 14 • Location: Ikeja Clearing Subnet (Lagos)
                </p>
              </div>
            </div>

            {/* Stopwatch Concurrent Delta Badge */}
            <div className="flex items-center gap-3 bg-[#080B10] px-4 py-2.5 rounded-xl border border-amber-500/30 text-center">
              <Clock className="size-5 text-amber-400 animate-spin" />
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-400 uppercase block">Concurrent App Delta:</span>
                <span className="text-sm font-bold text-red-400">
                  {relay.deltaSeconds} SECONDS APART
                </span>
              </div>
            </div>

            {/* Technical Verification Chip */}
            <div className="text-right font-mono text-xs text-slate-400">
              <span className="text-[10px] text-slate-500 block">DETECTION ENGINE:</span>
              <span className="text-emerald-400 font-bold block text-[11px]">
                {relay.detectionMechanism.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-slate-500">
                Consortium Hash: <span className="text-slate-300">{relay.sharedBvnHash}</span>
              </span>
            </div>
          </div>

          {/* Dual Correlation Beams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] space-y-1">
              <span className="text-red-400 font-bold flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="size-3.5 text-red-400" />
                Session A: {relay.sourceBankName} Mobile App
              </span>
              <p className="text-[11px] text-slate-400">
                Authenticated at {new Date(relay.inflowTimestamp).toLocaleTimeString()} with hardware token{' '}
                <strong className="text-slate-200">{displayDevice}</strong>. Outbound transfer executed.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] space-y-1">
              <span className="text-blue-400 font-bold flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="size-3.5 text-blue-400" />
                Session B: {relay.destinationBankName} Mobile App
              </span>
              <p className="text-[11px] text-slate-400">
                Authenticated at {new Date(relay.crossBankLoginTimestamp).toLocaleTimeString()} ({relay.deltaSeconds}s
                later) on the <strong className="text-slate-200">identical physical handset</strong>. Rapid dispersion
                attempted.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Forensic Verdict & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
        <div className="flex items-start gap-2.5 max-w-2xl">
          <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="text-red-300 block font-mono font-bold">
              STATUTORY ENFORCEMENT & CONSORTIUM ACTION (CBN AML/CFT 2022 §19.4):
            </strong>
            <p className="text-slate-300 text-[11px]">
              {relay.suggestedInterdiction}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExportEvidence && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExportEvidence(relay)}
              className="text-xs border-[#1E293B] text-slate-300 hover:text-white hover:bg-white/5 font-mono gap-1.5"
            >
              <Download className="size-3.5" />
              <span>Export Evidence Package</span>
            </Button>
          )}

          {onExecutePnd && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onExecutePnd(relay.sourceAccount)}
              className="text-xs bg-red-600 hover:bg-red-700 font-bold font-mono gap-1.5 cursor-pointer shadow-lg shadow-red-600/20"
            >
              <Lock className="size-3.5" />
              <span>Execute Bilateral PND Freeze</span>
            </Button>
          )}
        </div>
      </div>

    </div>
  );
};
