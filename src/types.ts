export type EntityType = 'account' | 'device' | 'beneficiary' | 'identity' | 'hub';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  risk: RiskLevel;
  x: number;
  y: number;
  score?: number;
  meta?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: string;
  isHighRisk?: boolean;
  type?: 'dispersion' | 'fan_out' | 'circular' | 'device_link';
}

export interface FraudTypology {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  investigationNote: string;
  indicators: string[];
  metrics: { label: string; value: string }[];
}

export interface CoreCapability {
  id: string;
  number: string;
  title: string;
  description: string;
  features: string[];
  output: string;
}

export interface CaseDossier {
  caseId: string;
  networkName: string;
  riskScore: number;
  exposureAmount: string;
  flaggedDate: string;
  entitiesResolved: number;
  devicesShared: number;
  nexusCountry: string;
  narrative: string;
  findings: string[];
  regulatoryAction: string;
}
