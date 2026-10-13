import { describe, it, expect } from 'vitest';
import { BankingService } from '../services/banking-api';
import { GraphDetectionEngine } from './algorithms';
import { CsvTransactionParser } from './csv-parser';
import { GoAmlReportGenerator } from '../services/goaml-generator';
import { TransactionRecord } from './types';

describe('BankingService: Central Bank of Nigeria (CBN) NUBAN MOD-10 Checksum', () => {
  it('should validate official Zenith Bank (057) valid account checksum', () => {
    // 2081940192 is Zenith Bank (057)
    // 057 + 208194019 -> check digit should equal 2
    const result = BankingService.validateCbnNubanChecksum('2081940192', '057');
    expect(result.isValid).toBe(true);
    expect(result.calculatedCheckDigit).toBe(2);
    expect(result.providedCheckDigit).toBe(2);
  });

  it('should reject tampered or invalid check digits', () => {
    // Deliberately wrong check digit (7 instead of 2)
    const result = BankingService.validateCbnNubanChecksum('2081940197', '057');
    expect(result.isValid).toBe(false);
    expect(result.calculatedCheckDigit).toBe(2);
    expect(result.providedCheckDigit).toBe(7);
  });

  it('should reject accounts that are not exactly 10 digits', () => {
    const tooShort = BankingService.validateCbnNubanChecksum('123456789', '057');
    expect(tooShort.isValid).toBe(false);

    const tooLong = BankingService.validateCbnNubanChecksum('12345678901', '057');
    expect(tooLong.isValid).toBe(false);
  });
});

describe('GraphDetectionEngine: Tarjan SCC & Topology Detection', () => {
  it('should detect a closed-loop circular layering ring (TYP-03)', () => {
    const transactions: TransactionRecord[] = [
      {
        id: 'TX-1',
        timestamp: '2026-10-08T09:00:00Z',
        sourceId: 'ACC-01',
        targetId: 'ACC-02',
        amount: 5000000,
        rail: 'NIP',
      },
      {
        id: 'TX-2',
        timestamp: '2026-10-08T09:05:00Z',
        sourceId: 'ACC-02',
        targetId: 'ACC-03',
        amount: 4800000,
        rail: 'NIP',
      },
      {
        id: 'TX-3',
        timestamp: '2026-10-08T09:10:00Z',
        sourceId: 'ACC-03',
        targetId: 'ACC-01',
        amount: 4600000,
        rail: 'NIP',
      },
    ];

    const results = GraphDetectionEngine.analyzeTransactions(transactions);

    expect(results.clusters.length).toBeGreaterThanOrEqual(1);
    const circularCluster = results.clusters.find((c) => c.typology === 'circular');
    expect(circularCluster).toBeDefined();
    expect(circularCluster?.cycleLength).toBe(3);
    expect(circularCluster?.nodeIds).toContain('ACC-01');
    expect(circularCluster?.nodeIds).toContain('ACC-02');
    expect(circularCluster?.nodeIds).toContain('ACC-03');

    // All cycle participants should be flagged high risk
    const node1 = results.nodes.find((n) => n.id === 'ACC-01');
    expect(node1?.metrics.isInCycle).toBe(true);
    expect(node1?.riskScore).toBeGreaterThanOrEqual(50);
  });

  it('should detect shared hardware device multiplexing (TYP-04)', () => {
    const transactions: TransactionRecord[] = [
      {
        id: 'TX-D1',
        timestamp: '2026-10-08T10:00:00Z',
        sourceId: 'ACC-USER-A',
        targetId: 'MERCHANT-01',
        amount: 1500000,
        rail: 'NIP',
        deviceId: 'DEV-SHARED-HANDSET-99',
      },
      {
        id: 'TX-D2',
        timestamp: '2026-10-08T10:02:00Z',
        sourceId: 'ACC-USER-B',
        targetId: 'MERCHANT-02',
        amount: 1800000,
        rail: 'NIP',
        deviceId: 'DEV-SHARED-HANDSET-99',
      },
    ];

    const results = GraphDetectionEngine.analyzeTransactions(transactions);

    const deviceCluster = results.clusters.find((c) => c.typology === 'shared_device');
    expect(deviceCluster).toBeDefined();
    expect(deviceCluster?.sharedHardware).toContain('DEV-SHARED-HANDSET-99');
    expect(deviceCluster?.nodeIds).toContain('ACC-USER-A');
    expect(deviceCluster?.nodeIds).toContain('ACC-USER-B');
  });
});

describe('CsvTransactionParser: Real Timestamp & Field Ingestion', () => {
  it('should parse authentic ISO timestamps from CSV rows', () => {
    const csvContent = `transaction_id,timestamp,source_account,target_account,amount,payment_rail,device_id
TXN-101,2026-10-08T14:22:00Z,ACC-SENDER,ACC-RECEIVER,3500000,NIP,DEV-01`;

    const { records, error } = CsvTransactionParser.parseCsv(csvContent);

    expect(error).toBeUndefined();
    expect(records.length).toBe(1);
    expect(records[0].timestamp).toBe('2026-10-08T14:22:00.000Z');
    expect(records[0].sourceId).toBe('ACC-SENDER');
    expect(records[0].targetId).toBe('ACC-RECEIVER');
    expect(records[0].amount).toBe(3500000);
    expect(records[0].deviceId).toBe('DEV-01');
  });
});

describe('GoAmlReportGenerator: NFIU AML/CFT XML Generation', () => {
  it('should construct valid UNODC goAML v5 XML structure', () => {
    const mockCluster = {
      id: 'CLUSTER-01',
      code: 'TYP-03',
      name: 'Circular Layering Syndicate',
      typology: 'circular' as const,
      riskScore: 92,
      nodeIds: ['ACC-01', 'ACC-02'],
      edgeIds: ['EDGE-01'],
      totalExposure: 10000000,
      narrative: 'Coordinated circular flow detected across accounts.',
      indicators: ['Circular NIP transshipment'],
      recommendedAction: 'Freeze accounts and file SAR',
    };

    const mockNodes = [
      {
        id: 'ACC-01',
        label: 'Account 01',
        type: 'account' as const,
        riskScore: 92,
        metrics: {
          totalInflow: 10000000,
          totalOutflow: 10000000,
          inDegree: 1,
          outDegree: 1,
          netRetentionRatio: 0,
          connectedDeviceIds: [],
          associatedBvns: ['BVN-1122334455'],
          isInCycle: true,
        },
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      },
    ];

    const xml = GoAmlReportGenerator.generateGoAmlXml({
      cluster: mockCluster,
      nodes: mockNodes,
      edges: [],
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rentity_id>ZENITH_BANK_057</rentity_id>');
    expect(xml).toContain('<submission_code>SAR</submission_code>');
    expect(xml).toContain('<account_number>ACC-01</account_number>');
    expect(xml).toContain('<bvn>BVN-1122334455</bvn>');
    expect(xml).toContain('EXECUTE FINACLE API MODIFY_ACCOUNT_FREEZE CODE 08');
  });
});
