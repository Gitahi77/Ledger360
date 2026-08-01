/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// src/lib/actions/transactions.ts
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { getAccountBalances } from './accounts';
import type { Category } from '@prisma/client';
import { z } from 'zod';
import { mapTransactionToDTO } from '@/lib/mappers/transactions';
import { mapCategoryToDTO } from '@/lib/mappers/categories';
import { TransactionSelectBase } from '@/lib/repositories/transactions';

const PeriodSchema = z.enum(['this-week', 'this-month', 'this-year', 'all', 'all-time']);
const TypeSchema = z.enum(['income', 'expense', 'transfer', 'savings', 'all']);

export function activeTransactionFilter(userId: string) {
  return { userId, status: 'ACTIVE' } as const;
}

const DeleteSchema = z.object({
  id: z.string().cuid(),
});

const EditTransactionSchema = z.object({
  baseAmountMinor: z.number().int().positive().optional(),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['income', 'expense']).optional(),
  date: z.date().optional(),
  categoryId: z.string().cuid().optional(),
  accountId: z.string().cuid().optional(),
  note: z.string().max(500).optional(),
});

/* -- List --------------------------------------------------- */
export async function getTransactions({ userId, period: inputPeriod = 'this-month', type: inputType, cursor, take, includeAudit }: { userId: string; period?: unknown; type?: unknown; cursor?: unknown; take?: unknown, includeAudit?: boolean }) {
const GetTransactionsSchema = z.object({
    period: PeriodSchema.default('this-month'),
    type: TypeSchema.optional(),
    cursor: z.string().optional(),
    take: z.number().int().positive().max(100).default(50),
    includeAudit: z.boolean().default(false),
  });
  const parsed = GetTransactionsSchema.safeParse({ period: inputPeriod, type: inputType, cursor, take, includeAudit });
  if (!parsed.success) throw new Error('Invalid input');
  const { period, type, cursor: parsedCursor, take: parsedTake, includeAudit: parsedIncludeAudit } = parsed.data;

  const { from, to } = periodDates(period);

  const txs = await prisma.transaction.findMany({
    take: parsedTake + 1, // fetch one extra to determine hasNextPage
    ...(parsedCursor ? { cursor: { id: parsedCursor }, skip: 1 } : {}),
    where: {
      userId,
      ...(!parsedIncludeAudit ? { status: 'ACTIVE' } : {}),
      date: { gte: from, lte: to },
      ...(type && type !== 'all' ? { type } : {}),
    },
    select: TransactionSelectBase,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  const hasNextPage = txs.length > parsedTake;
  const items = hasNextPage ? txs.slice(0, -1) : txs;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return {
    items: items.map(mapTransactionToDTO),
    nextCursor,
    hasNextPage,
  };
}

/* -- Summary for period ------------------------------------- */
export async function getTransactionSummary({ userId, period: inputPeriod = 'this-month' }: { userId: string; period?: unknown }) {
  const GetSummarySchema = z.object({
    period: PeriodSchema.default('this-month'),
  });
  const parsed = GetSummarySchema.safeParse({ period: inputPeriod });
  if (!parsed.success) throw new Error('Invalid input');
  const { period } = parsed.data;

  const { from, to } = periodDates(period);

  let prevFrom: Date, prevTo: Date;
  if (period === 'this-week') {
    const prevD = new Date(from); prevD.setDate(prevD.getDate() - 7);
    prevFrom = prevD;
    prevTo = new Date(from.getTime() - 1);
  } else if (period === 'this-year') {
    prevFrom = new Date(from.getFullYear() - 1, 0, 1);
    prevTo = new Date(from.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else {
    prevFrom = new Date(from.getFullYear(), from.getMonth() - 1, 1);
    prevTo = new Date(from.getFullYear(), from.getMonth(), 0, 23, 59, 59, 999);
  }

  const startOfToday = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 0, 0, 0, 0);

  const [income, expenses, transfersOut, savingsTransfers, todaySpendAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...activeTransactionFilter(userId), type: 'income',   date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { ...activeTransactionFilter(userId), type: 'expense',  date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transfer.aggregate({
      where: { userId, toAccountId: null, date: { gte: from, lte: to } },
      _sum: { baseAmountMinor: true, interestMinor: true }
    }),
    prisma.transfer.aggregate({
      where: {
        userId, date: { gte: from, lte: to }, loanId: null,
        OR: [{ goalId: { not: null } }, { toAccount: { type: { in: ['SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'] } } }],
      },
      _sum: { baseAmountMinor: true },
    }),
    prisma.transaction.aggregate({
      where: { ...activeTransactionFilter(userId), type: 'expense', date: { gte: startOfToday, lte: to } },
      _sum: { baseAmountMinor: true }
    })
  ]);

  const inc = Number(income._sum.baseAmountMinor ?? 0);
  
  const totalLoanInterest = Number(transfersOut._sum.interestMinor ?? 0);
  const exp = Number(expenses._sum.baseAmountMinor ?? 0) + totalLoanInterest;
  const moneyOut = exp + Number(transfersOut._sum.baseAmountMinor ?? 0) - totalLoanInterest;

  // WO-16 / BUG-3: "savings" = sum of transfers that fund a goal OR go to a
  // savings/investment account, EXCLUDING loan repayments. Each qualifying
  // transfer is counted once even if it matches multiple conditions.
  const savings = Number(savingsTransfers._sum?.baseAmountMinor ?? 0);
  const todaySpend = Number(todaySpendAgg._sum.baseAmountMinor ?? 0);

  return {
    income:     inc,
    expenses:   exp,
    moneyOut:   moneyOut,
    savings,
    savingRate: inc > 0 ? Math.round((savings / inc) * 100) : 0,
    todaySpend,
  };
}

/* -- Monthly chart data (last 6 months) â€” single query ------ */
export async function getMonthlyChartData({ userId }: { userId: string }) {
  const now   = new Date();

  const nowNairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const nYr = nowNairobi.getFullYear();
  const nMo = nowNairobi.getMonth();

  const start = new Date(Date.UTC(nYr, nMo - 5, 1, -3, 0, 0));
  const end   = new Date(Date.UTC(nYr, nMo + 1, 0, 20, 59, 59, 999));

  const txs = await prisma.transaction.findMany({
    where: {
      ...activeTransactionFilter(userId),
      type: { in: ['income', 'expense'] },
      date: { gte: start, lte: end }
    },
    select: { date: true, type: true, baseAmountMinor: true }
  });

  const agg: Record<string, { income: number, expense: number }> = {};
  for (const t of txs) {
    const d = new Date(t.date.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!agg[key]) agg[key] = { income: 0, expense: 0 };
    if (t.type === 'income') agg[key].income += Number(t.baseAmountMinor);
    else agg[key].expense += Number(t.baseAmountMinor);
  }

  const months: { label: string; yr: number; mo: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nYr, nMo - i, 1);
    months.push({ label: d.toLocaleString('default', { month: 'short' }), yr: d.getFullYear(), mo: d.getMonth() + 1 });
  }

  return months.map((m: any) => {
    const key = `${m.yr}-${m.mo}`;
    return { month: m.label, income: agg[key]?.income ?? 0, expenses: agg[key]?.expense ?? 0 };
  });
}

/* -- Category breakdown ------------------------------------- */
export async function getCategoryBreakdown({ userId, period: inputPeriod = 'this-month' }: { userId: string; period?: unknown }) {
  const GetCategoryBreakdownSchema = z.object({
    period: PeriodSchema.default('this-month'),
  });
  const parsed = GetCategoryBreakdownSchema.safeParse({ period: inputPeriod });
  if (!parsed.success) throw new Error('Invalid input');
  const { period } = parsed.data;

  const { from, to } = periodDates(period);

  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { ...activeTransactionFilter(userId), type: 'expense', date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true },
    orderBy: { _sum: { baseAmountMinor: 'desc' } },
  });

  const categoryIds = rows.map((r: any) => r.categoryId).filter((id): id is string => id !== null);
  let catMap: Record<string, any> = {};
  if (categoryIds.length > 0) {
    const categories: Category[] = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    catMap = Object.fromEntries(categories.map((c: any) => [c.id, c]));
  }

  const total = rows.reduce((s, r: any) => s + Number(r._sum.baseAmountMinor ?? 0), 0);
  return rows.map((r: any) => ({
    name:  r.categoryId ? (catMap[r.categoryId]?.name ?? r.categoryId) : 'Other',
    icon:  r.categoryId ? (catMap[r.categoryId]?.icon ?? 'other') : 'other',
    value: Number(r._sum.baseAmountMinor ?? 0),
    pct:   total > 0 ? Math.round((Number(r._sum.baseAmountMinor ?? 0) / total) * 100) : 0,
  }));
}

/* -- Categories list ---------------------------------------- */
export async function getCategories({ userId, type: inputType }: { userId: string; type?: unknown }) {
  const GetCategoriesSchema = z.object({
    type: z.enum(['income', 'expense', 'savings']).optional(),
  });
  const parsed = GetCategoriesSchema.safeParse({ type: inputType });
  if (!parsed.success) throw new Error('Invalid input');
  const { type } = parsed.data;

  const categories = await prisma.category.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    orderBy: { name: 'asc' },
  });
  
  return categories.map(mapCategoryToDTO);
}

/* -- Add (Zod-validated) ------------------------------------ */



/* -- Delete (atomic â€” no TOCTOU race) ---------------------- */


/* -- Edit (atomic ownership check) -------------------------- */

