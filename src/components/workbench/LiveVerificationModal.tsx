import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BankingService,
  NigerianBank,
  NubanVerificationResult,
  POPULAR_NIGERIAN_BANKS,
} from '@/lib/services/banking-api';
import {
  TelemetryService,
  IpTelemetryData,
  IP_TELEMETRY_PRESETS,
} from '@/lib/services/telemetry-api';
import {
  SovereignGeoIpService,
  SovereignIpResult,
} from '@/lib/services/sovereign-geoip';
import {
  X,
  Landmark,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Radio,
} from 'lucide-react';

const SOVEREIGN_IP_PRESETS = [
  { ip: '102.89.43.12', label: 'MTN 4G LTE (Lagos)', carrier: 'MTN NG' },
  { ip: '105.112.8.44', label: 'Airtel 4G LTE (Ikeja)', carrier: 'Airtel NG' },
  { ip: '102.165.34.19', label: 'Starlink NG (Lekki)', carrier: 'Starlink' },
  { ip: '197.210.22.90', label: 'Glo Mobile (VI)', carrier: 'Glo NG' },
  { ip: '185.220.101.5', label: 'Tor Exit Node (Relay)', carrier: 'Tor Proxy' },
  { ip: '138.197.140.21', label: 'Cloud Hosting (Proxy)', carrier: 'Datacenter' },
];

interface LiveVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'banking' | 'telemetry';
  initialAccountNumber?: string;
  initialBankCode?: string;
  initialIp?: string;
}

