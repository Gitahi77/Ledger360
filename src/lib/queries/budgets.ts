/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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

export async function getBudgetsWithSpend({ userId, period: inputPeriod = 'this-month' }: { userId: string; period?: unknown }) {
  const GetBudgetsSchema = z.object({
    period: PeriodSchema.default('this-month'),
  });
  const parsed = GetBudgetsSchema.safeParse({ period: inputPeriod });
  if (!parsed.success) throw new Error('Invalid input');
  const { period } = parsed.data;

  const { from, to } = periodDates(period);

  const { getBudgetsByUserId } = await import('../repositories/budgets');
  const budgets = await getBudgetsByUserId(userId);

  const spendThisPeriodGroup = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { 
      userId, 
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

  const rolloverBudgets = budgets.filter((b) => b.rollover);
  const rolloverSpendMap: Record<string, number> = {};

  if (rolloverBudgets.length > 0) {
    const minDate = new Date(Math.min(...rolloverBudgets.map((b) => b.createdAt.getTime())));
    const categoryIds = rolloverBudgets.map((b) => b.categoryId).filter((c): c is string => Boolean(c));

    const txs = await prisma.transaction.findMany({
      where: {
        userId,
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
      rolloverSpendMap[b.id] = totalSpend;
    }
  }

  const { calculateBudgetUsage } = await import('../domain/calculators/budget-engine');

  return budgets.map((b) => {
    const usage = calculateBudgetUsage(
      {
        id: b.id,
        categoryId: b.categoryId!,
        limitAmountMinor: b.limitAmountMinor,
        period: b.period as 'weekly' | 'monthly' | 'yearly',
        rollover: b.rollover,
        createdAt: b.createdAt
      },
      spendThisPeriodMap,
      rolloverSpendMap,
      from
    );

    return {
      id:       b.id,
      name:     b.name,
      category: b.category.name,
      icon:     b.category.icon ?? b.category.name.toLowerCase(),
      limit:    usage.limit,
      spent:    usage.spent,
      period:   usage.period,
      rollover: usage.rollover,
    };
  });
}

/* -- Add (Zod-validated) ------------------------------------ */





