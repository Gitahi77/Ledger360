import { prisma } from '@/lib/prisma';
import type { Budget, Prisma } from '@prisma/client';
import { withMetric } from '../domain/metrics-proxy';

export type BudgetPersistenceModel = Budget;

export const getBudgetsByUserId = withMetric('BudgetsRepository', 'getBudgetsByUserId', async function getBudgetsByUserId(userId: string): Promise<(BudgetPersistenceModel & { category: { name: string, icon: string | null } })[]> {
  return await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });
});

export const getBudgetById = withMetric('BudgetsRepository', 'getBudgetById', async function getBudgetById(id: string, userId: string): Promise<BudgetPersistenceModel | null> {
  return await prisma.budget.findFirst({
    where: { id, userId },
  });
});

export const createBudgetRecord = withMetric('BudgetsRepository', 'createBudgetRecord', async function createBudgetRecord(
  data: Prisma.BudgetUncheckedCreateInput
): Promise<BudgetPersistenceModel> {
  return await prisma.budget.create({ data });
});

export const updateBudgetRecord = withMetric('BudgetsRepository', 'updateBudgetRecord', async function updateBudgetRecord(
  id: string,
  userId: string,
  data: Prisma.BudgetUpdateInput
): Promise<BudgetPersistenceModel> {
  const budget = await prisma.budget.updateMany({
    where: { id, userId },
    data,
  });
  if (budget.count === 0) throw new Error('Budget not found');
  return (await prisma.budget.findUnique({ where: { id } }))!;
});

export const deleteBudgetRecord = withMetric('BudgetsRepository', 'deleteBudgetRecord', async function deleteBudgetRecord(
  id: string,
  userId: string
): Promise<void> {
  await prisma.budget.deleteMany({
    where: { id, userId },
  });
});
