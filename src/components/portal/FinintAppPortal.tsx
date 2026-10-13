import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SAMPLE_DATASETS } from '@/lib/graph-engine/sample-datasets';
import { GraphDetectionEngine } from '@/lib/graph-engine/algorithms';
import { TransactionRecord, EntityNode, SyndicateCluster, PaymentRail } from '@/lib/graph-engine/types';
import { ForceGraphCanvas } from '@/components/graph/ForceGraphCanvas';
import { SupabaseDbService } from '@/lib/supabase/db-service';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { BankingService, NigerianBank, POPULAR_NIGERIAN_BANKS, NubanVerificationResult } from '@/lib/services/banking-api';
import { TelemetryService, IpTelemetryData, IP_TELEMETRY_PRESETS } from '@/lib/services/telemetry-api';
import { FinacleCoreConnector, FinacleResponseEnvelope } from '@/lib/services/finacle-envelope';
import { NfiuConnectClient, NfiuSubmissionPackage, NfiuSubmissionReceipt } from '@/lib/services/nfiu-connect';
import { GoAmlReportGenerator } from '@/lib/services/goaml-generator';
import { ForensicDossierResult } from '@/lib/services/ai-copilot';
import { GroqForensicService } from '@/lib/services/groq-service';
import { GroqDossierModal } from '@/components/workbench/GroqDossierModal';
import { Iso20022Parser } from '@/lib/graph-engine/iso20022-parser';
import { CsvTransactionParser } from '@/lib/graph-engine/csv-parser';
import { FrozenAccountRecord, AuditLogEntry } from '@/lib/storage/investigation-store';
import { DataProtectionService } from '@/lib/security/data-protection';
import {
  CrossBankConsortiumService,
  CrossBankRelayEvent,
  SAMPLE_CROSS_BANK_RELAYS,
} from '@/lib/services/cross-bank-consortium';
import { CrossBankRelayVisualizer } from '@/components/crossbank/CrossBankRelayVisualizer';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Network,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCode,
  Terminal,
  Upload,
  Download,
  RefreshCw,
  Play,
  Square,
  Search,
  Sparkles,
  Globe,
  Building2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Send,
  Zap,
  Activity,
  ChevronRight,
  Shuffle,
  Eye,
  Cpu,
  Radio,
  Clock,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';

export type PortalTab =
  | 'dashboard'
  | 'graph'
  | 'nuban'
  | 'crossbank'
  | 'finacle'
  | 'goaml'
  | 'audit'
  | 'ingest';

interface FinintAppPortalProps {
  onSwitchToLanding: () => void;
}

