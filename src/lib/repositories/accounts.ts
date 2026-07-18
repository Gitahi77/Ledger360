import { prisma } from '@/lib/prisma';
import type { Account, Prisma } from '@prisma/client';
import { withMetric } from '../domain/metrics-proxy';
import { Money } from '../domain/money/Money';
import { AccountAggregator } from '../domain/calculators/AccountAggregator';
import { MoneyFormatter } from '../domain/money/MoneyFormatter';
import type { EnrichedAccountData } from '../domain/services/BalanceService';
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

export const getSingleAccountBalance = withMetric('AccountsRepository', 'getSingleAccountBalance', async function getSingleAccountBalance(userId: string, accountId: string): Promise<EnrichedAccountData | null> {
  const acc = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  
  if (!acc) return null;

  // READ PATH: Denormalized Projection (O(1))
  // The balance is now persisted directly on the account table.
  const summary = {
    accountId: acc.id,
    currency: acc.currency,
    openingMinor: Number(acc.openingMinor),
    // We mock the breakdown components because they are no longer computed individually.
    // In the future, the UI may need them or we can drop them.
    totalIncomeMinor: 0,
    totalExpenseMinor: 0,
    totalTransfersInMinor: 0,
    totalTransfersOutMinor: 0,
  };

  // We explicitly override the aggregate result with the canonical persisted balance
  const balanceMoney = Money.fromMinor(Number(acc.balanceMinor), acc.currency);

  return {
    ...acc,
    openingMinor: Number(acc.openingMinor),
    balanceMinor: Number(acc.balanceMinor),
    displayBalance: MoneyFormatter.format(balanceMoney),
    isOverdrawn: acc.balanceMinor < 0n,
    availableBalanceMinor: Number(acc.balanceMinor),
  };
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
