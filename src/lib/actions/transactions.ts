'use server';

// src/lib/actions/transactions.ts
import { prisma } from '@/lib/prisma';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { getAccountBalances } from './accounts';

import { z } from 'zod';


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


/* -- Summary for period ------------------------------------- */


/* -- Monthly chart data (last 6 months) — single query ------ */


/* -- Category breakdown ------------------------------------- */


/* -- Categories list ---------------------------------------- */


export async function addTransaction(raw: unknown) {
  'use server';
  try {
    const { AddTransactionSchema } = await import('@/lib/validation');
    const parsed = AddTransactionSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();

    let accountId = data.accountId;
    if (!accountId) {
      const firstAccount = await prisma.account.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }});
      if (firstAccount) accountId = firstAccount.id;
      else {
        const fallback = await prisma.account.create({ data: { userId: user.id, name: 'Default Account', type: 'CHECKING', currency: 'KES' }});
        accountId = fallback.id;
      }
    }

    const { TransactionService } = await import('../domain/services/TransactionService');
    const { Money } = await import('../domain/money/Money');
    const { createTransactionRecord, getCategoryByNameOrId } = await import('../repositories/transactions');
    
    // Fallback to KES if no currency available on user
    const currency = user.currency || 'KES';
    const moneyAmount = Money.fromMinor(data.baseAmountMinor, currency);

    // Overdraft prevention
    let warning: string | undefined;
    if (data.type === 'expense' && accountId) {
      const { BalanceService } = await import('../domain/services/BalanceService');
      const balances = await BalanceService.getEnrichedAccounts(user.id);
      const acc = balances.find((a: any) => a.id === accountId);
      if (acc && acc.type !== 'CREDIT_CARD' && acc.balanceMinor - data.baseAmountMinor < 0) {
        warning = `Warning: Not enough money in ${acc.name}. Available: ${acc.displayBalance}.`;
      }
    }

    // 1. Process Domain Logic (Validation, Normalization, Classification)
    const { persistencePayload } = TransactionService.processNewTransaction(
      accountId,
      moneyAmount,
      data.type === 'income' ? 'income' : 'expense',
      data.name,
      new Date(data.date),
      data.note,
      data.categoryId // Used as explicit hint if provided
    );

    // 2. Persist to Repository
    await prisma.$transaction(async (tx) => {
      // Resolve category
      let resolvedCategoryId = data.categoryId;
      if (persistencePayload.categoryHint && !resolvedCategoryId) {
        const cat = await getCategoryByNameOrId({ userId: user.id, hint: persistencePayload.categoryHint, type: persistencePayload.type });
        resolvedCategoryId = cat.id;
      }

      const createdTx = await createTransactionRecord(tx, {
        ...persistencePayload,
        categoryId: resolvedCategoryId,
        userId: user.id
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_LEDGER_ENTRY',
          resource: 'Transaction',
          metadata: JSON.stringify({ txId: createdTx.id, amount: data.baseAmountMinor, name: data.name }),
        }
      });

      return createdTx;
    });

    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true, warning };
  } catch (error: any) {
    console.error('[addTransaction]', error);
    return { error: error.message || 'An unexpected error occurred. Please try again.' };
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
    baseAmountMinor: z.union([z.number(), z.string()]).transform(v => Math.round(Math.abs(Number(v)))),
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

/* -- Delete (atomic — no TOCTOU race) ---------------------- */
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

/* -- Edit (atomic ownership check) -------------------------- */
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
      const balancesResult = await getAccountBalances(user.id);
      if (balancesResult.success) {
        const acc = balancesResult.data.find((a: any) => a.id === newAccountId);
        
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
