import { prisma } from '@/lib/prisma';

export async function getTransactionSumsByAccount(userId: string) {
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
}

export async function getTransactions(userId: string, accountId?: string) {
  return await prisma.transaction.findMany({
    where: { 
      userId,
      ...(accountId ? { accountId } : {})
    },
    include: { category: true },
    orderBy: { date: 'desc' }
  });
}

export async function createTransactionRecord(tx: any, data: any) {
  return await tx.transaction.create({ data });
}

export async function deleteTransactionRecord(tx: any, id: string, userId: string) {
  const { count } = await tx.transaction.deleteMany({
    where: { id, userId }
  });
  if (count === 0) throw new Error('Transaction not found or unauthorized');
}

export async function getCategoryByNameOrId(userId: string, hint: string, type: string) {
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
}
