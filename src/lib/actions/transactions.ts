'use server';
import { getErrorMessage } from '@/lib/format';

// src/lib/actions/transactions.ts
import { prisma } from '@/lib/prisma';
import { AuthorizationError, assertOwnsAccount, assertOwnsCategory, assertOwnsTransaction } from '@/lib/authz';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { getAccountBalances } from './accounts';

import { z } from 'zod';

import { safeValidate } from '@/lib/respond';


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

export async function addTransaction(envelope: { idempotencyKey?: string; payload: unknown }) {
  'use server';
  const { withAction } = await import('@/lib/respond');
  return withAction<unknown, void>({
    actionName: 'addTransaction',
    idempotencyKey: envelope.idempotencyKey,
    input: envelope.payload,
    handler: async () => {
      const { AddTransactionSchema } = await import('@/lib/validation');
      const parsed = safeValidate(AddTransactionSchema, envelope.payload, 'AddTransactionSchema');
      if (!parsed.success) return parsed.error;
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
      } else {
        await assertOwnsAccount(user.id, accountId);
      }

      if (data.categoryId) {
        await assertOwnsCategory(user.id, data.categoryId);
      }

      const { TransactionService } = await import('../domain/services/TransactionService');
      const idempotencyKey = envelope.idempotencyKey || crypto.randomUUID();

      await TransactionService.createTransaction(
        user.id,
        accountId,
        data.categoryId,
        data.baseAmountMinor,
        data.type === 'income' ? 'income' : 'expense',
        data.name,
        new Date(data.date),
        data.note,
        idempotencyKey
      );

      revalidatePath('/transactions');
      revalidatePath('/');
      return { success: true, data: undefined };
    }
  });
}
export async function importTransactions(rows: unknown[], targetAccountId: string) {
  'use server';
  try {
    const user = await requireAuth();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows to import');
    if (rows.length > 500) throw new Error('Max 500 rows per import');
    if (!targetAccountId) throw new Error('Account ID is required for import');

    // Verify the target account exists and belongs to the user
    await assertOwnsAccount(user.id, targetAccountId);

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

  const parsedArray = z.array(z.unknown()).safeParse(rows);
  if (!parsedArray.success) throw new Error('Invalid payload');

  const validRows: z.infer<typeof ImportRowSchema>[] = [];
  for (const r of parsedArray.data) {
    const res = ImportRowSchema.safeParse(r);
    if (!res.success) {
      console.warn('[importTransactions] Dropping invalid row:', r, res.error.issues);
      continue;
    }
    const data = res.data;
    if (isNaN(data.date.getTime())) {
      console.warn('[importTransactions] Skipping invalid date:', r);
      continue;
    }
    if (!isFinite(data.baseAmountMinor) || data.baseAmountMinor <= 0) {
      console.warn('[importTransactions] Skipping invalid amount:', r);
      continue;
    }
    validRows.push(data);
  }
  if (validRows.length === 0) throw new Error('No valid rows to import after filtering');

  // Use an interactive transaction so category resolution + bulk insert are atomic.
  // If the createMany fails, no orphaned categories are left behind.
  const { withRetry } = await import('@/lib/db-retry');
  const createdIds = await withRetry(() => prisma.$transaction(async (tx) => {
    // Resolve or create categories
    const categoryNames = [...new Set(validRows.map(r => String(r.categoryName)))];
    const existingCats = await tx.category.findMany({ where: { userId: user.id, name: { in: categoryNames } } });
    const catMap: Record<string, string> = Object.fromEntries(existingCats.map(c => [c.name, c.id]));

    const newCatsToCreate = categoryNames
      .filter(name => !catMap[name])
      .map(name => {
        const typeHint = validRows.find(r => r.categoryName === name)?.type === 'income' ? 'income' : 'expense';
        return { name, type: typeHint, userId: user.id };
      });

    if (newCatsToCreate.length > 0) {
      await tx.category.createMany({ data: newCatsToCreate, skipDuplicates: true });
      const newlyCreated = await tx.category.findMany({
        where: { userId: user.id, name: { in: newCatsToCreate.map(c => c.name) } }
      });
      for (const cat of newlyCreated) {
        catMap[cat.name] = cat.id;
      }
    }

    await tx.transaction.createMany({
      data: validRows.map(r => ({
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
      skipDuplicates: true,
    });

    // STAGE 5: Update balance inline within the same transaction
    const totalDelta = validRows.reduce((acc, row) => {
      const amt = BigInt(row.baseAmountMinor);
      return row.type === 'income' ? acc + amt : acc - amt;
    }, 0n);

    if (totalDelta !== 0n) {
      await tx.account.update({
        where: { id: targetAccountId },
        data: { balanceMinor: { increment: totalDelta } }
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPORT',
        resource: 'Transactions',
        metadata: JSON.stringify({ rowCount: validRows.length }),
      }
    });

      // Return income rows to trigger auto-save outside the transaction
      return validRows.filter(r => r.type === 'income');
    }), { operationName: 'importTransactions' });

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
        recentTxs.map(tx => ({ id: tx.id, baseAmountMinor: Number(tx.baseAmountMinor), date: tx.date })),
        user.currency || 'KES',
      );
    }
  }

      revalidatePath('/transactions');
      revalidatePath('/');
      return { success: true, data: undefined };
    } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[importTransactions]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* -- Delete (atomic — no TOCTOU race) ---------------------- */
export async function deleteTransaction(envelope: { idempotencyKey?: string; payload: unknown }) {
  'use server';
  const { withAction } = await import('@/lib/respond');
  return withAction<unknown, void>({
    actionName: 'deleteTransaction',
    idempotencyKey: envelope.idempotencyKey,
    input: envelope.payload,
    handler: async () => {
      const user = await requireAuth();
      const parsed = safeValidate(DeleteSchema, envelope.payload, 'DeleteSchema');
      if (!parsed.success) return parsed.error;

      const { TransactionService } = await import('../domain/services/TransactionService');
      const idempotencyKey = envelope.idempotencyKey || crypto.randomUUID();

      await TransactionService.voidTransaction(user.id, parsed.data.id, idempotencyKey);

      revalidatePath('/transactions');
      revalidatePath('/');
      return { success: true, data: undefined };
    }
  });
}

/* -- Edit (atomic ownership check) -------------------------- */
export async function editTransaction(id: string, envelope: { idempotencyKey?: string; payload: unknown }) {
  'use server';
  const { withAction } = await import('@/lib/respond');
  return withAction<unknown, void>({
    actionName: 'editTransaction',
    idempotencyKey: envelope.idempotencyKey,
    input: envelope.payload,
    handler: async () => {
      const user = await requireAuth();
      const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
      const parsedData = safeValidate(EditTransactionSchema, envelope.payload, 'EditTransactionSchema');
      if (!parsedId.success) return parsedId.error;
      if (!parsedData.success) return parsedData.error;
      const validId = parsedId.data.id;
      const data = parsedData.data;

      const oldTx = await assertOwnsTransaction(user.id, validId);

      const newType = data.type ?? oldTx.type;
      const newAmount = data.baseAmountMinor ?? oldTx.baseAmountMinor;
      const newAccountId = data.accountId ?? oldTx.accountId;

      if (newAccountId !== oldTx.accountId) {
        await assertOwnsAccount(user.id, newAccountId);
      }

      if (data.categoryId && data.categoryId !== oldTx.categoryId) {
        await assertOwnsCategory(user.id, data.categoryId);
      }

      let warning: string | undefined;
      const { toMajor } = await import('@/lib/money');
      const balancesResult = await getAccountBalances(user.id);
      if (!balancesResult.success) {
        return { success: false, code: 'INTERNAL', message: balancesResult.message || 'Failed to retrieve account balances' };
      }
      let newCurrency = oldTx.currency;

      const acc = balancesResult.data.find(a => a.id === newAccountId);
      if (acc) {
        newCurrency = acc.balanceMoney.currency;
        if (newType === 'expense' && acc.type !== 'CREDIT_CARD') {
          let effectiveBalance = acc.balanceMoney.amountMinor;
          if (oldTx.type === 'expense' && oldTx.accountId === newAccountId) {
            effectiveBalance += Number(oldTx.baseAmountMinor); // restore old amount
          } else if (oldTx.type === 'income' && oldTx.accountId === newAccountId) {
            effectiveBalance -= Number(oldTx.baseAmountMinor); // remove old income
          }
          
          const projectedBalance = effectiveBalance - Number(newAmount);
          if (projectedBalance < 0) {
            if (!acc.allowNegativeBalance) {
              return { success: false, code: 'VALIDATION', message: `Insufficient funds: ${acc.name} does not allow negative balances. Available: ${acc.balanceMoney.currency} ${toMajor(effectiveBalance)}.` };
            } else {
              warning = `Warning: This transaction will cause your account ${acc.name} to become overdrawn.`;
            }
          }
        }
      }

      const { withRetry } = await import('@/lib/db-retry');
      await withRetry(() => prisma.$transaction(async (tx) => {
        const { count } = await tx.transaction.updateMany({
          where: { id: validId, userId: user.id },
          data: { ...data, currency: newCurrency },
        });
        if (count === 0) throw new Error('Transaction not found or ownership failed');

        // STAGE 5: Apply balance deltas
        const oldDelta = oldTx.type === 'income' ? -BigInt(oldTx.baseAmountMinor) : BigInt(oldTx.baseAmountMinor);
        if (oldTx.accountId === newAccountId) {
          const newDelta = newType === 'income' ? BigInt(newAmount) : -BigInt(newAmount);
          const netDelta = oldDelta + newDelta;
          if (netDelta !== 0n) {
            await tx.account.update({
              where: { id: newAccountId },
              data: { balanceMinor: { increment: netDelta } }
            });
          }
        } else {
          await tx.account.update({
            where: { id: oldTx.accountId },
            data: { balanceMinor: { increment: oldDelta } }
          });
          const newDelta = newType === 'income' ? BigInt(newAmount) : -BigInt(newAmount);
          await tx.account.update({
            where: { id: newAccountId },
            data: { balanceMinor: { increment: newDelta } }
          });
        }

        await tx.auditLog.create({
          data: {
            userId:   user.id,
            action:   'UPDATE',
            resource: 'Transaction',
            metadata: { txId: validId, fields: Object.keys(data) },
          }
        });
      }), { operationName: 'editTransaction' });

      revalidatePath('/transactions');
      revalidatePath('/');
      return { success: true, data: undefined, warning };
    }
  });
}
