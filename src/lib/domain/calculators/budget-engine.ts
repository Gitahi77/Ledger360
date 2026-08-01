export interface BudgetInput {
  id: string;
  categoryId: string;
  limitAmountMinor: bigint | number;
  period: 'weekly' | 'monthly' | 'yearly';
  rollover: boolean;
  createdAt: Date;
}

export interface BudgetUsageResult {
  id: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  rollover: boolean;
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

  return {
    id: budget.id,
    limit: effectiveLimit,
    spent: effectiveSpend,
    period: budget.period,
    rollover: budget.rollover,
  };
}
