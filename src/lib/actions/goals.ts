'use server';

// src/lib/actions/goals.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

import { z } from 'zod';
import { AuthorizationError, assertOwnsGoal } from '@/lib/authz';

import { safeValidate } from '@/lib/respond';

const DeleteSchema = z.object({ id: z.string().cuid() });
const EditGoalSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  targetAmountMinor: z.number().int().positive().optional(),
  deadline: z.string().optional().nullable(),
});



/* -- Add (Zod-validated) ------------------------------------ */
export async function addGoal(raw: unknown) {
  'use server';
  try {
    const { AddGoalSchema } = await import('@/lib/validation');
    const parsed = safeValidate(AddGoalSchema, raw, 'AddGoalSchema');
    if (!parsed.success) return parsed.error;
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
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[addGoal]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteGoal(id: string) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    if (!parsedId.success) return parsedId.error;
    const validId = parsedId.data.id;

    await assertOwnsGoal(user.id, validId);
    await prisma.goal.deleteMany({ where: { id: validId, userId: user.id } });
    revalidatePath('/goals');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[deleteGoal]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editGoal(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    const parsedData = safeValidate(EditGoalSchema, rawData, 'EditGoalSchema');
    if (!parsedId.success) return parsedId.error;
    if (!parsedData.success) return parsedData.error;
    const validId = parsedId.data.id;
    const data = parsedData.data;

    const updateData: Record<string, unknown> = { ...data };
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    await assertOwnsGoal(user.id, validId);
    const { count } = await prisma.goal.updateMany({
      where: { id: validId, userId: user.id },
      data: updateData,
    });
    if (count === 0) return { error: 'Goal not found or ownership failed' };
    
    revalidatePath('/goals');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[editGoal]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
