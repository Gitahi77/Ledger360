// src/lib/actions/transactions.ts
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../actions/_auth';
import { getAccountBalances } from './accounts';
import type { Category } from '@prisma/client';
import { z } from 'zod';
import { mapTransactionToDTO } from '@/lib/mappers/transactions';

const PeriodSchema = z.enum(['this-week', 'this-month', 'this-year', 'all', 'all-time']);
const TypeSchema = z.enum(['income', 'expense', 'transfer', 'savings', 'all']);

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
export async function getTransactions(inputPeriod: unknown = 'this-month', inputType?: unknown) {
  const GetTransactionsSchema = z.object({
    period: PeriodSchema.default('this-month'),
    type: TypeSchema.optional(),
  });
  const parsed = GetTransactionsSchema.safeParse({ period: inputPeriod, type: inputType });
  if (!parsed.success) throw new Error('Invalid input');
  const { period, type } = parsed.data;

  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const txs = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: from, lte: to },
      ...(type && type !== 'all' ? { type } : {}),
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  return txs.map(mapTransactionToDTO);
}

/* -- Summary for period ------------------------------------- */
export async function getTransactionSummary(inputPeriod: unknown = 'this-month') {
  const GetSummarySchema = z.object({
    period: PeriodSchema.default('this-month'),
  });
  const parsed = GetSummarySchema.safeParse({ period: inputPeriod });
  if (!parsed.success) throw new Error('Invalid input');
  const { period } = parsed.data;

  const user = await requireAuth();
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
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',   date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense',  date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transfer.aggregate({
      where: { userId: user.id, toAccountId: null, date: { gte: from, lte: to } },
      _sum: { baseAmountMinor: true, interestMinor: true }
    }),
    prisma.transfer.aggregate({
      where: {
        userId: user.id, date: { gte: from, lte: to }, loanId: null,
        OR: [{ goalId: { not: null } }, { toAccount: { type: { in: ['SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'] } } }],
      },
      _sum: { baseAmountMinor: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: 'expense', date: { gte: startOfToday, lte: to } },
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

/* -- Monthly chart data (last 6 months) — single query ------ */
export async function getMonthlyChartData() {
  const user  = await requireAuth();
  const now   = new Date();

  const nowNairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const nYr = nowNairobi.getFullYear();
  const nMo = nowNairobi.getMonth();

  const start = new Date(Date.UTC(nYr, nMo - 5, 1, -3, 0, 0));
  const end   = new Date(Date.UTC(nYr, nMo + 1, 0, 20, 59, 59, 999));

  const txs = await prisma.transaction.findMany({
    where: {
      userId: user.id,
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
export async function getCategoryBreakdown(inputPeriod: unknown = 'this-month') {
  const GetCategoryBreakdownSchema = z.object({
    period: PeriodSchema.default('this-month'),
  });
  const parsed = GetCategoryBreakdownSchema.safeParse({ period: inputPeriod });
  if (!parsed.success) throw new Error('Invalid input');
  const { period } = parsed.data;

  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } },
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
export async function getCategories(inputType?: unknown) {
  const GetCategoriesSchema = z.object({
    type: z.enum(['income', 'expense', 'savings']).optional(),
  });
  const parsed = GetCategoriesSchema.safeParse({ type: inputType });
  if (!parsed.success) throw new Error('Invalid input');
  const { type } = parsed.data;

  const user = await requireAuth();
  return prisma.category.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

/* -- Add (Zod-validated) ------------------------------------ */



/* -- Delete (atomic — no TOCTOU race) ---------------------- */


/* -- Edit (atomic ownership check) -------------------------- */

