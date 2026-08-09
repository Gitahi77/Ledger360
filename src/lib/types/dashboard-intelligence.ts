export type DashboardIntelligenceDTO = {
  // Global state
  dashboardState: 'ready' | 'onboarding' | 'partial';

  // 1. Where do I stand? (Source: Accounts)
  currentPosition: {
    totalCashMinor: number;
    currency: string; // Guaranteed by the Intelligence Engine to be the user's normalized reporting currency
  };

  dataFreshness: {
    status: 'fresh' | 'stale'; // Backend determines staleness (e.g., >24h sync delay)
    lastUpdated: string; // ISO-8601
  };

  // Guardrail: Safe to Spend (Source: Intelligence Engine)
  safeToSpend: {
    amountMinor: number | null; // null if uncalculatable (e.g., missing history)
    currency: string;
    status: 'available' | 'insufficient_data' | 'stale';
    reasoning: string; // Explains the math to the user (Trust Layer)
  };

  // 2. Is it healthy? (Source: Transactions)
  trajectory: {
    netFlow30DaysMinor: number;
    trend: 'improving' | 'stable' | 'deteriorating';
  };

  // Vital Signs Metrics (Source: Aggregated by Orchestrator)
  // Must provide 4 explicit KPIs for the 2x2 grid.
  vitalSigns: {
    totalCashMinor: number;
    netFlow30DaysMinor: number;
    burnRatePercentage: number | null;
    monthToDateSavingsMinor: number | null;
  };

  // 3, 4 & 7. Attention & Action (Source: Orchestrator)
  // MUST BE GUARANTEED: Returned in descending priority order. index[0] is the most urgent.
  // GUARDRAIL: The frontend must render the supplied order and must not re-sort, score, merge, or reinterpret attention items.
  attentionItems: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    domainSource: 'budgets' | 'accounts' | 'transactions' | 'loans';
    actionableLink?: string; // Deep-link to resolve the issue
  }>;

  // 5. What's next? (Source: Orchestrator / Transactions)
  upcomingObligations: Array<{
    id: string;
    dueDate: string; // ISO-8601
    amountMinor: number;
    merchantName: string;
    confidencePercentage: number; // 0-100
  }>;

  // 6. Am I on track? (Source: Budgets & Goals)
  planHealth: {
    activeBudgetsCount: number;
    budgetsOnTrack: number;
    overallPacingPercentage: number; // e.g., 85 (meaning 15% under budget)
  } | null; // null if user hasn't set up planning features

  // The Hero Briefing
  briefing: {
    greeting: string;
    primaryInsight: string;
  };
};
