import { TransactionRecord } from './types';

/**
 * Pre-configured realistic transaction datasets for Zenith Bank hackathon demonstrations
 */
export interface DatasetOption {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  expectedThreat: string;
  records: TransactionRecord[];
}

function generateLagosBenchmarkDataset(): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  const baseTime = new Date('2026-10-08T08:00:00Z').getTime();

  // 1. Generate 2,480 benign background transactions (salaries, retail, utilities, groceries)
  const retailUsers = Array.from({ length: 450 }, (_, i) => `ZEN-RETAIL-${1000 + i}`);
  const corporatePayroll = ['ZENITH-PAYROLL-CORP', 'DANGOTE-TREASURY', 'FLOUR-MILLS-HQ', 'NESTLE-NIG-LTD'];
  const merchants = ['SUPERMART-VI-01', 'EKO-FUEL-LEKKI', 'AIRTIME-SWITCH-NG', 'PHCN-POWER-IKOYI', 'DSTV-MULTI-BILL'];

  for (let i = 0; i < 2480; i++) {
    const timestamp = new Date(baseTime + i * 4200).toISOString();
    const isPayroll = i % 40 === 0;
    const isMerchant = i % 3 === 0;

    let source = retailUsers[i % retailUsers.length];
    let target = retailUsers[(i + 7) % retailUsers.length];
    let amount = Math.floor(Math.random() * 85000) + 2500;
    let rail: 'NIP' | 'POS' | 'MOBILE' | 'WEB' = i % 4 === 0 ? 'POS' : i % 3 === 0 ? 'MOBILE' : 'NIP';

    if (isPayroll) {
      source = corporatePayroll[i % corporatePayroll.length];
      target = retailUsers[i % retailUsers.length];
      amount = Math.floor(Math.random() * 450000) + 120000;
    } else if (isMerchant) {
      target = merchants[i % merchants.length];
      amount = Math.floor(Math.random() * 45000) + 1500;
    }

    records.push({
      id: `TXN-BENIGN-${i.toString().padStart(4, '0')}`,
      timestamp,
      sourceId: source,
      targetId: target,
      amount,
      rail,
      narration: isPayroll ? 'Staff salary disbursement' : isMerchant ? 'Retail merchant payment' : 'Peer transfer',
    });
  }

  // 2. Inject covert 5-node circular layering syndicate sharing 1 device UUID
  const syndicateNodes = ['MULE-IKJ-01', 'MULE-IKJ-02', 'MULE-IKJ-03', 'MULE-IKJ-04', 'MULE-IKJ-05'];
  const sharedHandset = 'DEV-IOS-22';
  const sharedBvn = 'BVN-2281940192';

  for (let j = 0; j < syndicateNodes.length; j++) {
    const nextNode = syndicateNodes[(j + 1) % syndicateNodes.length];
    records.push({
      id: `TXN-COVERT-RING-${j + 1}`,
      timestamp: new Date(baseTime + 1800000 + j * 180000).toISOString(), // 3 mins apart
      sourceId: syndicateNodes[j],
      sourceName: `Syndicate Node ${j + 1} (Ikeja)`,
      targetId: nextNode,
      targetName: `Syndicate Node ${((j + 1) % syndicateNodes.length) + 1}`,
      amount: 4200000 - j * 80000,
      rail: 'NIP',
      deviceId: sharedHandset,
      bvn: sharedBvn,
      narration: 'Interbank contract tranche sweep',
    });
  }

  // 3. Inject rapid dispersion cash-out to POS
  for (let k = 0; k < 6; k++) {
    records.push({
      id: `TXN-COVERT-DISP-${k + 1}`,
      timestamp: new Date(baseTime + 2800000 + k * 90000).toISOString(),
      sourceId: 'MULE-IKJ-05',
      sourceName: 'Syndicate Terminal Node',
      targetId: `POS-ALABA-AGENT-${k + 1}`,
      targetName: `Alaba Cash-out Terminal 0${k + 1}`,
      amount: 650000,
      rail: 'POS',
      merchantType: 'POS Agent Terminal',
      deviceId: sharedHandset,
      narration: 'Quick settlement cash withdrawal',
    });
  }

  return records;
}

