// src/lib/actions/budgets.ts
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../actions/_auth';
import { z } from 'zod';

const PeriodSchema = z.enum(['this-week', 'this-month', 'this-year', 'all']);

const DeleteSchema = z.object({ id: z.string().cuid() });
const EditBudgetSchema = z.object({
  name: z.string().optional(),
  limitAmountMinor: z.number().int().positive().optional(),
  period: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  categoryId: z.string().cuid().optional(),
  rollover: z.boolean().optional(),
});

export async function getBudgetsWithSpend(inputPeriod: unknown = 'this-month') {
  const GetBudgetsSchema = z.object({
    period: PeriodSchema.default('this-month'),
  });
  const parsed = GetBudgetsSchema.safeParse({ period: inputPeriod });
  if (!parsed.success) throw new Error('Invalid input');
  const { period } = parsed.data;

  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const budgets: (import('@prisma/client').Budget & { category: import('@prisma/client').Category })[] = await prisma.budget.findMany({
    where: { userId: user.id },
    include: { category: true },
  });

  const spendThisPeriodGroup = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { 
      userId: user.id, 
      type: 'expense', 
      date: { gte: from, lte: to },
      NOT: [
        { name: { contains: 'VOIDED', mode: 'insensitive' } },
        { name: { contains: 'pending', mode: 'insensitive' } }
      ]
    },
    _sum: { baseAmountMinor: true }
  });

  const spendThisPeriodMap: Record<string, number> = {};
  for (const g of spendThisPeriodGroup) {
    if (g.categoryId) {
      spendThisPeriodMap[g.categoryId] = Number(g._sum.baseAmountMinor ?? 0);
    }
  }

  const rolloverBudgets = budgets.filter((b: any) => b.rollover);
  const rolloverSpendMap = new Map<string, number>();

  if (rolloverBudgets.length > 0) {
    const minDate = new Date(Math.min(...rolloverBudgets.map((b: any) => b.createdAt.getTime())));
    const categoryIds = rolloverBudgets.map((b: any) => b.categoryId).filter(Boolean);

    const txs = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        categoryId: { in: categoryIds },
        date: { gte: minDate, lte: to },
        NOT: [
          { name: { contains: 'VOIDED', mode: 'insensitive' } },
          { name: { contains: 'pending', mode: 'insensitive' } }
        ]
      },
      select: { categoryId: true, date: true, baseAmountMinor: true }
    });

    for (const b of rolloverBudgets) {
      const budgetTxs = txs.filter(tx => tx.categoryId === b.categoryId && tx.date >= b.createdAt);
      const totalSpend = budgetTxs.reduce((sum, tx) => sum + Number(tx.baseAmountMinor), 0);
      rolloverSpendMap.set(b.id, totalSpend);
    }
  }

  return budgets.map((b: any) => {
    let effectiveLimit = Number(b.limitAmountMinor);
    let effectiveSpend = spendThisPeriodMap[b.categoryId] ?? 0;

    if (b.rollover) {
      let periodsExisted = 1;
      if (b.createdAt < from) {
        const shiftToNairobi = (d: Date) => new Date(d.getTime() + 3 * 3600000);
        const bCreated = shiftToNairobi(b.createdAt);
        const fromDate = shiftToNairobi(from);

        if (b.period === 'monthly') {
          const m1 = bCreated.getUTCFullYear() * 12 + bCreated.getUTCMonth();
          const m2 = fromDate.getUTCFullYear() * 12 + fromDate.getUTCMonth();
          periodsExisted = Math.max(1, m2 - m1 + 1);
        } else if (b.period === 'yearly') {
          periodsExisted = Math.max(1, fromDate.getUTCFullYear() - bCreated.getUTCFullYear() + 1);
        } else if (b.period === 'weekly') {
          periodsExisted = Math.max(1, Math.floor((from.getTime() - b.createdAt.getTime()) / (7 * 86400000)) + 1);
        }
      }
      
      const spendSinceCreated = rolloverSpendMap.get(b.id) ?? 0;
      const pastPeriods = periodsExisted - 1;
      const pastLimit = Number(b.limitAmountMinor) * pastPeriods;
      const pastSpend = spendSinceCreated - effectiveSpend;
      const rolloverBalance = pastLimit - pastSpend;

      // Stop budget limit from inflating: just show this period's limit + rollover balance
      // If they overspent in the past, limit shrinks. If underspent, limit grows.
      effectiveLimit = Number(b.limitAmountMinor) + rolloverBalance;
      effectiveSpend = effectiveSpend; // Show only this period's spend against the effective limit
    }

    return {
      id:       b.id,
      name:     b.name,
      category: b.category.name,
      icon:     b.category.icon ?? b.category.name.toLowerCase(),
      limit:    effectiveLimit,
      spent:    effectiveSpend,
      period:   b.period,
      rollover: b.rollover,
    };
  });
}

/* -- Add (Zod-validated) ------------------------------------ */





