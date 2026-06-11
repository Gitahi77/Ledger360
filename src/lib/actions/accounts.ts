'use server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { z } from 'zod';
import { Account } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const AccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['mobile_money', 'bank', 'cash', 'credit_card', 'savings', 'investment']),
  currency: z.string().length(3).optional(),
  openingMinor: z.number().int().default(0),
  archived: z.boolean().optional(),
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
  
  return Promise.all(accounts.map(async (acc) => {
    const [inc, exp, transfersOut, transfersIn] = await Promise.all([
      prisma.transaction.aggregate({ 
        _sum: { baseAmountMinor: true }, 
        where: { userId, accountId: acc.id, type: 'income' } 
      }),
      prisma.transaction.aggregate({ 
        _sum: { baseAmountMinor: true }, 
        where: { userId, accountId: acc.id, type: 'expense' } 
      }),
      prisma.transfer.aggregate({
        _sum: { amountMinor: true },
        where: { userId, fromAccountId: acc.id }
      }),
      prisma.transfer.aggregate({
        _sum: { amountMinor: true },
        where: { userId, toAccountId: acc.id }
      })
    ]);

    const balanceMinor = acc.openingMinor
      + (inc._sum.baseAmountMinor ?? 0) 
      - (exp._sum.baseAmountMinor ?? 0)
      - (transfersOut._sum.amountMinor ?? 0)
      + (transfersIn._sum.amountMinor ?? 0);
      
    return { ...acc, balanceMinor };
  }));
}

export async function createAccount(data: z.infer<typeof AccountSchema>) {
  const user = await requireAuth();
  const valid = AccountSchema.parse(data);

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        ...valid,
        currency: valid.currency || user.currency || 'KES',
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

export async function updateAccount(id: string, data: Partial<z.infer<typeof AccountSchema>>) {
  const user = await requireAuth();

  const result = await prisma.$transaction(async (tx) => {
    const { count } = await tx.account.updateMany({
      where: { id, userId: user.id },
      data,
    });
    
    if (count === 0) throw new Error('Account not found or unauthorized');

    const updated = await tx.account.findUnique({ where: { id } });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_ACCOUNT',
        resource: 'Account',
        metadata: JSON.stringify({ accountId: id, updates: data }),
      },
    });

    return updated;
  });

  invalidateAccountPaths();
  return result;
}

export async function deleteAccount(id: string) {
  const user = await requireAuth();

  // Block deletion if transactions or transfers exist
  const [txCount, transferFromCount, transferToCount] = await Promise.all([
    prisma.transaction.count({ where: { accountId: id, userId: user.id } }),
    prisma.transfer.count({ where: { fromAccountId: id, userId: user.id } }),
    prisma.transfer.count({ where: { toAccountId: id, userId: user.id } })
  ]);
  if (txCount > 0 || transferFromCount > 0 || transferToCount > 0) {
    throw new Error('Cannot delete account with existing transactions or transfers. Please reassign them first.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const { count } = await tx.account.deleteMany({
      where: { id, userId: user.id }
    });

    if (count === 0) throw new Error('Account not found or unauthorized');

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_ACCOUNT',
        resource: 'Account',
        metadata: JSON.stringify({ accountId: id }),
      },
    });
    
    return true;
  });

  invalidateAccountPaths();
  return result;
}
