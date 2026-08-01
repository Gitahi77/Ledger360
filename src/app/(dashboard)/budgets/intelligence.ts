import { BudgetUsageResult, BudgetPacingResult, calculateBudgetHealthScore } from '@/lib/domain/calculators/budget-engine';
import { formatCurrency } from '@/lib/finance/formatCurrency';

export interface BudgetWithPacing extends BudgetUsageResult {
  name: string;
  category: string;
  icon: string;
  pacing: BudgetPacingResult;
}

export interface BudgetIntelligenceResult {
  advisorNote: {
    narrative: string;
    status: 'neutral' | 'positive' | 'warning' | 'negative';
  };
  healthScore: number;
}

export function generateBudgetIntelligence(
  budgets: BudgetWithPacing[],
  currency: string
): BudgetIntelligenceResult {
  // Extract pacing map for the health score calculator
  const pacingMap: Record<string, BudgetPacingResult> = {};
  budgets.forEach(b => { pacingMap[b.id] = b.pacing; });

  const healthScore = calculateBudgetHealthScore(budgets, pacingMap);

  if (budgets.length === 0) {
    return {
      healthScore: 100,
      advisorNote: {
        narrative: "You haven't set up any budgets yet. Create your first budget to start pacing your spending.",
        status: 'neutral',
      },
    };
  }

  // Find the budget that needs the most attention
  const exceededBudgets = budgets.filter(b => b.status === 'exceeded');
  const criticalBudgets = budgets.filter(b => b.status === 'critical');
  const warningBudgets = budgets.filter(b => b.status === 'warning');
  
  // Find budgets pacing ahead of schedule but not yet in warning
  const pacingAheadBudgets = budgets.filter(b => b.pacing.isAheadOfSchedule && b.status === 'healthy');

  let narrative = '';
  let status: 'neutral' | 'positive' | 'warning' | 'negative' = 'positive';

  if (exceededBudgets.length > 0) {
    // Actionable advice for exceeded budgets
    const worst = exceededBudgets.sort((a, b) => (b.spent - b.limit) - (a.spent - a.limit))[0];
    const overSpend = worst.spent - worst.limit;
    
    // Calculate remaining allocation in other healthy budgets
    const healthyBudgets = budgets.filter(b => b.status === 'healthy');
    const remainingAvailable = healthyBudgets.reduce((sum, b) => sum + (b.limit - b.spent), 0);

    const formattedOver = formatCurrency({ amountMinor: overSpend, currency }, { precision: 0 });
    const formattedRemaining = formatCurrency({ amountMinor: remainingAvailable, currency }, { precision: 0 });

    if (remainingAvailable >= overSpend) {
      narrative = `${worst.name} has exceeded its limit by ${formattedOver}. Remaining budgets still have ${formattedRemaining} available.`;
    } else {
      narrative = `${worst.name} has exceeded its limit by ${formattedOver}. Review your spending immediately.`;
    }
    status = 'negative';
  } else if (criticalBudgets.length > 0 || warningBudgets.length > 0) {
    const atRisk = [...criticalBudgets, ...warningBudgets].sort((a, b) => b.percentage - a.percentage)[0];
    const pacing = atRisk.pacing;
    
    if (pacing && pacing.isAheadOfSchedule) {
      // Find out how much they need to reduce
      const overPacedAmount = Math.round(atRisk.limit * pacing.pacingVariancePercent);
      const formattedReduce = formatCurrency({ amountMinor: overPacedAmount, currency }, { precision: 0 });
      narrative = `${atRisk.name} is spending faster than planned. Reducing this period's spend by ${formattedReduce} keeps you on target.`;
    } else {
      narrative = `${atRisk.name} is nearing its limit, but pacing is stable. Monitor closely.`;
    }
    status = 'warning';
  } else if (pacingAheadBudgets.length > 0) {
    const worstPacing = pacingAheadBudgets.sort((a, b) => b.pacing.pacingVariancePercent - a.pacing.pacingVariancePercent)[0];
    narrative = `${worstPacing.name} is trending ahead of schedule. Slowing down now will ensure you stay within your limit.`;
    status = 'warning';
  } else {
    narrative = "You're on track. At your current pace, all budgets should finish within plan.";
    status = 'positive';
  }

  return {
    advisorNote: { narrative, status },
    healthScore,
  };
}
