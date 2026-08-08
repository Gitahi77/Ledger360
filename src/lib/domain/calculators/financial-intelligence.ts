import type { CategoryAnalyticsDTO } from '@/lib/queries/analytics';
import type { IntelligenceModuleOutput, Observation, Insight, TimelineEvent, RiskResult, ForecastResult } from '@/lib/types/intelligence';

export interface FinancialMetrics {
  executiveSummary: {
    healthScore: number;
    healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
    savingsRate: number;
    savingsRateChange: number;
    netCashFlow: number;
    netCashFlowChange: number;
    income: number;
    incomeChange: number;
    expenses: number;
    expensesChange: number;
  };
  behaviourAnalysis: {
    cashFlowTrend: 'Expanding' | 'Contracting' | 'Stable';
    incomeTrend: 'Rising' | 'Falling' | 'Stable';
    expenseTrend: 'Rising' | 'Falling' | 'Stable';
    netSavingsTrend: 'Rising' | 'Falling' | 'Stable';
    largestPositiveChange: string;
    largestNegativeChange: string;
    topGrowingCategory: string | null;
    topShrinkingCategory: string | null;
  };
  deepAnalytics: {
    rollingAverages: {
      income6Mo: number;
      expenses6Mo: number;
      savings6Mo: number;
    };
    categoryConcentration: {
      name: string;
      percentage: number;
      isHigh: boolean;
    }[];
    monthlyVariance: {
      incomeVariance: number;
      expenseVariance: number;
      status: 'Stable' | 'Variable' | 'Highly Volatile';
    };
  };
}

export type FinancialIntelligenceDTO = IntelligenceModuleOutput<FinancialMetrics>;

// Input Types mapped from query layer
export type MonthlyTrendData = {
  label: string;
  Income: number;
  Expenses: number;
  Savings: number;
  DebtRepayment: number;
};

export type ReportSummaryData = {
  income: number;
  expenses: number;
  savings: number;
  debtRepayment: number;
  netCashFlow: number;
  savingRate: number;
  previous: {
    income: number;
    expenses: number;
    savings: number;
    debtRepayment: number;
    netCashFlow: number;
    savingRate: number;
    incomeChange: number;
    expensesChange: number;
    savingsChange: number;
    debtRepaymentChange: number;
    netCashFlowChange: number;
    savingRateChange: number;
  };
};

function calculateTrend(values: number[]): 'Rising' | 'Falling' | 'Stable' {
  if (values.length < 2) return 'Stable';
  
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  const mean = sumY / n;
  if (mean === 0) return 'Stable';
  
  const normalizedSlope = slope / mean;

  if (normalizedSlope > 0.05) return 'Rising';
  if (normalizedSlope < -0.05) return 'Falling';
  return 'Stable';
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return (stdDev / mean) * 100;
}

