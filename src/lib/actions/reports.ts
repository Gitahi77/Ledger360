// src/lib/actions/reports.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import type { Category } from '@prisma/client';

/* ── 6-month trend (single raw SQL) ──────────────────────── */
export async function getMonthlyTrend() {
  const user  = await requireAuth();
  const now   = new Date();
  
  const nowNairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const nYr = nowNairobi.getFullYear();
  const nMo = nowNairobi.getMonth();

  const start = new Date(Date.UTC(nYr, nMo - 5, 1, -3, 0, 0));
  const end   = new Date(Date.UTC(nYr, nMo + 1, 0, 20, 59, 59, 999));

  type Row = { yr: number; mo: number; type: string; total: number };
  type DebtRow = Row & { interest: number };

  const [rows, savingsRows, debtRows] = await Promise.all([
    prisma.$queryRaw<Row[]>`
      SELECT
        EXTRACT(YEAR  FROM (date AT TIME ZONE 'Africa/Nairobi'))::int AS yr,
        EXTRACT(MONTH FROM (date AT TIME ZONE 'Africa/Nairobi'))::int AS mo,
        type,
        SUM("baseAmountMinor")::float            AS total
      FROM "Transaction"
      WHERE "userId" = ${user.id}
        AND type IN ('income','expense')
        AND date >= ${start} AND date <= ${end}
      GROUP BY yr, mo, type
      ORDER BY yr, mo
    `,
    prisma.$queryRaw<Row[]>`
      SELECT
        EXTRACT(YEAR  FROM (t.date AT TIME ZONE 'Africa/Nairobi'))::int AS yr,
        EXTRACT(MONTH FROM (t.date AT TIME ZONE 'Africa/Nairobi'))::int AS mo,
        'savings' AS type,
        SUM(t."baseAmountMinor")::float AS total
      FROM "Transfer" t
      LEFT JOIN "Account" a ON t."toAccountId" = a.id
      WHERE t."userId" = ${user.id}
        AND t."loanId" IS NULL
        AND (t."goalId" IS NOT NULL OR a.type IN ('SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'))
        AND t.date >= ${start} AND t.date <= ${end}
      GROUP BY yr, mo
    `,
    prisma.$queryRaw<DebtRow[]>`
      SELECT
        EXTRACT(YEAR  FROM (date AT TIME ZONE 'Africa/Nairobi'))::int AS yr,
        EXTRACT(MONTH FROM (date AT TIME ZONE 'Africa/Nairobi'))::int AS mo,
        'debt' AS type,
        SUM("baseAmountMinor" - "interestMinor")::float AS total,
        SUM("interestMinor")::float AS interest
      FROM "Transfer"
      WHERE "userId" = ${user.id}
        AND "loanId" IS NOT NULL
        AND "toAccountId" IS NULL
        AND date >= ${start} AND date <= ${end}
      GROUP BY yr, mo
    `
  ]);

  const months: { label: string; yr: number; mo: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nYr, nMo - i, 1);
    months.push({ label: d.toLocaleString('default', { month: 'short' }), yr: d.getFullYear(), mo: d.getMonth() + 1 });
  }

  return months.map(m => {
    const inc = rows.find(r => r.yr === m.yr && r.mo === m.mo && r.type === 'income');
    const exp = rows.find(r => r.yr === m.yr && r.mo === m.mo && r.type === 'expense');
    const sav = savingsRows.find(r => r.yr === m.yr && r.mo === m.mo);
    const deb = debtRows.find(r => r.yr === m.yr && r.mo === m.mo);
    const income   = Math.round(inc?.total ?? 0);
    const expenses = Math.round((exp?.total ?? 0) + (deb?.interest ?? 0));
    const savings  = Math.round(sav?.total ?? 0);
    const debtRepayment = Math.round(deb?.total ?? 0);
    return { label: m.label, Income: income, Expenses: expenses, Savings: savings, DebtRepayment: debtRepayment };
  });
}

