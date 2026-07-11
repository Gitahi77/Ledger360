/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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

import { mapAccountToDTO, type AccountDTO } from '@/lib/mappers/accounts';

export async function getAccounts({ userId }: { userId: string }): Promise<AccountDTO[]> {
  const all = await getAccountBalances({ userId });
  return all.filter((a: any) => !a.archived);
}

export async function getAccountBalances({ userId }: { userId: string }): Promise<AccountDTO[]> {
  const accounts = await prisma.account.findMany({ 
    where: { userId },
    include: { chamaDetails: true },
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
      _sum: { baseAmountMinor: true }
    })
  ]);

  const incMap = new Map(incGroup.map((g: any) => [g.accountId, Number(g._sum?.baseAmountMinor ?? 0)]));
  const expMap = new Map(expGroup.map((g: any) => [g.accountId, Number(g._sum?.baseAmountMinor ?? 0)]));
  const txOutMap = new Map(txOutGroup.map((g: any) => [g.fromAccountId, Number(g._sum?.amountMinor ?? 0)]));
  const txInMap = new Map(txInGroup.map((g: any) => [g.toAccountId, Number(g._sum?.baseAmountMinor ?? 0)]));

  return accounts.map((acc: any) => {
    const inc = incMap.get(acc.id) ?? 0;
    const exp = expMap.get(acc.id) ?? 0;
    const txOut = txOutMap.get(acc.id) ?? 0;
    const txIn = txInMap.get(acc.id) ?? 0;

    const balanceMinor = Number(acc.openingMinor) + inc - exp - txOut + txIn;
      
    return mapAccountToDTO({ ...acc, balanceMinor });
  });
}






