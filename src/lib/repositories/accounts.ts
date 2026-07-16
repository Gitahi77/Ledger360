import { prisma } from '@/lib/prisma';
import type { Account, Prisma } from '@prisma/client';
import { withMetric } from '../domain/metrics-proxy';
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

  const txWhere = {
    userId,
    accountId,
    NOT: [
      { name: { contains: 'VOIDED', mode: 'insensitive' as const } },
      { name: { contains: 'pending', mode: 'insensitive' as const } }
    ]
  };

  // Step 2: SQL Consolidation within the reduced scope.
  // We consolidate Income/Expense into a single `groupBy` and fetch transfers concurrently.
  const [txSums, transfersOut, transfersIn] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['type'],
      where: txWhere,
      _sum: { baseAmountMinor: true }
    }),
    prisma.transfer.aggregate({
      where: { userId, fromAccountId: accountId },
      _sum: { amountMinor: true }
    }),
    prisma.transfer.aggregate({
      where: { userId, toAccountId: accountId },
      _sum: { baseAmountMinor: true }
    })
  ]);

  const totalIncomeMinor = Number(txSums.find(t => t.type === 'income')?._sum?.baseAmountMinor ?? 0);
  const totalExpenseMinor = Number(txSums.find(t => t.type === 'expense')?._sum?.baseAmountMinor ?? 0);
  const totalTransfersOutMinor = Number(transfersOut._sum?.amountMinor ?? 0);
  const totalTransfersInMinor = Number(transfersIn._sum?.baseAmountMinor ?? 0);

  const summary = {
    accountId: acc.id,
    currency: acc.currency,
    openingMinor: Number(acc.openingMinor),
    totalIncomeMinor,
    totalExpenseMinor,
    totalTransfersInMinor,
    totalTransfersOutMinor,
  };

  const balanceMoney = AccountAggregator.aggregate(summary);

  return {
    ...acc,
    openingMinor: Number(acc.openingMinor),
    balanceMinor: balanceMoney.minorUnits,
    displayBalance: MoneyFormatter.format(balanceMoney),
    isOverdrawn: balanceMoney.isNegative(),
    availableBalanceMinor: balanceMoney.minorUnits,
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
