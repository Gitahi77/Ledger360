import { prisma } from '@/lib/prisma';
import type { Account, Prisma } from '@prisma/client';
import { withMetric } from '../domain/metrics-proxy';

export type AccountPersistenceModel = Account;

export const getAccountsByUserId = withMetric('AccountsRepository', 'getAccountsByUserId', async function getAccountsByUserId(userId: string): Promise<AccountPersistenceModel[]> {
  return await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
});

export const getAccountById = withMetric('AccountsRepository', 'getAccountById', async function getAccountById(id: string, userId: string): Promise<AccountPersistenceModel | null> {
  return await prisma.account.findFirst({
    where: { id, userId },
  });
});

export const createAccountRecord = withMetric('AccountsRepository', 'createAccountRecord', async function createAccountRecord(
  tx: Prisma.TransactionClient,
  data: Prisma.AccountUncheckedCreateInput
): Promise<AccountPersistenceModel> {
  return await tx.account.create({ data });
});

export const updateAccountRecord = withMetric('AccountsRepository', 'updateAccountRecord', async function updateAccountRecord(
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
});

export const deleteAccountRecord = withMetric('AccountsRepository', 'deleteAccountRecord', async function deleteAccountRecord(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string
): Promise<void> {
  await tx.account.deleteMany({
    where: { id, userId },
  });
});
