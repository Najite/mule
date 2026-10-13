import { supabase, isSupabaseConfigured } from './client';
import { TransactionRecord, SyndicateCluster, PaymentRail } from '@/lib/graph-engine/types';
import {
  SavedCaseRecord,
  AuditLogEntry,
  FrozenAccountRecord,
  investigationStore,
} from '@/lib/storage/investigation-store';

export interface SupabaseSyncState {
  connected: boolean;
  cloudSyncEnabled: boolean;
  lastSyncTimestamp: string | null;
  error: string | null;
}

export class SupabaseDbService {
  /**
   * Check connection status to Supabase Cloud
   */
  public static async checkConnection(): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { error } = await supabase.from('transactions').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // --- Transactions ---

  public static async fetchTransactions(): Promise<TransactionRecord[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error || !data) {
        console.warn('Supabase: fetchTransactions returned error:', error);
        return [];
      }

      return data.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        sourceId: row.source_id,
        sourceName: row.source_name || undefined,
        targetId: row.target_id,
        targetName: row.target_name || undefined,
        amount: Number(row.amount),
        rail: row.payment_rail as PaymentRail,
        narration: row.narration || undefined,
        deviceId: row.device_id || undefined,
        bvn: row.bvn || undefined,
      }));
    } catch (err) {
      console.warn('Supabase: fetchTransactions exception:', err);
      return [];
    }
  }

  public static async insertTransactions(records: TransactionRecord[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || records.length === 0) {
      return false;
    }

    try {
      const rows = records.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        source_id: r.sourceId,
        source_name: r.sourceName || null,
        target_id: r.targetId,
        target_name: r.targetName || null,
        amount: r.amount,
        payment_rail: r.rail,
        narration: r.narration || null,
        device_id: r.deviceId || null,
        bvn: r.bvn || null,
      }));

      const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase: insertTransactions error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase: insertTransactions exception:', err);
      return false;
    }
  }

  // --- Syndicate Clusters ---

  public static async fetchSyndicateClusters(): Promise<SyndicateCluster[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase.from('syndicate_clusters').select('*');
      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        typology: row.typology,
        riskScore: row.risk_score,
        nodeIds: row.node_ids || [],
        edgeIds: [],
        totalExposure: Number(row.total_exposure),
        cycleLength: row.cycle_length || undefined,
        timeVelocityMinutes: row.time_velocity_minutes || undefined,
        sharedHardware: row.shared_hardware || undefined,
        narrative: row.narrative || '',
        indicators: row.indicators || [],
        recommendedAction: row.recommended_action || '',
      }));
    } catch {
      return [];
    }
  }

  // --- PND Freeze Records ---

  public static async insertPndRecord(pnd: {
    accountId: string;
    bankCode?: string;
    reasonCode?: string;
    reasonDescription: string;
    initiatorOfficer: string;
    hostTransactionId: string;
    soapXml?: string;
    hostXml?: string;
  }): Promise<boolean> {
    const record: FrozenAccountRecord = {
      accountId: pnd.accountId,
      bankCode: pnd.bankCode || '057',
      reasonCode: pnd.reasonCode || '08',
      reasonDescription: pnd.reasonDescription,
      frozenAt: new Date().toISOString(),
      initiator: pnd.initiatorOfficer,
      status: 'ACTIVE_PND',
    };

    // Always persist to local IndexedDB
    await investigationStore.saveFrozenAccount(record);

    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('pnd_records').upsert({
        id: `PND-${Date.now().toString(36)}-${pnd.accountId}`,
        account_id: pnd.accountId,
        bank_code: pnd.bankCode || '057',
        reason_code: pnd.reasonCode || '08',
        reason_description: pnd.reasonDescription,
        initiator_officer: pnd.initiatorOfficer,
        host_transaction_id: pnd.hostTransactionId,
        status: 'ACTIVE_PND',
        freeze_type: 'TOTAL_PND',
        soap_envelope_xml: pnd.soapXml || null,
        host_response_xml: pnd.hostXml || null,
        frozen_at: new Date().toISOString(),
      });

      if (error) console.warn('Supabase: insertPndRecord error:', error);
      return !error;
    } catch (err) {
      console.warn('Supabase: insertPndRecord exception:', err);
      return false;
    }
  }

  public static async fetchPndAccounts(): Promise<FrozenAccountRecord[]> {
    // Check Supabase first, fallback to IndexedDB
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('pnd_records')
          .select('*')
          .eq('status', 'ACTIVE_PND');

        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            accountId: r.account_id,
            bankCode: r.bank_code,
            reasonCode: r.reason_code,
            reasonDescription: r.reason_description,
            frozenAt: r.frozen_at,
            initiator: r.initiator_officer,
            status: 'ACTIVE_PND' as const,
          }));
        }
      } catch (err) {
        console.warn('Supabase: fetchPndAccounts error:', err);
      }
    }

    return investigationStore.getAllFrozenAccounts();
  }

  // --- Case Dossiers ---

  public static async saveCaseDossier(c: SavedCaseRecord): Promise<void> {
    // 1. Persist to local IndexedDB
    await investigationStore.saveCase(c);

    // 2. Sync to Supabase Cloud if online
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('case_dossiers').upsert({
          case_reference: c.caseReference,
          title: c.title,
          cluster_id: c.clusterId,
          threat_level: c.threatLevel,
          total_exposure: c.totalExposure,
          notes: c.notes,
          assigned_officer: 'ZENITH_AML_INVESTIGATOR_L2',
          status: 'UNDER_INVESTIGATION',
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase: saveCaseDossier error:', err);
      }
    }
  }

  public static async fetchCaseDossiers(): Promise<SavedCaseRecord[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_dossiers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            caseReference: row.case_reference,
            title: row.title,
            clusterId: row.cluster_id || 'UNKNOWN',
            threatLevel: row.threat_level,
            totalExposure: Number(row.total_exposure),
            notes: row.notes || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase: fetchCaseDossiers error:', err);
      }
    }

    return investigationStore.getAllSavedCases();
  }

  public static async deleteCaseDossier(caseRef: string): Promise<void> {
    await investigationStore.deleteSavedCase(caseRef);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('case_dossiers').delete().eq('case_reference', caseRef);
      } catch (err) {
        console.warn('Supabase: deleteCaseDossier error:', err);
      }
    }
  }

  // --- Audit Trail ---

  public static async logAuditAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `AUDIT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    await investigationStore.logAuditAction(entry);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('audit_trail').insert({
          id: fullEntry.id,
          timestamp: fullEntry.timestamp,
          action: fullEntry.action,
          target_entity_id: fullEntry.targetEntityId,
          officer_id: fullEntry.officerId,
          details: fullEntry.details,
        });
      } catch (err) {
        console.warn('Supabase: logAuditAction error:', err);
      }
    }
  }

  public static async fetchAuditTrail(): Promise<AuditLogEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_trail')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            timestamp: row.timestamp,
            action: row.action,
            targetEntityId: row.target_entity_id,
            officerId: row.officer_id,
            details: row.details,
          }));
        }
      } catch (err) {
        console.warn('Supabase: fetchAuditTrail error:', err);
      }
    }

    return investigationStore.getAuditTrail();
  }

  // --- Realtime Subscriptions ---

  public static subscribeToRealtime(handlers: {
    onNewTransaction?: (tx: TransactionRecord) => void;
    onNewPndHold?: (pnd: FrozenAccountRecord) => void;
    onAuditAction?: (entry: AuditLogEntry) => void;
  }): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('finint-realtime-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          if (handlers.onNewTransaction && payload.new) {
            const row = payload.new;
            handlers.onNewTransaction({
              id: row.id,
              timestamp: row.timestamp,
              sourceId: row.source_id,
              sourceName: row.source_name || undefined,
              targetId: row.target_id,
              targetName: row.target_name || undefined,
              amount: Number(row.amount),
              rail: row.payment_rail as PaymentRail,
              narration: row.narration || undefined,
              deviceId: row.device_id || undefined,
              bvn: row.bvn || undefined,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pnd_records' },
        (payload) => {
          if (handlers.onNewPndHold && payload.new) {
            const row = payload.new;
            handlers.onNewPndHold({
              accountId: row.account_id,
              bankCode: row.bank_code,
              reasonCode: row.reason_code,
              reasonDescription: row.reason_description,
              frozenAt: row.frozen_at,
              initiator: row.initiator_officer,
              status: 'ACTIVE_PND',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_trail' },
        (payload) => {
          if (handlers.onAuditAction && payload.new) {
            const row = payload.new;
            handlers.onAuditAction({
              id: row.id,
              timestamp: row.timestamp,
              action: row.action,
              targetEntityId: row.target_entity_id,
              officerId: row.officer_id,
              details: row.details,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }
}
