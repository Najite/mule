import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ForensicDossierResult } from '@/lib/services/ai-copilot';
import { SupabaseDbService } from '@/lib/supabase/db-service';
import {
  X,
  Sparkles,
  Cpu,
  Zap,
  CheckCircle2,
  Copy,
  Download,
  Lock,
  Layers,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface GroqDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: ForensicDossierResult | null;
  isSynthesizing?: boolean;
  onRegenerate?: () => void;
  onSelectNode?: (nodeId: string) => void;
  onExecutePnd?: (accountIds: string[]) => void;
}

export const GroqDossierModal: React.FC<GroqDossierModalProps> = ({
  isOpen,
  onClose,
  dossier,
  isSynthesizing = false,
  onRegenerate,
  onSelectNode,
  onExecutePnd,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pndSuccess, setPndSuccess] = useState(false);

  // Escape key close handler (better-accessibility)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dossier) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const jsonStr = JSON.stringify(dossier, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dossier.caseReference}_GROQ_DOSSIER.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await SupabaseDbService.logAuditAction({
        action: 'SAR_EXPORT',
        targetEntityId: dossier.clusterId,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `Exported Groq Forensic Dossier JSON for case ${dossier.caseReference}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleTriggerBatchPnd = async () => {
    if (onExecutePnd && dossier.finacleFreezeDirective.targetAccounts.length > 0) {
      onExecutePnd(dossier.finacleFreezeDirective.targetAccounts);
      setPndSuccess(true);
      setTimeout(() => setPndSuccess(false), 3000);
    }
  };

  const groqMeta = dossier.groqMetadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-500/30 bg-[#0A0E17] shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-200">
        
        {/* Top Institutional Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0E131F]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heading text-white tracking-wide">
                  {dossier.title}
                </h2>
                <Badge
                  variant="outline"
                  className={
                    dossier.threatLevel === 'CRITICAL'
                      ? 'border-red-500/40 text-red-400 bg-red-500/10 text-[10px]'
                      : 'border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]'
                  }
                >
                  {dossier.threatLevel} THREAT
                </Badge>
              </div>
              <p className="text-xs font-mono text-slate-400">
                REF: <span className="text-amber-400 font-semibold">{dossier.caseReference}</span> | REGULATION:{' '}
                <span className="text-slate-300">{dossier.cbnRegulationCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isSynthesizing}
                className="text-xs border-[#1E293B] text-slate-300 hover:text-white hover:bg-white/5 gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isSynthesizing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isSynthesizing ? 'Inference...' : 'Re-run Groq'}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Groq LPU Hardware Acceleration Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-gradient-to-r from-amber-500/10 via-[#0E1524] to-emerald-500/10 border-b border-[#1E293B] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Cpu className="size-3.5" /> GROQ LPU ACCELERATED
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              Model: <span className="text-amber-400 font-bold">{groqMeta?.model || 'openai/gpt-oss-120b'}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            {groqMeta && (
              <>
                <span className="flex items-center gap-1">
                  <Zap className="size-3 text-amber-400" />
                  Latency:{' '}
                  <span className="text-emerald-400 font-bold">
                    {groqMeta.latencyMs}ms
                  </span>
                </span>
                {groqMeta.totalTokens && (
                  <span>
                    Tokens:{' '}
                    <span className="text-slate-200 font-semibold">
                      {groqMeta.totalTokens}
                    </span>{' '}
                    ({groqMeta.completionTokens || 0} completion)
                  </span>
                )}
              </>
            )}
            <span className="text-slate-400">
              Confidence:{' '}
              <span className="text-amber-400 font-bold">{dossier.confidenceScore}%</span>
            </span>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Executive Summary */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="size-3.5" /> 1. Executive Intelligence Summary
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(dossier.executiveSummary, 'exec')}
                className="text-[11px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1"
              >
                {copiedKey === 'exec' ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                {copiedKey === 'exec' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {dossier.executiveSummary}
            </p>
          </div>

          {/* Forensic Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Topological Proof */}
            <div className="rounded-xl border border-[#1E293B] bg-[#0E131F] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="size-3.5 text-amber-400" /> Topological Proof
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {dossier.topologicalProof}
              </p>
            </div>

            {/* Hardware Forensics */}
            <div className="rounded-xl border border-[#1E293B] bg-[#0E131F] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-blue-400" /> Hardware Forensics
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {dossier.hardwareForensics}
              </p>
            </div>

            {/* Velocity Analysis */}
            <div className="rounded-xl border border-[#1E293B] bg-[#0E131F] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="size-3.5 text-emerald-400" /> Velocity Analysis
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {dossier.velocityAnalysis}
              </p>
            </div>
          </div>

          {/* Interactive Evidence Anchors */}
          {dossier.anchors.length > 0 && (
            <div className="rounded-xl border border-[#1E293B] bg-[#0E131F] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-300">
                  Deterministic Evidence Anchors ({dossier.anchors.length} Nodes Verified)
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Click any anchor to inspect in Forensic Graph Studio
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dossier.anchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    type="button"
                    onClick={() => {
                      if (onSelectNode) {
                        onSelectNode(anchor.id);
                        onClose();
                      }
                    }}
                    className="p-2 rounded-lg bg-[#080B10] border border-[#1E293B] hover:border-amber-500/50 hover:bg-amber-500/5 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-bold text-amber-400 group-hover:text-amber-300">
                        {anchor.id}
                      </span>
                      <ExternalLink className="size-3 text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 line-clamp-2">
                      {anchor.proof}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Official NFIU SAR Narrative Pre-formatted Block */}
          <div className="rounded-xl border border-[#1E293B] bg-[#080B10] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-amber-400" /> Official NFIU SAR Regulatory Narrative (MLPA 2022)
              </h4>
              <button
                type="button"
                onClick={() => handleCopy(dossier.nfiuNarrative, 'nfiu')}
                className="text-[11px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1"
              >
                {copiedKey === 'nfiu' ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                {copiedKey === 'nfiu' ? 'Copied to Clipboard' : 'Copy Narrative'}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 bg-[#0A0E17] p-3 rounded-lg border border-[#1E293B] whitespace-pre-wrap leading-relaxed">
              {dossier.nfiuNarrative}
            </pre>
          </div>

          {/* Finacle PND Directive */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-red-400" />
                <h4 className="text-xs font-mono uppercase font-bold text-red-400">
                  Targeted Finacle PND Freeze Directive
                </h4>
              </div>
              <Badge variant="outline" className="border-red-500/40 text-red-400 text-[10px]">
                Reason Code {dossier.finacleFreezeDirective.reasonCode}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">CORE BANKING SERVICE:</span>
                <span className="text-slate-200 font-bold">{dossier.finacleFreezeDirective.serviceName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">FREEZE DESCRIPTION:</span>
                <span className="text-slate-200">{dossier.finacleFreezeDirective.description}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block mb-1">
                TARGET ACCOUNTS ({dossier.finacleFreezeDirective.targetAccounts.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dossier.finacleFreezeDirective.targetAccounts.map((acc) => (
                  <span
                    key={acc}
                    className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[11px] font-mono font-semibold border border-red-500/30"
                  >
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#1E293B] bg-[#0E131F]/90">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={isExporting}
              className="text-xs border-[#1E293B] text-slate-300 hover:text-white hover:bg-white/5 gap-1.5"
            >
              <Download className="size-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export Dossier JSON'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(dossier.nfiuNarrative, 'footer')}
              className="text-xs border-[#1E293B] text-slate-300 hover:text-white hover:bg-white/5 gap-1.5"
            >
              {copiedKey === 'footer' ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              <span>{copiedKey === 'footer' ? 'Narrative Copied' : 'Copy NFIU Narrative'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onExecutePnd && dossier.finacleFreezeDirective.targetAccounts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleTriggerBatchPnd}
                className="text-xs gap-1.5 bg-red-600 hover:bg-red-700 font-bold"
              >
                <Lock className="size-3.5" />
                <span>
                  {pndSuccess
                    ? 'Finacle PND Executed!'
                    : `Execute PND (${dossier.finacleFreezeDirective.targetAccounts.length} Accounts)`}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#1E293B] text-slate-400 hover:text-white"
            >
              Close
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
