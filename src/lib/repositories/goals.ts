import { prisma } from '@/lib/prisma';
import { Goal } from '@prisma/client';

export async function getGoalById(userId: string, goalId: string): Promise<Goal | null> {
  return prisma.goal.findFirst({
    where: { id: goalId, userId }
  });
}
