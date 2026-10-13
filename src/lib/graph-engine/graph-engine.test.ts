import { describe, it, expect } from 'vitest';
import { BankingService } from '../services/banking-api';
import { GraphDetectionEngine } from './algorithms';
import { CsvTransactionParser } from './csv-parser';
import { GoAmlReportGenerator } from '../services/goaml-generator';
import { TransactionRecord } from './types';
import { Iso20022Parser } from './iso20022-parser';
import { SovereignGeoIpService } from '../services/sovereign-geoip';
import { FinacleCoreConnector } from '../services/finacle-envelope';
import { NfiuConnectClient } from '../services/nfiu-connect';

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

describe('Iso20022Parser: Interbank Customer Credit Transfer (pacs.008.001.08)', () => {
  it('should parse official ISO 20022 pacs.008 XML message into structured transaction records', () => {
    const sampleXml = Iso20022Parser.generateSamplePacs008();
    const { records, error } = Iso20022Parser.parsePacs008(sampleXml);

    expect(error).toBeUndefined();
    expect(records.length).toBe(2);
    expect(records[0].id).toBe('NIP-ZENITH-TX-001');
    expect(records[0].amount).toBe(4200000);
    expect(records[0].sourceId).toBe('2081940192');
    expect(records[0].targetId).toBe('1019284910');
    expect(records[0].deviceId).toBe('DEV-IOS-22');
    expect(records[0].bvn).toBe('BVN-2281940192');
    expect(records[0].rail).toBe('NIP');
  });
});

describe('SovereignGeoIpService: In-VPC Subnet Telemetry & NDPA Compliance', () => {
  it('should resolve local Nigerian mobile LTE subnets with low threat score', () => {
    const result = SovereignGeoIpService.evaluateIp('102.89.43.12'); // MTN Nigeria

    expect(result.jurisdiction).toBe('NIGERIA');
    expect(result.countryCode).toBe('NG');
    expect(result.isp).toContain('MTN Nigeria');
    expect(result.carrierType).toBe('MOBILE_LTE');
    expect(result.threatScore).toBeLessThanOrEqual(20);
    expect(result.isVpnOrProxy).toBe(false);
    expect(result.ndpaSovereigntyCompliant).toBe(true);
  });

  it('should flag commercial datacenter Tor exit nodes as critical proxy evasion', () => {
    const result = SovereignGeoIpService.evaluateIp('185.220.101.5'); // Tor exit subnet

    expect(result.isVpnOrProxy).toBe(true);
    expect(result.carrierType).toBe('TOR_EXIT');
    expect(result.threatScore).toBeGreaterThanOrEqual(90);
    expect(result.threatCategory).toBe('SUSPICIOUS_DATACENTER');
  });
});

describe('FinacleCoreConnector: Infosys Finacle FI XML SOAP Envelopes', () => {
  it('should build valid Finacle FI ModifyAccountFreeze SOAP request envelope', () => {
    const xml = FinacleCoreConnector.buildModifyAccountFreezeXml({
      accountNumber: '2081940192',
      reasonCode: '08',
      reasonDescription: 'CBN AML/CFT 2022 - SUSPECTED MONEY MULE',
      caseReference: 'INV-ZENITH-2026-001',
      initiatorOfficer: 'ZENITH_AML_OFFICER_L2',
    });

    expect(xml).toContain('<fi:ServiceRequestId>ModifyAccountFreeze</fi:ServiceRequestId>');
    expect(xml).toContain('<fi:BankId>057</fi:BankId>');
    expect(xml).toContain('<fi:AcctNum>2081940192</fi:AcctNum>');
    expect(xml).toContain('<fi:FreezeReasonCode>08</fi:FreezeReasonCode>');
    expect(xml).toContain('<fi:FreezeType>TOTAL_PND</fi:FreezeType>');
  });

  it('should simulate Finacle Host processing and return status 00', () => {
    const response = FinacleCoreConnector.simulateHostExecution({
      accountNumber: '2081940192',
      reasonCode: '08',
      reasonDescription: 'CBN AML/CFT 2022',
      caseReference: 'INV-2026',
      initiatorOfficer: 'OFFICER_1',
    });

    expect(response.status).toBe('SUCCESS');
    expect(response.responseCode).toBe('00');
    expect(response.hostTransactionId).toBeDefined();
    expect(response.rawXml).toContain('<HostResponseCode>00</HostResponseCode>');
  });
});

describe('NfiuConnectClient: NFIU goAML B2B WebService Package', () => {
  it('should generate cryptographic SHA-256 digest and transmission receipt', async () => {
    const pkg = await NfiuConnectClient.createSubmissionPackage({
      xmlPayload: '<report><rentity_id>ZENITH_BANK_057</rentity_id></report>',
      caseReference: 'SAR-ZENITH-089',
      totalTransactionsCount: 15,
      totalExposureNgn: 45000000,
    });

    expect(pkg.reportingEntityId).toBe('ZENITH_BANK_057');
    expect(pkg.sha256XmlDigest).toBeDefined();
    expect(pkg.sha256XmlDigest.length).toBe(64); // SHA-256 hex length

    const receipt = NfiuConnectClient.generateTransmissionReceipt(pkg);
    expect(receipt.status).toBe('ACCEPTED_BY_NFIU');
    expect(receipt.statusCode).toBe('200_ACK_PROCESSED');
    expect(receipt.reportingEntity).toBe('ZENITH_BANK_057');
  });
});

