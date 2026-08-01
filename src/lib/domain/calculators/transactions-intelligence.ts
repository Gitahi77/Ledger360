import { toMajor } from '@/lib/money';
import type { MoneyDTO } from '@/lib/types/domain';
import type { 
  TransactionSnapshot, 
  TransactionsIntelligenceDTO, 
  IntelligenceMetrics,
} from '@/lib/types/transactions-intelligence';
import type { Observation, Insight, Recommendation, TimelineEvent } from '@/lib/types/intelligence';
import { assignPriority } from '../intelligence/priority-engine';
import { generateAdvisorNote } from '../intelligence/advisor-engine';
import { BehaviourThresholds } from '../intelligence/behaviour-thresholds';

function createMoney(amountMinor: number): MoneyDTO {
  return { amountMinor, currency: 'KES' };
}

export function generateTransactionsIntelligence(transactions: TransactionSnapshot[], periodDays: number = 30): TransactionsIntelligenceDTO {
  const metrics = calculateMetrics(transactions, periodDays);

  const observations: Observation[] = [];
  const insights: Insight[] = [];
  const actions: Recommendation[] = [];
  const timeline: TimelineEvent[] = [];

  observations.push(...analyzeOutliers(transactions, metrics));
  observations.push(...analyzeMerchants(transactions));
  observations.push(...analyzeRhythm(transactions));
  
  const categoryInsights = analyzeCategoryMomentum(transactions);
  observations.push(...categoryInsights.observations);
  insights.push(...categoryInsights.insights);
  actions.push(...categoryInsights.actions);

  const cashFlowInsights = analyzeCashFlow(transactions, metrics);
  insights.push(...cashFlowInsights.insights);
  actions.push(...cashFlowInsights.actions);

  timeline.push(...generateTimelineEvents(transactions, metrics));

  const advisor = generateAdvisorNote(observations, insights, actions, metrics.transactionCount);

  return {
    advisor,
    metrics,
    behaviour: observations,
    insights,
    actions,
    timeline,
    visualizations: generateVisualizations(transactions, periodDays),
    forecast: null,
    risk: null
  };
}

function calculateMetrics(transactions: TransactionSnapshot[], periodDays: number): IntelligenceMetrics {
  let expensesMinor = 0;
  let incomeMinor = 0;
  let largestExp: TransactionSnapshot | null = null;
  let largestInc: TransactionSnapshot | null = null;

  for (const t of transactions) {
    if (t.type === 'expense') {
      expensesMinor += t.baseMoney.amountMinor;
      if (!largestExp || t.baseMoney.amountMinor > largestExp.baseMoney.amountMinor) {
        largestExp = t;
      }
    } else if (t.type === 'income') {
      incomeMinor += t.baseMoney.amountMinor;
      if (!largestInc || t.baseMoney.amountMinor > largestInc.baseMoney.amountMinor) {
        largestInc = t;
      }
    }
  }

  const netCashFlowMinor = incomeMinor - expensesMinor;
  const avgSpendMinor = transactions.filter(t => t.type === 'expense').length > 0 
    ? Math.floor(expensesMinor / transactions.filter(t => t.type === 'expense').length) 
    : 0;

  return {
    netCashFlow: createMoney(netCashFlowMinor),
    totalExpenses: createMoney(expensesMinor),
    totalIncome: createMoney(incomeMinor),
    largestExpense: largestExp,
    largestIncome: largestInc,
    averageSpend: createMoney(avgSpendMinor),
    transactionCount: transactions.length,
    averageTransactionsPerDay: periodDays > 0 ? Number((transactions.length / periodDays).toFixed(1)) : transactions.length
  };
}

function analyzeOutliers(transactions: TransactionSnapshot[], metrics: IntelligenceMetrics): Observation[] {
  const observations: Observation[] = [];
  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length < BehaviourThresholds.minTransactionsForOutliers) return observations;

  const avg = metrics.averageSpend.amountMinor;
  const variance = expenses.reduce((sum, t) => sum + Math.pow(t.baseMoney.amountMinor - avg, 2), 0) / expenses.length;
  const stdDev = Math.sqrt(variance);

  expenses.forEach(t => {
    if (t.baseMoney.amountMinor > avg + (stdDev * BehaviourThresholds.outlierStdDev) && t.baseMoney.amountMinor > 0) {
      observations.push({
        id: `outlier-${t.id}`,
        priority: assignPriority('outlier'),
        type: 'outlier',
        description: `Unusually large transaction: ${t.name}`,
        confidence: 0.95,
        data: { transactionId: t.id, amount: t.baseMoney, reason: `${t.name} is significantly higher than your average spend of KES ${toMajor(avg)}.` }
      });
    }
  });

  return observations;
}

function analyzeMerchants(transactions: TransactionSnapshot[]): Observation[] {
  const observations: Observation[] = [];
  const expenses = transactions.filter(t => t.type === 'expense');
  const merchantCounts: Record<string, number> = {};
  const merchantTotals: Record<string, number> = {};
  
  let totalExpenseMinor = 0;

  expenses.forEach(t => {
    const name = t.name.trim().toLowerCase();
    merchantCounts[name] = (merchantCounts[name] || 0) + 1;
    merchantTotals[name] = (merchantTotals[name] || 0) + t.baseMoney.amountMinor;
    totalExpenseMinor += t.baseMoney.amountMinor;
  });

  if (totalExpenseMinor === 0) return observations;

  for (const [merchant, total] of Object.entries(merchantTotals)) {
    const percentage = total / totalExpenseMinor;
    if (percentage > BehaviourThresholds.categoryConcentration && merchantCounts[merchant] > 1) {
      observations.push({
        id: `merchant-concentration-${merchant}`,
        priority: assignPriority('concentration'),
        type: 'concentration',
        description: `${Math.round(percentage * 100)}% of your expenses came from ${merchant}.`,
        confidence: 0.9,
        data: { reason: `Concentrated spending at one merchant increases reliance.` }
      });
    }
  }

  return observations;
}

