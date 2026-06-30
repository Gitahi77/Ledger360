// src/lib/actions/goals.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../actions/_auth';
import type { Goal } from '@prisma/client';
import { z } from 'zod';

import { mapGoalToDTO, type GoalDTO } from '@/lib/mappers/goals';

const DeleteSchema = z.object({ id: z.string().cuid() });
const EditGoalSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  targetAmountMinor: z.number().int().positive().optional(),
  deadline: z.string().optional().nullable(),
});

export async function getGoals(): Promise<GoalDTO[]> {
  const user = await requireAuth();
  const goals: Goal[] = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { deadline: 'asc' },
  });

  const transferAgg = await prisma.transfer.groupBy({
    by: ['goalId'],
    where: { userId: user.id, goalId: { not: null } },
    _sum: { baseAmountMinor: true },
  });

  const transferMap = new Map(transferAgg.map((t: any) => [t.goalId, t._sum.baseAmountMinor ?? 0]));

  return goals.map((g: any) => {
    return mapGoalToDTO({
      ...g,
      currentAmountMinor: transferMap.get(g.id) ?? 0
    });
  });
}

/* -- Add (Zod-validated) ------------------------------------ */