describe('Iso20022Parser & Sovereign Telemetry: Boundary & Error Handling', () => {
  it('should return error when XML has no pacs.008 credit transfer blocks', () => {
    const result = Iso20022Parser.parsePacs008('<Document><Empty/></Document>');
    expect(result.error).toBeDefined();
    expect(result.records.length).toBe(0);
  });

  it('should resolve Starlink Nigeria (102.165.x.x) as residential broadband with zero egress', () => {
    const result = SovereignGeoIpService.evaluateIp('102.165.34.19');
    expect(result.jurisdiction).toBe('NIGERIA');
    expect(result.asn).toBe('AS14593');
    expect(result.carrierType).toBe('BROADBAND');
    expect(result.isVpnOrProxy).toBe(false);
    expect(result.ndpaSovereigntyCompliant).toBe(true);
  });

  it('should reject invalid account numbers in Finacle host simulation', () => {
    const response = FinacleCoreConnector.simulateHostExecution({
      accountNumber: 'INVALID_ACC',
      reasonCode: '08',
      reasonDescription: 'CBN AML/CFT',
      caseReference: 'CASE-01',
      initiatorOfficer: 'OFFICER_1',
    });

    expect(response.status).toBe('INVALID_ACCOUNT');
    expect(response.responseCode).toBe('14');
    expect(response.message).toContain('Invalid NUBAN');
  });
});

describe('DataProtectionService: NDPA 2023 Statutory PII Redaction', () => {
  it('should mask 11-digit BVN preserving audit parity', async () => {
    const { DataProtectionService } = await import('../security/data-protection');
    const masked = DataProtectionService.maskBvn('22194810291', true);
    expect(masked).toBe('2219*****91');
    expect(masked.length).toBe(11);
  });

  it('should mask 10-digit NUBAN account number', async () => {
    const { DataProtectionService } = await import('../security/data-protection');
    const masked = DataProtectionService.maskAccountNumber('2081940192', true);
    expect(masked).toBe('208****192');
  });

  it('should generate deterministic consortium BVN hash without cleartext exposure', async () => {
    const { DataProtectionService } = await import('../security/data-protection');
    const hash1 = DataProtectionService.hashBvnForConsortium('22194810291');
    const hash2 = DataProtectionService.hashBvnForConsortium('22194810291');
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('BVN_HASH_')).toBe(true);
  });
});

describe('CrossBankConsortiumService: NIBSS & Device Telemetry Correlation', () => {
  it('should intercept cross-bank mule relay on matching shared hardware', async () => {
    const { CrossBankConsortiumService } = await import('../services/cross-bank-consortium');
    const relay = CrossBankConsortiumService.evaluateCrossBankRelay(
      '2081940192',
      '8039182741',
      18500000,
      'DEV-LG-ALPHA-9821'
    );
    expect(relay).not.toBeNull();
    expect(relay?.destinationBankName).toBe('OPay Digital Services');
    expect(relay?.deltaSeconds).toBe(43);
    expect(relay?.detectionMechanism).toBe('NIBSS_CONSORTIUM_DEVICE_TELEMETRY');
  });

  it('should flag rapid smurfing for unlisted accounts with shared device and high value', async () => {
    const { CrossBankConsortiumService } = await import('../services/cross-bank-consortium');
    const relay = CrossBankConsortiumService.evaluateCrossBankRelay(
      '0192837465',
      '9928172635',
      8500000,
      'DEV-MULE-HARDWARE-99'
    );
    expect(relay).not.toBeNull();
    expect(relay?.threatSeverity).toBe('HIGH_SUSPICION');
    expect(relay?.deltaSeconds).toBe(45);
  });
});

describe('GroqForensicService: High-Speed LPU AML Dossier Synthesizer', () => {
  it('should synthesize a grounded forensic AML dossier with evidence anchors and Finacle directive', async () => {
    const { GroqForensicService } = await import('../services/groq-service');
    const { SAMPLE_DATASETS } = await import('./sample-datasets');
    const { GraphDetectionEngine } = await import('./algorithms');

    const dataset = SAMPLE_DATASETS.find((d) => d.id === 'apex-syndicate');
    expect(dataset).toBeDefined();

    const analysis = GraphDetectionEngine.analyzeTransactions(dataset!.records);
    expect(analysis.clusters.length).toBeGreaterThan(0);

    const cluster = analysis.clusters[0];
    const dossier = await GroqForensicService.synthesizeDossier({
      cluster,
      nodes: analysis.nodes,
      edges: analysis.edges,
    });

    expect(dossier).toBeDefined();
    expect(dossier.clusterId).toBe(cluster.id);
    expect(dossier.cbnRegulationCode).toBe('CBN/AML-CFT/SEC-6/2022');
    expect(dossier.executiveSummary).toBeTruthy();
    expect(dossier.topologicalProof).toBeTruthy();
    expect(dossier.nfiuNarrative).toContain('Zenith Bank');
    expect(dossier.finacleFreezeDirective.reasonCode).toBe('08');
    expect(dossier.finacleFreezeDirective.targetAccounts.length).toBeGreaterThan(0);
    expect(dossier.anchors.length).toBeGreaterThan(0);
    expect(dossier.groqMetadata).toBeDefined();
    expect(dossier.groqMetadata?.provider).toBe('groq');
    expect(dossier.groqMetadata?.latencyMs).toBeGreaterThanOrEqual(0);
  }, 15000);
});

