/**
 * FININT IndexedDB Investigation Store
 * Provides persistent offline-first storage for financial intelligence investigations:
 * - Frozen account state (PND holds)
 * - Saved case dossiers & analyst notes
 * - Audit trail (NDPR / CBN compliance requirement)
 * - Custom uploaded datasets
 */

export interface FrozenAccountRecord {
  accountId: string;
  bankCode: string;
  reasonCode: string;
  reasonDescription: string;
  frozenAt: string;
  initiator: string;
  status: 'ACTIVE_PND' | 'LIFTED';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'PND_FREEZE'
    | 'PND_UNFREEZE'
    | 'SAR_EXPORT'
    | 'GOAML_EXPORT'
    | 'DATASET_IMPORT'
    | 'INGEST_ISO20022'
    | 'NFIU_TRANSMISSION';
  targetEntityId: string;
  details: string;
  officerId: string;
}

export interface SavedCaseRecord {
  caseReference: string;
  title: string;
  clusterId: string;
  threatLevel: string;
  totalExposure: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'finint_intelligence_db';
const DB_VERSION = 1;

class InvestigationStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('frozenAccounts')) {
          db.createObjectStore('frozenAccounts', { keyPath: 'accountId' });
        }
        if (!db.objectStoreNames.contains('auditLogs')) {
          const store = db.createObjectStore('auditLogs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('savedCases')) {
          db.createObjectStore('savedCases', { keyPath: 'caseReference' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Frozen Accounts (PND) ---

  public async saveFrozenAccount(record: FrozenAccountRecord): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('frozenAccounts', 'readwrite');
      tx.objectStore('frozenAccounts').put(record);
    } catch (err) {
      console.warn('InvestigationStore: Failed to persist frozen account:', err);
    }
  }

  public async removeFrozenAccount(accountId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('frozenAccounts', 'readwrite');
      tx.objectStore('frozenAccounts').delete(accountId);
    } catch (err) {
      console.warn('InvestigationStore: Failed to delete frozen account:', err);
    }
  }

  public async getAllFrozenAccounts(): Promise<FrozenAccountRecord[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('frozenAccounts', 'readonly');
        const req = tx.objectStore('frozenAccounts').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  // --- Audit Trail ---

  public async logAuditAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('auditLogs', 'readwrite');
      const fullEntry: AuditLogEntry = {
        ...entry,
        id: `AUDIT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      tx.objectStore('auditLogs').add(fullEntry);
    } catch (err) {
      console.warn('InvestigationStore: Audit logging skipped:', err);
    }
  }

  public async getAuditTrail(): Promise<AuditLogEntry[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('auditLogs', 'readonly');
        const req = tx.objectStore('auditLogs').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const investigationStore = new InvestigationStore();
