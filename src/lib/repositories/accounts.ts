import { prisma } from '@/lib/prisma';
import type { Account, Prisma } from '@prisma/client';

export type AccountPersistenceModel = Account;

export async function getAccountsByUserId(userId: string): Promise<AccountPersistenceModel[]> {
  return await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAccountById(id: string, userId: string): Promise<AccountPersistenceModel | null> {
  return await prisma.account.findFirst({
    where: { id, userId },
  });
}

export async function createAccountRecord(
  tx: Prisma.TransactionClient,
  data: Prisma.AccountUncheckedCreateInput
): Promise<AccountPersistenceModel> {
  return await tx.account.create({ data });
}

export async function updateAccountRecord(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string,
  data: Prisma.AccountUpdateInput
): Promise<AccountPersistenceModel> {
  const account = await tx.account.updateMany({
    where: { id, userId },
    data,
  });
  if (account.count === 0) throw new Error('Account not found');
  return (await tx.account.findUnique({ where: { id } }))!;
}

export async function deleteAccountRecord(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string
): Promise<void> {
  await tx.account.deleteMany({
    where: { id, userId },
  });
}