function analyzeRhythm(transactions: TransactionSnapshot[]): Observation[] {
  const observations: Observation[] = [];
  if (transactions.length < BehaviourThresholds.minTransactionsForRhythm) return observations;

  const dayCounts = { weekend: 0, weekday: 0 };
  transactions.forEach(t => {
    const d = new Date(t.date);
    const day = d.getDay();
    if (day === 0 || day === 6) dayCounts.weekend++;
    else dayCounts.weekday++;
  });

  if (dayCounts.weekend > dayCounts.weekday * BehaviourThresholds.weekendDominationMultiplier) {
    observations.push({
      id: 'rhythm-weekend',
      priority: assignPriority('rhythm'),
      type: 'rhythm',
      description: 'Your spending is heavily concentrated on weekends.',
      confidence: 0.85
    });
  }

  return observations;
}

function analyzeCategoryMomentum(transactions: TransactionSnapshot[]) {
  const observations: Observation[] = [];
  const insights: Insight[] = [];
  const actions: Recommendation[] = [];

  const expenses = transactions.filter(t => t.type === 'expense' && t.category);
  const categoryTotals: Record<string, number> = {};
  let maxCat = '';
  let maxAmount = 0;

  expenses.forEach(t => {
    const cat = t.category!.name;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.baseMoney.amountMinor;
    if (categoryTotals[cat] > maxAmount) {
      maxAmount = categoryTotals[cat];
      maxCat = cat;
    }
  });

  if (maxCat && maxAmount > 0) {
    observations.push({
      id: `cat-concentration`,
      priority: assignPriority('concentration'),
      type: 'concentration',
      description: `Spending concentrated in ${maxCat}`,
      confidence: 0.9,
      data: { category: maxCat }
    });
    
    insights.push({
      id: `insight-cat-${maxCat}`,
      priority: assignPriority('reliance'),
      type: 'reliance',
      explanation: `You're relying heavily on ${maxCat} this period.`,
      confidence: 0.88
    });

    if (maxCat.toLowerCase() === 'dining' || maxCat.toLowerCase() === 'entertainment') {
      actions.push({
        id: `action-reduce-${maxCat}`,
        priority: assignPriority('reliance'),
        directive: `Review ${maxCat} spending.`,
        reason: `${maxCat} is your largest expense category right now.`,
        confidence: 0.9,
        impact: 'high'
      });
    }
  }

  return { observations, insights, actions };
}

function analyzeCashFlow(transactions: TransactionSnapshot[], metrics: IntelligenceMetrics) {
  const insights: Insight[] = [];
  const actions: Recommendation[] = [];

  if (metrics.totalExpenses.amountMinor > metrics.totalIncome.amountMinor && metrics.totalIncome.amountMinor > 0) {
    insights.push({
      id: 'cashflow-negative',
      priority: assignPriority('cash_flow_risk'),
      type: 'acceleration',
      explanation: 'Expenses are accelerating faster than income.',
      confidence: 0.95
    });
    actions.push({
      id: 'action-delay-purchases',
      priority: assignPriority('cash_flow_risk'),
      directive: 'Delay discretionary purchases.',
      reason: 'You are currently running a negative cash flow.',
      confidence: 0.95,
      impact: 'high'
    });
  }

  return { insights, actions };
}

function generateTimelineEvents(transactions: TransactionSnapshot[], metrics: IntelligenceMetrics): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  if (metrics.largestExpense) {
    events.push({
      id: `timeline-exp-${metrics.largestExpense.id}`,
      date: metrics.largestExpense.date,
      type: 'LARGE_EXPENSE',
      title: 'Largest Purchase',
      severity: 'warning',
      data: {
        description: metrics.largestExpense.name,
        amount: metrics.largestExpense.baseMoney
      }
    });
  }

  if (metrics.largestIncome) {
    events.push({
      id: `timeline-inc-${metrics.largestIncome.id}`,
      date: metrics.largestIncome.date,
      type: 'SALARY_RECEIVED',
      title: 'Significant Income',
      severity: 'success',
      data: {
        description: metrics.largestIncome.name,
        amount: metrics.largestIncome.baseMoney
      }
    });
  }
  
  // Create timeline events for the category surge if present
  const categoryObservations = analyzeCategoryMomentum(transactions).observations;
  if (categoryObservations.length > 0) {
      const catObs = categoryObservations[0];
      events.push({
        id: `timeline-cat-surge`,
        date: new Date().toISOString(), // In reality we'd tie this to a specific day or latest transaction
        type: 'CATEGORY_SURGE',
        title: 'Category Surge',
        severity: 'warning',
        data: {
          description: catObs.description,
          category: (catObs.data && 'category' in catObs.data) ? catObs.data.category as string : undefined
        }
      });
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateVisualizations(transactions: TransactionSnapshot[], periodDays: number) {
  const dailySpendMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const d = t.date.split('T')[0];
    dailySpendMap[d] = (dailySpendMap[d] || 0) + t.baseMoney.amountMinor;
  });

  const rollingDailySpend = Object.keys(dailySpendMap).sort().map(date => ({
    date,
    amount: createMoney(dailySpendMap[date])
  }));

  return {
    rollingDailySpend
  };
}
