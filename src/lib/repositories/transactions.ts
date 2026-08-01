import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { withMetric } from '../domain/metrics-proxy';

export const getTransactionSumsByAccount = withMetric('TransactionsRepository', 'getTransactionSumsByAccount', async function getTransactionSumsByAccount({ userId }: { userId: string }) {
  const txWhere = {
    userId,
    NOT: [
      { name: { contains: 'VOIDED', mode: 'insensitive' as const } },
      { name: { contains: 'pending', mode: 'insensitive' as const } }
    ]
  };

  const [incomeSums, expenseSums] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['accountId'],
      where: { ...txWhere, type: 'income' },
      _sum: { baseAmountMinor: true }
    }),
    prisma.transaction.groupBy({
      by: ['accountId'],
      where: { ...txWhere, type: 'expense' },
      _sum: { baseAmountMinor: true }
    })
  ]);

  return { incomeSums, expenseSums };
});

export const TransactionSelectBase = {
  id: true,
  date: true,
  baseAmountMinor: true,
  currency: true,
  type: true,
  name: true,
  note: true,
  categoryId: true,
  accountId: true,
  userId: true,
  status: true,
  parentId: true,
  importedAt: true,
  importHash: true,
  reference: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      type: true,
      icon: true
    }
  }
} satisfies Prisma.TransactionSelect;

export const getTransactions = withMetric('TransactionsRepository', 'getTransactions', async function getTransactions({ userId, accountId }: { userId: string; accountId?: string }) {
  return await prisma.transaction.findMany({
    where: { 
      userId,
      ...(accountId ? { accountId } : {})
    },
    select: TransactionSelectBase,
    orderBy: { date: 'desc' }
  });
});

export const createTransactionRecord = withMetric('TransactionsRepository', 'createTransactionRecord', async function createTransactionRecord(tx: Prisma.TransactionClient, data: Prisma.TransactionUncheckedCreateInput) {
  return await tx.transaction.create({ data });
});

export const deleteTransactionRecord = withMetric('TransactionsRepository', 'deleteTransactionRecord', async function deleteTransactionRecord(tx: Prisma.TransactionClient, id: string, userId: string) {
  const { count } = await tx.transaction.deleteMany({
    where: { id, userId }
  });
  if (count === 0) throw new Error('Transaction not found or unauthorized');
});

export const getCategoryByNameOrId = withMetric('TransactionsRepository', 'getCategoryByNameOrId', async function getCategoryByNameOrId({ userId, hint, type }: { userId: string; hint: string; type: string }) {
  // Check by ID first
  let cat = await prisma.category.findFirst({ where: { id: hint, userId } });
  if (cat) return cat;

  // Check by Name
  cat = await prisma.category.findFirst({ where: { name: hint, userId } });
  if (cat) return cat;

  // Create if missing
  return await prisma.category.create({
    data: { name: hint, type, userId }
  });
});
