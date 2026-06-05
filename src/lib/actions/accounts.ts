import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { Account } from '@prisma/client';

const AccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['mobile_money', 'bank', 'cash', 'credit_card', 'savings', 'investment']),
  currency: z.string().length(3).optional(),
  openingMinor: z.number().int().default(0),
});

export type AccountWithBalance = Account & { balanceMinor: number };

export async function getAccounts(): Promise<AccountWithBalance[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  const userId = (session.user as any).id;

  return getAccountBalances(userId);
}

export async function getAccountBalances(userId: string): Promise<AccountWithBalance[]> {
  const accounts = await prisma.account.findMany({ 
    where: { userId },
    orderBy: { createdAt: 'asc' } 
  });
  
  return Promise.all(accounts.map(async (acc) => {
    const [inc, exp] = await Promise.all([
      prisma.transaction.aggregate({ 
        _sum: { baseAmountMinor: true }, 
        where: { userId, accountId: acc.id, type: 'income' } 
      }),
      prisma.transaction.aggregate({ 
        _sum: { baseAmountMinor: true }, 
        where: { userId, accountId: acc.id, type: 'expense' } 
      })
      // WO-8: Add transfers here
    ]);

    const balanceMinor = acc.openingMinor
      + (inc._sum.baseAmountMinor ?? 0) 
      - (exp._sum.baseAmountMinor ?? 0);
      
    return { ...acc, balanceMinor };
  }));
}

export async function createAccount(data: z.infer<typeof AccountSchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  const userId = (session.user as any).id;

  const valid = AccountSchema.parse(data);

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        ...valid,
        currency: valid.currency || (session.user as any).currency || 'KES',
        userId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ACCOUNT',
        resource: 'Account',
        metadata: JSON.stringify({ accountId: account.id, name: account.name }),
      },
    });

    return account;
  });
}

export async function updateAccount(id: string, data: Partial<z.infer<typeof AccountSchema>>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  const userId = (session.user as any).id;

  // Verify ownership
  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new Error('Account not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.account.update({
      where: { id },
      data,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_ACCOUNT',
        resource: 'Account',
        metadata: JSON.stringify({ accountId: id, updates: data }),
      },
    });

    return updated;
  });
}

export async function deleteAccount(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  const userId = (session.user as any).id;

  // Verify ownership
  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new Error('Account not found');

  // Block deletion if transactions exist
  const txCount = await prisma.transaction.count({ where: { accountId: id } });
  if (txCount > 0) {
    throw new Error('Cannot delete account with existing transactions. Please reassign them first.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.account.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'DELETE_ACCOUNT',
        resource: 'Account',
        metadata: JSON.stringify({ accountId: id, name: existing.name }),
      },
    });
    
    return true;
  });
}
