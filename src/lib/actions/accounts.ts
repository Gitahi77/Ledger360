'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { z } from 'zod';
import { AuthorizationError, assertOwnsAccount } from '@/lib/authz';

import { safeValidate } from '@/lib/respond';
import { Account, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { AccountType } from '@prisma/client';

const AccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AccountType),
  openingMinor: z.number().int().default(0),
  archived: z.boolean().optional(),
});

const DeleteSchema = z.object({
  id: z.string().cuid(),
});

export type AccountWithBalance = Account & { balanceMinor: number };

function invalidateAccountPaths() {
  revalidatePath('/accounts');
  revalidatePath('/');
  revalidatePath('/net-worth');
}

import { BalanceService } from '../domain/services/BalanceService';
import { mapAccountToDTO, AccountDTO } from '../mappers/accounts';
import { ActionResult } from '../types/action-result';
import { getErrorMessage } from '@/lib/format';

export async function getAccounts(): Promise<ActionResult<AccountDTO[]>> {
  try {
    const user = await requireAuth();
    const enrichedAccounts = await BalanceService.getEnrichedAccounts(user.id);
    
    const dtos = enrichedAccounts
      .filter(a => !a.archived)
      .map(mapAccountToDTO);

    return { success: true, data: dtos };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[getAccounts] Error:', error);
    return { success: false, code: 'UNKNOWN', message: 'Failed to retrieve accounts' };
  }
}

export async function getAccountBalances(userId: string): Promise<ActionResult<AccountDTO[]>> {
  try {
    const enrichedAccounts = await BalanceService.getEnrichedAccounts(userId);
    const dtos = enrichedAccounts.map(mapAccountToDTO);
    return { success: true, data: dtos };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[getAccountBalances] Error:', error);
    return { success: false, code: 'UNKNOWN', message: 'Failed to compute balances' };
  }
}

export async function createAccount(rawData: unknown): Promise<ActionResult<AccountDTO>> {
  'use server';
  try {
    const user = await requireAuth();
    const parsed = safeValidate(AccountSchema, rawData, 'AccountSchema');
    if (!parsed.success) return parsed.error;
    const valid = parsed.data;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { createAccountRecord } = await import('../repositories/accounts');
      const account = await createAccountRecord(tx, {
        ...valid,
        currency: user.currency || 'KES',
        userId: user.id,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_ACCOUNT',
          resource: 'Account',
          metadata: JSON.stringify({ accountId: account.id, name: account.name }),
        },
      });

      return account;
    });

    invalidateAccountPaths();
    
    const { Money } = await import('../domain/money/Money');
    const { MoneyFormatter } = await import('../domain/money/MoneyFormatter');
    
    // We mock the balance as 0 (or openingMinor) for a newly created account
    const initialMoney = Money.fromMinor(result.openingMinor, result.currency);
    const enrichedAccount = {
      ...result,
      openingMinor: Number(result.openingMinor),
      balanceMinor: initialMoney.minorUnits,
      displayBalance: MoneyFormatter.format(initialMoney),
      isOverdrawn: initialMoney.isNegative(),
      availableBalanceMinor: initialMoney.minorUnits
    };
    
    return { success: true, data: mapAccountToDTO(enrichedAccount) };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[createAccount]', error);
    return { success: false, code: 'UNKNOWN', message: 'An unexpected error occurred.' };
  }
}

export async function updateAccount(id: string, rawData: unknown): Promise<ActionResult<AccountDTO>> {
  'use server';
  try {
    const user = await requireAuth();
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    if (!parsedId.success) return parsedId.error;
    const validId = parsedId.data.id;

    const parsedData = safeValidate(AccountSchema.partial(), rawData, 'AccountSchema.partial()');
    if (!parsedData.success) return parsedData.error;
    const data = parsedData.data;

    await assertOwnsAccount(user.id, validId);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { updateAccountRecord } = await import('../repositories/accounts');
      const updated = await updateAccountRecord(tx, validId, user.id, data);

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_ACCOUNT',
          resource: 'Account',
          metadata: JSON.stringify({ accountId: validId, updates: data }),
        },
      });

      return updated;
    });

    invalidateAccountPaths();
    
    const { Money } = await import('../domain/money/Money');
    const { MoneyFormatter } = await import('../domain/money/MoneyFormatter');

    const initialMoney = Money.fromMinor(result.openingMinor, result.currency);
    const enrichedAccount = {
      ...result,
      openingMinor: Number(result.openingMinor),
      balanceMinor: initialMoney.minorUnits, // Should ideally re-aggregate
      displayBalance: MoneyFormatter.format(initialMoney),
      isOverdrawn: initialMoney.isNegative(),
      availableBalanceMinor: initialMoney.minorUnits
    };
    
    return { success: true, data: mapAccountToDTO(enrichedAccount) };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[updateAccount]', error);
    if (getErrorMessage(error) === 'Account not found') {
      return { success: false, code: 'NOT_FOUND', message: 'Account not found or unauthorized' };
    }
    return { success: false, code: 'UNKNOWN', message: 'An unexpected error occurred.' };
  }
}

export async function deleteAccount(id: string): Promise<ActionResult<void>> {
  'use server';
  try {
    const user = await requireAuth();
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    if (!parsedId.success) return parsedId.error;
    const validId = parsedId.data.id;

    await assertOwnsAccount(user.id, validId);

    // Block deletion if transactions or transfers exist
    const [txCount, transferFromCount, transferToCount] = await Promise.all([
      prisma.transaction.count({ where: { accountId: validId, userId: user.id } }),
      prisma.transfer.count({ where: { fromAccountId: validId, userId: user.id } }),
      prisma.transfer.count({ where: { toAccountId: validId, userId: user.id } })
    ]);
    
    if (txCount > 0 || transferFromCount > 0 || transferToCount > 0) {
      return { success: false, code: 'CONFLICT', message: 'Cannot delete account with existing transactions or transfers. Please reassign them first.' };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { deleteAccountRecord } = await import('../repositories/accounts');
      await deleteAccountRecord(tx, validId, user.id);

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_ACCOUNT',
          resource: 'Account',
          metadata: JSON.stringify({ accountId: validId }),
        },
      });
    });

    invalidateAccountPaths();
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[deleteAccount]', error);
    return { success: false, code: 'UNKNOWN', message: 'An unexpected error occurred.' };
  }
}