export const SAMPLE_DATASETS: DatasetOption[] = [
  {
    id: 'apex-syndicate',
    name: 'Apex Circular Syndicate (Lagos)',
    subtitle: '₦14.25M Layering Loop with Shared Device',
    description:
      'Coordinated circular layering between 5 retail & SME accounts in Ikeja, Lagos, controlled by a single iPhone 15 Pro hardware UUID.',
    expectedThreat: 'TYP-03 Circular Layering & TYP-04 Device Multiplexing',
    records: [
      {
        id: 'TXN-001',
        timestamp: '2026-10-08T09:12:00Z',
        sourceId: 'ACC-4891',
        sourceName: 'O. Adeyemi (Retail)',
        targetId: 'ACC-8204',
        targetName: 'Apex Swift Logistics',
        amount: 4200000,
        rail: 'NIP',
        deviceId: 'DEV-IOS-22',
        bvn: 'BVN-2281940192',
        narration: 'Interbank transfer / trade logistics',
      },
      {
        id: 'TXN-002',
        timestamp: '2026-10-08T09:16:30Z',
        sourceId: 'ACC-8204',
        sourceName: 'Apex Swift Logistics',
        targetId: 'ACC-9102',
        targetName: 'K. Balogun Consulting',
        amount: 3850000,
        rail: 'NIP',
        deviceId: 'DEV-IOS-22',
        bvn: 'BVN-2281940192',
        narration: 'Vendor settlement invoice 992',
      },
      {
        id: 'TXN-003',
        timestamp: '2026-10-08T09:22:15Z',
        sourceId: 'ACC-9102',
        sourceName: 'K. Balogun Consulting',
        targetId: 'ACC-7330',
        targetName: 'Emerald Express Global',
        amount: 3700000,
        rail: 'NIP',
        deviceId: 'DEV-IOS-22',
        bvn: 'BVN-8840192831',
        narration: 'Contractual advance tranche',
      },
      {
        id: 'TXN-004',
        timestamp: '2026-10-08T09:28:40Z',
        sourceId: 'ACC-7330',
        sourceName: 'Emerald Express Global',
        targetId: 'ACC-4891',
        targetName: 'O. Adeyemi (Retail)',
        amount: 3500000,
        rail: 'NIP',
        deviceId: 'DEV-IOS-22',
        bvn: 'BVN-8840192831',
        narration: 'Loan repayment rebate',
      },
      {
        id: 'TXN-005',
        timestamp: '2026-10-08T09:34:10Z',
        sourceId: 'ACC-4891',
        sourceName: 'O. Adeyemi (Retail)',
        targetId: 'BEN-OFFSHORE-09',
        targetName: 'Apex Overseas Holdings',
        amount: 2500000,
        rail: 'NIP',
        deviceId: 'DEV-IOS-22',
        narration: 'International clearing sweep',
      },
    ],
  },

  {
    id: 'lagos-clearing-2500',
    name: 'Lagos Clearing Scale (2,500 Txns)',
    subtitle: 'High-Volume Benchmark: Needle in a Haystack Test',
    description:
      'A batch of 2,500 transactions (2,480 benign retail/salaries + 20 covert syndicate injections). Proves Tarjan\'s SCC linear scalability and sub-20ms noise filtration.',
    expectedThreat: 'TYP-03 Circular Layering & Noise Rejection',
    records: generateLagosBenchmarkDataset(),
  },

  {
    id: 'alaba-pos-dispersion',
    name: 'Alaba POS Smurfing & Dispersion',
    subtitle: '₦28.5M Influx Splintered across 8 POS Terminals',
    description:
      'A compromised commercial account splinters ₦28.5M into sub-₦50,000 and sub-₦500,000 tranches across merchant cash-out terminals in Alaba International Market.',
    expectedThreat: 'TYP-01 Rapid Dispersion (Smurfing)',
    records: [
      {
        id: 'TXN-P01',
        timestamp: '2026-10-08T10:00:00Z',
        sourceId: 'COMPROMISED-CORP-01',
        sourceName: 'Atlantic Prime Builders Ltd',
        targetId: 'HUB-MULE-ALABA',
        targetName: 'Alaba Liquidity Collector',
        amount: 28500000,
        rail: 'NIP',
        narration: 'Invoice advance settlement',
      },
      {
        id: 'TXN-P02',
        timestamp: '2026-10-08T10:04:12Z',
        sourceId: 'HUB-MULE-ALABA',
        sourceName: 'Alaba Liquidity Collector',
        targetId: 'POS-TERM-ALB01',
        targetName: 'Z-Money POS Agent 01 (Alaba)',
        amount: 4800000,
        rail: 'POS',
        merchantType: 'POS Cash-out Terminal',
      },
      {
        id: 'TXN-P03',
        timestamp: '2026-10-08T10:07:30Z',
        sourceId: 'HUB-MULE-ALABA',
        sourceName: 'Alaba Liquidity Collector',
        targetId: 'POS-TERM-ALB02',
        targetName: 'Z-Money POS Agent 02 (Alaba)',
        amount: 4750000,
        rail: 'POS',
        merchantType: 'POS Cash-out Terminal',
      },
      {
        id: 'TXN-P04',
        timestamp: '2026-10-08T10:11:05Z',
        sourceId: 'HUB-MULE-ALABA',
        sourceName: 'Alaba Liquidity Collector',
        targetId: 'POS-TERM-ALB03',
        targetName: 'Z-Money POS Agent 03 (Alaba)',
        amount: 4900000,
        rail: 'POS',
        merchantType: 'POS Cash-out Terminal',
      },
      {
        id: 'TXN-P05',
        timestamp: '2026-10-08T10:14:40Z',
        sourceId: 'HUB-MULE-ALABA',
        sourceName: 'Alaba Liquidity Collector',
        targetId: 'POS-TERM-ALB04',
        targetName: 'Z-Money POS Agent 04 (Alaba)',
        amount: 4850000,
        rail: 'POS',
        merchantType: 'POS Cash-out Terminal',
      },
      {
        id: 'TXN-P06',
        timestamp: '2026-10-08T10:18:20Z',
        sourceId: 'HUB-MULE-ALABA',
        sourceName: 'Alaba Liquidity Collector',
        targetId: 'POS-TERM-ALB05',
        targetName: 'Z-Money POS Agent 05 (Alaba)',
        amount: 4950000,
        rail: 'POS',
        merchantType: 'POS Cash-out Terminal',
      },
      {
        id: 'TXN-P07',
        timestamp: '2026-10-08T10:21:55Z',
        sourceId: 'HUB-MULE-ALABA',
        sourceName: 'Alaba Liquidity Collector',
        targetId: 'POS-TERM-ALB06',
        targetName: 'Z-Money POS Agent 06 (Alaba)',
        amount: 4200000,
        rail: 'POS',
        merchantType: 'POS Cash-out Terminal',
      },
    ],
  },

  {
    id: 'campus-student-mules',
    name: 'Campus Student Mule Ring',
    subtitle: '7 Unrelated Accounts Operated by 1 Hardware IMEI',
    description:
      'Unrelated undergraduate student accounts in UNILAG / Yaba receiving romance and crypto scam payouts, all authenticated via a single Xiaomi Redmi note device in Akoka.',
    expectedThreat: 'TYP-04 Hardware Device Multi-Accounting',
    records: [
      {
        id: 'TXN-C01',
        timestamp: '2026-10-08T08:30:00Z',
        sourceId: 'EXT-VICTIM-01',
        sourceName: 'Victim Wire (UK Remit)',
        targetId: 'STU-ACC-01',
        targetName: 'Chioma E. (Retail Checking)',
        amount: 1850000,
        rail: 'NIP',
        deviceId: 'DEV-XIAOMI-AKOKA',
      },
      {
        id: 'TXN-C02',
        timestamp: '2026-10-08T08:32:00Z',
        sourceId: 'EXT-VICTIM-02',
        sourceName: 'Victim Wire (US Remit)',
        targetId: 'STU-ACC-02',
        targetName: 'Babatunde F. (Student Saver)',
        amount: 2200000,
        rail: 'NIP',
        deviceId: 'DEV-XIAOMI-AKOKA',
      },
      {
        id: 'TXN-C03',
        timestamp: '2026-10-08T08:35:00Z',
        sourceId: 'EXT-VICTIM-03',
        sourceName: 'Victim Wire (P2P Inflow)',
        targetId: 'STU-ACC-03',
        targetName: 'Emeka O. (Youth Account)',
        amount: 1950000,
        rail: 'NIP',
        deviceId: 'DEV-XIAOMI-AKOKA',
      },
      {
        id: 'TXN-C04',
        timestamp: '2026-10-08T08:42:00Z',
        sourceId: 'STU-ACC-01',
        sourceName: 'Chioma E.',
        targetId: 'CRYPTO-DESK-ESCROW',
        targetName: 'P2P Crypto Merchant Desk',
        amount: 1800000,
        rail: 'NIP',
        deviceId: 'DEV-XIAOMI-AKOKA',
      },
      {
        id: 'TXN-C05',
        timestamp: '2026-10-08T08:44:00Z',
        sourceId: 'STU-ACC-02',
        sourceName: 'Babatunde F.',
        targetId: 'CRYPTO-DESK-ESCROW',
        targetName: 'P2P Crypto Merchant Desk',
        amount: 2150000,
        rail: 'NIP',
        deviceId: 'DEV-XIAOMI-AKOKA',
      },
      {
        id: 'TXN-C06',
        timestamp: '2026-10-08T08:47:00Z',
        sourceId: 'STU-ACC-03',
        sourceName: 'Emeka O.',
        targetId: 'CRYPTO-DESK-ESCROW',
        targetName: 'P2P Crypto Merchant Desk',
        amount: 1900000,
        rail: 'NIP',
        deviceId: 'DEV-XIAOMI-AKOKA',
      },
    ],
  },

  {
    id: 'clean-commercial-baseline',
    name: 'Verified Commercial Baseline (Benign Trade)',
    subtitle: '100% Benign Trade with Zero False Alarms',
    description:
      'Regular legitimate corporate vendor transactions (Dangote Sugar, Flour Mills, Zenith Payroll Run) illustrating zero false-positive alerts on standard business turnover.',
    expectedThreat: 'Clean / Zero Syndicates Detected (Verified)',
    records: [
      {
        id: 'TXN-LEG-01',
        timestamp: '2026-10-08T11:00:00Z',
        sourceId: 'ZENITH-PAYROLL-CORP',
        sourceName: 'Zenith Institutional Treasury',
        targetId: 'STAFF-CORP-A',
        targetName: 'Vendor Staff Batch A',
        amount: 14500000,
        rail: 'INTERNAL',
        narration: 'Monthly operational payroll',
      },
      {
        id: 'TXN-LEG-02',
        timestamp: '2026-10-08T11:05:00Z',
        sourceId: 'DANGOTE-INDUSTRIES',
        sourceName: 'Dangote Agro Allied Ltd',
        targetId: 'FLOUR-MILLS-NIG',
        targetName: 'Flour Mills of Nigeria Plc',
        amount: 45000000,
        rail: 'NIP',
        narration: 'Bulk grain delivery invoice #782',
      },
      {
        id: 'TXN-LEG-03',
        timestamp: '2026-10-08T11:20:00Z',
        sourceId: 'FLOUR-MILLS-NIG',
        sourceName: 'Flour Mills of Nigeria Plc',
        targetId: 'CONTAINER-PORT-APAPA',
        targetName: 'Apapa Port Terminal Logistics',
        amount: 8200000,
        rail: 'NIP',
        narration: 'Port customs clearance fees',
      },
      {
        id: 'TXN-LEG-04',
        timestamp: '2026-10-08T11:35:00Z',
        sourceId: 'NESTLE-NIGERIA',
        sourceName: 'Nestle Nigeria Plc',
        targetId: 'DISTRIB-NORTH-KANO',
        targetName: 'Kano Regional Depot Co',
        amount: 19800000,
        rail: 'NIP',
        narration: 'Regional distributor inventory replenishment',
      },
    ],
  },
];
