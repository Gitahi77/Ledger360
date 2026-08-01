import type { CategoryAnalyticsDTO } from '@/lib/queries/analytics';

export interface FinancialIntelligenceDTO {
  advisor: {
    narrative: string;
    status: 'neutral' | 'positive' | 'warning' | 'negative';
  };
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
      incomeVariance: number; // Coefficient of Variation (CV) as percentage
      expenseVariance: number;
      status: 'Stable' | 'Variable' | 'Highly Volatile';
    };
  };
}

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
  
  // Simple linear regression slope
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Normalize slope against the mean
  const mean = sumY / n;
  if (mean === 0) return 'Stable';
  
  const normalizedSlope = slope / mean; // Percentage change per month on average

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
  
  // Return Coefficient of Variation (CV) as percentage
  return (stdDev / mean) * 100;
}

export function generateFinancialIntelligence(
  monthlyTrend: MonthlyTrendData[],
  summary: ReportSummaryData,
  categoryAnalytics: CategoryAnalyticsDTO[]
): FinancialIntelligenceDTO {
  
  // 1. Core Arrays for 6-Month Data
  const incomes = monthlyTrend.map(t => t.Income);
  const expenses = monthlyTrend.map(t => t.Expenses);
  const savings = monthlyTrend.map(t => t.Savings);
  
  // 2. Rolling Averages
  const income6Mo = incomes.reduce((a, b) => a + b, 0) / (incomes.length || 1);
  const expenses6Mo = expenses.reduce((a, b) => a + b, 0) / (expenses.length || 1);
  const savings6Mo = savings.reduce((a, b) => a + b, 0) / (savings.length || 1);

  // 3. Variance
  const incomeVariance = calculateVariance(incomes);
  const expenseVariance = calculateVariance(expenses);
  const varianceStatus = expenseVariance > 30 ? 'Highly Volatile' : expenseVariance > 15 ? 'Variable' : 'Stable';

  // 4. Trends
  const incomeTrend = calculateTrend(incomes);
  const expenseTrend = calculateTrend(expenses);
  const netSavingsTrend = calculateTrend(savings);
  
  const cashFlowTrend = summary.netCashFlow > summary.previous.netCashFlow 
    ? 'Expanding' 
    : (summary.netCashFlow < summary.previous.netCashFlow ? 'Contracting' : 'Stable');

  // 5. Largest Changes
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
    // A positive impact is an increase in Income/Savings, or a decrease in Expenses
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

  // 6. Category Analytics 
  // Growing / Shrinking
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

  // Concentration (Top 3 categories % of total expenses)
  const total6MoSpend = categoryAnalytics.reduce((sum, cat) => sum + cat.totalSixMonthSpendMinor, 0);
  const categoryConcentration = [...categoryAnalytics]
    .sort((a, b) => b.totalSixMonthSpendMinor - a.totalSixMonthSpendMinor)
    .slice(0, 3)
    .map(cat => {
      const percentage = total6MoSpend > 0 ? (cat.totalSixMonthSpendMinor / total6MoSpend) * 100 : 0;
      return {
        name: cat.name,
        percentage: Math.round(percentage),
        isHigh: percentage > 30 // E.g., if one category is > 30% of total spend, it's highly concentrated
      };
    });

  // 7. Health Score (0-100)
  // Baseline = 50. 
  // +25 for good savings rate (>20%). 
  // +15 for positive cash flow. 
  // +10 for stable expenses (low variance).
  let healthScore = 50;
  
  // Savings Rate Contribution (up to 25 points)
  // 0% -> 0 pts, 20% -> 25 pts, >20% -> 25 pts
  healthScore += Math.min(25, (summary.savingRate / 20) * 25);
  
  // Cash Flow Contribution (up to 15 points)
  if (summary.netCashFlow > 0) healthScore += 15;
  else if (summary.netCashFlow === 0) healthScore += 5;
  else healthScore -= 10; // Penalty for negative cash flow

  // Expense Stability Contribution (up to 10 points)
  if (expenseVariance < 15) healthScore += 10;
  else if (expenseVariance < 30) healthScore += 5;

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  
  let healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' = 'Fair';
  if (healthScore >= 80) healthStatus = 'Excellent';
  else if (healthScore >= 60) healthStatus = 'Good';
  else if (healthScore >= 40) healthStatus = 'Fair';
  else healthStatus = 'Needs Attention';

  // 8. Advisor Note Generation
  let narrative = '';
  let status: 'neutral' | 'positive' | 'warning' | 'negative' = 'neutral';

  if (summary.savingRate > 0 && summary.savingRate > summary.previous.savingRate && summary.netCashFlow > 0) {
    narrative = `Your savings rate improved to ${summary.savingRate}%. You are maintaining strong positive cash flow.`;
    status = 'positive';
  } else if (summary.netCashFlow < 0 && summary.previous.netCashFlow > 0) {
    narrative = `Your cash flow turned negative this month. Check your ${topGrowingCategory ? topGrowingCategory + ' ' : ''}spending, which has been growing.`;
    status = 'negative';
  } else if (summary.savingRate === 0 && summary.netCashFlow > 0) {
    narrative = `You have positive cash flow, but aren't actively saving. Consider setting up an automated transfer to savings.`;
    status = 'warning';
  } else if (topGrowingCategory && expenseTrend === 'Rising') {
    narrative = `Overall expenses are rising, largely driven by ${topGrowingCategory}. Watch this category closely.`;
    status = 'warning';
  } else if (expenseTrend === 'Falling' && summary.savingRate > 10) {
    narrative = `Great job reducing expenses. You're building healthy financial habits and a strong savings rate.`;
    status = 'positive';
  } else {
    narrative = `Your financial behaviour is stable. ${largestPositiveChange !== 'No significant positive changes' ? largestPositiveChange + '.' : ''}`;
    status = 'neutral';
  }

  return {
    advisor: {
      narrative,
      status
    },
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
}
