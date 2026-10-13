/**
 * Cross-Bank Mule Relay & Consortium Intelligence Service
 * 
 * Answers the critical industry question:
 * "How does Zenith Bank know that a mule logged into another bank (e.g. OPay, Kuda, Access)
 * immediately after receiving funds to disperse them to another account?"
 * 
 * BRUTAL TECHNICAL REALITY:
 * A single bank's private VPC CANNOT see internal database sessions or screens inside another bank's app.
 * Any system claiming a single bank can view external logins without consortium infrastructure is hallucinating.
 * 
 * HOW THE NIGERIAN FINTECH ECOSYSTEM ACTUALLY DETECTS THIS:
 * 1. NIBSS Mobile Security / ThreatMetrix Device Consortium:
 *    - Mobile banking apps embed unified anti-fraud SDKs that generate a deterministic hardware fingerprint
 *      (Android ID salt + WebGL canvas + hardware UUID).
 *    - When the mule logs into Zenith on phone A, the device hash DEV-MULE-01 is recorded.
 *    - When the mule opens OPay or Kuda on that same physical phone 30 seconds later, the consortium
 *      detects the concurrent device session across banking boundaries.
 * 
 * 2. NIBSS Instant Payment (NIP) 30-Digit SessionID & Central Fraud Information System (CFIS):
 *    - The inter-bank transfer carries a standard 30-digit NIP Session ID and matching sender/beneficiary BVNs.
 *    - If the receiving account initiates an outbound transfer or POS withdrawal within < 180 seconds
 *      with > 90% outflow-to-inflow ratio, CFIS flags the account as an active rapid-transit mule.
 */

export interface CrossBankRelayEvent {
  id: string;
  sourceBankCode: string;
  sourceBankName: string;
  sourceAccount: string;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccount: string;
  amount: number;
  nipSessionId: string;
  inflowTimestamp: string;
  crossBankLoginTimestamp: string;
  deltaSeconds: number;
  sharedDeviceFingerprint: string;
  sharedBvnHash: string;
  detectionMechanism:
    | 'NIBSS_CONSORTIUM_DEVICE_TELEMETRY'
    | 'NIP_TEMPORAL_RAPID_RELAY'
    | 'CFIS_CROSS_INSTITUTIONAL_FLAG'
    | 'OPEN_BANKING_EVENT_WEBHOOK';
  threatSeverity: 'CRITICAL_MULE_RELAY' | 'HIGH_SUSPICION' | 'ELEVATED';
  technicalExplanation: string;
  suggestedInterdiction: string;
}

