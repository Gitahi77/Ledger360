// src/lib/actions/goals.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import type { Goal } from '@prisma/client';
import { z } from 'zod';

const DeleteSchema = z.object({ id: z.string().cuid() });
const EditGoalSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  targetAmountMinor: z.number().int().positive().optional(),
  deadline: z.string().optional().nullable(),
});

export async function getGoals() {
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
    return { ...g, currentAmountMinor: transferMap.get(g.id) ?? 0 };
  });
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addGoal(raw: unknown) {
  try {
    const { AddGoalSchema } = await import('@/lib/validation');
    const parsed = AddGoalSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();
    await prisma.goal.create({
      data: {
        name:          data.name,
        category:      data.category,
        targetAmountMinor:  data.targetAmountMinor,
        deadline:      data.deadline ? new Date(data.deadline) : null,
        userId:        user.id,
      },
    });
    revalidatePath('/goals');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[addGoal]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteGoal(id: string) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    await prisma.goal.deleteMany({ where: { id: validId, userId: user.id } });
    revalidatePath('/goals');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[deleteGoal]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editGoal(id: string, rawData: unknown) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    const parsedData = EditGoalSchema.safeParse(rawData);
    if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;
    const data = parsedData.data;

    const updateData: Record<string, unknown> = { ...data };
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    const { count } = await prisma.goal.updateMany({
      where: { id: validId, userId: user.id },
      data: updateData,
    });
    if (count === 0) return { error: 'Goal not found or ownership failed' };
    
    revalidatePath('/goals');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[editGoal]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
