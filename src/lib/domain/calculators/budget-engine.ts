export interface BudgetInput {
  id: string;
  categoryId: string;
  limitAmountMinor: bigint | number;
  period: 'weekly' | 'monthly' | 'yearly';
  rollover: boolean;
  createdAt: Date;
}

export type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'exceeded';

export const BUDGET_THRESHOLDS = {
  WARNING: 0.8,
  CRITICAL: 1.0,
};

export function getBudgetStatus(percentage: number, spent: number, limit: number): BudgetStatus {
  if (spent > limit) return 'exceeded';
  if (spent === limit && limit > 0) return 'critical';
  if (percentage >= BUDGET_THRESHOLDS.WARNING) return 'warning';
  return 'healthy';
}

export interface BudgetUsageResult {
  id: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  rollover: boolean;
  status: BudgetStatus;
  percentage: number;
}

/**
 * Calculates effective budget limit and spend for a given period.
 * 
 * Invariants:
 * - Spending never exceeds reported spending (only sums txs).
 * - Rollover never creates money. Limit = baseLimit + (pastLimit - pastSpend).
 * - December -> January transition (handled by UTC math).
 * - Timezone boundary handled by shifting to Nairobi UTC+3.
 * - BigInt precision for money.
 */
export function calculateBudgetUsage(
  budget: BudgetInput,
  spendThisPeriodMap: Record<string, number>, // baseAmountMinor total for the current period by category
  rolloverSpendMap: Record<string, number>,   // baseAmountMinor total from createdAt up to end of period
  from: Date,
): BudgetUsageResult {
  const effectiveSpend = spendThisPeriodMap[budget.categoryId] ?? 0;
  let effectiveLimit = Number(budget.limitAmountMinor);

  if (budget.rollover) {
    let periodsExisted = 1;
    if (budget.createdAt < from) {
      const shiftToNairobi = (d: Date) => new Date(d.getTime() + 3 * 3600000);
      const bCreated = shiftToNairobi(budget.createdAt);
      const fromDate = shiftToNairobi(from);

      if (budget.period === 'monthly') {
        const m1 = bCreated.getUTCFullYear() * 12 + bCreated.getUTCMonth();
        const m2 = fromDate.getUTCFullYear() * 12 + fromDate.getUTCMonth();
        periodsExisted = Math.max(1, m2 - m1 + 1);
      } else if (budget.period === 'yearly') {
        periodsExisted = Math.max(1, fromDate.getUTCFullYear() - bCreated.getUTCFullYear() + 1);
      } else if (budget.period === 'weekly') {
        // Week starts on Monday? For now keep existing arithmetic
        periodsExisted = Math.max(1, Math.floor((from.getTime() - budget.createdAt.getTime()) / (7 * 86400000)) + 1);
      }
    }
    
    // total spent since budget creation
    const spendSinceCreated = rolloverSpendMap[budget.id] ?? 0; 
    const pastPeriods = periodsExisted - 1;
    
    const pastLimit = Number(budget.limitAmountMinor) * pastPeriods;
    const pastSpend = spendSinceCreated - effectiveSpend;
    
    const rolloverBalance = pastLimit - pastSpend;

    effectiveLimit = Number(budget.limitAmountMinor) + rolloverBalance;
  }

  const percentage = effectiveLimit > 0 ? (effectiveSpend / effectiveLimit) : (effectiveSpend > 0 ? 1.0 : 0);
  const status = getBudgetStatus(percentage, effectiveSpend, effectiveLimit);

  return {
    id: budget.id,
    limit: effectiveLimit,
    spent: effectiveSpend,
    period: budget.period,
    rollover: budget.rollover,
    status,
    percentage,
  };
}

export interface BudgetPacingResult {
  percentTimeElapsed: number;
  expectedSpend: number;
  isAheadOfSchedule: boolean;
  pacingVariancePercent: number; // Positive means ahead of schedule (bad), negative means behind (good)
}

/**
 * Calculates how spending is pacing relative to time elapsed in the period.
 * Assuming straight-line spending (which may not always be true, but is a useful proxy).
 */
export function calculateBudgetPacing(
  percentageSpent: number,
  periodStart: Date,
  periodEnd: Date,
  now: Date = new Date()
): BudgetPacingResult {
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const nowMs = now.getTime();

  let percentTimeElapsed = 0;
  if (nowMs >= endMs) {
    percentTimeElapsed = 1.0;
  } else if (nowMs > startMs) {
    percentTimeElapsed = (nowMs - startMs) / (endMs - startMs);
  }

  const expectedSpend = percentTimeElapsed;
  // Threshold of 5% variance before we flag it
  const pacingVariancePercent = percentageSpent - expectedSpend;
  const isAheadOfSchedule = pacingVariancePercent > 0.05 && percentageSpent > 0;

  return {
    percentTimeElapsed,
    expectedSpend,
    isAheadOfSchedule,
    pacingVariancePercent,
  };
}

/**
 * Calculates a portfolio health score (0-100) based on aggregate pacing and limits.
 */
export function calculateBudgetHealthScore(
  budgets: BudgetUsageResult[],
  pacingMap: Record<string, BudgetPacingResult>
): number {
  if (budgets.length === 0) return 100;

  let totalDeduction = 0;
  let totalWeight = 0;

  for (const b of budgets) {
    // Weight by limit size to avoid small budgets skewing the score, but give a minimum weight
    const weight = Math.max(b.limit, 100000); 
    totalWeight += weight;

    if (b.status === 'exceeded') {
      totalDeduction += 1.0 * weight; // 100% deduction for this budget's weight
    } else if (b.status === 'critical') {
      totalDeduction += 0.8 * weight;
    } else if (b.status === 'warning') {
      totalDeduction += 0.4 * weight;
    } else {
      const pacing = pacingMap[b.id];
      if (pacing && pacing.isAheadOfSchedule) {
        // Minor deduction for pacing ahead of schedule
        totalDeduction += 0.2 * weight;
      }
    }
  }

  const score = 100 - ((totalDeduction / totalWeight) * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}