export const FinintAppPortal: React.FC<FinintAppPortalProps> = ({ onSwitchToLanding }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');

  // Supabase Status & Realtime
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [realtimePulse, setRealtimePulse] = useState<boolean>(false);

  // Core Data States
  const [transactions, setTransactions] = useState<TransactionRecord[]>(SAMPLE_DATASETS[0].records);
  const [pndRecords, setPndRecords] = useState<FrozenAccountRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<SyndicateCluster | null>(null);

  // Filter & Search
  const [riskFilterThreshold, setRiskFilterThreshold] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('apex-syndicate');

  // Streaming simulation
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const streamIntervalRef = useRef<number | null>(null);

  // NUBAN Resolver State
  const [nubanInput, setNubanInput] = useState<string>('2081940192');
  const [selectedBankCode, setSelectedBankCode] = useState<string>('057');
  const [availableBanks, setAvailableBanks] = useState<NigerianBank[]>(POPULAR_NIGERIAN_BANKS);
  const [nubanResult, setNubanResult] = useState<NubanVerificationResult | null>(null);
  const [isResolvingNuban, setIsResolvingNuban] = useState<boolean>(false);

  // Telemetry Inspector State
  const [ipInput, setIpInput] = useState<string>('102.89.43.12');
  const [ipResult, setIpResult] = useState<IpTelemetryData | null>(null);
  const [isFetchingTelemetry, setIsFetchingTelemetry] = useState<boolean>(false);

  // Finacle PND Console State
  const [pndAccountId, setPndAccountId] = useState<string>('2081940192');
  const [pndBankCode, setPndBankCode] = useState<string>('057');
  const [pndReasonCode, setPndReasonCode] = useState<string>('08');
  const [pndReasonDesc, setPndReasonDesc] = useState<string>('Suspected Circular Mule Routing - Zenith AML L2 Order');
  const [activeEnvelopeXml, setActiveEnvelopeXml] = useState<string>('');
  const [activeHostResponse, setActiveHostResponse] = useState<FinacleResponseEnvelope | null>(null);
  const [finacleCopied, setFinacleCopied] = useState<boolean>(false);
  const [isFreezingAccount, setIsFreezingAccount] = useState<boolean>(false);

  // goAML SAR Filing State
  const [goAmlTargetClusterId, setGoAmlTargetClusterId] = useState<string>('');
  const [goAmlXmlText, setGoAmlXmlText] = useState<string>('');
  const [nfiuPackage, setNfiuPackage] = useState<NfiuSubmissionPackage | null>(null);
  const [nfiuReceipt, setNfiuReceipt] = useState<NfiuSubmissionReceipt | null>(null);
  const [isTransmittingNfiu, setIsTransmittingNfiu] = useState<boolean>(false);
  const [xmlCopied, setXmlCopied] = useState<boolean>(false);

  // Groq LPU AI Copilot Grounded Synthesis
  const [isSynthesizingAi, setIsSynthesizingAi] = useState<boolean>(false);
  const [aiDossier, setAiDossier] = useState<ForensicDossierResult | null>(null);
  const [isGroqModalOpen, setIsGroqModalOpen] = useState<boolean>(false);

  // Ingestion State
  const [ingestTab, setIngestTab] = useState<'iso20022' | 'csv'>('iso20022');
  const [isoInputXml, setIsoInputXml] = useState<string>('');
  const [csvInputText, setCsvInputText] = useState<string>('');
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  // Audit Ledger Filter
  const [auditFilterAction, setAuditFilterAction] = useState<string>('ALL');

  // NDPA 2023 Statutory Privacy Masking State
  const [privacyMaskingEnabled, setPrivacyMaskingEnabled] = useState<boolean>(true);

  // Cross-Bank Relay & Consortium State
  const [crossBankRelays, setCrossBankRelays] = useState<CrossBankRelayEvent[]>(SAMPLE_CROSS_BANK_RELAYS);
  const [simSourceAccount, setSimSourceAccount] = useState<string>('2081940192');
  const [simTargetAccount, setSimTargetAccount] = useState<string>('8039182741');
  const [simRelayAmount, setSimRelayAmount] = useState<number>(18500000);
  const [simRelayDeviceId, setSimRelayDeviceId] = useState<string>('DEV-LG-ALPHA-9821');
  const [activeRelayEvent, setActiveRelayEvent] = useState<CrossBankRelayEvent | null>(SAMPLE_CROSS_BANK_RELAYS[0]);

  // Toggle NDPA 2023 Privacy Redaction with Audit Log
  const handleTogglePrivacyMasking = async () => {
    const nextState = !privacyMaskingEnabled;
    setPrivacyMaskingEnabled(nextState);

    if (!nextState) {
      await SupabaseDbService.logAuditAction({
        action: 'SAR_EXPORT',
        targetEntityId: 'NDPA_PII_DE_ANONYMIZATION',
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: 'Officer requested privileged de-anonymization of BVN & customer PII under NDPA 2023 Sec 24 compliance audit',
      });
      triggerRealtimeIndicator();
    }
  };

  // Trigger brief visual pulse on real-time activity
  const triggerRealtimeIndicator = () => {
    setRealtimePulse(true);
    setTimeout(() => setRealtimePulse(false), 1200);
  };

  // Sync / Initialize from Supabase
  const loadDatabaseData = async () => {
    setIsCheckingDb(true);
    try {
      const connected = await SupabaseDbService.checkConnection();
      setSupabaseConnected(connected);

      if (connected) {
        const [cloudTxs, cloudPnds, cloudAudits] = await Promise.all([
          SupabaseDbService.fetchTransactions(),
          SupabaseDbService.fetchPndAccounts(),
          SupabaseDbService.fetchAuditTrail(),
        ]);

        if (cloudTxs.length > 0) {
          setTransactions(cloudTxs);
        }
        setPndRecords(cloudPnds);
        setAuditLogs(cloudAudits);
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        const [localPnds, localAudits] = await Promise.all([
          SupabaseDbService.fetchPndAccounts(),
          SupabaseDbService.fetchAuditTrail(),
        ]);
        setPndRecords(localPnds);
        setAuditLogs(localAudits);
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();

    // Subscribe to Supabase Realtime
    const unsubscribe = SupabaseDbService.subscribeToRealtime({
      onNewTransaction: (tx) => {
        setTransactions((prev) => [tx, ...prev]);
        triggerRealtimeIndicator();
      },
      onNewPndHold: (pnd) => {
        setPndRecords((prev) => [pnd, ...prev.filter((p) => p.accountId !== pnd.accountId)]);
        triggerRealtimeIndicator();
      },
      onAuditAction: (audit) => {
        setAuditLogs((prev) => [audit, ...prev]);
        triggerRealtimeIndicator();
      },
    });

    // Load bank directory
    BankingService.fetchNigerianBanks()
      .then((banks) => setAvailableBanks(banks))
      .catch(() => setAvailableBanks(POPULAR_NIGERIAN_BANKS));

    return () => {
      unsubscribe();
      if (streamIntervalRef.current) {
        window.clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  // Compute Graph Nodes, Edges, and Clusters using GraphDetectionEngine
  const frozenAccountIdsSet = useMemo(() => {
    return new Set(pndRecords.map((p) => p.accountId));
  }, [pndRecords]);

  const graphAnalysis = useMemo(() => {
    const analysis = GraphDetectionEngine.analyzeTransactions(transactions);
    // Mark frozen state on nodes
    analysis.nodes.forEach((n) => {
      if (frozenAccountIdsSet.has(n.id)) {
        n.isFrozen = true;
      }
    });
    return analysis;
  }, [transactions, frozenAccountIdsSet]);

  const { nodes, edges, clusters, metrics } = graphAnalysis;

  // Set default cluster for goAML when clusters change
  useEffect(() => {
    if (clusters.length > 0 && !goAmlTargetClusterId) {
      setGoAmlTargetClusterId(clusters[0].id);
    }
  }, [clusters, goAmlTargetClusterId]);

  // Handle switching sample dataset
  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
    const ds = SAMPLE_DATASETS.find((d) => d.id === id);
    if (ds) {
      setTransactions([...ds.records]);
      setSelectedNode(null);
      setSelectedCluster(null);
    }
  };

  // Execute PND Freeze via Finacle Connector
  const handleExecutePndFreeze = async (accountId: string, bankCode = '057') => {
    setIsFreezingAccount(true);
    try {
      const caseRef = `CASE-${Date.now().toString(36).toUpperCase()}`;
      const freezeReq = {
        accountNumber: accountId,
        reasonCode: pndReasonCode,
        reasonDescription: pndReasonDesc,
        caseReference: caseRef,
        initiatorOfficer: 'ZENITH_AML_INVESTIGATOR_L2',
        freezeType: 'TOTAL_PND' as const,
      };

      const envelopeXml = FinacleCoreConnector.buildModifyAccountFreezeXml(freezeReq);
      setActiveEnvelopeXml(envelopeXml);

      const responseEnvelope = FinacleCoreConnector.simulateHostExecution(freezeReq);
      setActiveHostResponse(responseEnvelope);

      // Persist to Supabase Database
      await SupabaseDbService.insertPndRecord({
        accountId,
        bankCode,
        reasonCode: pndReasonCode,
        reasonDescription: pndReasonDesc,
        initiatorOfficer: 'ZENITH_AML_INVESTIGATOR_L2',
        hostTransactionId: responseEnvelope.hostTransactionId,
        soapXml: envelopeXml,
        hostXml: responseEnvelope.rawXml,
      });

      // Log Audit Entry
      await SupabaseDbService.logAuditAction({
        action: 'PND_FREEZE',
        targetEntityId: accountId,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `Finacle PND Total Hold executed on ${accountId} (${bankCode}) with status ${responseEnvelope.status} [HostTx: ${responseEnvelope.hostTransactionId}]`,
      });

      // Update local states
      const updatedPnd: FrozenAccountRecord = {
        accountId,
        bankCode,
        reasonCode: pndReasonCode,
        reasonDescription: pndReasonDesc,
        frozenAt: new Date().toISOString(),
        initiator: 'ZENITH_AML_INVESTIGATOR_L2',
        status: 'ACTIVE_PND',
      };
      setPndRecords((prev) => [updatedPnd, ...prev.filter((p) => p.accountId !== accountId)]);
      triggerRealtimeIndicator();
    } catch (err) {
      console.error('Failed to execute PND hold:', err);
    } finally {
      setIsFreezingAccount(false);
    }
  };

  // Run NUBAN Resolution
  const handleResolveNuban = async () => {
    if (!nubanInput.trim()) return;
    setIsResolvingNuban(true);
    try {
      const res = await BankingService.resolveAccount(nubanInput.trim(), selectedBankCode);
      setNubanResult(res);

      await SupabaseDbService.logAuditAction({
        action: 'DATASET_IMPORT',
        targetEntityId: nubanInput.trim(),
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `NUBAN Modulo-10 resolution: Bank ${selectedBankCode}, Name: ${res.accountName}, Valid: ${res.isValidNuban}`,
      });
    } catch (err) {
      console.warn('NUBAN resolution error:', err);
    } finally {
      setIsResolvingNuban(false);
    }
  };

  // Run Telemetry Lookup
  const handleFetchTelemetry = async (ipToTest?: string) => {
    const target = ipToTest !== undefined ? ipToTest : ipInput;
    setIsFetchingTelemetry(true);
    try {
      const data = await TelemetryService.fetchIpTelemetry(target);
      setIpResult(data);

      await SupabaseDbService.logAuditAction({
        action: 'DATASET_IMPORT',
        targetEntityId: data.ip,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `GeoIP Telemetry: ${data.city}, ${data.country} | ISP: ${data.isp} | Risk: ${data.riskAssessment}`,
      });
    } catch (err) {
      console.warn('Telemetry error:', err);
    } finally {
      setIsFetchingTelemetry(false);
    }
  };

  // Generate goAML XML
  const handleGenerateGoAml = async () => {
    const cluster = clusters.find((c: SyndicateCluster) => c.id === goAmlTargetClusterId) || clusters[0];
    if (!cluster) return;

    const xml = GoAmlReportGenerator.generateGoAmlXml({
      cluster,
      nodes,
      edges,
      caseReference: `SAR-${Date.now().toString(36).toUpperCase()}`,
      reportingOfficer: 'ZENITH_AML_INVESTIGATOR_L2',
    });

    setGoAmlXmlText(xml);
    const pkg = await NfiuConnectClient.createSubmissionPackage({
      xmlPayload: xml,
      caseReference: `SAR-${Date.now().toString(36).toUpperCase()}`,
      totalTransactionsCount: cluster.nodeIds.length * 2,
      totalExposureNgn: cluster.totalExposure,
    });
    setNfiuPackage(pkg);
    setNfiuReceipt(null);
  };

  // Submit goAML to NFIU B2B Direct Connect
  const handleSubmitToNfiu = async () => {
    if (!nfiuPackage) return;
    setIsTransmittingNfiu(true);
    try {
      const receipt = NfiuConnectClient.generateTransmissionReceipt(nfiuPackage);
      setNfiuReceipt(receipt);

      await SupabaseDbService.logAuditAction({
        action: 'NFIU_TRANSMISSION',
        targetEntityId: receipt.receiptNumber,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `NFIU B2B Direct Connect SAR filed: Receipt ${receipt.receiptNumber}, Batch: ${receipt.nfiuBatchId}, Status: ${receipt.status}`,
      });
      triggerRealtimeIndicator();
    } catch (err) {
      console.error('NFIU submission error:', err);
    } finally {
      setIsTransmittingNfiu(false);
    }
  };

  // Grounded Groq LPU AI Copilot Synthesis
  const handleSynthesizeAi = async () => {
    const targetCluster = selectedCluster || clusters[0];
    if (!targetCluster) return;

    setIsSynthesizingAi(true);
    try {
      const result = await GroqForensicService.synthesizeDossier({
        cluster: targetCluster,
        nodes,
        edges,
      });
      setAiDossier(result);
      setIsGroqModalOpen(true);

      await SupabaseDbService.logAuditAction({
        action: 'SAR_EXPORT',
        targetEntityId: targetCluster.code,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `Groq LPU Forensic Dossier synthesized for cluster ${targetCluster.code} (${result.title}) using ${result.groqMetadata?.model || 'openai/gpt-oss-120b'} in ${result.groqMetadata?.latencyMs}ms`,
      });
    } catch (err) {
      console.warn('Groq AI copilot error:', err);
    } finally {
      setIsSynthesizingAi(false);
    }
  };

  // Export Cross-Bank Evidence Package
  const handleExportRelayEvidence = async (relay: CrossBankRelayEvent) => {
    const evidence = {
      event: relay,
      exportedAt: new Date().toISOString(),
      officerId: 'ZENITH_AML_INVESTIGATOR_L2',
      regulatoryJurisdiction: 'CBN_AML_CFT_2022',
      statutoryLegalBasis: 'Money Laundering (Prevention and Prohibition) Act 2022 Section 6',
      interdictionDirective: 'Bilateral Category 08 PND Freeze via NIBSS CFIS Gateway',
    };
    const jsonStr = JSON.stringify(evidence, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${relay.id}_NIBSS_CONSORTIUM_EVIDENCE.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await SupabaseDbService.logAuditAction({
      action: 'SAR_EXPORT',
      targetEntityId: relay.id,
      officerId: 'ZENITH_AML_INVESTIGATOR_L2',
      details: `Exported cross-bank consortium evidence package for relay ${relay.id} (${relay.sourceBankName} -> ${relay.destinationBankName})`,
    });
  };

  // Toggle Live Transaction Stream
  const handleToggleStreaming = () => {
    if (isStreaming) {
      if (streamIntervalRef.current) {
        window.clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      const rails: PaymentRail[] = ['NIP', 'POS', 'ATM', 'MOBILE', 'WEB'];
      const syntheticAccounts = [
        '2081940192',
        '2081940201',
        '2081940319',
        '2081940428',
        '0129481729',
        '0129481992',
      ];

      streamIntervalRef.current = window.setInterval(async () => {
        const srcIdx = Math.floor(Math.random() * syntheticAccounts.length);
        let tgtIdx = Math.floor(Math.random() * syntheticAccounts.length);
        if (tgtIdx === srcIdx) tgtIdx = (srcIdx + 1) % syntheticAccounts.length;

        const newTx: TransactionRecord = {
          id: `STREAM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          sourceId: syntheticAccounts[srcIdx],
          sourceName: `Mule Node ${srcIdx + 1}`,
          targetId: syntheticAccounts[tgtIdx],
          targetName: `Mule Node ${tgtIdx + 1}`,
          amount: Math.floor(1500000 + Math.random() * 8500000),
          rail: rails[Math.floor(Math.random() * rails.length)],
          narration: 'RAPID NIP VELOCITY ROUTING',
          deviceId: `DEV-LG-${srcIdx % 2 ? 'ALPHA' : 'BETA'}`,
          bvn: `2219481029${srcIdx}`,
        };

        // Prepend locally
        setTransactions((prev) => [newTx, ...prev.slice(0, 75)]);
        triggerRealtimeIndicator();

        // Also push to Supabase if connected
        if (isSupabaseConfigured()) {
          SupabaseDbService.insertTransactions([newTx]);
        }
      }, 2400);
    }
  };

  // Ingest ISO 20022 pacs.008 XML
  const handleIngestIso20022 = async () => {
    if (!isoInputXml.trim()) return;
    try {
      const parsed = Iso20022Parser.parsePacs008(isoInputXml);
      if (parsed.records.length === 0) {
        setIngestStatus(`No records parsed: ${parsed.error || 'Empty payload'}`);
        return;
      }

      setTransactions((prev) => [...parsed.records, ...prev]);
      await SupabaseDbService.insertTransactions(parsed.records);
      await SupabaseDbService.logAuditAction({
        action: 'INGEST_ISO20022',
        targetEntityId: `ISO20022-BATCH-${parsed.records.length}`,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `Ingested ${parsed.records.length} transactions via ISO 20022 pacs.008.001.08 XML schema`,
      });

      setIngestStatus(`Successfully ingested ${parsed.records.length} ISO 20022 transactions into Supabase database.`);
      triggerRealtimeIndicator();
    } catch (err) {
      setIngestStatus(`ISO Ingestion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Ingest CSV transactions
  const handleIngestCsv = async () => {
    if (!csvInputText.trim()) return;
    try {
      const parsed = CsvTransactionParser.parseCsv(csvInputText);
      if (parsed.records.length === 0) {
        setIngestStatus(`No records parsed: ${parsed.error || 'Check CSV format'}`);
        return;
      }

      setTransactions((prev) => [...parsed.records, ...prev]);
      await SupabaseDbService.insertTransactions(parsed.records);
      await SupabaseDbService.logAuditAction({
        action: 'DATASET_IMPORT',
        targetEntityId: `CSV-BATCH-${parsed.records.length}`,
        officerId: 'ZENITH_AML_INVESTIGATOR_L2',
        details: `Ingested ${parsed.records.length} transactions via CSV batch parser`,
      });

      setIngestStatus(`Successfully ingested ${parsed.records.length} CSV transactions into Supabase database.`);
      triggerRealtimeIndicator();
    } catch (err) {
      setIngestStatus(`CSV Ingestion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Filtered transactions for search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.sourceId.toLowerCase().includes(q) ||
        tx.targetId.toLowerCase().includes(q) ||
        tx.narration?.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#E2E8F0] font-sans">
      {/* 1. LEFT OPERATIONS SIDEBAR */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[#1E293B] bg-[#0B0F17]/95 backdrop-blur-md z-30 select-none">
        {/* Brand Crest */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <button
            onClick={onSwitchToLanding}
            className="flex items-center gap-2.5 text-left group cursor-pointer w-full focus:outline-none"
            title="Return to FININT Landing Page"
          >
            <div className="size-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/40 group-hover:border-amber-400 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 transition-colors shrink-0">
              <Network className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black tracking-wider text-sm text-white group-hover:text-amber-300 transition-colors">ZENITH</span>
                <span className="text-[10px] font-mono font-bold uppercase px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  FININT
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-tight group-hover:text-slate-200 transition-colors flex items-center gap-1">
                <span>AML TIER-1 WORKBENCH</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400">&larr;</span>
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal Navigation">
          <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
            Intelligence Modules
          </div>

          {[
            { id: 'dashboard', label: 'Executive Oversight', icon: LayoutDashboard, badge: `${clusters.length} Rings` },
            { id: 'graph', label: 'Forensic Graph Studio', icon: Network, badge: `${nodes.length} Nodes` },
            { id: 'nuban', label: 'NUBAN & Telemetry', icon: Globe, badge: 'CBN MOD-10' },
            { id: 'crossbank', label: 'Cross-Bank Relay & NIBSS', icon: Shuffle, badge: 'CFIS / DEV' },
            { id: 'finacle', label: 'Finacle Core PND Console', icon: Lock, badge: `${pndRecords.length} PND` },
            { id: 'goaml', label: 'NFIU goAML Filing Station', icon: FileCode, badge: 'SAR v4.0' },
            { id: 'audit', label: 'Compliance Audit Ledger', icon: Terminal, badge: `${auditLogs.length}` },
            { id: 'ingest', label: 'Data Ingestion & Simulator', icon: Upload, badge: 'ISO 20022' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PortalTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141B26] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`size-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                        : 'bg-[#1E293B] text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live System Telemetry / Database Box */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0E131D]/80">
          <div className="rounded-lg border border-[#1E293B] bg-[#080B10] p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    supabaseConnected
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono text-slate-300 text-[10px] font-semibold">
                  {supabaseConnected ? 'Supabase Live' : 'Database Offline'}
                </span>
              </div>
              <button
                onClick={loadDatabaseData}
                disabled={isCheckingDb}
                className="text-slate-400 hover:text-amber-400 p-0.5 rounded transition-colors"
                title="Sync Supabase Database"
              >
                <RefreshCw className={`size-3 ${isCheckingDb ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            <div className="space-y-1 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Ref:</span>
                <span className="text-slate-300 truncate max-w-[110px]">zxgxbpvrermaavosiwrp</span>
              </div>
              <div className="flex justify-between">
                <span>Region:</span>
                <span className="text-slate-300">eu-central-1</span>
              </div>
              <div className="flex justify-between">
                <span>Realtime Sync:</span>
                <span className={realtimePulse ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {realtimePulse ? 'Syncing...' : 'Subscribed'}
                </span>
              </div>
            </div>
          </div>

          {/* Switch to Landing Page Button */}
          <button
            onClick={onSwitchToLanding}
            className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white bg-[#141B26] hover:bg-[#1E293B] border border-[#1E293B] transition-all cursor-pointer"
          >
            <span>Landing Page</span>
            <ExternalLink className="size-3" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070A0F]">
        {/* TOP STATUS BAR */}
        <header className="h-14 border-b border-[#1E293B] bg-[#0B0F17]/90 px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Quick Return to Landing Page Button */}
            <button
              onClick={onSwitchToLanding}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer shadow-sm shrink-0"
              title="Return to the FININT Public Product Landing Page"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>
            <div className="h-4 w-[1px] bg-[#1E293B]" />

            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <span className="text-slate-400">Portal /</span>
              <span className="text-amber-400 capitalize">
                {activeTab === 'dashboard' && 'Executive Oversight Dashboard'}
                {activeTab === 'graph' && 'Forensic Graph Intelligence Studio'}
                {activeTab === 'nuban' && 'NUBAN Checksum & Sovereign Telemetry'}
                {activeTab === 'crossbank' && 'Cross-Bank Relay & NIBSS Telemetry'}
                {activeTab === 'finacle' && 'Finacle Core Banking PND Hold Console'}
                {activeTab === 'goaml' && 'NFIU goAML v4.0 Regulatory Transmission'}
                {activeTab === 'audit' && 'Compliance Audit Ledger & Hash Trail'}
                {activeTab === 'ingest' && 'Multi-Rail Transaction Ingestion Center'}
              </span>
            </h1>

            {/* Quick Live Stream Indicator */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={handleToggleStreaming}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium transition-all cursor-pointer ${
                  isStreaming
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-[#141B26] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                }`}
              >
                {isStreaming ? (
                  <>
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Streaming pacs.008 Live</span>
                    <Square className="size-2.5 ml-1 text-emerald-400" />
                  </>
                ) : (
                  <>
                    <Play className="size-2.5 text-slate-400" />
                    <span>Simulate Real-time Stream</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-3">
            {/* NDPA 2023 Statutory Privacy Redaction Toggle */}
            <button
              onClick={handleTogglePrivacyMasking}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                privacyMaskingEnabled
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              }`}
              title="Nigeria Data Protection Act 2023 (NDPA) Section 24 statutory PII redaction"
            >
              {privacyMaskingEnabled ? <ShieldCheck className="size-3.5 text-emerald-400" /> : <Eye className="size-3.5 text-amber-400" />}
              <span>{privacyMaskingEnabled ? 'NDPA Masking: ACTIVE' : 'PII De-Anonymized'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0E131D] px-2.5 py-1 rounded-md border border-[#1E293B]">
              <span className="text-slate-500">OFFICER:</span>
              <span className="text-amber-400 font-semibold">ZENITH_AML_L2_2841</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0E131D] px-2.5 py-1 rounded-md border border-[#1E293B] text-[11px] font-mono text-slate-300">
              <span className="text-slate-500">SYNC:</span>
              <span>{lastSyncTime}</span>
            </div>
          </div>
        </header>


        {/* DYNAMIC TAB BODY */}
        <main className="flex-1 overflow-y-auto">
          {/* TAB 1: EXECUTIVE OVERSIGHT DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
              {/* High Impact KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/80 p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>TOTAL EXPOSURE</span>
                    <Zap className="size-4 text-amber-400" />
                  </div>
                  <div className="mt-3 text-2xl font-bold font-heading text-white">
                    ₦{(metrics.totalVolume / 1_000_000).toFixed(1)}M
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                    <span>{clusters.length} Active Mule Clusters</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/80 p-5 relative overflow-hidden group hover:border-red-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>MULE SYNDICATES</span>
                    <ShieldAlert className="size-4 text-red-400" />
                  </div>
                  <div className="mt-3 text-2xl font-bold font-heading text-white">
                    {clusters.length}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400 font-mono">
                    <span>High / Critical Threat</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/80 p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>FINACLE PND HOLDS</span>
                    <Lock className="size-4 text-emerald-400" />
                  </div>
                  <div className="mt-3 text-2xl font-bold font-heading text-white">
                    {pndRecords.length}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <span>Accounts Frozen in Core</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/80 p-5 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>TARJAN CYCLES DETECTED</span>
                    <Network className="size-4 text-blue-400" />
                  </div>
                  <div className="mt-3 text-2xl font-bold font-heading text-white">
                    {clusters.filter((c: SyndicateCluster) => c.typology === 'circular').length}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-400 font-mono">
                    <span>Closed Velocity Loops</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                </div>
              </div>

              {/* Active Syndicates Matrix */}
              <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Active High-Risk Syndicates & Rings
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('graph')}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Open in Graph Studio <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clusters.map((cluster: SyndicateCluster) => (
                    <div
                      key={cluster.id}
                      className="rounded-lg border border-[#1E293B] bg-[#080B10] p-4 flex flex-col justify-between hover:border-amber-500/40 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-400">{cluster.code}</span>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold ${
                              cluster.riskScore >= 85
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            SCORE: {cluster.riskScore}/100
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {cluster.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {cluster.narrative}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">₦{(cluster.totalExposure / 1_000_000).toFixed(1)}M Exposure</span>
                        <button
                          onClick={() => {
                            setSelectedCluster(cluster);
                            setActiveTab('graph');
                          }}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <span>Analyze</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Ingested Transactions Table */}
              <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Live Transaction Stream Ledger ({transactions.length} Total)
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1 text-xs rounded-md bg-[#080B10] border border-[#1E293B] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-48 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#080B10] text-slate-400 border-b border-[#1E293B]">
                      <tr>
                        <th className="py-2.5 px-3">TX ID</th>
                        <th className="py-2.5 px-3">TIMESTAMP</th>
                        <th className="py-2.5 px-3">SOURCE NUBAN</th>
                        <th className="py-2.5 px-3">TARGET NUBAN</th>
                        <th className="py-2.5 px-3">RAIL</th>
                        <th className="py-2.5 px-3 text-right">AMOUNT (₦)</th>
                        <th className="py-2.5 px-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] text-slate-300">
                      {filteredTransactions.slice(0, 10).map((tx) => {
                        const isFrozen =
                          frozenAccountIdsSet.has(tx.sourceId) || frozenAccountIdsSet.has(tx.targetId);
                        return (
                          <tr key={tx.id} className="hover:bg-[#141B26] transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-semibold">{tx.id}</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 text-amber-300">
                              {privacyMaskingEnabled
                                ? DataProtectionService.maskAccountNumber(tx.sourceId, true)
                                : tx.sourceId}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {privacyMaskingEnabled
                                ? DataProtectionService.maskAccountNumber(tx.targetId, true)
                                : tx.targetId}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1E293B] text-slate-300">
                                {tx.rail}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-white">
                              ₦{tx.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              {isFrozen ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                  <Lock className="size-2.5" /> PND FROZEN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  CLEARED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORENSIC GRAPH STUDIO */}
          {activeTab === 'graph' && (
            <div className="h-full flex flex-col relative overflow-hidden">
              {/* Studio Toolbar */}
              <div className="h-12 border-b border-[#1E293B] bg-[#0E131D]/90 px-4 flex items-center justify-between flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-400">DATASET:</span>
                    <select
                      value={selectedDatasetId}
                      onChange={(e) => handleSelectDataset(e.target.value)}
                      className="bg-[#080B10] border border-[#1E293B] text-xs font-mono text-amber-400 rounded px-2 py-1 focus:outline-none focus:border-amber-500/50"
                    >
                      {SAMPLE_DATASETS.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.records.length} Txs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-4 w-px bg-[#1E293B]" />

                  {/* Risk slider */}
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>RISK &ge; {riskFilterThreshold}</span>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={riskFilterThreshold}
                      onChange={(e) => setRiskFilterThreshold(Number(e.target.value))}
                      className="w-24 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCluster && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSynthesizeAi}
                      disabled={isSynthesizingAi}
                      className="text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-amber-400" />
                      <span>{isSynthesizingAi ? 'Synthesizing with Groq LPU...' : 'Groq AI Dossier'}</span>
                    </Button>
                  )}
                  {selectedNode && !frozenAccountIdsSet.has(selectedNode.id) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleExecutePndFreeze(selectedNode.id)}
                      disabled={isFreezingAccount}
                      className="text-xs gap-1.5 bg-red-600 hover:bg-red-700"
                    >
                      <Lock className="size-3.5" />
                      <span>Execute Finacle PND</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Force Canvas & Overlays */}
              <div className="flex-1 relative bg-[#070A0F]">
                <ForceGraphCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id}
                  onSelectNode={(n) => {
                    setSelectedNode(n);
                    const matchingCluster = clusters.find((c: SyndicateCluster) => c.nodeIds.includes(n.id));
                    if (matchingCluster) setSelectedCluster(matchingCluster);
                  }}
                  filterRiskThreshold={riskFilterThreshold}
                  privacyMaskingEnabled={privacyMaskingEnabled}
                />

                {/* Left Floating Cluster Selector */}
                <div className="absolute top-4 left-4 w-64 max-h-[calc(100%-2rem)] overflow-y-auto space-y-2 pointer-events-auto">
                  <div className="bg-[#0B0F17]/90 backdrop-blur-md border border-[#1E293B] rounded-lg p-3 shadow-lg shadow-black/50">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
                      <span>Detected Syndicates</span>
                      <span className="text-amber-400">{clusters.length}</span>
                    </div>

                    <div className="space-y-1.5">
                      {clusters.map((c: SyndicateCluster) => {
                        const isSelected = selectedCluster?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCluster(c);
                              const firstNode = nodes.find((n: EntityNode) => c.nodeIds.includes(n.id));
                              if (firstNode) setSelectedNode(firstNode);
                            }}
                            className={`w-full text-left p-2 rounded-md text-xs font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                : 'bg-[#080B10] border border-[#1E293B] text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{c.code}</span>
                              <span className="text-[10px] text-red-400">Risk {c.riskScore}</span>
                            </div>
                            <div className="text-[11px] truncate text-slate-400 mt-0.5">{c.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Inspector Drawer (Node or Cluster or AI Dossier) */}
                {(selectedNode || selectedCluster || aiDossier) && (
                  <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto bg-[#0B0F17]/95 backdrop-blur-md border border-[#1E293B] rounded-lg p-4 shadow-xl shadow-black/60 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {selectedNode ? `NODE: ${selectedNode.id}` : `SYNDICATE: ${selectedCluster?.code}`}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedNode(null);
                          setSelectedCluster(null);
                          setAiDossier(null);
                        }}
                        className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                      >
                        [✕]
                      </button>
                    </div>

                    {/* Node details */}
                    {selectedNode && (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Entity Type:</span>
                          <span className="text-white uppercase">{selectedNode.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Risk Score:</span>
                          <span
                            className={`font-bold ${
                              selectedNode.riskScore >= 75 ? 'text-red-400' : 'text-amber-400'
                            }`}
                          >
                            {selectedNode.riskScore} / 100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Inbound Volume:</span>
                          <span className="text-emerald-400">
                            ₦{(selectedNode.metrics.totalInflow / 1_000_000).toFixed(2)}M
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Outbound Volume:</span>
                          <span className="text-red-400">
                            ₦{(selectedNode.metrics.totalOutflow / 1_000_000).toFixed(2)}M
                          </span>
                        </div>
                        {selectedNode.metrics.associatedBvns.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Associated BVN:</span>
                            <span className="text-slate-300 truncate max-w-[140px]">
                              {selectedNode.metrics.associatedBvns[0]}
                            </span>
                          </div>
                        )}
                        {selectedNode.metrics.connectedDeviceIds.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Hardware ID:</span>
                            <span className="text-slate-300 truncate max-w-[140px]">
                              {selectedNode.metrics.connectedDeviceIds[0]}
                            </span>
                          </div>
                        )}

                        <div className="pt-2">
                          {frozenAccountIdsSet.has(selectedNode.id) ? (
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-center text-xs">
                              ACCOUNT LOCKED UNDER FINACLE PND
                            </div>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleExecutePndFreeze(selectedNode.id)}
                              disabled={isFreezingAccount}
                              className="w-full text-xs bg-red-600 hover:bg-red-700"
                            >
                              <Lock className="size-3 mr-1" /> Freeze Account (Finacle PND)
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Groq LPU AI Copilot grounded response if synthesized */}
                    {aiDossier && (
                      <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-bold">
                            <Sparkles className="size-3.5" />
                            <span>{aiDossier.title}</span>
                          </div>
                          {aiDossier.groqMetadata && (
                            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <Cpu className="size-3" /> {aiDossier.groqMetadata.latencyMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-3">
                          {aiDossier.executiveSummary}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-amber-500/20 pt-1.5">
                          <span>Confidence: {aiDossier.confidenceScore}%</span>
                          <button
                            type="button"
                            onClick={() => setIsGroqModalOpen(true)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold hover:underline cursor-pointer"
                          >
                            View Full Dossier →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NUBAN & SOVEREIGN TELEMETRY */}
          {activeTab === 'nuban' && (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CBN NUBAN Modulo-10 Resolver */}
                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      CBN NUBAN Modulo-10 Resolution
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Central Bank of Nigeria Modulo-10 algorithmic validation & simulated NIBSS interbank resolution.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">SELECT BANK</label>
                      <select
                        value={selectedBankCode}
                        onChange={(e) => setSelectedBankCode(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-slate-200 rounded-md p-2 focus:border-amber-500/50"
                      >
                        {availableBanks.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">10-DIGIT NUBAN ACCOUNT</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={nubanInput}
                        onChange={(e) => setNubanInput(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-amber-300 rounded-md p-2 focus:border-amber-500/50"
                        placeholder="e.g. 2081940192"
                      />
                    </div>

                    <Button
                      onClick={handleResolveNuban}
                      disabled={isResolvingNuban}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold cursor-pointer"
                    >
                      {isResolvingNuban ? 'Validating Modulo-10...' : 'Resolve Account via NIBSS'}
                    </Button>
                  </div>

                  {nubanResult && (
                    <div className="mt-4 p-3 rounded-lg border border-[#1E293B] bg-[#080B10] space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Validation Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            nubanResult.isValidNuban
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {nubanResult.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Name:</span>
                        <span className="text-white font-bold">{nubanResult.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Check Digit:</span>
                        <span className="text-amber-400">
                          Calc: {nubanResult.cbnCalculatedCheckDigit} | Provided: {nubanResult.providedCheckDigit}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-[#1E293B]">
                        {nubanResult.details}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sovereign In-VPC GeoIP & ASN Inspector */}
                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Sovereign Telemetry & GeoIP ASN Inspector
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Real-time in-VPC Autonomous System Number (ASN) intelligence to detect residential mobile vs offshore VPN proxies.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">TARGET IP ADDRESS</label>
                      <input
                        type="text"
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-emerald-300 rounded-md p-2 focus:border-emerald-500/50"
                        placeholder="e.g. 102.89.43.12"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {IP_TELEMETRY_PRESETS.map((p) => (
                        <button
                          key={p.ip}
                          onClick={() => {
                            setIpInput(p.ip);
                            handleFetchTelemetry(p.ip);
                          }}
                          className="px-2 py-1 rounded bg-[#080B10] border border-[#1E293B] text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleFetchTelemetry()}
                      disabled={isFetchingTelemetry}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold cursor-pointer"
                    >
                      {isFetchingTelemetry ? 'Querying Sovereign ASN...' : 'Inspect IP Telemetry'}
                    </Button>
                  </div>

                  {ipResult && (
                    <div className="mt-4 p-3 rounded-lg border border-[#1E293B] bg-[#080B10] space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="text-white font-bold">
                          {ipResult.city}, {ipResult.country} ({ipResult.countryCode})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ISP / Carrier:</span>
                        <span className="text-slate-200">{ipResult.isp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Threat Score:</span>
                        <span
                          className={`font-bold ${
                            ipResult.threatScore >= 60 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {ipResult.threatScore}/100
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-[#1E293B]">
                        Verdict: {ipResult.riskAssessment}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CROSS-BANK RELAY & NIBSS CONSORTIUM TELEMETRY */}
          {activeTab === 'crossbank' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
              {/* Institutional Cross-Bank Telemetry & Consortium Correlation Analysis Console */}
              <div className="rounded-xl border border-border-medium bg-canvas-raised p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-2.5 text-signal font-bold text-sm font-mono">
                    <Radio className="size-4 animate-pulse text-signal" />
                    <span>NIBSS CFIS & ThreatMetrix Cross-Institutional Telemetry Mesh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-verified/15 text-verified border border-verified/30">
                      <span className="size-1.5 rounded-full bg-verified animate-pulse" />
                      CFIS v2.4 Interconnect Active (14ms)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-signal/15 text-signal border border-signal/30">
                      CBN AML/CFT 2022 §19.4 Enforced
                    </span>
                  </div>
                </div>

                {/* 4 Real-Time Analytical KPI Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                      Active Relay Streams
                    </span>
                    <span className="text-lg font-bold text-risk tabular-nums">
                      {crossBankRelays.length} Intercepted
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Multi-Bank Mule Dispersion
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                      Monitored Volume
                    </span>
                    <span className="text-lg font-bold text-text-primary tabular-nums">
                      ₦{crossBankRelays.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Cumulative Inter-Bank Exposure
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                      Mean Hop Latency
                    </span>
                    <span className="text-lg font-bold text-signal tabular-nums">
                      {(crossBankRelays.reduce((sum, r) => sum + r.deltaSeconds, 0) / (crossBankRelays.length || 1)).toFixed(1)}s
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Threshold &lt; 180s Flagging
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-canvas border border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                      Hardware Match Rate
                    </span>
                    <span className="text-lg font-bold text-verified tabular-nums">
                      100.0%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      IMEI + WebGL Canvas Salt
                    </span>
                  </div>
                </div>

                {/* Forensic Analysis Correlation Methodology */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-[#080B10] border border-border-subtle space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-signal">
                      <Smartphone className="size-3.5" />
                      <span>1. Hardware Hash Correlation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Unified ThreatMetrix/NIBSS SDK generates deterministic handset signatures (IMEI salt + Canvas UUID), matching concurrent app sessions across institutions within seconds.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#080B10] border border-border-subtle space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-verified">
                      <Zap className="size-3.5" />
                      <span>2. NIP pacs.008 Reconciliation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Standardized 30-digit NIP Session IDs and BVN hashes are correlated across the central clearing switch in real time without bank VPC data egress.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#080B10] border border-border-subtle space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-risk">
                      <Clock className="size-3.5" />
                      <span>3. Velocity Dispersion Analysis</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Downstream outflows occurring within &lt; 180s retaining &gt; 90% volume indicate rapid smurfing, satisfying statutory criteria for bilateral CFIS Category 08 freeze orders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Cross-Bank Relay Pipeline Visualizer */}
              <CrossBankRelayVisualizer
                relay={activeRelayEvent || crossBankRelays[0]}
                privacyMaskingEnabled={privacyMaskingEnabled}
                onExecutePnd={handleExecutePndFreeze}
                onExportEvidence={handleExportRelayEvidence}
              />

              {/* Active Intercepted Cross-Bank Relays Table */}
              <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-red-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Active Cross-Institutional Mule Relays ({crossBankRelays.length} Detected)
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    NIBSS CFIS & Device Consortium Active
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#080B10] text-slate-400 border-b border-[#1E293B]">
                      <tr>
                        <th className="py-2.5 px-3">RELAY ID</th>
                        <th className="py-2.5 px-3">ORIGIN (ZENITH)</th>
                        <th className="py-2.5 px-3">DESTINATION INSTITUTION</th>
                        <th className="py-2.5 px-3 text-right">AMOUNT (₦)</th>
                        <th className="py-2.5 px-3">HOP DELTA</th>
                        <th className="py-2.5 px-3">SHARED DEVICE</th>
                        <th className="py-2.5 px-3">DETECTION SOURCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] text-slate-300">
                      {crossBankRelays.map((relay) => (
                        <tr
                          key={relay.id}
                          tabIndex={0}
                          role="button"
                          aria-label={`Select relay event ${relay.id}`}
                          onClick={() => setActiveRelayEvent(relay)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveRelayEvent(relay);
                            }
                          }}
                          className={`hover:bg-[#141B26] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                            (activeRelayEvent?.id || crossBankRelays[0]?.id) === relay.id
                              ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-amber-400 font-bold">{relay.id}</td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {privacyMaskingEnabled
                              ? DataProtectionService.maskAccountNumber(relay.sourceAccount, true)
                              : relay.sourceAccount}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-white font-semibold">{relay.destinationBankName}</span>{' '}
                            <span className="text-slate-400">
                              (
                              {privacyMaskingEnabled
                                ? DataProtectionService.maskAccountNumber(relay.destinationAccount, true)
                                : relay.destinationAccount}
                              )
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            ₦{relay.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                              {relay.deltaSeconds}s Delta
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {privacyMaskingEnabled
                              ? DataProtectionService.maskDeviceId(relay.sharedDeviceFingerprint, true)
                              : relay.sharedDeviceFingerprint}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-emerald-400">
                            {relay.detectionMechanism.replace(/_/g, ' ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Relay Deep Technical Telemetry */}
              {activeRelayEvent && (
                <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                    <span className="text-white font-bold flex items-center gap-2">
                      <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                      Relay Forensic Analysis: {activeRelayEvent.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                      {activeRelayEvent.threatSeverity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 block">NIP INTER-BANK SESSION ID:</span>
                      <span className="text-amber-300 font-bold">{activeRelayEvent.nipSessionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CROSS-INSTITUTIONAL TIMESTAMPS:</span>
                      <span>
                        Zenith Inflow: {new Date(activeRelayEvent.inflowTimestamp).toLocaleTimeString()} &rarr; Dest Login:{' '}
                        {new Date(activeRelayEvent.crossBankLoginTimestamp).toLocaleTimeString()} ({activeRelayEvent.deltaSeconds}s apart)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-amber-400 block mb-1">TECHNICAL PROOF:</strong>
                    {activeRelayEvent.technicalExplanation}
                  </div>

                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center justify-between">
                    <div>
                      <strong className="text-red-400 block font-bold">STATUTORY CBN INTERDICTION ORDER:</strong>
                      {activeRelayEvent.suggestedInterdiction}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleExecutePndFreeze(activeRelayEvent.sourceAccount)}
                      className="bg-red-600 hover:bg-red-500 text-xs font-semibold cursor-pointer"
                    >
                      Lock Both Nodes (PND)
                    </Button>
                  </div>
                </div>
              )}

              {/* On-Demand Cross-Bank Clearing & Device Telemetry Trace (Forensic Analysis Desk) */}
              <div className="rounded-xl border border-border-medium bg-canvas-raised p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-2">
                    <Search className="size-4 text-signal" />
                    <h3 className="text-sm font-semibold font-heading text-white">
                      On-Demand Cross-Bank Clearing & Device Telemetry Trace
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted bg-canvas px-2.5 py-1 rounded border border-border-subtle">
                    NIBSS CFIS Query Engine &bull; Zero VPC Data Egress
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Execute targeted ad-hoc correlation queries against the NIBSS CFIS clearing switch and device telemetry mesh to reconstruct downstream mule hops and verify multi-banking hardware concurrence.
                </p>

                {/* Quick Investigative Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Investigative Scenarios:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSimSourceAccount('2081940192');
                      setSimTargetAccount('8039182741');
                      setSimRelayAmount(18500000);
                      setSimRelayDeviceId('DEV-LG-ALPHA-9821');
                    }}
                    className="px-2.5 py-1 rounded text-[11px] font-mono bg-canvas border border-border-subtle hover:border-signal/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    1. OPay Rapid Smurfing (43s &bull; ₦18.5M)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimSourceAccount('2081940201');
                      setSimTargetAccount('2049182739');
                      setSimRelayAmount(15200000);
                      setSimRelayDeviceId('DEV-LG-BETA-4102');
                    }}
                    className="px-2.5 py-1 rounded text-[11px] font-mono bg-canvas border border-border-subtle hover:border-signal/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    2. Kuda MFB Pass-Through (75s &bull; ₦15.2M)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimSourceAccount('0129481729');
                      setSimTargetAccount('2089182319');
                      setSimRelayAmount(14800000);
                      setSimRelayDeviceId('DEV-LG-ALPHA-9821');
                    }}
                    className="px-2.5 py-1 rounded text-[11px] font-mono bg-canvas border border-border-subtle hover:border-signal/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    3. Interbank Circular Ring (52s &bull; ₦14.8M)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                  <div>
                    <label className="text-text-muted block mb-1 text-[11px]">SOURCE NUBAN (ZENITH BANK)</label>
                    <input
                      type="text"
                      value={simSourceAccount}
                      onChange={(e) => setSimSourceAccount(e.target.value)}
                      placeholder="e.g. 2081940192"
                      className="w-full bg-[#080B10] border border-[#1E293B] text-signal rounded-md p-2 focus:border-signal/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted block mb-1 text-[11px]">BENEFICIARY ACCOUNT (EXTERNAL NODE)</label>
                    <input
                      type="text"
                      value={simTargetAccount}
                      onChange={(e) => setSimTargetAccount(e.target.value)}
                      placeholder="e.g. 8039182741"
                      className="w-full bg-[#080B10] border border-[#1E293B] text-slate-200 rounded-md p-2 focus:border-signal/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted block mb-1 text-[11px]">CLEARING AMOUNT (₦)</label>
                    <input
                      type="number"
                      value={simRelayAmount}
                      onChange={(e) => setSimRelayAmount(Number(e.target.value))}
                      placeholder="18500000"
                      className="w-full bg-[#080B10] border border-[#1E293B] text-white rounded-md p-2 focus:border-signal/50 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted block mb-1 text-[11px]">HARDWARE TOKEN (IMEI + CANVAS)</label>
                    <input
                      type="text"
                      value={simRelayDeviceId}
                      onChange={(e) => setSimRelayDeviceId(e.target.value)}
                      placeholder="e.g. DEV-LG-ALPHA-9821"
                      className="w-full bg-[#080B10] border border-[#1E293B] text-purple-300 rounded-md p-2 focus:border-signal/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={() => {
                      const result = CrossBankConsortiumService.evaluateCrossBankRelay(
                        simSourceAccount,
                        simTargetAccount,
                        simRelayAmount,
                        simRelayDeviceId
                      );
                      if (result) {
                        setActiveRelayEvent(result);
                        setCrossBankRelays((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
                        triggerRealtimeIndicator();
                      }
                    }}
                    className="bg-signal hover:bg-signal-hover text-canvas font-bold text-xs cursor-pointer gap-2"
                  >
                    <Search className="size-3.5" />
                    <span>Execute Cross-Institutional Forensic Trace</span>
                  </Button>
                </div>
              </div>
            </div>
          )}


          {/* TAB 4: FINACLE CORE PND CONSOLE */}
          {activeTab === 'finacle' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Execute Freeze Form */}
                <div className="lg:col-span-1 rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-red-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Execute Post-No-Debit (PND) Hold
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dispatches SOAP FIXML envelope to Finacle Core Banking with WS-Security header.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">ACCOUNT NUMBER</label>
                      <input
                        type="text"
                        value={pndAccountId}
                        onChange={(e) => setPndAccountId(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-amber-300 rounded-md p-2"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">BANK CODE</label>
                      <input
                        type="text"
                        value={pndBankCode}
                        onChange={(e) => setPndBankCode(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-slate-300 rounded-md p-2"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">REASON CODE</label>
                      <select
                        value={pndReasonCode}
                        onChange={(e) => setPndReasonCode(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-slate-200 rounded-md p-2"
                      >
                        <option value="08">08 - Court Order / EFCC Restraint</option>
                        <option value="12">12 - AML Suspicious Activity Freeze</option>
                        <option value="15">15 - Rapid Velocity Mule Interdiction</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">REASON DESCRIPTION</label>
                      <textarea
                        rows={2}
                        value={pndReasonDesc}
                        onChange={(e) => setPndReasonDesc(e.target.value)}
                        className="w-full bg-[#080B10] border border-[#1E293B] text-slate-200 rounded-md p-2"
                      />
                    </div>

                    <Button
                      onClick={() => handleExecutePndFreeze(pndAccountId, pndBankCode)}
                      disabled={isFreezingAccount}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
                    >
                      {isFreezingAccount ? 'Transmitting to Finacle...' : 'Lock Account in Finacle Core'}
                    </Button>
                  </div>
                </div>

                {/* Active PND Records & SOAP Envelope Viewer */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Active PND Records Table */}
                  <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="size-4 text-red-400" />
                        <h2 className="text-sm font-semibold font-heading text-white">
                          Active Finacle Core PND Holds ({pndRecords.length})
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {supabaseConnected ? 'Synced with Supabase' : 'Local Persistence'}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#080B10] text-slate-400 border-b border-[#1E293B]">
                          <tr>
                            <th className="py-2.5 px-3">ACCOUNT</th>
                            <th className="py-2.5 px-3">BANK</th>
                            <th className="py-2.5 px-3">REASON</th>
                            <th className="py-2.5 px-3">INITIATOR</th>
                            <th className="py-2.5 px-3">FROZEN AT</th>
                            <th className="py-2.5 px-3">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E293B] text-slate-300">
                          {pndRecords.map((rec) => (
                            <tr key={rec.accountId} className="hover:bg-[#141B26]">
                              <td className="py-2.5 px-3 text-amber-300 font-bold">
                                {privacyMaskingEnabled
                                  ? DataProtectionService.maskAccountNumber(rec.accountId, true)
                                  : rec.accountId}
                              </td>
                              <td className="py-2.5 px-3">{rec.bankCode}</td>
                              <td className="py-2.5 px-3 truncate max-w-[150px]">{rec.reasonDescription}</td>
                              <td className="py-2.5 px-3 text-slate-400">{rec.initiator}</td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(rec.frozenAt).toLocaleTimeString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                                  ACTIVE_PND
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SOAP Envelope Preview */}
                  {activeEnvelopeXml && (
                    <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          Dispatched Finacle FI XML SOAP Envelope
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeEnvelopeXml);
                            setFinacleCopied(true);
                            setTimeout(() => setFinacleCopied(false), 2000);
                          }}
                          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {finacleCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{finacleCopied ? 'Copied' : 'Copy XML'}</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                        {activeEnvelopeXml}
                      </pre>
                    </div>
                  )}

                  {activeHostResponse && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>Finacle Host Confirmation</span>
                        <span>STATUS: {activeHostResponse.status}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Host Transaction ID: <span className="text-amber-300">{activeHostResponse.hostTransactionId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NFIU goAML FILING STATION */}
          {activeTab === 'goaml' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
              <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Nigerian Financial Intelligence Unit (NFIU) goAML v4.0 SAR Filing
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={goAmlTargetClusterId}
                      onChange={(e) => setGoAmlTargetClusterId(e.target.value)}
                      className="bg-[#080B10] border border-[#1E293B] text-xs font-mono text-amber-300 rounded px-2.5 py-1"
                    >
                      {clusters.map((c: SyndicateCluster) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleGenerateGoAml}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Generate SAR XML
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Constructs institutional Suspicious Activity Report (SAR) XML matching NFIU XML Schema v4.0 with SHA-256 digest validation.
                </p>

                {goAmlXmlText ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[#080B10] border border-[#1E293B] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">NFIU goAML v4.0 XML Payload</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(goAmlXmlText);
                            setXmlCopied(true);
                            setTimeout(() => setXmlCopied(false), 2000);
                          }}
                          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {xmlCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{xmlCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                        {goAmlXmlText}
                      </pre>
                    </div>

                    {/* Direct Connect Action */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#080B10] border border-[#1E293B]">
                      <div className="space-y-1 font-mono text-xs">
                        <div className="text-white font-bold">NFIU B2B WebService Direct Connect</div>
                        <div className="text-slate-400 text-[11px]">
                          HMAC-SHA256 Payload Digest:{' '}
                          <span className="text-amber-400">
                            {nfiuPackage ? `${nfiuPackage.sha256XmlDigest.substring(0, 24)}...` : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmitToNfiu}
                        disabled={isTransmittingNfiu || !nfiuPackage}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs gap-1.5 cursor-pointer"
                      >
                        <Send className="size-3.5" />
                        <span>{isTransmittingNfiu ? 'Transmitting to NFIU...' : 'Transmit SAR Direct Connect'}</span>
                      </Button>
                    </div>

                    {/* Transmission Receipt */}
                    {nfiuReceipt && (
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2 font-mono text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <CheckCircle2 className="size-4" />
                          <span>Official NFIU Transmission Acknowledgment</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                          <div>
                            <span className="text-slate-500 block">RECEIPT NUMBER</span>
                            <span className="text-emerald-300 font-bold">{nfiuReceipt.receiptNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">BATCH ID</span>
                            <span>{nfiuReceipt.nfiuBatchId}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">ACK TIMESTAMP</span>
                            <span>{new Date(nfiuReceipt.ackTimestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center border border-dashed border-[#1E293B] rounded-lg">
                    <p className="text-xs text-slate-400 font-mono">
                      Click &quot;Generate SAR XML&quot; above to compile the NFIU goAML suspicious transaction package.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: COMPLIANCE AUDIT LEDGER */}
          {activeTab === 'audit' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
              <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      CBN Regulatory Audit Ledger ({auditLogs.length} Events)
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={auditFilterAction}
                      onChange={(e) => setAuditFilterAction(e.target.value)}
                      className="bg-[#080B10] border border-[#1E293B] text-xs font-mono text-slate-300 rounded px-2.5 py-1"
                    >
                      <option value="ALL">All Actions</option>
                      <option value="PND_FREEZE">PND_FREEZE</option>
                      <option value="PND_UNFREEZE">PND_UNFREEZE</option>
                      <option value="SAR_EXPORT">SAR_EXPORT</option>
                      <option value="GOAML_EXPORT">GOAML_EXPORT</option>
                      <option value="INGEST_ISO20022">INGEST_ISO20022</option>
                      <option value="DATASET_IMPORT">DATASET_IMPORT</option>
                      <option value="NFIU_TRANSMISSION">NFIU_TRANSMISSION</option>
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(auditLogs, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `FININT_AUDIT_LEDGER_${Date.now()}.json`;
                        a.click();
                      }}
                      className="text-xs border-[#1E293B] text-slate-300 hover:text-white"
                    >
                      <Download className="size-3 mr-1" /> Export JSON
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#080B10] text-slate-400 border-b border-[#1E293B]">
                      <tr>
                        <th className="py-2.5 px-3">EVENT ID</th>
                        <th className="py-2.5 px-3">TIMESTAMP</th>
                        <th className="py-2.5 px-3">OFFICER</th>
                        <th className="py-2.5 px-3">ACTION</th>
                        <th className="py-2.5 px-3">TARGET</th>
                        <th className="py-2.5 px-3">DETAILS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] text-slate-300">
                      {auditLogs
                        .filter(
                          (a) => auditFilterAction === 'ALL' || a.action === auditFilterAction
                        )
                        .map((entry) => (
                          <tr key={entry.id} className="hover:bg-[#141B26]">
                            <td className="py-2.5 px-3 text-slate-500 font-bold">{entry.id}</td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 text-amber-400">{entry.officerId}</td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-400">{entry.action}</td>
                            <td className="py-2.5 px-3 text-slate-200">{entry.targetEntityId}</td>
                            <td className="py-2.5 px-3 text-slate-400 truncate max-w-[280px]">
                              {entry.details}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DATA INGESTION CENTER */}
          {activeTab === 'ingest' && (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
              <div className="rounded-xl border border-[#1E293B] bg-[#0E131D]/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold font-heading text-white">
                      Transaction Ingestion (ISO 20022 & CSV)
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-lg border border-[#1E293B]">
                    <button
                      onClick={() => setIngestTab('iso20022')}
                      className={`px-3 py-1 rounded text-xs font-mono cursor-pointer ${
                        ingestTab === 'iso20022'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ISO 20022 (pacs.008)
                    </button>
                    <button
                      onClick={() => setIngestTab('csv')}
                      className={`px-3 py-1 rounded text-xs font-mono cursor-pointer ${
                        ingestTab === 'csv'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      CSV Batch
                    </button>
                  </div>
                </div>

                {ingestTab === 'iso20022' ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400">PASTE ISO 20022 pacs.008.001.08 XML</label>
                      <button
                        onClick={() =>
                          setIsoInputXml(`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>ZENITH-ISO-${Date.now()}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>E2E-CIRCULAR-01</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="NGN">18500000.00</IntrBkSttlmAmt>
      <DbtrAcct><Id><Othr><Id>2081940192</Id></Othr></Id></DbtrAcct>
      <CdtrAcct><Id><Othr><Id>2081940201</Id></Othr></Id></CdtrAcct>
      <RmtInf><Ustrd>RAPID NIP VELOCITY</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`)
                        }
                        className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Load Sample pacs.008
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={isoInputXml}
                      onChange={(e) => setIsoInputXml(e.target.value)}
                      placeholder="Paste ISO 20022 pacs.008 XML..."
                      className="w-full bg-[#080B10] border border-[#1E293B] text-slate-200 rounded-md p-3 text-xs"
                    />
                    <Button
                      onClick={handleIngestIso20022}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Ingest ISO 20022 & Sync to Supabase
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400">PASTE CSV DATA</label>
                      <button
                        onClick={() =>
                          setCsvInputText(`id,timestamp,sourceId,targetId,amount,rail,narration,bvn,deviceId
TX-CSV-101,2026-10-13T12:00:00Z,2081940192,2081940201,15000000,NIP,RAPID MULE TRANSFER,22194810291,DEV-LG-01
TX-CSV-102,2026-10-13T12:05:00Z,2081940201,2081940319,14800000,RTGS,RAPID MULE TRANSFER,22194810292,DEV-LG-02
TX-CSV-103,2026-10-13T12:10:00Z,2081940319,2081940192,14600000,NIP,CIRCULAR CLOSURE,22194810293,DEV-LG-01`)
                        }
                        className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Load Sample CSV
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={csvInputText}
                      onChange={(e) => setCsvInputText(e.target.value)}
                      placeholder="id,timestamp,sourceId,targetId,amount,rail..."
                      className="w-full bg-[#080B10] border border-[#1E293B] text-slate-200 rounded-md p-3 text-xs"
                    />
                    <Button
                      onClick={handleIngestCsv}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Ingest CSV & Sync to Supabase
                    </Button>
                  </div>
                )}

                {ingestStatus && (
                  <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-mono text-slate-300">
                    {ingestStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Groq LPU Forensic Intelligence Dossier Modal */}
      <GroqDossierModal
        isOpen={isGroqModalOpen}
        onClose={() => setIsGroqModalOpen(false)}
        dossier={aiDossier}
        isSynthesizing={isSynthesizingAi}
        onRegenerate={handleSynthesizeAi}
        onSelectNode={(nodeId) => {
          const found = nodes.find((n) => n.id === nodeId);
          if (found) setSelectedNode(found);
        }}
        onExecutePnd={async (accountIds) => {
          for (const acc of accountIds) {
            await handleExecutePndFreeze(acc);
          }
        }}
      />
    </div>
  );
};

export default FinintAppPortal;