export function generateFinancialIntelligence(
  monthlyTrend: MonthlyTrendData[],
  summary: ReportSummaryData,
  categoryAnalytics: CategoryAnalyticsDTO[]
): FinancialIntelligenceDTO {
  
  const incomes = monthlyTrend.map(t => t.Income);
  const expenses = monthlyTrend.map(t => t.Expenses);
  const savings = monthlyTrend.map(t => t.Savings);
  
  const income6Mo = incomes.reduce((a, b) => a + b, 0) / (incomes.length || 1);
  const expenses6Mo = expenses.reduce((a, b) => a + b, 0) / (expenses.length || 1);
  const savings6Mo = savings.reduce((a, b) => a + b, 0) / (savings.length || 1);

  const incomeVariance = calculateVariance(incomes);
  const expenseVariance = calculateVariance(expenses);
  const varianceStatus = expenseVariance > 30 ? 'Highly Volatile' : expenseVariance > 15 ? 'Variable' : 'Stable';

  const incomeTrend = calculateTrend(incomes);
  const expenseTrend = calculateTrend(expenses);
  const netSavingsTrend = calculateTrend(savings);
  
  const cashFlowTrend = summary.netCashFlow > summary.previous.netCashFlow 
    ? 'Expanding' 
    : (summary.netCashFlow < summary.previous.netCashFlow ? 'Contracting' : 'Stable');

  let largestPositiveChange = 'No significant positive changes';
  let largestNegativeChange = 'No significant negative changes';
  
  const changes = [
    { name: 'Income', change: summary.previous.incomeChange, amountDiff: summary.income - summary.previous.income, isGoodIfPositive: true },
    { name: 'Expenses', change: summary.previous.expensesChange, amountDiff: summary.expenses - summary.previous.expenses, isGoodIfPositive: false },
    { name: 'Savings', change: summary.previous.savingsChange, amountDiff: summary.savings - summary.previous.savings, isGoodIfPositive: true },
  ].filter(c => c.amountDiff !== 0);

  let bestImpact = 0;
  let worstImpact = 0;

  for (const c of changes) {
    const impact = c.isGoodIfPositive ? c.amountDiff : -c.amountDiff;
    
    if (impact > bestImpact) {
      bestImpact = impact;
      const direction = c.amountDiff > 0 ? 'increased' : 'dropped';
      largestPositiveChange = `${c.name} ${direction} by ${Math.abs(c.change)}%`;
    }
    
    if (impact < worstImpact) {
      worstImpact = impact;
      const direction = c.amountDiff > 0 ? 'increased' : 'dropped';
      largestNegativeChange = `${c.name} ${direction} by ${Math.abs(c.change)}%`;
    }
  }

  let topGrowingCategory = null;
  let topShrinkingCategory = null;

  if (categoryAnalytics.length > 0) {
    const sortedByVelocity = [...categoryAnalytics].sort((a, b) => b.monthOverMonthChangePct - a.monthOverMonthChangePct);
    if (sortedByVelocity[0].monthOverMonthChangePct > 10) {
      topGrowingCategory = sortedByVelocity[0].name;
    }
    const sortedByDrop = [...categoryAnalytics].sort((a, b) => a.monthOverMonthChangePct - b.monthOverMonthChangePct);
    if (sortedByDrop[0].monthOverMonthChangePct < -10 && sortedByDrop[0].totalSixMonthSpendMinor > 0) {
      topShrinkingCategory = sortedByDrop[0].name;
    }
  }

  const total6MoSpend = categoryAnalytics.reduce((sum, cat) => sum + cat.totalSixMonthSpendMinor, 0);
  const categoryConcentration = [...categoryAnalytics]
    .sort((a, b) => b.totalSixMonthSpendMinor - a.totalSixMonthSpendMinor)
    .slice(0, 3)
    .map(cat => {
      const percentage = total6MoSpend > 0 ? (cat.totalSixMonthSpendMinor / total6MoSpend) * 100 : 0;
      return {
        name: cat.name,
        percentage: Math.round(percentage),
        isHigh: percentage > 30
      };
    });

  let healthScore = 50;
  
  healthScore += Math.min(25, (summary.savingRate / 20) * 25);
  
  if (summary.netCashFlow > 0) healthScore += 15;
  else if (summary.netCashFlow === 0) healthScore += 5;
  else healthScore -= 10;

  if (expenseVariance < 15) healthScore += 10;
  else if (expenseVariance < 30) healthScore += 5;

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  
  let healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' = 'Fair';
  if (healthScore >= 80) healthStatus = 'Excellent';
  else if (healthScore >= 60) healthStatus = 'Good';
  else if (healthScore >= 40) healthStatus = 'Fair';
  else healthStatus = 'Needs Attention';

  const metrics: FinancialMetrics = {
    executiveSummary: {
      healthScore,
      healthStatus,
      savingsRate: summary.savingRate,
      savingsRateChange: summary.previous.savingRateChange,
      netCashFlow: summary.netCashFlow,
      netCashFlowChange: summary.previous.netCashFlowChange,
      income: summary.income,
      incomeChange: summary.previous.incomeChange,
      expenses: summary.expenses,
      expensesChange: summary.previous.expensesChange,
    },
    behaviourAnalysis: {
      cashFlowTrend,
      incomeTrend,
      expenseTrend,
      netSavingsTrend,
      largestPositiveChange,
      largestNegativeChange,
      topGrowingCategory,
      topShrinkingCategory,
    },
    deepAnalytics: {
      rollingAverages: {
        income6Mo,
        expenses6Mo,
        savings6Mo,
      },
      categoryConcentration,
      monthlyVariance: {
        incomeVariance,
        expenseVariance,
        status: varianceStatus,
      }
    }
  };

  const observations: Observation[] = [];
  const insights: Insight[] = [];
  const timeline: TimelineEvent[] = [];

  if (summary.savingRate > 0 && summary.savingRate > summary.previous.savingRate) {
    observations.push({
      id: 'obs-savings-rate-improved',
      type: 'savings_rate',
      description: `Savings rate improved to ${summary.savingRate}%`
    });
  }

  if (summary.netCashFlow < 0) {
    observations.push({
      id: 'obs-cashflow-negative',
      type: 'cash_flow',
      description: 'Cash flow is currently negative.'
    });
  }

  if (expenseTrend === 'Rising') {
    insights.push({
      id: 'insight-expenses-rising',
      type: 'expense_trend',
      explanation: 'Expenses have been consistently rising over the past months.'
    });
  }

  return {
    module: 'Reports',
    metrics,
    observations,
    insights,
    timeline,
    risks: {},
    forecasts: {}
  };
}
