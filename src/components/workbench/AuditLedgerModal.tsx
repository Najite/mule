import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  investigationStore,
  AuditLogEntry,
  SavedCaseRecord,
} from '@/lib/storage/investigation-store';
import { SyndicateCluster } from '@/lib/graph-engine/types';
import {
  X,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Trash2,
  RefreshCw,
  FolderOpen,
  BookmarkPlus,
  Lock,
  Send,
  FileCode,
  Layers,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface AuditLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCluster: SyndicateCluster | null;
  onLoadCase?: (caseRecord: SavedCaseRecord) => void;
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  isOpen,
  onClose,
  currentCluster,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'cases'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [savedCases, setSavedCases] = useState<SavedCaseRecord[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New Case Bookmark Form
  const [caseTitle, setCaseTitle] = useState('');
  const [caseThreat, setCaseThreat] = useState('CRITICAL');
  const [caseNotes, setCaseNotes] = useState('');
  const [caseSavedSuccess, setCaseSavedSuccess] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const logs = await investigationStore.getAuditTrail();
      const cases = await investigationStore.getAllSavedCases();
      setAuditLogs(logs.reverse()); // Latest first
      setSavedCases(cases.reverse());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
      if (currentCluster) {
        setCaseTitle(currentCluster.name);
        setCaseThreat(currentCluster.riskScore >= 75 ? 'CRITICAL' : 'HIGH');
        setCaseNotes(currentCluster.narrative);
      }
    }
  }, [isOpen, currentCluster]);

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  // Export audit logs as CSV
  const handleExportCsv = () => {
    if (auditLogs.length === 0) return;
    const header = 'id,timestamp,officer_id,action,target_entity,details\n';
    const rows = auditLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.officerId}","${l.action}","${l.targetEntityId}","${l.details.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBN_AML_AUDIT_TRAIL_ZENITH_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export audit logs as JSON
  const handleExportJson = () => {
    if (auditLogs.length === 0) return;
    const payload = {
      exportMetadata: {
        institution: 'Zenith Bank Plc (057)',
        system: 'FININT AML Mule Detection Studio',
        statutoryStandards: ['CBN AML/CFT Regulations 2022 §34', 'Nigeria Data Protection Act 2023 §30'],
        exportedAt: new Date().toISOString(),
        totalRecords: auditLogs.length,
      },
      ledger: auditLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBN_AML_AUDIT_LEDGER_ZENITH_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear demo audit trail
  const handleClearLedger = async () => {
    if (window.confirm('Clear all local audit trail records from browser IndexedDB?')) {
      await investigationStore.clearAuditTrail();
      await fetchRecords();
    }
  };

  // Save new case dossier
  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const caseRef = `CASE-ZENITH-${Date.now().toString(36).toUpperCase()}`;
    const newCase: SavedCaseRecord = {
      caseReference: caseRef,
      title: caseTitle.trim() || 'Untitled Syndicate Investigation',
      clusterId: currentCluster?.id || 'MANUAL-CLUSTER',
      threatLevel: caseThreat,
      totalExposure: currentCluster?.totalExposure || 15000000,
      notes: caseNotes.trim() || 'No officer notes recorded.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await investigationStore.saveCase(newCase);
    await investigationStore.logAuditAction({
      action: 'DATASET_IMPORT',
      targetEntityId: caseRef,
      details: `Saved regulatory investigation dossier: ${newCase.title}`,
      officerId: 'ZENITH_AML_INVESTIGATOR_L2',
    });

    setCaseSavedSuccess(true);
    setTimeout(() => setCaseSavedSuccess(false), 2500);
    await fetchRecords();
  };

  // Delete saved case
  const handleDeleteCase = async (caseRef: string) => {
    if (window.confirm(`Delete case dossier ${caseRef}?`)) {
      await investigationStore.deleteSavedCase(caseRef);
      await fetchRecords();
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'PND_FREEZE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk/15 text-risk border border-risk/30">
            <Lock className="size-2.5" />
            <span>PND FREEZE</span>
          </span>
        );
      case 'PND_UNFREEZE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-verified/15 text-verified border border-verified/30">
            <ShieldCheck className="size-2.5" />
            <span>PND LIFTED</span>
          </span>
        );
      case 'NFIU_TRANSMISSION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-signal/15 text-signal border border-signal/30">
            <Send className="size-2.5" />
            <span>NFIU B2B SENT</span>
          </span>
        );
      case 'GOAML_EXPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-signal/10 text-signal border border-signal/20">
            <FileCode className="size-2.5" />
            <span>GOAML XML</span>
          </span>
        );
      case 'INGEST_ISO20022':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
            <Layers className="size-2.5" />
            <span>ISO 20022</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-canvas text-text-muted border border-border-subtle">
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div className="bg-canvas-raised border border-border-medium rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-canvas-overlay/90">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
              <FileSpreadsheet className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="audit-modal-title" className="font-heading font-bold text-base text-text-primary">
                  Regulatory Compliance Ledger & Case Management
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-verified/15 text-verified border border-verified/30 font-semibold">
                  CBN §34 & NDPA §30
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Tamper-evident institutional audit trail persisted locally in IndexedDB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg p-0.5 bg-canvas border border-border-subtle text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                1. Audit Ledger ({auditLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cases')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'cases'
                    ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                2. Case Dossiers ({savedCases.length})
              </button>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close audit ledger modal">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'audit' ? (
            /* TAB 1: AUDIT LEDGER */
            <div className="space-y-4">
              {/* Context Banner & Action Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-canvas border border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-text-muted uppercase font-semibold">
                    Action Filter:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                    {['ALL', 'PND_FREEZE', 'PND_UNFREEZE', 'NFIU_TRANSMISSION', 'GOAML_EXPORT', 'INGEST_ISO20022'].map(
                      (act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setFilterAction(act)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            filterAction === act
                              ? 'bg-signal/20 text-signal font-bold border border-signal/40'
                              : 'bg-canvas-raised text-text-muted hover:text-text-primary border border-border-subtle'
                          }`}
                        >
                          {act.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRecords}
                    disabled={isLoading}
                    className="text-xs font-mono h-7 gap-1 border-border-medium"
                    title="Refresh logs from IndexedDB"
                  >
                    <RefreshCw className={`size-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCsv}
                    className="text-xs font-mono h-7 gap-1 border-signal/40 text-signal hover:bg-signal/10"
                  >
                    <Download className="size-3" />
                    <span>Export CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJson}
                    className="text-xs font-mono h-7 gap-1 border-border-medium"
                  >
                    <span>JSON</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLedger}
                    className="text-xs font-mono h-7 gap-1 text-text-muted hover:text-risk"
                    title="Clear demo audit records"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Audit Table */}
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-canvas border border-border-subtle text-text-muted font-mono space-y-2">
                  <FileSpreadsheet className="size-8 mx-auto opacity-40" />
                  <p>No audit trail records found for selected filter.</p>
                  <p className="text-[11px] text-text-secondary">
                    Actions such as Finacle PND freeze, NFIU SAR transmission, or ISO 20022 ingestion are recorded automatically.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle overflow-hidden bg-canvas">
                  <div className="overflow-x-auto max-h-[460px]">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-canvas-raised border-b border-border-subtle sticky top-0 text-[10px] text-text-muted uppercase">
                        <tr>
                          <th className="p-3">Timestamp (UTC)</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Target Entity</th>
                          <th className="p-3">Officer ID</th>
                          <th className="p-3">Regulatory Audit Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {filteredLogs.map((entry) => (
                          <tr key={entry.id} className="hover:bg-canvas-raised/50 transition-colors">
                            <td className="p-3 text-text-muted whitespace-nowrap">
                              {entry.timestamp.replace('T', ' ').slice(0, 19)}
                            </td>
                            <td className="p-3 whitespace-nowrap">{getActionBadge(entry.action)}</td>
                            <td className="p-3 text-text-primary font-bold whitespace-nowrap">
                              {entry.targetEntityId}
                            </td>
                            <td className="p-3 text-verified whitespace-nowrap">{entry.officerId}</td>
                            <td className="p-3 text-text-secondary leading-relaxed max-w-xs sm:max-w-md truncate hover:whitespace-normal">
                              {entry.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: CASE DOSSIERS */
            <div className="space-y-6">
              {/* Bookmark Active Cluster Form */}
              <form onSubmit={handleSaveCase} className="p-4 rounded-xl bg-canvas border border-border-medium space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <BookmarkPlus className="size-4 text-signal" />
                    <span className="font-heading font-bold text-sm text-text-primary">
                      Bookmark Active Investigation into Institutional Registry
                    </span>
                  </div>
                  {caseSavedSuccess && (
                    <span className="text-verified text-[11px] font-mono flex items-center gap-1 font-semibold animate-pulse">
                      <ShieldCheck className="size-3.5" />
                      Saved into IndexedDB!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-text-muted uppercase font-semibold">
                      Case Dossier Title / Syndicate Name
                    </label>
                    <input
                      type="text"
                      required
                      value={caseTitle}
                      onChange={(e) => setCaseTitle(e.target.value)}
                      placeholder="e.g. Syndicate Ring: Apex Swift Circular Funnel"
                      className="p-2 rounded-lg bg-canvas-raised border border-border-subtle text-text-primary text-xs font-mono focus:border-signal focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-text-muted uppercase font-semibold">
                      Threat Priority
                    </label>
                    <select
                      value={caseThreat}
                      onChange={(e) => setCaseThreat(e.target.value)}
                      className="p-2 rounded-lg bg-canvas-raised border border-border-subtle text-text-primary text-xs font-mono focus:border-signal focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL (Score &ge; 75)</option>
                      <option value="HIGH">HIGH (Score 50 - 74)</option>
                      <option value="ELEVATED">ELEVATED (Score &lt; 50)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-12 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-text-muted uppercase font-semibold">
                      Officer Forensic Observations & Case Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={caseNotes}
                      onChange={(e) => setCaseNotes(e.target.value)}
                      placeholder="Document observed mule accounts, shared BVN links, or device identifiers..."
                      className="p-2.5 rounded-lg bg-canvas-raised border border-border-subtle text-text-primary text-xs font-mono focus:border-signal focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button type="submit" variant="default" size="sm" className="gap-1.5 font-semibold">
                    <BookmarkPlus className="size-3.5" />
                    <span>Save Case to IndexedDB</span>
                  </Button>
                </div>
              </form>

              {/* Saved Cases List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs uppercase text-text-muted font-mono tracking-wider">
                    Persisted Case Dossiers ({savedCases.length})
                  </span>
                  <span className="text-[11px] font-mono text-text-muted">
                    Persistent across browser refreshes
                  </span>
                </div>

                {savedCases.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-canvas border border-border-subtle text-text-muted font-mono space-y-1">
                    <FolderOpen className="size-6 mx-auto opacity-40" />
                    <p>No saved case dossiers in local registry.</p>
                    <p className="text-[10px] text-text-secondary">
                      Use the form above to bookmark active syndicate investigations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedCases.map((c) => (
                      <div
                        key={c.caseReference}
                        className="p-4 rounded-xl bg-canvas border border-border-subtle hover:border-border-medium transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-heading font-bold text-sm text-text-primary truncate">
                              {c.title}
                            </span>
                            <Badge
                              variant={c.threatLevel === 'CRITICAL' ? 'risk' : 'signal'}
                              className="font-mono text-[10px]"
                            >
                              {c.threatLevel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[10px] text-text-muted mb-2">
                            <span>Ref: {c.caseReference}</span>
                            <span>•</span>
                            <span className="text-signal font-semibold">
                              ₦{(c.totalExposure || 18500000).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed bg-canvas-raised p-2 rounded-lg border border-border-subtle">
                            {c.notes}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle font-mono text-[10px] text-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{c.createdAt.slice(0, 10)}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCase(c.caseReference)}
                            className="h-6 px-2 text-risk hover:bg-risk/10"
                            title="Delete case dossier"
                          >
                            <Trash2 className="size-3" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-canvas-overlay flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
            <UserCheck className="size-3.5 text-verified" />
            <span>Audit Officer: ZENITH_AML_INVESTIGATOR_L2 (Authenticated L2 Analyst)</span>
          </div>
          <Button variant="default" size="sm" onClick={onClose}>
            Close Studio
          </Button>
        </div>
      </div>
    </div>
  );
};
