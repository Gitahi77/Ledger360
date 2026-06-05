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

  const spendRows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true },
  });
  const spendMap = Object.fromEntries(
    spendRows.map(r => [r.categoryId, r._sum.baseAmountMinor ?? 0])
  );

  return budgets.map(b => ({
    id:       b.id,
    name:     b.name,
    category: b.category.name,
    icon:     b.category.icon ?? b.category.name.toLowerCase(),
    limit:    b.limitAmountMinor,
    spent:    spendMap[b.categoryId] ?? 0,
    period:   b.period,
  }));
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addBudget(raw: {
  name: string; categoryId: string; limitAmountMinor: number; period: string;
}) {
  const { AddBudgetSchema } = await import('@/lib/validation');
  const data = AddBudgetSchema.parse(raw);
  const user = await requireAuth();

  const cat = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });
  if (!cat) throw new Error('Invalid category');

  await prisma.budget.create({ data: { ...data, userId: user.id, limitAmountMinor: data.limitAmountMinor } });
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

export async function editBudget(id: string, data: { name?: string; limitAmountMinor?: number; period?: 'monthly' | 'yearly'; categoryId?: string }) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  if (data.categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } });
    if (!cat) throw new Error('Invalid category');
  }
  const { count } = await prisma.budget.updateMany({
    where: { id, userId: user.id },
    data: { ...data, limitAmountMinor: data.limitAmountMinor },
  });
  if (count === 0) throw new Error('Budget not found or ownership failed');
  revalidatePath('/budgets');
  revalidatePath('/');
}
