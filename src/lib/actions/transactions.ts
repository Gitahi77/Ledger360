// src/lib/actions/transactions.ts
'use server';
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { getAccountBalances } from './accounts';

/* ── List ─────────────────────────────────────────────────── */
export async function getTransactions(period = 'this-month', type?: string) {
  const user = await requireAuth();
  const { from, to } = periodDates(period);

  return prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: from, lte: to },
      ...(type && type !== 'all' ? { type } : {}),
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  });
}

/* ── Summary for period ───────────────────────────────────── */
export async function getTransactionSummary(period = 'this-month') {
  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const prevFrom = new Date(from); prevFrom.setMonth(prevFrom.getMonth() - 1);
  const prevTo = new Date(to); prevTo.setMonth(prevTo.getMonth() - 1);

  const income   = await prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',   date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } });
  const expenses = await prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense',  date: { gte: from, lte: to } }, _sum: { baseAmountMinor: true } });
  const prevInc  = await prisma.transaction.aggregate({ where: { userId: user.id, type: 'income',   date: { gte: prevFrom, lte: prevTo } }, _sum: { baseAmountMinor: true } });
  const prevExp  = await prisma.transaction.aggregate({ where: { userId: user.id, type: 'expense',  date: { gte: prevFrom, lte: prevTo } }, _sum: { baseAmountMinor: true } });

  const inc = income._sum.baseAmountMinor ?? 0;
  const exp = expenses._sum.baseAmountMinor ?? 0;
  return {
    income:     inc,
    expenses:   exp,
    savings:    inc - exp,
    savingRate: inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0,
  };
}