/* ── Period summary (KPIs) ────────────────────────────────── */
export async function getReportSummary(period: string) {
  const user = await requireAuth();
  const now  = new Date();
  
  let from: Date, to: Date;
  let prevFrom: Date, prevTo: Date;

  if (period === 'this-week') {
    const day = now.getDay() || 7;
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day), 23, 59, 59, 999);
    
    const prevD = new Date(from); prevD.setDate(prevD.getDate() - 7);
    prevFrom = prevD;
    prevTo   = new Date(from.getTime() - 1);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
    to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    prevFrom = new Date(now.getFullYear() - 1, 0, 1);
    prevTo   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  const [income, expenses, prevIncome, prevExpenses, currentSavingsTransfers, prevSavingsTransfers, currentDebtTransfers, prevDebtTransfers] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',  date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',  date: { gte: prevFrom, lte: prevTo } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense', date: { gte: prevFrom, lte: prevTo } }, _sum: { baseAmountMinor: true } }),
    prisma.transfer.findMany({
      where: {
        userId: user.id, date: { gte: from, lte: to }, loanId: null,
        OR: [{ goalId: { not: null } }, { toAccount: { type: { in: ['SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'] } } }],
      },
      select: { baseAmountMinor: true },
    }),
    prisma.transfer.findMany({
      where: {
        userId: user.id, date: { gte: prevFrom, lte: prevTo }, loanId: null,
        OR: [{ goalId: { not: null } }, { toAccount: { type: { in: ['SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'] } } }],
      },
      select: { baseAmountMinor: true },
    }),
    prisma.transfer.findMany({
      where: { userId: user.id, date: { gte: from, lte: to }, loanId: { not: null }, toAccountId: null },
      select: { baseAmountMinor: true, interestMinor: true },
    }),
    prisma.transfer.findMany({
      where: { userId: user.id, date: { gte: prevFrom, lte: prevTo }, loanId: { not: null }, toAccountId: null },
      select: { baseAmountMinor: true, interestMinor: true },
    }),
  ]);

  const inc = income._sum.baseAmountMinor   ?? 0;
  const sav = currentSavingsTransfers.reduce((sum, t) => sum + t.baseAmountMinor, 0);
  
  const currentDebtInfo = currentDebtTransfers.reduce((acc, t) => {
    acc.principal += (t.baseAmountMinor - t.interestMinor);
    acc.interest += t.interestMinor;
    return acc;
  }, { principal: 0, interest: 0 });
  const deb = currentDebtInfo.principal;
  const exp = (expenses._sum.baseAmountMinor ?? 0) + currentDebtInfo.interest;

  const ncf = inc - exp - sav - deb;
  const sr  = inc > 0 ? Math.round((sav / inc) * 100) : 0;

  const pInc = prevIncome._sum.baseAmountMinor   ?? 0;
  const pSav = prevSavingsTransfers.reduce((sum, t) => sum + t.baseAmountMinor, 0);
  
  const prevDebtInfo = prevDebtTransfers.reduce((acc, t) => {
    acc.principal += (t.baseAmountMinor - t.interestMinor);
    acc.interest += t.interestMinor;
    return acc;
  }, { principal: 0, interest: 0 });
  const pDeb = prevDebtInfo.principal;
  const pExp = (prevExpenses._sum.baseAmountMinor ?? 0) + prevDebtInfo.interest;

  const pNcf = pInc - pExp - pSav - pDeb;
  const pSr  = pInc > 0 ? Math.round((pSav / pInc) * 100) : 0;

  const calcPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return { 
    income: inc, 
    expenses: exp, 
    savings: sav, 
    debtRepayment: deb,
    netCashFlow: ncf,
    savingRate: sr,
    previous: {
      income: pInc,
      expenses: pExp,
      savings: pSav,
      debtRepayment: pDeb,
      netCashFlow: pNcf,
      savingRate: pSr,
      incomeChange: calcPct(inc, pInc),
      expensesChange: calcPct(exp, pExp),
      savingsChange: calcPct(sav, pSav),
      debtRepaymentChange: calcPct(deb, pDeb),
      netCashFlowChange: pNcf === 0 ? (ncf > 0 ? 100 : (ncf < 0 ? -100 : 0)) : Math.round(((ncf - pNcf) / Math.abs(pNcf)) * 100),
      savingRateChange: sr - pSr,
    }
  };
}

/* ── Category breakdown ───────────────────────────────────── */
export async function getReportCategories(period: string) {
  const user = await requireAuth();
  const now  = new Date();
  let from: Date, to: Date;
  if (period === 'this-week') {
    const day = now.getDay() || 7;
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day), 23, 59, 59, 999);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
    to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  type AggRow = { categoryId: string; _sum: { baseAmountMinor: number | null } };
  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true },
    orderBy: { _sum: { baseAmountMinor: 'desc' } },
    take: 8,
  });

  if (rows.length === 0) return [];

  const cats: Category[] = await prisma.category.findMany({ where: { id: { in: rows.map((r: AggRow) => r.categoryId) } } });
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const total  = rows.reduce((s, r: AggRow) => s + (r._sum.baseAmountMinor ?? 0), 0);

  const PALETTE = ['#0070F3','#16A34A','#DC2626','#D97706','#7C3AED','#0F766E','#DB2777','#F97316'];
  return rows.map((r: AggRow, i) => ({
    name:  catMap[r.categoryId]?.name ?? 'Other',
    value: r._sum.baseAmountMinor ?? 0,
    pct:   total > 0 ? Math.round(((r._sum.baseAmountMinor ?? 0) / total) * 100) : 0,
    color: PALETTE[i % PALETTE.length],
  }));
}

/* ── User profile ─────────────────────────────────────────── */
export async function getUserProfile() {
  const user   = await requireAuth();
  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { id: true, name: true, email: true, currency: true, accountType: true },
  });
  return dbUser;
}

/* ── Update profile (Zod-validated) ──────────────────────────
 *  After saving, we call revalidatePath so the Settings page
 *  Server Component re-renders with the latest values.
 *  The JWT trigger='update' in auth.ts then refreshes the token
 *  so currency/accountType changes propagate to all pages without
 *  requiring a re-login.
 */
export async function updateProfile(raw: { name: string; currency: string; accountType: string }) {
  const { UpdateProfileSchema } = await import('@/lib/validation');
  const data = UpdateProfileSchema.parse(raw);
  const user = await requireAuth();
  await prisma.user.update({ where: { id: user.id }, data });
  // Revalidate all paths that display user-specific data
  revalidatePath('/settings');
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  revalidatePath('/goals');
  revalidatePath('/loans');
  revalidatePath('/net-worth');
  revalidatePath('/reports');
}
