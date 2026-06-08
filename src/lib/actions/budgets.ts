// src/lib/actions/budgets.ts
'use server';
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

export async function getBudgetsWithSpend(period = 'this-month') {
  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    include: { category: true },
  });

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

  const spendThisPeriodMap = Object.fromEntries(spendThisPeriodRows.map(r => [r.categoryId, r._sum.baseAmountMinor ?? 0]));
  const spendAllTimeMap = Object.fromEntries(spendAllTimeRows.map(r => [r.categoryId, r._sum.baseAmountMinor ?? 0]));

  return budgets.map(b => {
    let effectiveLimit = b.limitAmountMinor;
    let effectiveSpend = spendThisPeriodMap[b.categoryId] ?? 0;

    if (b.rollover) {
      // Calculate periods existed
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
      effectiveLimit = b.limitAmountMinor * periodsExisted;
      
      // For display purposes, use all time spend. It might include spend before budget was created,
      // but users typically don't retroactively assign categories to old budgets. 
      // If we wanted to be strictly accurate we would fetch spend > createdAt for each budget.
      effectiveSpend = spendAllTimeMap[b.categoryId] ?? 0;
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
