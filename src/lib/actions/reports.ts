// src/lib/actions/reports.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

/* ── 6-month trend (single raw SQL) ──────────────────────── */
export async function getMonthlyTrend() {
  const user  = await requireAuth();
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  type Row = { yr: number; mo: number; type: string; total: number };
  const rows: Row[] = await prisma.$queryRaw`
    SELECT
      EXTRACT(YEAR  FROM date)::int AS yr,
      EXTRACT(MONTH FROM date)::int AS mo,
      type,
      SUM("baseAmountMinor")::float            AS total
    FROM "Transaction"
    WHERE "userId" = ${user.id}
      AND type IN ('income','expense')
      AND date >= ${start} AND date <= ${end}
    GROUP BY yr, mo, type
    ORDER BY yr, mo
  `;

  const months: { label: string; yr: number; mo: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString('default', { month: 'short' }), yr: d.getFullYear(), mo: d.getMonth() + 1 });
  }

  return months.map(m => {
    const inc = rows.find(r => r.yr === m.yr && r.mo === m.mo && r.type === 'income');
    const exp = rows.find(r => r.yr === m.yr && r.mo === m.mo && r.type === 'expense');
    const income   = Math.round(inc?.total ?? 0);
    const expenses = Math.round(exp?.total ?? 0);
    return { label: m.label, Income: income, Expenses: expenses, Savings: Math.max(0, income - expenses) };
  });
}

/* ── Period summary (KPIs) ────────────────────────────────── */
export async function getReportSummary(period: string) {
  const user = await requireAuth();
  const now  = new Date();
  
  let from: Date, to: Date;
  let prevFrom: Date, prevTo: Date;

  if (period === 'this-week') {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay());
    from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const prevD = new Date(from); prevD.setDate(prevD.getDate() - 7);
    prevFrom = prevD;
    prevTo   = new Date(from.getTime() - 1);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    prevFrom = new Date(now.getFullYear() - 1, 0, 1);
    prevTo   = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    prevTo = new Date(prevFrom.getFullYear(), prevFrom.getMonth(), Math.min(now.getDate(), lastDayPrevMonth.getDate()), 23, 59, 59, 999);
  }

  const [income, expenses, prevIncome, prevExpenses] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',  date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',  date: { gte: prevFrom, lte: prevTo } }, _sum: { baseAmountMinor: true } }),
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense', date: { gte: prevFrom, lte: prevTo } }, _sum: { baseAmountMinor: true } }),
  ]);

  const inc = income._sum.baseAmountMinor   ?? 0;
  const exp = expenses._sum.baseAmountMinor ?? 0;
  const sav = inc - exp;
  const sr  = inc > 0 ? Math.round((sav / inc) * 100) : 0;

  const pInc = prevIncome._sum.baseAmountMinor   ?? 0;
  const pExp = prevExpenses._sum.baseAmountMinor ?? 0;
  const pSav = pInc - pExp;
  const pSr  = pInc > 0 ? Math.round((pSav / pInc) * 100) : 0;

  const calcPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return { 
    income: inc, 
    expenses: exp, 
    savings: sav, 
    savingRate: sr,
    previous: {
      income: pInc,
      expenses: pExp,
      savings: pSav,
      savingRate: pSr,
      incomeChange: calcPct(inc, pInc),
      expensesChange: calcPct(exp, pExp),
      savingsChange: calcPct(sav, pSav),
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
    const d = new Date(now); d.setDate(d.getDate() - d.getDay());
    from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true },
    orderBy: { _sum: { baseAmountMinor: 'desc' } },
    take: 8,
  });

  if (rows.length === 0) return [];

  const cats   = await prisma.category.findMany({ where: { id: { in: rows.map(r => r.categoryId) } } });
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const total  = rows.reduce((s, r) => s + (r._sum.baseAmountMinor ?? 0), 0);

  const PALETTE = ['#0070F3','#16A34A','#DC2626','#D97706','#7C3AED','#0F766E','#DB2777','#F97316'];
  return rows.map((r, i) => ({
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
