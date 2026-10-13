import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SAMPLE_DATASETS } from '@/lib/graph-engine/sample-datasets';
import { GraphDetectionEngine } from '@/lib/graph-engine/algorithms';
import { CsvTransactionParser } from '@/lib/graph-engine/csv-parser';
import { Iso20022Parser } from '@/lib/graph-engine/iso20022-parser';
import { TransactionRecord, EntityNode, SyndicateCluster } from '@/lib/graph-engine/types';
import { ForceGraphCanvas } from '@/components/graph/ForceGraphCanvas';
import { LiveVerificationModal } from './LiveVerificationModal';
import { AuditLedgerModal } from './AuditLedgerModal';
import { GoAmlReportGenerator } from '@/lib/services/goaml-generator';
import { AiCopilotService, ForensicDossierResult } from '@/lib/services/ai-copilot';
import {
  FinacleCoreConnector,
  FinacleFreezeRequest,
  FinacleResponseEnvelope,
} from '@/lib/services/finacle-envelope';
import {
  NfiuConnectClient,
  NfiuSubmissionPackage,
  NfiuSubmissionReceipt,
} from '@/lib/services/nfiu-connect';
import { investigationStore } from '@/lib/storage/investigation-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Upload,
  Download,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Lock,
  Unlock,
  Layers,
  Terminal,
  FileCode,
  Cpu,
  Copy,
  Check,
  Send,
  Building2,
} from 'lucide-react';

