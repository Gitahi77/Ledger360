// src/lib/actions/budgets.ts
'use server';
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

export async function getBudgetsWithSpend(period = 'this-month') {
  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const budgets: (import('@prisma/client').Budget & { category: import('@prisma/client').Category })[] = await prisma.budget.findMany({
    where: { userId: user.id },
    include: { category: true },
  });

  type AggRow = { categoryId: string; _sum: { baseAmountMinor: number | null } };
  const [spendThisPeriodRows, spendAllTimeRows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } },
      _sum: { baseAmountMinor: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: user.id, type: 'expense', date: { lte: to } },
      _sum: { baseAmountMinor: true },
    })
  ]);

  const spendThisPeriodMap = Object.fromEntries(spendThisPeriodRows.map((r: AggRow) => [r.categoryId, r._sum.baseAmountMinor ?? 0]));
  
  // We will fetch spendSinceCreatedAt per budget below
  // to avoid spend before createdAt inflating the total.

  // Fetch spend >= createdAt for rollover budgets to strictly scope spend
  const rolloverBudgets = budgets.filter(b => b.rollover);
  const rolloverSpends = await Promise.all(rolloverBudgets.map(b => 
    prisma.transaction.aggregate({
      where: { userId: user.id, categoryId: b.categoryId, type: 'expense', date: { gte: b.createdAt, lte: to } },
      _sum: { baseAmountMinor: true }
    })
  ));
  const rolloverSpendMap = new Map(rolloverBudgets.map((b, i) => [b.id, rolloverSpends[i]._sum.baseAmountMinor ?? 0]));

  return budgets.map(b => {
    let effectiveLimit = b.limitAmountMinor;
    let effectiveSpend = spendThisPeriodMap[b.categoryId] ?? 0;

    if (b.rollover) {
      let periodsExisted = 1;
      if (b.createdAt < from) {
        if (b.period === 'monthly') {
          const m1 = b.createdAt.getFullYear() * 12 + b.createdAt.getMonth();
          const m2 = from.getFullYear() * 12 + from.getMonth();
          periodsExisted = Math.max(1, m2 - m1 + 1);
        } else if (b.period === 'yearly') {
          periodsExisted = Math.max(1, from.getFullYear() - b.createdAt.getFullYear() + 1);
        } else if (b.period === 'weekly') {
          periodsExisted = Math.max(1, Math.floor((from.getTime() - b.createdAt.getTime()) / (7 * 86400000)) + 1);
        }
      }
      
      const spendSinceCreated = rolloverSpendMap.get(b.id) ?? 0;
      const pastPeriods = periodsExisted - 1;
      const pastLimit = b.limitAmountMinor * pastPeriods;
      const pastSpend = spendSinceCreated - effectiveSpend;
      const rolloverBalance = pastLimit - pastSpend;

      // Stop budget limit from inflating: just show this period's limit + rollover balance
      // If they overspent in the past, limit shrinks. If underspent, limit grows.
      effectiveLimit = b.limitAmountMinor + rolloverBalance;
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

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addBudget(raw: {
  name: string; categoryId: string; limitAmountMinor: number; period: string; rollover?: boolean;
}) {
  const { AddBudgetSchema } = await import('@/lib/validation');
  const data = AddBudgetSchema.parse(raw);
  const user = await requireAuth();

  const cat = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });
  if (!cat) throw new Error('Invalid category');

  await prisma.budget.create({ data: { ...data, rollover: raw.rollover ?? false, userId: user.id, limitAmountMinor: data.limitAmountMinor } });
  revalidatePath('/budgets');
  revalidatePath('/');
}

export async function deleteBudget(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.budget.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/budgets');
  revalidatePath('/');
}

export async function editBudget(id: string, data: { name?: string; limitAmountMinor?: number; period?: 'monthly' | 'yearly'; categoryId?: string; rollover?: boolean }) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  if (data.categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } });
    if (!cat) throw new Error('Invalid category');
  }
  const { count } = await prisma.budget.updateMany({
    where: { id, userId: user.id },
    data: { ...data, limitAmountMinor: data.limitAmountMinor, rollover: data.rollover },
  });
  if (count === 0) throw new Error('Budget not found or ownership failed');
  revalidatePath('/budgets');
  revalidatePath('/');
}
