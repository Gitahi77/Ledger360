// src/lib/behavioral.ts
import { prisma } from '@/lib/prisma';
import { getLoansForUser } from './queries/loans';
import type { Budget } from '@prisma/client';

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
  if (period === 'monthly') {
    if (prefs?.expectedMonthlyIncomeMinor != null) {
      expectedIncome = prefs.expectedMonthlyIncomeMinor;
    } else {
      // Average of income over 3 complete calendar months before current month
      const threeMonthsAgoStart = new Date(from.getFullYear(), from.getMonth() - 3, 1);
      const lastMonthEnd = new Date(from.getFullYear(), from.getMonth(), 0, 23, 59, 59, 999);
      
      const oldestIncome = await prisma.transaction.findFirst({
        where: { userId, type: 'income', date: { lte: lastMonthEnd } },
        orderBy: { date: 'asc' }
      });

      if (oldestIncome) {
        const trailingIncome = await prisma.transaction.aggregate({
          where: { userId, type: 'income', date: { gte: threeMonthsAgoStart, lte: lastMonthEnd } },
          _sum: { baseAmountMinor: true }
        });
        
        // Calculate months of history (capped at 3)
        const oldestMonth = oldestIncome.date.getFullYear() * 12 + oldestIncome.date.getMonth();
        const lastMonth = lastMonthEnd.getFullYear() * 12 + lastMonthEnd.getMonth();
        const historyMonths = Math.max(1, lastMonth - oldestMonth + 1);
        const divisor = Math.min(3, historyMonths);
        
        expectedIncome = Math.round(Number(trailingIncome._sum.baseAmountMinor ?? 0) / divisor);
      }

      // If no history (or average is 0), fall back to current period actual income
      if (expectedIncome === 0) {
        const currentIncomeRows = await prisma.transaction.aggregate({
          where: { userId, type: 'income', date: { gte: from, lte: to } },
          _sum: { baseAmountMinor: true }
        });
        expectedIncome = Number(currentIncomeRows._sum.baseAmountMinor ?? 0);
      }
    }
  } else {
    // Actual income recorded this period (fallback for weekly/yearly)
    const incomeRows = await prisma.transaction.aggregate({
      where: { userId, type: 'income', date: { gte: from, lte: to } },
      _sum: { baseAmountMinor: true }
    });
    expectedIncome = Number(incomeRows._sum.baseAmountMinor ?? 0);
  }

  // 4. Planned Savings
  const plannedSavings = Math.floor(expectedIncome * (savingRate / 100));

  // 5. Loan Due
  const loans = await getLoansForUser(userId);
  let loanDue = 0;
  for (const l of loans) {
    if (new Date(l.nextDue) <= to) {
      loanDue += l.monthlyPaymentMinor;
    }
  }

  // 6. Envelopes (Budgets)
  const budgets: Budget[] = await prisma.budget.findMany({
    where: { userId, period },
  });
  
  const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
  
  let baseEnvelopeLimits = 0;
  let envelopeOverspendPenalty = 0;

  // Fetch spend for all budgeted categories this period in ONE query
  const spendThisPeriodGroups = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'expense', categoryId: { in: Array.from(budgetedCategoryIds) }, date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true }
  });
  
  const spendThisPeriodMap = new Map(spendThisPeriodGroups.map((g: any) => [g.categoryId, Number(g._sum.baseAmountMinor ?? 0)]));

  // Fetch unbudgeted spend in parallel with rollover queries
  const unbudgetedPromise = prisma.transaction.aggregate({
    where: { 
      userId, 
      type: 'expense', 
      date: { gte: from, lte: to },
      categoryId: { notIn: Array.from(budgetedCategoryIds) } 
    },
    _sum: { baseAmountMinor: true }
  });

  // Calculate limits and execute rollover queries concurrently
  const rolloverBudgets = budgets.filter(b => b.rollover);
  const rolloverSpends = await Promise.all(rolloverBudgets.map(b => 
    prisma.transaction.aggregate({
      where: { userId, categoryId: b.categoryId, type: 'expense', date: { gte: b.createdAt, lte: to } },
      _sum: { baseAmountMinor: true }
    })
  ));
  
  const rolloverSpendMap = new Map(rolloverBudgets.map((b: any, i: number) => [b.id, Number(rolloverSpends[i]._sum.baseAmountMinor ?? 0)]));

  for (const b of budgets) {
    baseEnvelopeLimits += Number(b.limitAmountMinor);
    const envelopeSpend = spendThisPeriodMap.get(b.categoryId) ?? 0;
    const envelopeEffectiveLimit = Number(b.limitAmountMinor);

    if (b.rollover) {
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
      
      const cumulativeLimit = Number(b.limitAmountMinor) * periodsExisted;
      const cumulativeSpend = rolloverSpendMap.get(b.id) ?? 0;
      
      envelopeOverspendPenalty += Math.max(0, cumulativeSpend - cumulativeLimit);
    } else {
      envelopeOverspendPenalty += Math.max(0, envelopeSpend - envelopeEffectiveLimit);
    }
  }

  // 7. Unbudgeted Spend
  const unbudgetedAgg = await unbudgetedPromise;
  const unbudgetedSpendThisPeriod = Number(unbudgetedAgg._sum.baseAmountMinor ?? 0);

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
