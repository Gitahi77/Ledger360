// src/lib/actions/transactions.ts
import { prisma } from '@/lib/prisma';
import { periodDates } from '@/lib/dateUtils';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { getAccountBalances } from './accounts';
import type { Category } from '@prisma/client';
import { z } from 'zod';

const PeriodSchema = z.enum(['this-week', 'this-month', 'this-year', 'all']);
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

/* ── List ─────────────────────────────────────────────────── */
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

/* ── Monthly chart data (last 6 months) — single query ────── */
export async function getMonthlyChartData() {
  const user  = await requireAuth();
  const now   = new Date();

  const nowNairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const nYr = nowNairobi.getFullYear();
  const nMo = nowNairobi.getMonth();

  const start = new Date(Date.UTC(nYr, nMo - 5, 1, -3, 0, 0));
  const end   = new Date(Date.UTC(nYr, nMo + 1, 0, 20, 59, 59, 999));

  type Row = { yr: number; mo: number; type: string; total: number };
  // "AT TIME ZONE" correctly converts timestamptz to local wall-clock time.
  const rows: Row[] = await prisma.$queryRaw`
    SELECT
      EXTRACT(YEAR  FROM (date AT TIME ZONE 'Africa/Nairobi'))::int  AS yr,
      EXTRACT(MONTH FROM (date AT TIME ZONE 'Africa/Nairobi'))::int  AS mo,
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
    const d = new Date(nYr, nMo - i, 1);
    months.push({ label: d.toLocaleString('default', { month: 'short' }), yr: d.getFullYear(), mo: d.getMonth() + 1 });
  }

  return months.map((m: any) => {
    const inc = rows.find((r: any) => r.yr === m.yr && r.mo === m.mo && r.type === 'income');
    const exp = rows.find((r: any) => r.yr === m.yr && r.mo === m.mo && r.type === 'expense');
    return { month: m.label, income: Math.round(inc?.total ?? 0), expenses: Math.round(exp?.total ?? 0) };
  });
}

/* ── Category breakdown ───────────────────────────────────── */
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
  const categories: Category[] = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const catMap = Object.fromEntries(categories.map((c: any) => [c.id, c]));

  const total = rows.reduce((s, r: any) => s + Number(r._sum.baseAmountMinor ?? 0), 0);
  return rows.map((r: any) => ({
    name:  r.categoryId ? (catMap[r.categoryId]?.name ?? r.categoryId) : 'Other',
    icon:  r.categoryId ? (catMap[r.categoryId]?.icon ?? 'other') : 'other',
    value: Number(r._sum.baseAmountMinor ?? 0),
    pct:   total > 0 ? Math.round((Number(r._sum.baseAmountMinor ?? 0) / total) * 100) : 0,
  }));
}

/* ── Categories list ──────────────────────────────────────── */
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

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addTransaction(raw: unknown) {
  'use server';
  try {
    const { AddTransactionSchema } = await import('@/lib/validation');
    const parsed = AddTransactionSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();

    // RLS-equivalent: validate category belongs to this user
    const cat = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: user.id },
    });
  if (!cat) throw new Error('Please choose a valid category.');

  // Find a default account if not provided
  let accountId = data.accountId;
  if (accountId) {
    const acc = await prisma.account.findFirst({ where: { id: accountId, userId: user.id } });
    if (!acc) throw new Error('Target account not found or access denied.');
  } else {
    const firstAccount = await prisma.account.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }});
    if (firstAccount) accountId = firstAccount.id;
    else {
      const fallback = await prisma.account.create({ data: { userId: user.id, name: 'Default Account', type: 'CHECKING', currency: 'KES' }});
      accountId = fallback.id;
    }
  }

  let warning: string | undefined;

  // Overdraft prevention
  if (data.type === 'expense' && accountId) {
    const { toMajor } = await import('@/lib/money');
    const balances = await getAccountBalances(user.id);
    const acc = balances.find((a: any) => a.id === accountId);
    if (acc && acc.type !== 'CREDIT_CARD' && acc.balanceMinor - data.baseAmountMinor < 0) {
      warning = `Warning: Not enough money in ${acc.name}. Available: ${acc.currency} ${toMajor(acc.balanceMinor)}.`;
    }
  }

  // Security Audit
  const { logActivity } = await import('@/lib/audit');

  const newTx = await prisma.$transaction(async (tx) => {
    const createdTx = await tx.transaction.create({
      data: { 
        name: data.name,
        baseAmountMinor: BigInt(data.baseAmountMinor),
        type: data.type === 'income' ? 'income' : 'expense',
        categoryId: data.categoryId,
        accountId: accountId,
        note: data.note,
        date: new Date(data.date), 
        userId: user.id 
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'Transaction',
        metadata: JSON.stringify({ txId: createdTx.id, amount: data.baseAmountMinor, name: data.name }),
      }
    });

    return createdTx;
  });

  // WO-15: Save-More-Tomorrow auto-save trigger (design point 3, 5)
  // Only fires for income; best-effort — failure never blocks the income.
  let autoSaveWarning: string | null = null;
  if (data.type === 'income') {
    const { triggerAutoSave } = await import('@/lib/actions/savings');
    autoSaveWarning = await triggerAutoSave(
      user.id,
      [{ id: newTx.id, baseAmountMinor: data.baseAmountMinor, date: new Date(data.date) }],
      user.currency || 'KES',
    );
  }

    revalidatePath('/transactions');
    revalidatePath('/');
    const warnings = [warning, autoSaveWarning].filter(Boolean).join(' ');
    return { warning: warnings || undefined, success: true };
  } catch (error) {
    console.error('[addTransaction]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
export async function importTransactions(rows: any[], targetAccountId: string) {
  'use server';
  try {
    const user = await requireAuth();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows to import');
    if (rows.length > 500) throw new Error('Max 500 rows per import');
    if (!targetAccountId) throw new Error('Account ID is required for import');

    // Verify the target account exists and belongs to the user
    const account = await prisma.account.findFirst({ where: { id: targetAccountId, userId: user.id } });
    if (!account) throw new Error('Selected account not found');

  const ImportRowSchema = z.object({
    name: z.string().min(1).max(120),
    baseAmountMinor: z.union([z.number(), z.string()]).transform(v => Math.abs(Number(v))),
    type: z.enum(['income', 'expense']),
    categoryName: z.string().min(1),
    date: z.union([z.string(), z.date()]).transform(v => new Date(v)),
    note: z.string().max(500).optional().nullable(),
    importHash: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
  });

  const parsedArray = z.array(z.any()).safeParse(rows);
  if (!parsedArray.success) throw new Error('Invalid payload');

  const validRows: z.infer<typeof ImportRowSchema>[] = [];
  for (const r of parsedArray.data) {
    const res = ImportRowSchema.safeParse(r);
    if (!res.success) {
      console.warn('[importTransactions] Dropping invalid row:', r.name, res.error.issues);
      continue;
    }
    const data = res.data;
    if (isNaN(data.date.getTime())) {
      console.warn('[importTransactions] Skipping invalid date:', r.date, r.name);
      continue;
    }
    if (!isFinite(data.baseAmountMinor) || data.baseAmountMinor <= 0) {
      console.warn('[importTransactions] Skipping invalid amount:', r.baseAmountMinor, r.name);
      continue;
    }
    validRows.push(data);
  }
  if (validRows.length === 0) throw new Error('No valid rows to import after filtering');

  // Use an interactive transaction so category resolution + bulk insert are atomic.
  // If the createMany fails, no orphaned categories are left behind.
  const createdIds = await prisma.$transaction(async (tx) => {
    // Resolve or create categories
    const categoryNames = [...new Set(validRows.map((r: any) => String(r.categoryName)))];
    const existingCats = await tx.category.findMany({ where: { userId: user.id, name: { in: categoryNames } } });
    const catMap: Record<string, string> = Object.fromEntries(existingCats.map((c: any) => [c.name, c.id]));

    const newCatsToCreate = categoryNames
      .filter((name: any) => !catMap[name])
      .map((name: any) => {
        const typeHint = validRows.find((r: any) => r.categoryName === name)?.type === 'income' ? 'income' : 'expense';
        return { name, type: typeHint, userId: user.id };
      });

    if (newCatsToCreate.length > 0) {
      await tx.category.createMany({ data: newCatsToCreate, skipDuplicates: true });
      const newlyCreated = await tx.category.findMany({
        where: { userId: user.id, name: { in: newCatsToCreate.map((c: any) => c.name) } }
      });
      for (const cat of newlyCreated) {
        catMap[cat.name] = cat.id;
      }
    }

    await tx.transaction.createMany({
      data: validRows.map((r: any) => ({
        name:            r.name,
        baseAmountMinor: BigInt(r.baseAmountMinor),
        type:            r.type,
        categoryId:      catMap[r.categoryName],
        accountId:       targetAccountId,
        date:            r.date,
        note:            r.note || undefined,
        userId:          user.id,
        importedAt:      new Date(),
        importHash:      r.importHash || null,
        reference:       r.reference || null,
      })),
    });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'IMPORT',
          resource: 'Transactions',
          metadata: JSON.stringify({ rowCount: validRows.length }),
        }
      });

      // Return income rows to trigger auto-save outside the transaction
      return validRows.filter((r: any) => r.type === 'income');
    });

  // WO-15: Save-More-Tomorrow auto-save trigger for imported income rows.
  const incomeRows = createdIds;
  if (incomeRows.length > 0) {
    const { triggerAutoSave } = await import('@/lib/actions/savings');
    const recentTxs = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'income',
        importedAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: incomeRows.length,
      select: { id: true, baseAmountMinor: true, date: true },
    });
    
    if (recentTxs.length > 0) {
      await triggerAutoSave(
        user.id,
        recentTxs.map((tx: any) => ({ id: tx.id, baseAmountMinor: tx.baseAmountMinor, date: tx.date })),
        user.currency || 'KES',
      );
    }
  }

    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[importTransactions]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* ── Delete (atomic — no TOCTOU race) ────────────────────── */
export async function deleteTransaction(id: string) {
  'use server';
  const user = await requireAuth();
  try {
    const parsed = DeleteSchema.safeParse({ id });
    if (!parsed.success) return { error: 'Invalid input' };

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.transaction.deleteMany({
        where: { id: parsed.data.id, userId: user.id },
      });
      if (count === 0) throw new Error('Transaction not found or already deleted');

      await tx.auditLog.create({
        data: {
          userId:   user.id,
          action:   'DELETE',
          resource: 'Transaction',
          metadata: JSON.stringify({ txId: parsed.data.id }),
        }
      });
    });

    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[deleteTransaction]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* ── Edit (atomic ownership check) ────────────────────────── */
export async function editTransaction(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    const parsedData = EditTransactionSchema.safeParse(rawData);
    if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;
    const data = parsedData.data;

    const oldTx = await prisma.transaction.findFirst({ where: { id: validId, userId: user.id } });
    if (!oldTx) return { error: 'Transaction not found' };

    const newType = data.type ?? oldTx.type;
    const newAmount = data.baseAmountMinor ?? oldTx.baseAmountMinor;
    const newAccountId = data.accountId ?? oldTx.accountId;

    if (newAccountId !== oldTx.accountId) {
      const acc = await prisma.account.findFirst({ where: { id: newAccountId, userId: user.id } });
      if (!acc) return { error: 'Target account not found or access denied.' };
    }

    if (data.categoryId && data.categoryId !== oldTx.categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } });
      if (!cat) return { error: 'Category not found or access denied.' };
    }

    let warning: string | undefined;

    if (newType === 'expense' && newAccountId) {
      const { toMajor } = await import('@/lib/money');
      const balances = await getAccountBalances(user.id);
      const acc = balances.find((a: any) => a.id === newAccountId);
      
      if (acc && acc.type !== 'CREDIT_CARD') {
        let effectiveBalance = acc.balanceMinor;
        if (oldTx.type === 'expense' && oldTx.accountId === newAccountId) {
          effectiveBalance += Number(oldTx.baseAmountMinor); // restore old amount
        } else if (oldTx.type === 'income' && oldTx.accountId === newAccountId) {
          effectiveBalance -= Number(oldTx.baseAmountMinor); // remove old income
        }
        
        if (effectiveBalance - Number(newAmount) < 0) {
          warning = `Warning: Not enough money in ${acc.name}. Available: ${acc.currency} ${toMajor(effectiveBalance)}.`;
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.transaction.updateMany({
        where: { id: validId, userId: user.id },
        data,
      });
      if (count === 0) throw new Error('Transaction not found or ownership failed');

      await tx.auditLog.create({
        data: {
          userId:   user.id,
          action:   'UPDATE',
          resource: 'Transaction',
          metadata: JSON.stringify({ txId: validId, fields: Object.keys(data) }),
        }
      });
    });

    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true, warning };
  } catch (error) {
    console.error('[editTransaction]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
