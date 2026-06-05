// src/lib/actions/goals.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

export async function getGoals() {
  const user = await requireAuth();
  return prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { deadline: 'asc' },
  });
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addGoal(raw: {
  name: string; category: string; targetAmountMinor: number;
  currentAmountMinor?: number; deadline?: string;
}) {
  const { AddGoalSchema } = await import('@/lib/validation');
  const data = AddGoalSchema.parse(raw);
  const user = await requireAuth();
  await prisma.goal.create({
    data: {
      name:          data.name,
      category:      data.category,
      targetAmountMinor:  data.targetAmountMinor,
      currentAmountMinor: data.currentAmountMinor ?? 0,
      deadline:      data.deadline ? new Date(data.deadline) : null,
      userId:        user.id,
    },
  });
  revalidatePath('/goals');
  revalidatePath('/');
}

export async function updateGoalAmount(id: string, currentAmountMinor: number) {
  const user   = await requireAuth();
  const amount = Math.max(0, Number(currentAmountMinor));
  if (!id) throw new Error('Missing goal id');
  await prisma.goal.updateMany({
    where: { id, userId: user.id },
    data:  { currentAmountMinor: amount },
  });
  revalidatePath('/goals');
  revalidatePath('/');
}

export async function deleteGoal(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.goal.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/goals');
  revalidatePath('/');
}

export async function editGoal(id: string, data: {
  name?: string; category?: string; targetAmountMinor?: number; currentAmountMinor?: number; deadline?: string | null;
}) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');

  const updateData: any = { ...data };
  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline ? new Date(data.deadline) : null;
  }

  const { count } = await prisma.goal.updateMany({
    where: { id, userId: user.id },
    data: updateData,
  });
  if (count === 0) throw new Error('Goal not found or ownership failed');
  
  revalidatePath('/goals');
  revalidatePath('/');
}
