import { CategoryAnalyticsDTO } from '@/lib/queries/analytics';

export interface ReportsIntelligenceResult {
  advisorNote: {
    narrative: string;
    status: 'neutral' | 'positive' | 'warning' | 'negative';
  };
}

export function generateReportsIntelligence(
  categoryAnalytics: CategoryAnalyticsDTO[]
): ReportsIntelligenceResult {
  if (!categoryAnalytics || categoryAnalytics.length === 0) {
    return {
      advisorNote: {
        narrative: "You haven't tracked any expenses yet. Start adding transactions to get intelligent insights.",
        status: 'neutral',
      },
    };
  }

  const rising = categoryAnalytics.filter(c => c.trendLabel.includes('Rising'));
  const stable = categoryAnalytics.filter(c => c.trendLabel.includes('Stable') || c.volatilityLabel === 'Very Stable');
  const faster = categoryAnalytics.filter(c => c.velocityLabel === 'Spending faster than usual');
  const unstable = categoryAnalytics.filter(c => c.stabilityScore < 50);

  let narrative = '';
  let status: 'neutral' | 'positive' | 'warning' | 'negative' = 'positive';

  // Find the most critical insight based on hierarchy
  if (unstable.length > 0) {
    // Highest priority: Unstable, highly variable categories
    const worst = unstable.sort((a, b) => a.stabilityScore - b.stabilityScore)[0];
    narrative = `Your ${worst.name} spending is highly variable right now. Keep an eye on it to improve your cashflow predictability.`;
    status = 'warning';
  } else if (rising.length > 0 && faster.length > 0) {
    // Both rising trend and velocity
    const worst = rising.sort((a, b) => b.totalSixMonthSpendMinor - a.totalSixMonthSpendMinor)[0];
    narrative = `${worst.name} spending has increased for consecutive months and is pacing faster than usual.`;
    status = 'negative';
  } else if (rising.length > 0) {
    // Just a rising trend
    const worst = rising.sort((a, b) => b.totalSixMonthSpendMinor - a.totalSixMonthSpendMinor)[0];
    narrative = `${worst.name} spending has been trending upward. Consider setting a budget to curb this trend.`;
    status = 'warning';
  } else if (stable.length > 0) {
    // Good stability
    const best = stable.sort((a, b) => b.stabilityScore - a.stabilityScore)[0];
    narrative = `${best.name} remains your most predictable expense. Good job maintaining a stable baseline.`;
    status = 'positive';
  } else {
    narrative = "Your category spending remains balanced. No immediate action required.";
    status = 'positive';
  }

  return {
    advisorNote: { narrative, status },
  };
}
