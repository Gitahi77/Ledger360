// src/lib/behavioral.ts
import { prisma } from '@/lib/prisma';
import { getLoansForUser } from './actions/loans';

export async function safeToSpend(userId: string, period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<{
  discretionaryMinor: number;
  remainingMinor: number;
  perDayMinor: number;
  daysLeft: number;
  breakdown: {
    expectedIncome: number;
    baseEnvelopeLimits: number;
    plannedSavings: number;
    loanDue: number;
    unbudgetedSpendThisPeriod: number;
    envelopeOverspendPenalty: number;
  };
}> {
  // 1. Establish period bounds
  const now = new Date();
  let from: Date, to: Date;
  
  if (period === 'monthly') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'weekly') {
    // Assuming Monday start
    const day = now.getDay() || 7; 
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(now.getDate() - day + 1);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else {
    // yearly
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  const daysLeftInPeriod = Math.max(1, Math.ceil((to.getTime() - now.getTime()) / 86400000));

  // 2. Fetch User Preferences
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  const savingRate = prefs?.savingRate ?? 30;

  // 3. Expected Income
  let expectedIncome = 0;
  if (period === 'monthly' && prefs?.expectedMonthlyIncomeMinor != null) {
    expectedIncome = prefs.expectedMonthlyIncomeMinor;
  } else {
    // Actual income recorded this period (fallback)
    const incomeRows = await prisma.transaction.aggregate({
      where: { userId, type: 'income', date: { gte: from, lte: to } },
      _sum: { baseAmountMinor: true }
    });
    expectedIncome = incomeRows._sum.baseAmountMinor ?? 0;
  }

  // 4. Planned Savings
  const plannedSavings = Math.floor(expectedIncome * (savingRate / 100));

  // 5. Loan Due
  const loans = await getLoansForUser(userId);
  let loanDue = 0;
  for (const l of loans) {
    if (l.nextDue >= from && l.nextDue <= to) {
      loanDue += l.monthlyPaymentMinor;
    }
  }

  // 6. Envelopes (Budgets)
  const budgets = await prisma.budget.findMany({
    where: { userId, period },
  });
  
  const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
  
  let baseEnvelopeLimits = 0;
  let envelopeOverspendPenalty = 0;

  // We need to fetch spending per budget category
  for (const b of budgets) {
    baseEnvelopeLimits += b.limitAmountMinor;
    
    // Spend this period
    const spendThisPeriodAgg = await prisma.transaction.aggregate({
      where: { userId, categoryId: b.categoryId, type: 'expense', date: { gte: from, lte: to } },
      _sum: { baseAmountMinor: true }
    });
    const envelopeSpend = spendThisPeriodAgg._sum.baseAmountMinor ?? 0;
    
    let envelopeEffectiveLimit = b.limitAmountMinor;

    if (b.rollover) {
      // For rollover=true, cumulative limit - cumulative spend since the budget was created
      // Note: we assume the budget limits were the same historically. To be perfectly accurate, 
      // we sum historical periods. But since we don't have historical budget limits stored, 
      // we approximate cumulative limit by: limit * (months since budget createdAt)
      // Wait, let's look at the exact budget creation date to find how many periods existed.
      let periodsExisted = 1;
      if (b.createdAt < from) {
        if (period === 'monthly') {
          const m1 = b.createdAt.getFullYear() * 12 + b.createdAt.getMonth();
          const m2 = from.getFullYear() * 12 + from.getMonth();
          periodsExisted = Math.max(1, m2 - m1 + 1);
        } else if (period === 'yearly') {
          periodsExisted = Math.max(1, from.getFullYear() - b.createdAt.getFullYear() + 1);
        } else if (period === 'weekly') {
          periodsExisted = Math.max(1, Math.floor((from.getTime() - b.createdAt.getTime()) / (7 * 86400000)) + 1);
        }
      }
      
      const cumulativeLimit = b.limitAmountMinor * periodsExisted;
      
      // Cumulative spend (from createdAt to this period's end)
      const cumulativeSpendAgg = await prisma.transaction.aggregate({
        where: { userId, categoryId: b.categoryId, type: 'expense', date: { gte: b.createdAt, lte: to } },
        _sum: { baseAmountMinor: true }
      });
      const cumulativeSpend = cumulativeSpendAgg._sum.baseAmountMinor ?? 0;
      
      // Overspend is max(0, cumulativeSpend - cumulativeLimit)
      envelopeOverspendPenalty += Math.max(0, cumulativeSpend - cumulativeLimit);
    } else {
      // Overspend is just this period
      envelopeOverspendPenalty += Math.max(0, envelopeSpend - envelopeEffectiveLimit);
    }
  }

  // 7. Unbudgeted Spend
  const unbudgetedAgg = await prisma.transaction.aggregate({
    where: { 
      userId, 
      type: 'expense', 
      date: { gte: from, lte: to },
      categoryId: { notIn: Array.from(budgetedCategoryIds) } 
    },
    _sum: { baseAmountMinor: true }
  });
  const unbudgetedSpendThisPeriod = unbudgetedAgg._sum.baseAmountMinor ?? 0;

  // 8. Final Math
  const discretionaryMinor = expectedIncome - baseEnvelopeLimits - plannedSavings - loanDue;
  const remainingMinor = discretionaryMinor - unbudgetedSpendThisPeriod - envelopeOverspendPenalty;
  const perDayMinor = Math.floor(Math.max(0, remainingMinor) / daysLeftInPeriod);

  return {
    discretionaryMinor,
    remainingMinor,
    perDayMinor,
    daysLeft: daysLeftInPeriod,
    breakdown: {
      expectedIncome,
      baseEnvelopeLimits,
      plannedSavings,
      loanDue,
      unbudgetedSpendThisPeriod,
      envelopeOverspendPenalty
    }
  };
}
