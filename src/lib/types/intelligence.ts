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
  priority: number;
  type: string;
  description: string;
  confidence: number;
  data?: ObservationData;
}

export type InsightData = Record<string, unknown>;

export interface Insight {
  id: string;
  priority: number;
  type: string;
  explanation: string;
  confidence: number;
  data?: InsightData;
}

export interface Recommendation {
  id: string;
  priority: number;
  directive: string;
  reason: string;
  confidence: number;
  impact?: 'high' | 'medium' | 'low';
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
}

export interface RiskResult {
  overdraftRisk?: number | null;
  overspendingRisk?: number | null;
  savingsRisk?: number | null;
}

export interface IntelligenceModule<
  TMetrics,
  TBehaviour,
  TInsight,
  TAction,
  TTimeline = TimelineEvent[],
  TForecast = ForecastResult | null,
  TRisk = RiskResult | null
> {
  advisor: AdvisorResult | null;
  metrics: TMetrics;
  behaviour: TBehaviour;
  insights: TInsight[];
  actions: TAction[];
  timeline: TTimeline;
  forecast: TForecast;
  risk: TRisk;
}