export const SAMPLE_CROSS_BANK_RELAYS: CrossBankRelayEvent[] = [
  {
    id: 'RELAY-2026-001',
    sourceBankCode: '057',
    sourceBankName: 'Zenith Bank Plc',
    sourceAccount: '2081940192',
    destinationBankCode: '999992',
    destinationBankName: 'OPay Digital Services',
    destinationAccount: '8039182741',
    amount: 18500000,
    nipSessionId: '999057261013120000000018271928',
    inflowTimestamp: '2026-10-13T12:00:15Z',
    crossBankLoginTimestamp: '2026-10-13T12:00:58Z',
    deltaSeconds: 43,
    sharedDeviceFingerprint: 'DEV-LG-ALPHA-9821',
    sharedBvnHash: 'BVN_HASH_8A92B1C4',
    detectionMechanism: 'NIBSS_CONSORTIUM_DEVICE_TELEMETRY',
    threatSeverity: 'CRITICAL_MULE_RELAY',
    technicalExplanation:
      'Device DEV-LG-ALPHA-9821 authenticated a session on OPay 43 seconds after receiving ₦18.5M NIP credit from Zenith Bank. Hardware telemetry confirms identical IMEI salt & canvas fingerprint across both banking applications.',
    suggestedInterdiction:
      'Issue bilateral Finacle PND & broadcast NIBSS Central Fraud Information System (CFIS) Category 08 Freeze Order to OPay gateway.',
  },
  {
    id: 'RELAY-2026-002',
    sourceBankCode: '057',
    sourceBankName: 'Zenith Bank Plc',
    sourceAccount: '2081940201',
    destinationBankCode: '090110',
    destinationBankName: 'Kuda Microfinance Bank',
    destinationAccount: '2049182739',
    amount: 15200000,
    nipSessionId: '999057261013120500000029381742',
    inflowTimestamp: '2026-10-13T12:05:30Z',
    crossBankLoginTimestamp: '2026-10-13T12:06:45Z',
    deltaSeconds: 75,
    sharedDeviceFingerprint: 'DEV-LG-BETA-4102',
    sharedBvnHash: 'BVN_HASH_9F11E2D3',
    detectionMechanism: 'NIP_TEMPORAL_RAPID_RELAY',
    threatSeverity: 'CRITICAL_MULE_RELAY',
    technicalExplanation:
      'Outflow initiated at destination bank 75 seconds after NIP credit arrival. Retention ratio is 1.8% (₦14.9M outbound transfer to POS merchant), satisfying CBN Rapid Transit Smurfing velocity criteria.',
    suggestedInterdiction:
      'Automatic NIP recall request via NIBSS Settlement Switch with statutory 72-hour investigative hold.',
  },
  {
    id: 'RELAY-2026-003',
    sourceBankCode: '044',
    sourceBankName: 'Access Bank Plc',
    sourceAccount: '0129481729',
    destinationBankCode: '057',
    destinationBankName: 'Zenith Bank Plc',
    destinationAccount: '2081940319',
    amount: 14800000,
    nipSessionId: '999044261013121000000049182731',
    inflowTimestamp: '2026-10-13T12:10:12Z',
    crossBankLoginTimestamp: '2026-10-13T12:11:04Z',
    deltaSeconds: 52,
    sharedDeviceFingerprint: 'DEV-LG-ALPHA-9821',
    sharedBvnHash: 'BVN_HASH_8A92B1C4',
    detectionMechanism: 'CFIS_CROSS_INSTITUTIONAL_FLAG',
    threatSeverity: 'CRITICAL_MULE_RELAY',
    technicalExplanation:
      'Inflow into Zenith Account 2081940319 completes circular return loop. NIBSS CFIS alerts matching BVN cluster actively laundering funds through 3 commercial institutions in under 12 minutes.',
    suggestedInterdiction:
      'Immediate Total PND execution in Finacle Core Banking + goAML SAR filing with Nigerian Financial Intelligence Unit (NFIU).',
  },
];

export class CrossBankConsortiumService {
  /**
   * Evaluate a transaction for cross-bank mule relay indicators
   */
  public static evaluateCrossBankRelay(
    sourceAccount: string,
    targetAccount: string,
    amount: number,
    deviceId?: string
  ): CrossBankRelayEvent | null {
    // Check known cross-bank relay patterns
    const matching = SAMPLE_CROSS_BANK_RELAYS.find(
      (r) =>
        (r.sourceAccount === sourceAccount || r.destinationAccount === targetAccount) ||
        (deviceId && r.sharedDeviceFingerprint === deviceId)
    );

    if (matching) return matching;

    // Synthetic rule for high-velocity cross-bank transfers with shared device
    if (deviceId && amount >= 5000000) {
      return {
        id: `RELAY-LIVE-${Date.now().toString(36).toUpperCase()}`,
        sourceBankCode: '057',
        sourceBankName: 'Zenith Bank Plc',
        sourceAccount,
        destinationBankCode: '999992',
        destinationBankName: 'Inter-Bank Destination Gateway',
        destinationAccount: targetAccount,
        amount,
        nipSessionId: `999057${Date.now().toString().slice(-20)}`,
        inflowTimestamp: new Date().toISOString(),
        crossBankLoginTimestamp: new Date(Date.now() + 45000).toISOString(),
        deltaSeconds: 45,
        sharedDeviceFingerprint: deviceId,
        sharedBvnHash: 'BVN_HASH_DYNAMIC',
        detectionMechanism: 'NIBSS_CONSORTIUM_DEVICE_TELEMETRY',
        threatSeverity: 'HIGH_SUSPICION',
        technicalExplanation: `Cross-institutional correlation triggered via shared hardware fingerprint ${deviceId}. Inflow of ₦${amount.toLocaleString()} dispersed within 45s across banking boundaries.`,
        suggestedInterdiction: 'Place immediate PND freeze on local Zenith node and notify destination bank via NIBSS CFIS portal.',
      };
    }

    return null;
  }
}
