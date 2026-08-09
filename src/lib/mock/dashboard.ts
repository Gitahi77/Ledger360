import { DashboardIntelligenceDTO } from '../types/dashboard-intelligence';

export const mockDashboardIntelligence: DashboardIntelligenceDTO = {
  dashboardState: 'ready',
  currentPosition: {
    totalCashMinor: 45000000, // 450,000 KES
    currency: 'KES',
  },
  dataFreshness: {
    status: 'fresh',
    lastUpdated: new Date().toISOString(),
  },
  safeToSpend: {
    amountMinor: 31500000, // 315,000 KES
    currency: 'KES',
    status: 'available',
    reasoning: 'Calculated as total cash minus upcoming obligations (135,000 KES).',
  },
  trajectory: {
    netFlow30DaysMinor: 8500000, // 85,000 KES
    trend: 'improving',
  },
  vitalSigns: {
    totalCashMinor: 45000000,
    netFlow30DaysMinor: 8500000,
    burnRatePercentage: 65,
    monthToDateSavingsMinor: 1200000, // 12,000 KES
  },
  attentionItems: [
    {
      id: 'attention-1',
      severity: 'critical',
      message: 'Insurance payment of KES 135,000 due tomorrow.',
      domainSource: 'budgets',
      actionableLink: '?action=review_budget&id=insurance',
    },
    {
      id: 'attention-2',
      severity: 'warning',
      message: 'Dining Out budget is 90% consumed with 14 days left.',
      domainSource: 'budgets',
      actionableLink: '?action=review_budget&id=dining',
    },
  ],
  upcomingObligations: [
    {
      id: 'obs-1',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      amountMinor: 13500000, // 135,000 KES
      merchantName: 'Jubilee Insurance',
      confidencePercentage: 98,
    },
    {
      id: 'obs-2',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // In 5 days
      amountMinor: 450000, // 4,500 KES
      merchantName: 'Netflix',
      confidencePercentage: 100,
    },
  ],
  planHealth: {
    activeBudgetsCount: 5,
    budgetsOnTrack: 4,
    overallPacingPercentage: 85,
  },
  briefing: {
    greeting: 'Good morning, Eric.',
    primaryInsight: 'You are pacing 15% under budget this month. Strong progress on your savings goal.',
  },
};
