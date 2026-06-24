'use server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { z } from 'zod';
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

export async function getAccounts(): Promise<AccountWithBalance[]> {
  const user = await requireAuth();
  const all = await getAccountBalances(user.id);
  return all.filter(a => !a.archived);
}

export async function getAccountBalances(userId: string): Promise<AccountWithBalance[]> {
  const accounts: Account[] = await prisma.account.findMany({ 
    where: { userId },
    orderBy: { createdAt: 'asc' } 
  });

  if (accounts.length === 0) return [];

  const txWhere = {
    userId,
    NOT: [
      { name: { contains: 'VOIDED', mode: 'insensitive' as const } },
      { name: { contains: 'pending', mode: 'insensitive' as const } }
    ]
  };

  const [incGroup, expGroup, txOutGroup, txInGroup] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['accountId'],
      where: { ...txWhere, type: 'income' },
      _sum: { baseAmountMinor: true }
    }),
    prisma.transaction.groupBy({
      by: ['accountId'],
      where: { ...txWhere, type: 'expense' },
      _sum: { baseAmountMinor: true }
    }),
    prisma.transfer.groupBy({
      by: ['fromAccountId'],
      where: { userId },
      _sum: { amountMinor: true }
    }),
    prisma.transfer.groupBy({
      by: ['toAccountId'],
      where: { userId },
      _sum: { amountMinor: true }
    })
  ]);

  const incMap = new Map(incGroup.map(g => [g.accountId, g._sum?.baseAmountMinor ?? 0]));
  const expMap = new Map(expGroup.map(g => [g.accountId, g._sum?.baseAmountMinor ?? 0]));
  const txOutMap = new Map(txOutGroup.map(g => [g.fromAccountId, g._sum?.amountMinor ?? 0]));
  const txInMap = new Map(txInGroup.map(g => [g.toAccountId, g._sum?.amountMinor ?? 0]));

  return accounts.map(acc => {
    const inc = incMap.get(acc.id) ?? 0;
    const exp = expMap.get(acc.id) ?? 0;
    const txOut = txOutMap.get(acc.id) ?? 0;
    const txIn = txInMap.get(acc.id) ?? 0;

    const balanceMinor = acc.openingMinor + inc - exp - txOut + txIn;
      
    return { ...acc, balanceMinor };
  });
}

export async function createAccount(data: z.infer<typeof AccountSchema>) {
  const user = await requireAuth();
  const valid = AccountSchema.parse(data);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const account = await tx.account.create({
      data: {
        ...valid,
        currency: user.currency || 'KES',
        userId: user.id,
      },
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
  return result;
}

export async function updateAccount(id: string, rawData: unknown) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    // We can use partial parsing since it's an update
    const parsedData = AccountSchema.partial().safeParse(rawData);
    if (!parsedData.success) return { error: 'Invalid input' };
    const data = parsedData.data;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { count } = await tx.account.updateMany({
        where: { id: validId, userId: user.id },
        data,
      });
      
      if (count === 0) throw new Error('Account not found or unauthorized');

      const updated = await tx.account.findUnique({ where: { id: validId } });

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
    return { success: true, account: result };
  } catch (error) {
    console.error('[updateAccount]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteAccount(id: string) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    // Block deletion if transactions or transfers exist
    const [txCount, transferFromCount, transferToCount] = await Promise.all([
      prisma.transaction.count({ where: { accountId: validId, userId: user.id } }),
      prisma.transfer.count({ where: { fromAccountId: validId, userId: user.id } }),
      prisma.transfer.count({ where: { toAccountId: validId, userId: user.id } })
    ]);
    if (txCount > 0 || transferFromCount > 0 || transferToCount > 0) {
      return { error: 'Cannot delete account with existing transactions or transfers. Please reassign them first.' };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { count } = await tx.account.deleteMany({
        where: { id: validId, userId: user.id }
      });

      if (count === 0) throw new Error('Account not found or unauthorized');

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
    return { success: true };
  } catch (error) {
    console.error('[deleteAccount]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