export const LiveVerificationModal: React.FC<LiveVerificationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'banking',
  initialAccountNumber = '2081940192',
  initialBankCode = '057',
  initialIp = '102.89.43.12',
}) => {
  const [activeTab, setActiveTab] = useState<'banking' | 'telemetry'>(initialTab);

  // Banking State
  const [banks, setBanks] = useState<NigerianBank[]>(POPULAR_NIGERIAN_BANKS);
  const [selectedBankCode, setSelectedBankCode] = useState<string>(initialBankCode);
  const [accountNumber, setAccountNumber] = useState<string>(initialAccountNumber);
  const [isVerifyingBank, setIsVerifyingBank] = useState<boolean>(false);
  const [bankResult, setBankResult] = useState<NubanVerificationResult | null>(null);

  // Telemetry State: Sovereign In-VPC (NDPA 2023) or Legacy Public Gateway
  const [telemetryEngine, setTelemetryEngine] = useState<'sovereign' | 'public'>('sovereign');
  const [targetIp, setTargetIp] = useState<string>(initialIp);
  const [isScanningIp, setIsScanningIp] = useState<boolean>(false);
  const [telemetryResult, setTelemetryResult] = useState<IpTelemetryData | null>(null);
  const [sovereignResult, setSovereignResult] = useState<SovereignIpResult | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  // Fetch real bank list on mount
  useEffect(() => {
    if (isOpen) {
      BankingService.fetchNigerianBanks().then((list) => {
        if (list.length > 0) setBanks(list);
      });
      // Run initial verification on open
      if (activeTab === 'banking' && !bankResult) {
        handleVerifyAccount();
      } else if (activeTab === 'telemetry') {
        if (!sovereignResult && !telemetryResult) {
          handleScanIp(targetIp, 'sovereign');
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Account Verification
  const handleVerifyAccount = async () => {
    if (!accountNumber.trim()) return;
    setIsVerifyingBank(true);
    try {
      const res = await BankingService.resolveAccount(
        accountNumber.trim(),
        selectedBankCode
      );
      setBankResult(res);
    } finally {
      setIsVerifyingBank(false);
    }
  };

  // Handle Telemetry Scan
  const handleScanIp = async (overrideIp?: string, forceEngine?: 'sovereign' | 'public') => {
    const ipToScan = overrideIp !== undefined ? overrideIp : targetIp;
    const engineToUse = forceEngine !== undefined ? forceEngine : telemetryEngine;
    setIsScanningIp(true);
    setTelemetryError(null);
    try {
      if (engineToUse === 'sovereign') {
        const res = SovereignGeoIpService.evaluateIp(ipToScan);
        setSovereignResult(res);
        setTargetIp(res.ip);
      } else {
        const res = await TelemetryService.fetchIpTelemetry(ipToScan);
        setTelemetryResult(res);
        setTargetIp(res.ip);
      }
    } catch (err: unknown) {
      setTelemetryError(err instanceof Error ? err.message : 'Telemetry lookup failed');
    } finally {
      setIsScanningIp(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-verification-title"
    >
      <div className="bg-canvas-raised border border-border-medium rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-canvas-overlay/90">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
              {activeTab === 'banking' ? <Landmark className="size-4" /> : <Globe2 className="size-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="live-verification-title" className="font-heading font-bold text-base text-text-primary">
                  Live Verification & Telemetry Studio
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-verified/15 text-verified border border-verified/30">
                  <span className="size-1.5 rounded-full bg-verified animate-pulse" />
                  Live APIs Active
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Real NIBSS / CBN NUBAN validation & ipapi.co device fraud intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg p-1 bg-canvas border border-border-subtle text-xs font-medium font-mono">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('banking');
                  if (!bankResult) handleVerifyAccount();
                }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'banking'
                    ? 'bg-canvas-raised text-signal shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                1. NUBAN Resolver
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('telemetry');
                  if (!telemetryResult) handleScanIp();
                }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'telemetry'
                    ? 'bg-canvas-raised text-signal shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                2. Device IP Telemetry
              </button>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close verification modal">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'banking' ? (
            /* Tab 1: Nigerian Banking NUBAN & NIBSS Verification */
            <div className="space-y-5">
              {/* Context Banner */}
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase text-signal font-semibold tracking-wider">
                    Official Central Bank of Nigeria (CBN) NUBAN Protocol
                  </span>
                  <Badge variant="signal" className="font-mono text-[10px]">
                    Zenith Bank Code: 057
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  FININT validates 10-digit NUBAN numbers using the official CBN Modulo-10 algorithm and
                  resolves registered account holder names live via the NIBSS clearing gateway.
                </p>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Bank Select (5 Cols) */}
                <div className="sm:col-span-5 flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-text-muted font-semibold uppercase">
                    Destination Bank
                  </label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    className="p-2.5 rounded-xl bg-canvas border border-border-subtle text-text-primary text-xs font-mono focus:border-signal focus:outline-none"
                  >
                    {banks.map((b) => (
                      <option key={`${b.code}-${b.id}`} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Number (5 Cols) */}
                <div className="sm:col-span-5 flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-text-muted font-semibold uppercase">
                    10-Digit NUBAN Account
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 2081940192"
                    className="p-2.5 rounded-xl bg-canvas border border-border-subtle text-text-primary text-xs font-mono focus:border-signal focus:outline-none"
                  />
                </div>

                {/* Verify Button (2 Cols) */}
                <div className="sm:col-span-2 flex flex-col justify-end">
                  <Button
                    variant="default"
                    onClick={handleVerifyAccount}
                    disabled={isVerifyingBank || accountNumber.length < 10}
                    className="w-full h-[38px] text-xs font-semibold"
                  >
                    {isVerifyingBank ? 'Checking...' : 'Resolve'}
                  </Button>
                </div>
              </div>

              {/* Quick Fill Preset Accounts */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                <span className="text-text-muted">Syndicate Case Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBankCode('057');
                    setAccountNumber('2081940192');
                  }}
                  className="px-2 py-0.5 rounded bg-canvas hover:bg-canvas-overlay border border-border-subtle text-signal"
                >
                  2081940192 (Zenith Inbound Mule)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBankCode('057');
                    setAccountNumber('1019284910');
                  }}
                  className="px-2 py-0.5 rounded bg-canvas hover:bg-canvas-overlay border border-border-subtle text-text-secondary"
                >
                  1019284910 (Apex Swift Logistics)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBankCode('058');
                    setAccountNumber('2048910291');
                  }}
                  className="px-2 py-0.5 rounded bg-canvas hover:bg-canvas-overlay border border-border-subtle text-text-secondary"
                >
                  2048910291 (GTBank Intermediary)
                </button>
              </div>

              {/* Verification Result Card */}
              {bankResult && (
                <div className="p-5 rounded-xl bg-canvas border border-border-medium space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      {bankResult.isValidNuban ? (
                        <CheckCircle2 className="size-5 text-verified" />
                      ) : (
                        <AlertTriangle className="size-5 text-risk" />
                      )}
                      <div>
                        <span className="font-heading font-bold text-sm text-text-primary block">
                          {bankResult.accountName}
                        </span>
                        <span className="text-[11px] font-mono text-text-muted">
                          {bankResult.bankName} • NUBAN {bankResult.accountNumber}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={bankResult.isValidNuban ? 'default' : 'risk'}
                      className="font-mono text-[10px]"
                    >
                      {bankResult.isValidNuban ? 'VALID NUBAN' : 'INVALID CHECKSUM'}
                    </Badge>
                  </div>

                  {/* Mathematical Checksum Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Calculated Check Digit</span>
                      <span className="text-base font-bold text-signal tabular-nums">
                        {bankResult.cbnCalculatedCheckDigit}
                      </span>
                      <span className="text-[10px] text-text-muted block mt-0.5">CBN Modulo-10 formula</span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Provided 10th Digit</span>
                      <span className="text-base font-bold text-text-primary tabular-nums">
                        {bankResult.providedCheckDigit}
                      </span>
                      <span className="text-[10px] text-text-muted block mt-0.5">Account serial ending</span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Verification Source</span>
                      <span className="text-xs font-semibold text-verified block truncate mt-1">
                        {bankResult.verificationSource === 'ZENITH_NIBSS_GATEWAY'
                          ? 'Zenith NIBSS Gateway'
                          : 'CBN NUBAN Algorithm'}
                      </span>
                      <span className="text-[10px] text-text-muted block">Direct clearing validation</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed bg-canvas-raised p-3 rounded-lg border border-border-subtle">
                    {bankResult.details}
                  </p>
                </div>
              )}

              {/* Enterprise Security Compliance Notice */}
              <div className="pt-2 border-t border-border-subtle">
                <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-start gap-2.5 text-[11px] font-mono text-text-muted">
                  <ShieldCheck className="size-4 text-verified shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="text-text-primary font-semibold block">Enterprise Security Standard:</span>
                    Live Nigerian Bank Directory is fetched securely from Paystack Public Gateway. Core NIBSS Account Resolution is routed through Zenith Bank&apos;s internal VPC integration gateway (Zero client-side secrets exposed).
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Live Device & IP Telemetry */
            <div className="space-y-5">
              {/* Sovereign Mode vs Public Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
                    {telemetryEngine === 'sovereign' ? <Lock className="size-3.5" /> : <Globe2 className="size-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">
                      {telemetryEngine === 'sovereign' ? 'Sovereign In-VPC Routing' : 'Foreign Public Gateway'}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {telemetryEngine === 'sovereign'
                        ? 'NDPA 2023 §39 Compliant • Zero Third-Party Egress'
                        : 'External REST Call to ipapi.co (Potential PII Egress)'}
                    </span>
                  </div>
                </div>

                <div className="flex rounded-lg p-0.5 bg-canvas-raised border border-border-subtle text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setTelemetryEngine('sovereign');
                      handleScanIp(targetIp, 'sovereign');
                    }}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                      telemetryEngine === 'sovereign'
                        ? 'bg-signal/20 text-signal font-semibold border border-signal/40'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Lock className="size-3" />
                    <span>Sovereign VPC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTelemetryEngine('public');
                      handleScanIp(targetIp, 'public');
                    }}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                      telemetryEngine === 'public'
                        ? 'bg-canvas text-signal font-semibold border border-signal/40'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Globe2 className="size-3" />
                    <span>Public IPAPI</span>
                  </button>
                </div>
              </div>

              {/* Context Banner */}
              <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase text-signal font-semibold tracking-wider">
                    {telemetryEngine === 'sovereign'
                      ? 'National Cybersecurity In-VPC Subnet Intelligence'
                      : 'Third-Party IP Intelligence (ipapi.co HTTPS)'}
                  </span>
                  <Badge variant={telemetryEngine === 'sovereign' ? 'default' : 'risk'} className="font-mono text-[10px]">
                    {telemetryEngine === 'sovereign' ? 'NDPA 2023 SOVEREIGN' : 'DATA EGRESS RISK'}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {telemetryEngine === 'sovereign'
                    ? 'Evaluates hardware session IP addresses directly against Zenith Bank’s internal carrier ASN routing database (MTN AS29465, Airtel AS36873, Starlink AS14593). Detects commercial Tor exit nodes and datacenter proxies with zero foreign network leaks.'
                    : 'Dispatches raw IP queries to foreign web endpoints. Suitable only for staging testing where trans-border session transfer is explicitly permitted under regulatory exemptions.'}
                </p>
              </div>

              {/* IP Input & Preset Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetIp}
                    onChange={(e) => setTargetIp(e.target.value)}
                    placeholder="Enter IPv4 Address..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-canvas border border-border-subtle text-xs font-mono text-text-primary focus:border-signal focus:outline-none"
                  />
                </div>
                <Button
                  variant="default"
                  onClick={() => handleScanIp()}
                  disabled={isScanningIp}
                  className="text-xs font-semibold"
                >
                  {isScanningIp ? 'Scanning...' : 'Scan Telemetry'}
                </Button>
                {telemetryEngine === 'public' && (
                  <Button
                    variant="outline"
                    onClick={() => handleScanIp('')}
                    disabled={isScanningIp}
                    className="text-xs font-mono border-border-medium"
                    title="Detect and scan your current public network IP"
                  >
                    My Network
                  </Button>
                )}
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="text-text-muted">Target Presets:</span>
                {telemetryEngine === 'sovereign'
                  ? SOVEREIGN_IP_PRESETS.map((p) => (
                      <button
                        key={p.ip}
                        type="button"
                        onClick={() => handleScanIp(p.ip, 'sovereign')}
                        className="px-2.5 py-1 rounded bg-canvas hover:bg-canvas-overlay border border-border-subtle text-text-secondary hover:text-signal transition-colors flex items-center gap-1"
                      >
                        <Radio className="size-2.5 text-signal" />
                        <span>{p.label}</span>
                      </button>
                    ))
                  : IP_TELEMETRY_PRESETS.map((p) => (
                      <button
                        key={p.ip}
                        type="button"
                        onClick={() => handleScanIp(p.ip, 'public')}
                        className="px-2.5 py-1 rounded bg-canvas hover:bg-canvas-overlay border border-border-subtle text-text-secondary hover:text-signal transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
              </div>

              {/* Error Message */}
              {telemetryError && (
                <div className="p-3 rounded-xl bg-risk/10 border border-risk/30 text-risk font-mono text-xs">
                  {telemetryError}
                </div>
              )}

              {/* Sovereign Result Card */}
              {telemetryEngine === 'sovereign' && sovereignResult && (
                <div className="p-5 rounded-xl bg-canvas border border-border-medium space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      {sovereignResult.isVpnOrProxy ? (
                        <ShieldAlert className="size-5 text-risk" />
                      ) : (
                        <ShieldCheck className="size-5 text-verified" />
                      )}
                      <div>
                        <span className="font-heading font-bold text-sm text-text-primary block font-mono">
                          {sovereignResult.ip}
                        </span>
                        <span className="text-[11px] text-text-muted font-mono">
                          {sovereignResult.city}, {sovereignResult.state} • {sovereignResult.jurisdiction}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sovereignResult.threatScore >= 60 ? 'risk' : 'default'}
                        className="font-mono text-xs tabular-nums"
                      >
                        Risk Score: {sovereignResult.threatScore}/100
                      </Badge>
                      <Badge variant="signal" className="font-mono text-[10px]">
                        {sovereignResult.carrierType}
                      </Badge>
                    </div>
                  </div>

                  {/* Sovereign Grid Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Carrier ASN</span>
                      <span className="text-xs font-semibold text-text-primary block truncate mt-0.5">
                        {sovereignResult.asn}
                      </span>
                      <span className="text-[10px] text-text-muted truncate block">{sovereignResult.isp}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Routing Jurisdiction</span>
                      <span className="text-xs font-semibold text-text-primary block mt-0.5">
                        {sovereignResult.jurisdiction === 'NIGERIA' ? '🇳🇬 Sovereign Nigeria' : '🌐 International'}
                      </span>
                      <span className="text-[10px] text-text-muted block">ISO-3166: {sovereignResult.countryCode}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Proxy / Evasion</span>
                      <span
                        className={`text-xs font-bold block mt-0.5 ${
                          sovereignResult.isVpnOrProxy ? 'text-risk' : 'text-verified'
                        }`}
                      >
                        {sovereignResult.isVpnOrProxy ? 'DETECTED PROXY' : 'CLEAN SUBNET'}
                      </span>
                      <span className="text-[10px] text-text-muted block">{sovereignResult.threatCategory}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">NDPA 2023 Sovereignty</span>
                      <span className="text-xs font-bold text-verified block mt-0.5 flex items-center gap-1">
                        <Lock className="size-3" />
                        <span>ZERO EGRESS</span>
                      </span>
                      <span className="text-[10px] text-text-muted block">In-VPC Resolution</span>
                    </div>
                  </div>

                  {/* Sovereign Forensic Verdict */}
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      sovereignResult.threatScore >= 60
                        ? 'bg-risk/10 border-risk/30 text-risk'
                        : 'bg-canvas-raised border-border-subtle text-text-secondary'
                    }`}
                  >
                    <strong>Institutional Compliance Audit Verdict: </strong>
                    {sovereignResult.complianceNote}
                  </div>
                </div>
              )}

              {/* Public Telemetry Result Card */}
              {telemetryEngine === 'public' && telemetryResult && (
                <div className="p-5 rounded-xl bg-canvas border border-border-medium space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      {telemetryResult.isVpnOrProxy ? (
                        <ShieldAlert className="size-5 text-risk" />
                      ) : (
                        <ShieldCheck className="size-5 text-verified" />
                      )}
                      <div>
                        <span className="font-heading font-bold text-sm text-text-primary block font-mono">
                          {telemetryResult.ip}
                        </span>
                        <span className="text-[11px] text-text-muted font-mono">
                          {telemetryResult.city}, {telemetryResult.region}, {telemetryResult.country}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={telemetryResult.threatScore >= 60 ? 'risk' : 'signal'}
                      className="font-mono text-xs tabular-nums"
                    >
                      Threat Risk: {telemetryResult.threatScore}/100
                    </Badge>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">ISP Network</span>
                      <span className="text-xs font-semibold text-text-primary block truncate mt-0.5">
                        {telemetryResult.isp}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Timezone</span>
                      <span className="text-xs font-semibold text-text-primary block mt-0.5">
                        {telemetryResult.timezone}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">GPS Coordinates</span>
                      <a
                        href={`https://www.google.com/maps?q=${telemetryResult.latitude},${telemetryResult.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-signal hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>{telemetryResult.latitude.toFixed(2)}, {telemetryResult.longitude.toFixed(2)}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>

                    <div className="p-3 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted uppercase block">Proxy / Datacenter</span>
                      <span
                        className={`text-xs font-bold block mt-0.5 ${
                          telemetryResult.isVpnOrProxy ? 'text-risk' : 'text-verified'
                        }`}
                      >
                        {telemetryResult.isVpnOrProxy ? 'DETECTED' : 'CLEAN'}
                      </span>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      telemetryResult.threatScore >= 60
                        ? 'bg-risk/10 border-risk/30 text-risk'
                        : 'bg-canvas-raised border-border-subtle text-text-secondary'
                    }`}
                  >
                    <strong>Forensic Verdict: </strong>
                    {telemetryResult.riskAssessment}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-canvas-overlay flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted">
            Institutional Gateways: CBN Modulo-10 NUBAN, Sovereign In-VPC Subnet & Paystack Directory
          </span>
          <Button variant="default" size="sm" onClick={onClose}>
            Close Studio
          </Button>
        </div>
      </div>
    </div>
  );
};
