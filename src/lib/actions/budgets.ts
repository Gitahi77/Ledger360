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
    _sum: { amount: true },
  });
  const spendMap = Object.fromEntries(
    spendRows.map(r => [r.categoryId, r._sum.amount ?? 0])
  );

  return budgets.map(b => ({
    id:       b.id,
    name:     b.name,
    category: b.category.name,
    icon:     b.category.icon ?? b.category.name.toLowerCase(),
    limit:    b.limitAmt,
    spent:    spendMap[b.categoryId] ?? 0,
    period:   b.period,
  }));
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addBudget(raw: {
  name: string; categoryId: string; limitAmt: number; period: string;
}) {
  const { AddBudgetSchema } = await import('@/lib/validation');
  const data = AddBudgetSchema.parse(raw);
  const user = await requireAuth();

  const cat = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });
  if (!cat) throw new Error('Invalid category');

  await prisma.budget.create({ data: { ...data, userId: user.id } });
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
