import { prisma } from '@/lib/prisma';
import { Goal } from '@prisma/client';
import { withMetric } from '../domain/metrics-proxy';

export const getGoalById = withMetric('GoalsRepository', 'getGoalById', async function getGoalById(userId: string, goalId: string): Promise<Goal | null> {
  return prisma.goal.findFirst({
    where: { id: goalId, userId }
  });
});