/* ── Monthly chart data (last 6 months) — single query ────── */
export async function getMonthlyChartData() {
  const user  = await requireAuth();
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  type Row = { yr: number; mo: number; type: string; total: number };
  const rows: Row[] = await prisma.$queryRaw`
    SELECT
      EXTRACT(YEAR  FROM date)::int  AS yr,
      EXTRACT(MONTH FROM date)::int  AS mo,
      type,
      SUM("baseAmountMinor")::float  AS total
    FROM "Transaction"
    WHERE
      "userId" = ${user.id}
      AND type IN ('income','expense')
      AND date >= ${start}
      AND date <= ${end}
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
    return { month: m.label, income: Math.round(inc?.total ?? 0), expenses: Math.round(exp?.total ?? 0) };
  });
}

/* ── Category breakdown ───────────────────────────────────── */
export async function getCategoryBreakdown(period = 'this-month') {
  const user = await requireAuth();
  const { from, to } = periodDates(period);

  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, type: 'expense', date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true },
    orderBy: { _sum: { baseAmountMinor: 'desc' } },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: rows.map(r => r.categoryId) } },
  });
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const total = rows.reduce((s, r) => s + (r._sum.baseAmountMinor ?? 0), 0);
  return rows.map(r => ({
    name:  catMap[r.categoryId]?.name ?? r.categoryId,
    icon:  catMap[r.categoryId]?.icon ?? 'other',
    value: r._sum.baseAmountMinor ?? 0,
    pct:   total > 0 ? Math.round(((r._sum.baseAmountMinor ?? 0) / total) * 100) : 0,
  }));
}

/* ── Categories list ──────────────────────────────────────── */
export async function getCategories(type?: 'income' | 'expense' | 'savings') {
  const user = await requireAuth();
  return prisma.category.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addTransaction(raw: {
  name: string; baseAmountMinor: number; type: string;
  categoryId: string; accountId?: string; date: string; note?: string;
}) {
  const { AddTransactionSchema } = await import('@/lib/validation');
  const data = AddTransactionSchema.parse(raw);
  const user = await requireAuth();

  // RLS-equivalent: validate category belongs to this user
  const cat = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });
  if (!cat) throw new Error('Invalid category');

  // Find a default account if not provided
  let accountId = data.accountId;
  if (!accountId) {
    const firstAccount = await prisma.account.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }});
    if (firstAccount) accountId = firstAccount.id;
    else {
      const fallback = await prisma.account.create({ data: { userId: user.id, name: 'Default Account', type: 'bank', currency: 'KES' }});
      accountId = fallback.id;
    }
  }

  // Overdraft prevention
  if (data.type === 'expense' && accountId) {
    const balances = await getAccountBalances(user.id);
    const acc = balances.find(a => a.id === accountId);
    if (acc && acc.type !== 'credit_card' && acc.balanceMinor - data.baseAmountMinor < 0) {
      throw new Error('Insufficient funds. This expense would result in a negative account balance.');
    }
  }

  const newTx = await prisma.transaction.create({
    data: { 
      name: data.name,
      baseAmountMinor: data.baseAmountMinor,
      type: data.type === 'income' ? 'income' : 'expense',
      categoryId: data.categoryId,
      accountId: accountId,
      note: data.note,
      date: new Date(data.date), 
      userId: user.id 
    },
  });

  // Security Audit
  const { logActivity } = await import('@/lib/audit');
  await logActivity({
    userId: user.id,
    action: 'CREATE',
    resource: 'Transaction',
    metadata: { txId: newTx.id, amount: data.baseAmountMinor, name: data.name },
  });
  revalidatePath('/transactions');
  revalidatePath('/');
}

/* ── Bulk import (Smart Upload) ───────────────────────────── */
export async function importTransactions(rows: {
  name: string; baseAmountMinor: number; type: string;
  categoryName: string; accountId?: string; date: string; note?: string;
}[]) {
  const user = await requireAuth();
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows to import');
  if (rows.length > 500) throw new Error('Max 500 rows per import');

  // Find a default account if not provided
  let defaultAccountId = '';
  const firstAccount = await prisma.account.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }});
  if (firstAccount) defaultAccountId = firstAccount.id;
  else {
    // Should not happen if signup seeded accounts, but handle anyway
    const fallback = await prisma.account.create({ data: { userId: user.id, name: 'Default Account', type: 'bank', currency: 'KES' }});
    defaultAccountId = fallback.id;
  }

  // Resolve or create categories dynamically based on the string provided by the user
  const categoryNames = [...new Set(rows.map(r => String(r.categoryName)))];
  const existingCats  = await prisma.category.findMany({ where: { userId: user.id, name: { in: categoryNames } } });
  const catMap: Record<string, string> = Object.fromEntries(existingCats.map(c => [c.name, c.id]));

  for (const name of categoryNames) {
    if (!catMap[name]) {
      const typeHint = rows.find(r => r.categoryName === name)?.type === 'income' ? 'income' : 'expense';
      const cat = await prisma.category.create({
        data: { name, type: typeHint, userId: user.id },
      });
      catMap[name] = cat.id;
    }
  }

  await prisma.transaction.createMany({
    data: rows
      .filter(r => {
        // Validate date before new Date() — NaN dates crash Prisma
        const d = new Date(r.date);
        if (isNaN(d.getTime())) {
          console.warn('[importTransactions] Skipping row with invalid date:', r.date, r.name);
          return false;
        }
        return true;
      })
      .map(r => ({
        name:       String(r.name).slice(0, 120),
        baseAmountMinor: Math.abs(Number(r.baseAmountMinor)),
        type:       r.type === 'income' ? 'income' : 'expense',
        categoryId: catMap[String(r.categoryName)],
        accountId:  r.accountId || defaultAccountId,
        date:       new Date(r.date),
        note:       r.note ? String(r.note).slice(0, 500) : undefined,
        userId:     user.id,
        importedAt: new Date(),
      })),
    skipDuplicates: true,
  });

  // Security Audit
  const { logActivity } = await import('@/lib/audit');
  await logActivity({
    userId: user.id,
    action: 'IMPORT',
    resource: 'Transactions',
    metadata: { rowCount: rows.length },
  });

  revalidatePath('/transactions');
  revalidatePath('/');
}

/* ── Delete (atomic — no TOCTOU race) ────────────────────── */
export async function deleteTransaction(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');

  // findFirst + delete is a TOCTOU race: another request could delete between the two calls.
  // deleteMany with userId scope is atomic AND enforces ownership in one query.
  const { count } = await prisma.transaction.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) throw new Error('Transaction not found or already deleted');

  // Security Audit
  const { logActivity } = await import('@/lib/audit');
  await logActivity({
    userId:   user.id,
    action:   'DELETE',
    resource: 'Transaction',
    metadata: { txId: id },
  });

  revalidatePath('/transactions');
  revalidatePath('/');
}

/* ── Edit (atomic ownership check) ────────────────────────── */
export async function editTransaction(id: string, data: {
  baseAmountMinor?: number; name?: string; type?: 'income' | 'expense'; date?: Date; categoryId?: string; accountId?: string; note?: string;
}) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');

  const oldTx = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!oldTx) throw new Error('Transaction not found');

  const newType = data.type ?? oldTx.type;
  const newAmount = data.baseAmountMinor ?? oldTx.baseAmountMinor;
  const newAccountId = data.accountId ?? oldTx.accountId;

  if (newType === 'expense' && newAccountId) {
    const balances = await getAccountBalances(user.id);
    const acc = balances.find(a => a.id === newAccountId);
    
    if (acc && acc.type !== 'credit_card') {
      let effectiveBalance = acc.balanceMinor;
      if (oldTx.type === 'expense' && oldTx.accountId === newAccountId) {
        effectiveBalance += oldTx.baseAmountMinor; // restore old amount
      } else if (oldTx.type === 'income' && oldTx.accountId === newAccountId) {
        effectiveBalance -= oldTx.baseAmountMinor; // remove old income
      }
      
      if (effectiveBalance - newAmount < 0) {
        throw new Error('Insufficient funds. This update would result in a negative account balance.');
      }
    }
  }

  const { count } = await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (count === 0) throw new Error('Transaction not found or ownership failed');

  const { logActivity } = await import('@/lib/audit');
  await logActivity({
    userId:   user.id,
    action:   'UPDATE',
    resource: 'Transaction',
    metadata: { txId: id, fields: Object.keys(data) },
  });

  revalidatePath('/transactions');
  revalidatePath('/');
}
