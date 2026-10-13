export type EntityType = 'account' | 'device' | 'bvn' | 'beneficiary' | 'merchant';

export type PaymentRail = 'NIP' | 'POS' | 'ATM' | 'MOBILE' | 'WEB' | 'INTERNAL';

export type EdgeRelationType = 'FINANCIAL_TRANSFER' | 'AUTHENTICATED_ON' | 'REGISTERED_TO_BVN';

export type EntityArchetype = 'retail' | 'sme_merchant' | 'pos_agent' | 'corporate';

export interface RiskFactor {
  factor: string;
  points: number;
  description: string;
}

export interface TransactionRecord {
  id: string;
  timestamp: string; // ISO string
  sourceId: string;
  sourceName?: string;
  targetId: string;
  targetName?: string;
  amount: number;
  rail: PaymentRail;
  deviceId?: string;
  bvn?: string;
  bankName?: string;
  merchantType?: string;
  narration?: string;
}

export interface EntityNode {
  id: string;
  label: string;
  type: EntityType;
  riskScore: number;
  archetype?: EntityArchetype;
  isFrozen?: boolean;
  riskBreakdown?: RiskFactor[];
  // Computed metrics from real algorithms
  metrics: {
    totalInflow: number;
    totalOutflow: number;
    inDegree: number;
    outDegree: number;
    netRetentionRatio: number;
    connectedDeviceIds: string[];
    associatedBvns: string[];
    isInCycle: boolean;
    cycleLength?: number;
    clusterId?: string;
  };
  // Graph visual coordinates
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPinned?: boolean;
}

export interface EntityEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  rail: PaymentRail;
  timestamp: string;
  isHighRisk?: boolean;
  typology?: 'circular' | 'dispersion' | 'fan_out' | 'device_link' | 'bvn_link';
  relationType?: EdgeRelationType;
}

export interface SyndicateCluster {
  id: string;
  code: string;
  name: string;
  typology: 'circular' | 'dispersion' | 'fan_out' | 'shared_device';
  riskScore: number;
  nodeIds: string[];
  edgeIds: string[];
  totalExposure: number;
  cycleLength?: number;
  timeVelocityMinutes?: number;
  sharedHardware?: string[];
  narrative: string;
  indicators: string[];
  recommendedAction: string;
}

export interface DetectionResults {
  nodes: EntityNode[];
  edges: EntityEdge[];
  clusters: SyndicateCluster[];
  metrics: {
    totalTransactions: number;
    totalVolume: number;
    highRiskNodesCount: number;
    detectedSyndicatesCount: number;
    processingTimeMs: number;
    algorithmUsed: string;
  };
}