export const InvestigationWorkbench: React.FC = () => {
  // Current active dataset
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('apex-syndicate');
  const [transactions, setTransactions] = useState<TransactionRecord[]>(
    SAMPLE_DATASETS[0].records
  );

  // Filter & Search states
  const [riskFilter, setRiskFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<SyndicateCluster | null>(null);

  // Live streaming simulation state
  const [isStreaming, setIsStreaming] = useState(false);
  const streamTimerRef = useRef<number | null>(null);

  // Frozen Account IDs for Finacle PND state mutation
  const [frozenAccountIds, setFrozenAccountIds] = useState<Set<string>>(new Set());
  const [finacleModalOpen, setFinacleModalOpen] = useState(false);
  const [activeFinaclePayload, setActiveFinaclePayload] = useState<Record<string, unknown> | null>(null);
  const [finacleModalTab, setFinacleModalTab] = useState<'envelope' | 'response' | 'json'>('envelope');
  const [finacleEnvelopeXml, setFinacleEnvelopeXml] = useState<string>('');
  const [finacleHostResponse, setFinacleHostResponse] = useState<FinacleResponseEnvelope | null>(null);
  const [finacleCopied, setFinacleCopied] = useState<boolean>(false);

  // Grounded GenAI Copilot State
  const [aiDossier, setAiDossier] = useState<ForensicDossierResult | null>(null);
  const [isSynthesizingAi, setIsSynthesizingAi] = useState(false);

  // goAML XML & NFIU B2B Submission State
  const [goAmlModalOpen, setGoAmlModalOpen] = useState(false);
  const [currentGoAmlXml, setCurrentGoAmlXml] = useState<string>('');
  const [xmlCopied, setXmlCopied] = useState(false);
  const [nfiuPackage, setNfiuPackage] = useState<NfiuSubmissionPackage | null>(null);
  const [nfiuReceipt, setNfiuReceipt] = useState<NfiuSubmissionReceipt | null>(null);
  const [isTransmittingNfiu, setIsTransmittingNfiu] = useState(false);

  // Inspector Sub-Tab: 'ai' | 'metrics' | 'risk'
  const [inspectorTab, setInspectorTab] = useState<'ai' | 'metrics' | 'risk'>('ai');

  // UI Ingestion modal states (ISO 20022 pacs.008 + CSV)
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState<'iso20022' | 'csv'>('iso20022');
  const [isoXmlInputText, setIsoXmlInputText] = useState('');
  const [isoError, setIsoError] = useState<string | null>(null);
  const [csvInputText, setCsvInputText] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [pndStatus, setPndStatus] = useState<string | null>(null);
  const [sarExported, setSarExported] = useState(false);

  // Live Verification & Telemetry Modal State
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verifyModalTab, setVerifyModalTab] = useState<'banking' | 'telemetry'>('banking');
  const verifyInitialAccount = '2081940192';
  const verifyInitialBank = '057';
  const verifyInitialIp = '102.89.43.12';

  // Audit Ledger & Case Management Modal State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogCount, setAuditLogCount] = useState<number>(0);

  const refreshAuditCount = () => {
    investigationStore.getAuditTrail().then((logs) => setAuditLogCount(logs.length));
  };

  // Switch dataset handler
  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
    const ds = SAMPLE_DATASETS.find((d) => d.id === id);
    if (ds) {
      setTransactions([...ds.records]);
      setSelectedNode(null);
      setSelectedCluster(null);
      setPndStatus(null);
      setAiDossier(null);
      setFrozenAccountIds(new Set());
    }
  };

  // Run Real Graph Detection Engine
  const baseDetectionResults = useMemo(() => {
    return GraphDetectionEngine.analyzeTransactions(transactions);
  }, [transactions]);

  // Decorate nodes with active live PND frozen state
  const detectionResults = useMemo(() => {
    return {
      ...baseDetectionResults,
      nodes: baseDetectionResults.nodes.map((n) => ({
        ...n,
        isFrozen: frozenAccountIds.has(n.id),
      })),
    };
  }, [baseDetectionResults, frozenAccountIds]);

  // Set default selected cluster or node on results change
  useEffect(() => {
    if (detectionResults.clusters.length > 0 && !selectedCluster && !selectedNode) {
      setSelectedCluster(detectionResults.clusters[0]);
    }
  }, [detectionResults, selectedCluster, selectedNode]);

  // Auto-synthesize initial AI dossier when cluster changes
  useEffect(() => {
    const targetCluster = selectedCluster || detectionResults.clusters[0];
    if (targetCluster && !aiDossier) {
      AiCopilotService.synthesizeDossier({
        cluster: targetCluster,
        nodes: detectionResults.nodes,
        edges: detectionResults.edges,
      }).then((dossier) => setAiDossier(dossier));
    }
  }, [selectedCluster, detectionResults.clusters]);

  // Live Stream Simulation Effect
  useEffect(() => {
    if (isStreaming) {
      streamTimerRef.current = window.setInterval(() => {
        const accounts = ['ACC-4891', 'ACC-8204', 'ACC-9102', 'ACC-7330', 'ACC-NEW-MULE'];
        const randomSource = accounts[Math.floor(Math.random() * accounts.length)];
        const randomTarget = accounts[Math.floor(Math.random() * accounts.length)];

        if (randomSource !== randomTarget) {
          const newTx: TransactionRecord = {
            id: `TXN-STREAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            timestamp: new Date().toISOString(),
            sourceId: randomSource,
            targetId: randomTarget,
            amount: Math.floor(Math.random() * 2500000) + 250000,
            rail: 'NIP',
            deviceId: 'DEV-IOS-22',
            bvn: 'BVN-2281940192',
            narration: 'Live streaming simulated settlement',
          };

          setTransactions((prev) => [...prev, newTx]);
        }
      }, 1200);
    } else if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isStreaming]);

  // Handle CSV Import
  const handleImportCsv = () => {
    if (!csvInputText.trim()) return;
    const { records, error } = CsvTransactionParser.parseCsv(csvInputText);
    if (error) {
      setCsvError(error);
      return;
    }
    setTransactions(records);
    setSelectedDatasetId('custom-csv');
    setCsvModalOpen(false);
    setCsvInputText('');
    setCsvError(null);
    setSelectedNode(null);
    setSelectedCluster(null);
    setAiDossier(null);
    setFrozenAccountIds(new Set());
  };

  // Handle ISO 20022 pacs.008 XML Import
  const handleImportIso20022 = () => {
    if (!isoXmlInputText.trim()) {
      setIsoError('Please paste or load a valid ISO 20022 pacs.008 XML clearing payload.');
      return;
    }
    const { records, error } = Iso20022Parser.parsePacs008(isoXmlInputText);
    if (error || records.length === 0) {
      setIsoError(error || 'No valid credit transfer transactions found in XML.');
      return;
    }
    setTransactions(records);
    setSelectedDatasetId('iso20022-clearing');
    setCsvModalOpen(false);
    setIsoXmlInputText('');
    setIsoError(null);
    setSelectedNode(null);
    setSelectedCluster(null);
    setAiDossier(null);
    setFrozenAccountIds(new Set());
    investigationStore.logAuditAction({
      action: 'INGEST_ISO20022',
      targetEntityId: 'CLEARING_BATCH',
      details: `Ingested ${records.length} pacs.008 interbank clearing records`,
      officerId: 'ZENITH_AML_INVESTIGATOR_L2',
    });
    refreshAuditCount();
    setPndStatus(`Loaded ${records.length} ISO 20022 clearing records into bipartite graph.`);
  };

  // Quick-load sample ISO 20022 pacs.008 XML
  const handleLoadSampleIso = () => {
    const sample = Iso20022Parser.generateSamplePacs008();
    setIsoXmlInputText(sample);
    setIsoError(null);
  };

  // Handle Sample CSV Download
  const handleDownloadSampleCsv = () => {
    const csvContent = CsvTransactionParser.generateSampleCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_zenith_transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Manual AI Dossier Generation
  const handleSynthesizeAiDossier = async () => {
    const targetCluster = selectedCluster || detectionResults.clusters[0];
    if (!targetCluster) return;
    setIsSynthesizingAi(true);
    try {
      const res = await AiCopilotService.synthesizeDossier({
        cluster: targetCluster,
        nodes: detectionResults.nodes,
        edges: detectionResults.edges,
      });
      setAiDossier(res);
      setInspectorTab('ai');
    } finally {
      setIsSynthesizingAi(false);
    }
  };

  // Restore persisted PND frozen accounts and audit count on mount from IndexedDB
  useEffect(() => {
    investigationStore.getAllFrozenAccounts().then((records) => {
      if (records.length > 0) {
        setFrozenAccountIds(new Set(records.map((r) => r.accountId)));
      }
    });
    refreshAuditCount();
  }, []);

  // Handle Finacle PND Trigger Simulation & State Mutation
  const handleTriggerPnd = () => {
    const targetCluster = selectedCluster || detectionResults.clusters[0];
    const targetAccountIds = targetCluster
      ? targetCluster.nodeIds.filter((id) => !id.startsWith('DEV-') && !id.startsWith('BVN-'))
      : selectedNode
      ? [selectedNode.id]
      : [];

    if (targetAccountIds.length === 0) return;

    // Mutate internal state: mark nodes frozen
    setFrozenAccountIds((prev) => {
      const next = new Set(prev);
      targetAccountIds.forEach((id) => next.add(id));
      return next;
    });

    const primaryAccount = targetAccountIds[0] || '2081940192';

    // Persist to IndexedDB and record auditable compliance action
    targetAccountIds.forEach((id) => {
      investigationStore.saveFrozenAccount({
        accountId: id,
        bankCode: '057',
        reasonCode: '08',
        reasonDescription: 'CBN AML/CFT 2022 - SUSPECTED MONEY MULE RING',
        frozenAt: new Date().toISOString(),
        initiator: 'FININT_AUTO_ENGINE_L2',
        status: 'ACTIVE_PND',
      });
      investigationStore.logAuditAction({
        action: 'PND_FREEZE',
        targetEntityId: id,
        details: 'Placed automated Finacle PND hold pursuant to CBN AML Guidelines',
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
      });
    });
    refreshAuditCount();

    // Generate Official Infosys Finacle FI XML SOAP Request
    const freezeReq: FinacleFreezeRequest = {
      accountNumber: primaryAccount,
      reasonCode: '08',
      reasonDescription: 'CBN AML/CFT 2022 - SUSPECTED MONEY MULE RING',
      caseReference: targetCluster?.id || 'CASE-CBN-AML-2026',
      initiatorOfficer: 'ZENITH_AML_INVESTIGATOR_L2',
      freezeType: 'TOTAL_PND',
    };

    const envelopeXml = FinacleCoreConnector.buildModifyAccountFreezeXml(freezeReq);
    const hostResponse = FinacleCoreConnector.simulateHostExecution(freezeReq);

    const payload = {
      service: 'Finacle_FI_ModifyAccountFreeze',
      requestHeader: {
        bankId: '057',
        channel: 'FININT_AML_FRAUD_DESK',
        transactionId: hostResponse.hostTransactionId,
        timestamp: new Date().toISOString(),
      },
      freezeDetails: {
        accountNumbers: targetAccountIds,
        primaryAccount,
        freezeType: 'TOTAL_PND',
        freezeReasonCode: '08',
        freezeReasonDescription: 'CBN AML/CFT 2022 - SUSPECTED MONEY MULE RING',
        initiatorId: 'FININT_AUTO_ENGINE_L2',
        approvalStatus: 'AUTO_PLACED_RESTRICTION',
      },
    };

    setActiveFinaclePayload(payload);
    setFinacleEnvelopeXml(envelopeXml);
    setFinacleHostResponse(hostResponse);
    setFinacleModalTab('envelope');
    setFinacleModalOpen(true);
    setPndStatus(`Finacle Core API: Post-No-Debit (PND) hold placed on ${targetAccountIds.length} accounts.`);
  };

  // Handle Unfreeze
  const handleUnfreezeAccount = (accountId: string) => {
    setFrozenAccountIds((prev) => {
      const next = new Set(prev);
      next.delete(accountId);
      return next;
    });
    investigationStore.removeFrozenAccount(accountId);
    investigationStore.logAuditAction({
      action: 'PND_UNFREEZE',
      targetEntityId: accountId,
      details: 'PND restriction lifted by compliance officer',
      officerId: 'ZENITH_AML_INVESTIGATOR_L2',
    });
    refreshAuditCount();
    setPndStatus(`Finacle Core API: Account ${accountId} PND restriction lifted.`);
  };

  // Handle goAML XML Report Generation
  const handleExportGoAmlXml = () => {
    const primaryCluster = selectedCluster || detectionResults.clusters[0];
    if (!primaryCluster) return;

    const xml = GoAmlReportGenerator.generateGoAmlXml({
      cluster: primaryCluster,
      nodes: detectionResults.nodes,
      edges: detectionResults.edges,
    });

    investigationStore.logAuditAction({
      action: 'GOAML_EXPORT',
      targetEntityId: primaryCluster.id,
      details: `Generated NFIU goAML XML regulatory filing for cluster ${primaryCluster.name}`,
      officerId: 'ZENITH_AML_INVESTIGATOR_L2',
    });
    refreshAuditCount();

    setCurrentGoAmlXml(xml);
    setNfiuReceipt(null);
    setNfiuPackage(null);
    setGoAmlModalOpen(true);
  };

  // Transmit SAR to NFIU via B2B WebService Direct Connect
  const handleTransmitNfiu = async () => {
    if (!currentGoAmlXml) return;
    setIsTransmittingNfiu(true);
    try {
      const primaryCluster = selectedCluster || detectionResults.clusters[0];
      const totalExposure = primaryCluster?.totalExposure || 18500000;
      const pkg = await NfiuConnectClient.createSubmissionPackage({
        xmlPayload: currentGoAmlXml,
        caseReference: primaryCluster?.id || 'SAR-2026-NFIU',
        totalTransactionsCount: transactions.length,
        totalExposureNgn: totalExposure,
      });
      const receipt = NfiuConnectClient.generateTransmissionReceipt(pkg);
      setNfiuPackage(pkg);
      setNfiuReceipt(receipt);
      investigationStore.logAuditAction({
        action: 'NFIU_TRANSMISSION',
        targetEntityId: receipt.receiptNumber,
        details: `Transmitted goAML SAR Package ${pkg.packageId} to NFIU. Batch: ${receipt.nfiuBatchId}, SHA-256: ${pkg.sha256XmlDigest}`,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
      });
      refreshAuditCount();
    } finally {
      setIsTransmittingNfiu(false);
    }
  };

  const handleDownloadXmlFile = () => {
    if (!currentGoAmlXml) return;
    const blob = new Blob([currentGoAmlXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFIU_SAR_ZENITH_${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSarExported(true);
    setTimeout(() => setSarExported(false), 2500);
  };

  const handleCopyXml = () => {
    if (!currentGoAmlXml) return;
    navigator.clipboard.writeText(currentGoAmlXml);
    setXmlCopied(true);
    setTimeout(() => setXmlCopied(false), 2000);
  };

  // Node selection from canvas or list
  const handleSelectNode = (node: EntityNode) => {
    setSelectedNode(node);
    const cluster = detectionResults.clusters.find((c) => c.nodeIds.includes(node.id));
    if (cluster) {
      setSelectedCluster(cluster);
    }
  };

  // Filtered nodes by search
  const visibleNodes = useMemo(() => {
    if (!searchQuery.trim()) return detectionResults.nodes;
    const query = searchQuery.toLowerCase();
    return detectionResults.nodes.filter(
      (n) => n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query)
    );
  }, [detectionResults.nodes, searchQuery]);

  return (
    <section
      id="workbench"
      className="py-20 sm:py-28 border-t border-border-subtle bg-canvas relative overflow-hidden"
      aria-labelledby="workbench-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-signal/10 border border-signal/30 text-signal mb-3">
              <Terminal className="size-3.5" />
              <span>Phase 1 Production Intelligence Studio</span>
            </div>
            <h2
              id="workbench-heading"
              className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary tracking-tight"
            >
              Interactive Forensic Workbench
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-2xl">
              Heterogeneous bipartite graph engine with linear Tarjan SCC cycle detection, grounded
              GenAI NFIU SAR drafting, and simulated Finacle core banking PND freeze integration.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVerifyModalTab('banking');
                setVerificationModalOpen(true);
              }}
              className="gap-1.5 text-xs border-verified/40 text-verified hover:bg-verified/10"
            >
              <span className="size-1.5 rounded-full bg-verified animate-pulse" />
              <span>NUBAN & IP Gateway</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshAuditCount();
                setAuditModalOpen(true);
              }}
              className="gap-1.5 text-xs border-border-medium hover:border-signal/40 hover:text-signal"
            >
              <ShieldCheck className="size-3.5 text-verified" />
              <span>Audit Ledger & Cases</span>
              {auditLogCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-verified/20 text-verified font-bold">
                  {auditLogCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleCsv}
              className="gap-1.5 text-xs border-border-medium"
            >
              <Download className="size-3.5" />
              <span>Sample CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIngestTab('iso20022');
                setCsvModalOpen(true);
              }}
              className="gap-1.5 text-xs border-signal/40 text-signal hover:bg-signal/10"
            >
              <Upload className="size-3.5" />
              <span>Ingest (ISO 20022 / CSV)</span>
            </Button>
            <Button
              variant={isStreaming ? 'destructive' : 'default'}
              size="sm"
              onClick={() => setIsStreaming(!isStreaming)}
              className="gap-1.5 text-xs font-semibold"
            >
              {isStreaming ? (
                <>
                  <RotateCcw className="size-3.5 animate-spin" />
                  <span>Stop Stream</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  <span>Simulate Live Influx</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dataset Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-4 mb-6 border-b border-border-subtle">
          <span className="text-xs font-mono uppercase text-text-muted mr-2 font-semibold">
            Test Scenarios:
          </span>
          {SAMPLE_DATASETS.map((ds) => (
            <button
              key={ds.id}
              type="button"
              onClick={() => handleSelectDataset(ds.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedDatasetId === ds.id
                  ? 'bg-canvas-raised border border-signal text-signal font-semibold shadow-sm'
                  : 'bg-canvas-subtle border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium'
              }`}
            >
              {ds.name}
            </button>
          ))}
          {selectedDatasetId === 'custom-csv' && (
            <Badge variant="signal" className="font-mono text-xs">
              Custom CSV Active ({transactions.length} txns)
            </Badge>
          )}
          {selectedDatasetId === 'iso20022-clearing' && (
            <Badge variant="signal" className="font-mono text-xs">
              ISO 20022 pacs.008 Clearing Batch ({transactions.length} txns)
            </Badge>
          )}
        </div>

        {/* Real Computed Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-canvas-raised border border-border-medium mb-6 font-mono text-xs">
          <div>
            <span className="text-[10px] text-text-muted uppercase block">Engine Latency</span>
            <span className="text-base font-bold text-signal tabular-nums">
              {detectionResults.metrics.processingTimeMs} ms
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase block">Transactions</span>
            <span className="text-base font-bold text-text-primary tabular-nums">
              {detectionResults.metrics.totalTransactions}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase block">Active Algorithm</span>
            <span className="text-xs font-bold text-verified truncate block mt-0.5">
              Tarjan SCC O(V+E)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase block">Detected Syndicates</span>
            <span className="text-base font-bold text-risk tabular-nums">
              {detectionResults.metrics.detectedSyndicatesCount} Rings
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase block">PND Frozen</span>
            <span className="text-base font-bold text-risk tabular-nums">
              {frozenAccountIds.size} Accounts
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Account, BVN, Device..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-canvas-raised border border-border-subtle focus:border-signal text-text-primary placeholder:text-text-muted text-xs focus:outline-none w-52 sm:w-64 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-text-muted">
              <SlidersHorizontal className="size-3 text-text-muted" />
              <span>Risk &ge; {riskFilter}</span>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={riskFilter}
                onChange={(e) => setRiskFilter(Number(e.target.value))}
                className="w-24 accent-signal"
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-text-muted">
            Drag nodes to pin • Purple = Device • Cyan = BVN • Click node for factor scorecard
          </div>
        </div>

        {/* Main Workspace (Graph Canvas + Side Forensic Inspector) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Force-Directed Graph Visualizer (7 Cols) */}
          <div className="lg:col-span-7 h-[560px] flex flex-col bg-canvas-subtle rounded-2xl border border-border-medium overflow-hidden shadow-xl">
            <ForceGraphCanvas
              nodes={visibleNodes}
              edges={detectionResults.edges}
              selectedNodeId={selectedNode?.id}
              onSelectNode={handleSelectNode}
              filterRiskThreshold={riskFilter}
            />
          </div>

          {/* Right Live Forensic Inspector Panel (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-canvas-raised border border-border-medium rounded-2xl p-6 shadow-xl text-xs">
            <div>
              {/* Header */}
              <div className="pb-3 border-b border-border-subtle mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-signal font-semibold tracking-wider">
                      {selectedNode ? `${selectedNode.type.toUpperCase()} INSPECTOR` : 'SYNDICATE DOSSIER'}
                    </span>
                    {selectedNode?.isFrozen && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-risk/20 text-risk border border-risk/40 flex items-center gap-1">
                        <Lock className="size-2.5" /> PND FROZEN
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={
                      (selectedNode?.riskScore || selectedCluster?.riskScore || 0) >= 75
                        ? 'risk'
                        : 'signal'
                    }
                    className="font-mono text-xs tabular-nums"
                  >
                    Score: {selectedNode?.riskScore || selectedCluster?.riskScore || 85}
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  {selectedNode?.label || selectedCluster?.name || 'Syndicate Network Cluster'}
                </h3>
                <div className="text-xs font-mono text-text-muted mt-0.5">
                  ID: {selectedNode?.id || selectedCluster?.id}
                </div>
              </div>

              {/* Sub-Tabs for Inspector */}
              <div className="flex rounded-lg p-1 bg-canvas border border-border-subtle text-xs font-mono mb-4">
                <button
                  type="button"
                  onClick={() => setInspectorTab('ai')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    inspectorTab === 'ai'
                      ? 'bg-signal text-canvas font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Sparkles className="size-3" />
                  <span>AI Copilot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('risk')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    inspectorTab === 'risk'
                      ? 'bg-signal text-canvas font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Cpu className="size-3" />
                  <span>Risk Factors</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('metrics')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    inspectorTab === 'metrics'
                      ? 'bg-signal text-canvas font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Terminal className="size-3" />
                  <span>Telemetry</span>
                </button>
              </div>

              {/* TAB 1: Grounded GenAI Forensic Copilot */}
              {inspectorTab === 'ai' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-text-muted font-semibold flex items-center gap-1">
                      <Sparkles className="size-3 text-signal" />
                      Grounded AI Forensic Briefing
                    </span>
                    <button
                      type="button"
                      onClick={handleSynthesizeAiDossier}
                      disabled={isSynthesizingAi}
                      className="text-[11px] font-mono text-signal hover:underline disabled:opacity-50"
                    >
                      {isSynthesizingAi ? 'Synthesizing...' : 'Regenerate'}
                    </button>
                  </div>

                  <div className="bg-canvas p-3 rounded-xl border border-border-subtle text-text-secondary text-xs leading-relaxed max-h-48 overflow-y-auto space-y-2">
                    <p className="text-text-primary font-medium">
                      {aiDossier?.executiveSummary ||
                        selectedCluster?.narrative ||
                        'Tarjan SCC algorithm detected coordinated circular movement across clearing nodes.'}
                    </p>
                    {aiDossier && (
                      <p className="text-text-muted border-t border-border-subtle pt-2 text-[11px]">
                        {aiDossier.topologicalProof}
                      </p>
                    )}
                  </div>

                  {/* Clickable Evidence Anchors */}
                  {aiDossier && aiDossier.anchors.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase text-text-muted block mb-1.5">
                        Deterministic Evidence Anchors (Click to inspect):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiDossier.anchors.slice(0, 6).map((anchor) => (
                          <button
                            key={anchor.id}
                            type="button"
                            onClick={() => {
                              const found = detectionResults.nodes.find((n) => n.id === anchor.id);
                              if (found) handleSelectNode(found);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                              selectedNode?.id === anchor.id
                                ? 'bg-signal text-canvas font-bold border-signal'
                                : 'bg-canvas text-signal border-signal/30 hover:border-signal'
                            }`}
                          >
                            [{anchor.id}]
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Calibrated Risk Scorecard */}
              {inspectorTab === 'risk' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-text-muted font-semibold">
                      Calibrated Multi-Factor Scorecard
                    </span>
                    <span className="text-xs font-mono font-bold text-signal">
                      Score: {selectedNode?.riskScore || selectedCluster?.riskScore || 85}/99
                    </span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {(selectedNode?.riskBreakdown || [
                      {
                        factor: "Tarjan's SCC Cycle",
                        points: 38,
                        description: 'Closed directed flow detected in O(V+E) time',
                      },
                      {
                        factor: 'Hardware Multiplexing',
                        points: 24,
                        description: 'Session authenticated on multi-account handset DEV-IOS-22',
                      },
                      {
                        factor: 'Pass-Through Transshipment',
                        points: 22,
                        description: 'Low overnight retention (<15%) on NIP rail',
                      },
                    ]).map((rf, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-canvas border border-border-subtle flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-text-primary text-[11px]">{rf.factor}</div>
                          <div className="text-[10px] text-text-muted mt-0.5">{rf.description}</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-risk/10 text-risk border border-risk/30 shrink-0">
                          +{rf.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Telemetry & Flow Metrics */}
              {inspectorTab === 'metrics' && (
                <div className="space-y-3">
                  {selectedNode && (
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] p-3 rounded-xl bg-canvas border border-border-subtle">
                      <div>
                        <span className="text-text-muted block text-[10px]">TOTAL INFLOW</span>
                        <span className="font-semibold text-text-primary tabular-nums">
                          ₦{selectedNode.metrics.totalInflow.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">TOTAL OUTFLOW</span>
                        <span className="font-semibold text-text-primary tabular-nums">
                          ₦{selectedNode.metrics.totalOutflow.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">RETENTION RATIO</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            selectedNode.metrics.netRetentionRatio < 0.15 ? 'text-risk' : 'text-text-primary'
                          }`}
                        >
                          {(selectedNode.metrics.netRetentionRatio * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">IN CYCLE LOOP</span>
                        <span
                          className={`font-semibold ${
                            selectedNode.metrics.isInCycle ? 'text-risk' : 'text-verified'
                          }`}
                        >
                          {selectedNode.metrics.isInCycle ? 'YES (Tarjan SCC)' : 'NO'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Indicators */}
                  <div className="space-y-1.5">
                    {(selectedCluster?.indicators || [
                      'Tarjan SCC algorithm verified closed cycle',
                      'Direct linkage to shared hardware device signature',
                    ]).map((ind, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-text-secondary text-xs">
                        <CheckCircle2 className="size-3.5 text-signal shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live status feedback */}
              {pndStatus && (
                <div className="mt-3 p-2.5 rounded-xl bg-risk/10 border border-risk/30 text-risk font-mono text-xs flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span>{pndStatus}</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center gap-2.5">
              {selectedNode?.isFrozen ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnfreezeAccount(selectedNode.id)}
                  className="w-full sm:w-1/2 justify-center gap-1.5 border-verified/40 text-verified hover:bg-verified/10"
                >
                  <Unlock className="size-3.5" />
                  <span>Lift PND Hold</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerPnd}
                  className="w-full sm:w-1/2 justify-center gap-1.5 border-risk/40 text-risk hover:bg-risk/10"
                >
                  <Lock className="size-3.5" />
                  <span>Execute Finacle PND</span>
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleExportGoAmlXml}
                className="w-full sm:w-1/2 justify-center gap-1.5"
              >
                <FileCode className="size-3.5" />
                <span>NFIU goAML XML</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Finacle Core Banking FI XML SOAP Gateway Modal */}
      {finacleModalOpen && activeFinaclePayload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-canvas-raised border border-border-medium rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-risk/15 border border-risk/30 flex items-center justify-center text-risk">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-sm text-text-primary">
                      Infosys Finacle 11.0 FI SOAP Gateway
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-verified/15 text-verified border border-verified/30 font-semibold">
                      Zenith Bank (057)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    Service: FI_ModifyAccountFreeze • Reason Code: 08 (CBN AML/CFT 2022)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg p-0.5 bg-canvas border border-border-subtle text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setFinacleModalTab('envelope')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      finacleModalTab === 'envelope'
                        ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    1. FI SOAP Envelope
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinacleModalTab('response')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      finacleModalTab === 'response'
                        ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    2. Host Response (00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinacleModalTab('json')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      finacleModalTab === 'json'
                        ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    3. JSON REST
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setFinacleModalOpen(false)}
                  className="text-text-muted hover:text-text-primary font-mono text-sm p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {finacleModalTab === 'envelope' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-text-secondary leading-relaxed flex items-start gap-2">
                  <Lock className="size-4 text-risk shrink-0 mt-0.5" />
                  <div>
                    <span className="text-text-primary font-semibold block">Statutory PND Authority:</span>
                    CBN AML/CFT Regulations 2022 §19.4. Outbound clearing and NIP settlement immediately restricted on target accounts.
                  </div>
                </div>
                <pre className="p-3 bg-canvas border border-border-subtle rounded-xl font-mono text-[10px] text-text-primary overflow-x-auto max-h-64 leading-relaxed">
                  {finacleEnvelopeXml}
                </pre>
              </div>
            )}

            {finacleModalTab === 'response' && finacleHostResponse && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-canvas border border-border-medium space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-verified" />
                      <span className="font-heading font-bold text-text-primary text-xs">
                        Finacle Host Execution Confirmation
                      </span>
                    </div>
                    <Badge variant="default" className="font-mono text-[10px]">
                      RESPONSE CODE: {finacleHostResponse.responseCode} (SUCCESS)
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted block">Host Tx ID</span>
                      <span className="font-semibold text-text-primary truncate block mt-0.5">
                        {finacleHostResponse.hostTransactionId}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted block">Restriction Applied</span>
                      <span className="font-bold text-risk block mt-0.5">TOTAL_PND</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-canvas-raised border border-border-subtle">
                      <span className="text-[10px] text-text-muted block">Execution Timestamp</span>
                      <span className="text-text-primary text-[11px] truncate block mt-0.5">
                        {finacleHostResponse.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
                <pre className="p-3 bg-canvas border border-border-subtle rounded-xl font-mono text-[10px] text-text-primary overflow-x-auto max-h-48 leading-relaxed">
                  {finacleHostResponse.rawXml}
                </pre>
              </div>
            )}

            {finacleModalTab === 'json' && (
              <pre className="p-3 bg-canvas border border-border-subtle rounded-xl font-mono text-[11px] text-text-primary overflow-x-auto max-h-64">
                {JSON.stringify(activeFinaclePayload, null, 2)}
              </pre>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(finacleEnvelopeXml);
                  setFinacleCopied(true);
                  setTimeout(() => setFinacleCopied(false), 2000);
                }}
                className="gap-1.5 font-mono text-xs"
              >
                {finacleCopied ? <Check className="size-3 text-verified" /> : <Copy className="size-3" />}
                <span>{finacleCopied ? 'SOAP Copied!' : 'Copy SOAP XML'}</span>
              </Button>
              <Button variant="default" size="sm" onClick={() => setFinacleModalOpen(false)}>
                Acknowledge & Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* goAML XML Report & NFIU B2B Direct Connect Modal */}
      {goAmlModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-canvas-raised border border-border-medium rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FileCode className="size-4 text-signal" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-text-primary">
                    NFIU Suspicious Activity Report (goAML XML Schema)
                  </h4>
                  <span className="text-[10px] font-mono text-verified">
                    Compliant with United Nations goAML v5.0 / NFIU AML Guidelines
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoAmlModalOpen(false)}
                className="text-text-muted hover:text-text-primary font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* NFIU Transmission Receipt Card */}
            {nfiuReceipt && nfiuPackage && (
              <div className="p-4 rounded-xl bg-canvas border border-verified/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-verified" />
                    <span className="font-heading font-bold text-xs text-text-primary">
                      NFIU B2B WebService Direct Connect Receipt
                    </span>
                  </div>
                  <Badge variant="default" className="font-mono text-[10px]">
                    200 OK • ACK PROCESSED
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-2 rounded-lg bg-canvas-raised border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">Receipt Number</span>
                    <span className="font-bold text-signal block truncate mt-0.5">{nfiuReceipt.receiptNumber}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-canvas-raised border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">NFIU Batch ID</span>
                    <span className="font-semibold text-text-primary block truncate mt-0.5">{nfiuReceipt.nfiuBatchId}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-canvas-raised border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">Reporting Institution</span>
                    <span className="font-semibold text-verified block truncate mt-0.5">{nfiuReceipt.reportingEntity}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-canvas-raised border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">SHA-256 Digest</span>
                    <span className="text-[10px] text-text-muted font-mono block truncate mt-0.5" title={nfiuPackage.sha256XmlDigest}>
                      {nfiuPackage.sha256XmlDigest.slice(0, 14)}...
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed bg-canvas-raised p-2.5 rounded-lg border border-border-subtle">
                  {nfiuReceipt.auditMessage}
                </p>
              </div>
            )}

            <pre className="p-3 bg-canvas border border-border-subtle rounded-xl font-mono text-[10px] text-text-primary overflow-x-auto max-h-64 leading-relaxed">
              {currentGoAmlXml}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleCopyXml} className="gap-1.5 font-mono text-xs">
                {xmlCopied ? <Check className="size-3 text-verified" /> : <Copy className="size-3" />}
                <span>{xmlCopied ? 'Copied to Clipboard!' : 'Copy XML'}</span>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTransmitNfiu}
                  disabled={isTransmittingNfiu || Boolean(nfiuReceipt)}
                  className="gap-1.5 border-signal/40 text-signal hover:bg-signal/10"
                >
                  <Send className="size-3.5" />
                  <span>{isTransmittingNfiu ? 'Connecting to NFIU...' : nfiuReceipt ? 'Submitted to NFIU' : 'Transmit via NFIU B2B'}</span>
                </Button>
                <Button variant="default" size="sm" onClick={handleDownloadXmlFile} className="gap-1.5">
                  <Download className="size-3.5" />
                  <span>{sarExported ? 'Downloaded!' : 'Download XML File'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clearing Telemetry Ingestion Modal (ISO 20022 XML & CSV) */}
      {csvModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-canvas-raised border border-border-medium rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-signal" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-text-primary">
                    Ingest Clearing Transactions
                  </h4>
                  <span className="text-[10px] font-mono text-text-muted">
                    Supports ISO 20022 pacs.008 clearing messages & raw CSV files
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg p-0.5 bg-canvas border border-border-subtle text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setIngestTab('iso20022')}
                    className={`px-3 py-1 rounded transition-colors ${
                      ingestTab === 'iso20022'
                        ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    1. ISO 20022 pacs.008 XML
                  </button>
                  <button
                    type="button"
                    onClick={() => setIngestTab('csv')}
                    className={`px-3 py-1 rounded transition-colors ${
                      ingestTab === 'csv'
                        ? 'bg-canvas-raised text-signal font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    2. Raw CSV
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCsvModalOpen(false)}
                  className="text-text-muted hover:text-text-primary font-mono text-sm p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {ingestTab === 'iso20022' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-border-subtle">
                  <p className="text-text-secondary leading-relaxed text-xs">
                    NIBSS Instant Payment (NIP) / RTGS interbank clearing specification (<code className="text-signal font-mono">pacs.008.001.08</code>).
                    Parses <code className="text-signal font-mono">&lt;CdtTrfTxInf&gt;</code> blocks, settlement amounts, and supplementary BVN envelopes.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSampleIso}
                    className="shrink-0 text-xs font-mono border-signal/30 text-signal hover:bg-signal/10"
                  >
                    Load Sample XML
                  </Button>
                </div>

                <textarea
                  value={isoXmlInputText}
                  onChange={(e) => setIsoXmlInputText(e.target.value)}
                  placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>...</GrpHdr>\n    <CdtTrfTxInf>...</CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>`}
                  className="w-full h-52 p-3 bg-canvas border border-border-subtle rounded-xl font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-signal resize-none"
                />

                {isoError && (
                  <div className="p-2.5 rounded-lg bg-risk/10 border border-risk/30 text-risk font-mono text-[11px]">
                    {isoError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleImportIso20022}>
                    Ingest ISO 20022 Batch
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-border-subtle">
                  <p className="text-text-secondary leading-relaxed text-xs">
                    Paste transaction rows below. Expected columns:{' '}
                    <code className="text-signal font-mono">
                      source_account, target_account, amount, [rail, device_id, bvn]
                    </code>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCsvInputText(CsvTransactionParser.generateSampleCsv());
                      setCsvError(null);
                    }}
                    className="shrink-0 text-xs font-mono border-signal/30 text-signal hover:bg-signal/10"
                  >
                    Load Sample CSV
                  </Button>
                </div>

                <textarea
                  value={csvInputText}
                  onChange={(e) => setCsvInputText(e.target.value)}
                  placeholder={`source_account,target_account,amount,payment_rail,device_id\nACC-001,ACC-002,4500000,NIP,DEV-01\nACC-002,ACC-003,4200000,NIP,DEV-01\nACC-003,ACC-001,3900000,NIP,DEV-01`}
                  className="w-full h-52 p-3 bg-canvas border border-border-subtle rounded-xl font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-signal resize-none"
                />

                {csvError && (
                  <div className="p-2.5 rounded-lg bg-risk/10 border border-risk/30 text-risk font-mono text-[11px]">
                    {csvError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleImportCsv}>
                    Run Graph Analysis
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live NUBAN & Telemetry Gateway Modal */}
      <LiveVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        initialTab={verifyModalTab}
        initialAccountNumber={verifyInitialAccount}
        initialBankCode={verifyInitialBank}
        initialIp={verifyInitialIp}
      />

      {/* Regulatory Compliance Audit Ledger & Case Management Modal */}
      <AuditLedgerModal
        isOpen={auditModalOpen}
        onClose={() => {
          setAuditModalOpen(false);
          refreshAuditCount();
        }}
        currentCluster={selectedCluster}
      />
    </section>
  );
};
