export interface AdvisorResult {
  priority: number;
  title: string;
  explanation: string;
  recommendation: string | null;
  confidence: number;
}

export type ObservationData = 
  | { transactionId: string; amount: any; reason: string }
  | { category: string }
  | { reason: string }
  | Record<string, unknown>;

export interface Observation {
  id: string;
  type: string;
  description: string;
  data?: ObservationData;
}

export type InsightData = Record<string, unknown>;

export interface Insight {
  id: string;
  type: string;
  explanation: string;
  data?: InsightData;
}

export interface EvaluationResult {
  severity: number;
  confidence: number;
  urgency: number;
  financialImpact: number;
  recurrence: number;
  stability: number;
}

export interface EvaluatedItem<T> {
  item: T;
  evaluation: EvaluationResult;
}

export interface Recommendation {
  id: string;
  evaluation: EvaluationResult;
  text: string;
  evidenceIds: string[];
  confidence: number;
  generatedBy: string;
}

export type TimelineEventType = 
  | 'SALARY_RECEIVED'
  | 'INCOME_RECEIVED'
  | 'LARGE_EXPENSE'
  | 'CATEGORY_SURGE'
  | 'CATEGORY_RECOVERY'
  | 'TRANSFER'
  | 'SAVINGS_DEPOSIT'
  | 'LOAN_PAYMENT'
  | 'BILL_PAYMENT'
  | 'SUBSCRIPTION_RENEWED'
  | 'UNUSUAL_ACTIVITY'
  | 'MILESTONE'
  | 'GOAL_PROGRESS';

export interface BaseTimelineEvent {
  id: string;
  date: string;
  title: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export type TimelineEvent = 
  | (BaseTimelineEvent & { type: 'LARGE_EXPENSE' | 'SALARY_RECEIVED' | 'INCOME_RECEIVED'; data: { description: string; amount: any } })
  | (BaseTimelineEvent & { type: 'CATEGORY_SURGE' | 'CATEGORY_RECOVERY'; data: { description: string; category?: string } })
  | (BaseTimelineEvent & { type: 'TRANSFER' | 'SAVINGS_DEPOSIT' | 'LOAN_PAYMENT' | 'BILL_PAYMENT' | 'SUBSCRIPTION_RENEWED' | 'UNUSUAL_ACTIVITY' | 'MILESTONE' | 'GOAL_PROGRESS'; data: { description: string; [key: string]: unknown } });

export interface ForecastResult {
  next7Days?: any;
  next30Days?: any;
  expectedCashflow?: any;
  confidenceBand?: number;
}

export interface RiskResult {
  overdraftRisk?: number | null;
  overspendingRisk?: number | null;
  savingsRisk?: number | null;
}

export interface IntelligenceModuleOutput<TMetrics = unknown> {
  module: string;
  metrics: TMetrics;
  observations: Observation[];
  insights: Insight[];
  risks: RiskResult;
  forecasts: ForecastResult;
  timeline: TimelineEvent[];
}

export interface OSIntelligenceDTO {
  pipelineVersion: 'v1';
  advisor: AdvisorResult | null;
  risks: RiskResult;
  forecasts: ForecastResult;
  recommendations: Recommendation[];
  insights: Insight[];
  timeline: TimelineEvent[];
}
