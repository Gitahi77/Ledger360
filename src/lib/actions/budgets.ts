// src/lib/actions/budgets.ts
'use server';
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
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
    const earliestCreated = new Date(Math.min(...rolloverBudgets.map((b: any) => b.createdAt.getTime())));
    const categoryIds = rolloverBudgets.map((b: any) => b.categoryId);
    
    const rawSpends = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        categoryId: { in: categoryIds },
        date: { gte: earliestCreated, lte: to },
        NOT: [
          { name: { contains: 'VOIDED', mode: 'insensitive' } },
          { name: { contains: 'pending', mode: 'insensitive' } }
        ]
      },
      select: { categoryId: true, date: true, baseAmountMinor: true }
    });

    for (const b of rolloverBudgets) {
      const budgetSpends = rawSpends.filter((tx: any) => tx.categoryId === b.categoryId && tx.date >= b.createdAt);
      const sum = budgetSpends.reduce((acc: number, tx: any) => acc + Number(tx.baseAmountMinor), 0);
      rolloverSpendMap.set(b.id, sum);
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

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addBudget(raw: unknown) {
  try {
    const { AddBudgetSchema } = await import('@/lib/validation');
    const parsed = AddBudgetSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();

    const cat = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: user.id },
    });
    if (!cat) return { error: 'Invalid category' };

    await prisma.budget.create({ data: { ...data, rollover: (data as any).rollover ?? false, userId: user.id, limitAmountMinor: BigInt(data.limitAmountMinor) } });
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[addBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteBudget(id: string) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    await prisma.budget.deleteMany({ where: { id: validId, userId: user.id } });
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[deleteBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editBudget(id: string, rawData: unknown) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    const parsedData = EditBudgetSchema.safeParse(rawData);
    if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;
    const data = parsedData.data;

    if (data.categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } });
      if (!cat) return { error: 'Invalid category' };
    }
    const { count } = await prisma.budget.updateMany({
      where: { id: validId, userId: user.id },
      data: { ...data, limitAmountMinor: data.limitAmountMinor !== undefined ? BigInt(data.limitAmountMinor) : undefined, rollover: data.rollover },
    });
    if (count === 0) return { error: 'Budget not found or ownership failed' };
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[editBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
