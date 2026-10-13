import { TransactionRecord, PaymentRail } from './types';

/**
 * Robust CSV parser for transaction streams and financial ledger exports
 */
export class CsvTransactionParser {
  /**
   * Parse raw CSV text into validated TransactionRecord array
   */
  public static parseCsv(csvText: string): { records: TransactionRecord[]; error?: string } {
    try {
      const lines = csvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        return { records: [], error: 'CSV must contain at least a header and one data row.' };
      }

      const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/["']/g, ''));

      const idIdx = header.findIndex((h) => h === 'id' || h === 'tx_id' || h === 'reference');
      const timeIdx = header.findIndex((h) => h.includes('timestamp') || h.includes('date') || h.includes('time'));
      const sourceIdx = header.findIndex((h) => h.includes('source') || h.includes('sender') || h.includes('originator'));
      const targetIdx = header.findIndex((h) => h.includes('target') || h.includes('receiver') || h.includes('beneficiary'));
      const amountIdx = header.findIndex((h) => h.includes('amount') || h.includes('value'));
      const railIdx = header.findIndex((h) => h.includes('rail') || h.includes('channel') || h.includes('type'));
      const deviceIdx = header.findIndex((h) => h.includes('device') || h.includes('imei') || h.includes('hardware'));
      const bvnIdx = header.findIndex((h) => h.includes('bvn'));
      const narrIdx = header.findIndex((h) => h.includes('narration') || h.includes('desc') || h.includes('remark') || h.includes('memo'));

      if (sourceIdx === -1 || targetIdx === -1 || amountIdx === -1) {
        return {
          records: [],
          error:
            'Missing required columns. CSV header must include: source_account, target_account, amount.',
        };
      }

      const records: TransactionRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 3) continue;

        const source = parts[sourceIdx];
        const target = parts[targetIdx];
        const rawAmount = parts[amountIdx].replace(/[^0-9.]/g, '');
        const amount = parseFloat(rawAmount);

        if (!source || !target || isNaN(amount) || amount <= 0) continue;

        const recordId = idIdx !== -1 && parts[idIdx] ? parts[idIdx] : `TXN-CSV-${i.toString().padStart(3, '0')}`;
        const rail = (railIdx !== -1 && parts[railIdx]?.toUpperCase()) as PaymentRail || 'NIP';
        const deviceId = deviceIdx !== -1 && parts[deviceIdx] ? parts[deviceIdx] : undefined;
        const bvn = bvnIdx !== -1 && parts[bvnIdx] ? parts[bvnIdx] : undefined;
        const narration = narrIdx !== -1 && parts[narrIdx] ? parts[narrIdx] : undefined;

        // Parse authentic timestamp if present; only fallback to relative timestamp if missing/invalid
        let recordTimestamp: string;
        if (timeIdx !== -1 && parts[timeIdx]) {
          const parsed = new Date(parts[timeIdx]);
          recordTimestamp = !isNaN(parsed.getTime())
            ? parsed.toISOString()
            : new Date(Date.now() - (lines.length - i) * 60000).toISOString();
        } else {
          recordTimestamp = new Date(Date.now() - (lines.length - i) * 60000).toISOString();
        }

        records.push({
          id: recordId,
          timestamp: recordTimestamp,
          sourceId: source,
          targetId: target,
          amount,
          rail: ['NIP', 'POS', 'ATM', 'MOBILE', 'WEB', 'INTERNAL'].includes(rail) ? rail : 'NIP',
          deviceId,
          bvn,
          narration,
        });
      }

      if (records.length === 0) {
        return { records: [], error: 'No valid transaction records could be parsed.' };
      }

      return { records };
    } catch (err: unknown) {
      return { records: [], error: err instanceof Error ? err.message : 'Unknown CSV parse error' };
    }
  }

  /**
   * Export sample CSV string for users/judges to download and test
   */
  public static generateSampleCsv(): string {
    return `transaction_id,timestamp,source_account,target_account,amount,payment_rail,device_id,bvn,narration
TXN-001,2026-10-08T09:12:00Z,ACC-4891,ACC-8204,4200000,NIP,DEV-IOS-22,BVN-2281940192,Mule layer leg 1
TXN-002,2026-10-08T09:16:30Z,ACC-8204,ACC-9102,3850000,NIP,DEV-IOS-22,BVN-2281940192,Mule layer leg 2
TXN-003,2026-10-08T09:22:15Z,ACC-9102,ACC-7330,3700000,NIP,DEV-IOS-22,BVN-8840192831,Mule layer leg 3
TXN-004,2026-10-08T09:28:40Z,ACC-7330,ACC-4891,3500000,NIP,DEV-IOS-22,BVN-8840192831,Circular loop back to ACC-4891
TXN-005,2026-10-08T09:34:10Z,ACC-4891,BEN-OFFSHORE-09,2500000,NIP,DEV-IOS-22,BVN-2281940192,Offshore consolidation`;
  }
}
