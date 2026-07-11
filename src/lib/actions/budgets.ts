'use server';

// src/lib/actions/budgets.ts
import { prisma } from '@/lib/prisma';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { z } from 'zod';



const DeleteSchema = z.object({ id: z.string().cuid() });
const EditBudgetSchema = z.object({
  name: z.string().optional(),
  limitAmountMinor: z.number().int().positive().optional(),
  period: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  categoryId: z.string().cuid().optional(),
  rollover: z.boolean().optional(),
});



/* -- Add (Zod-validated) ------------------------------------ */
export async function addBudget(raw: unknown) {
  'use server';
  try {
    const { AddBudgetSchema } = await import('@/lib/validation');
    const parsed = AddBudgetSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();

    const cat = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: user.id },
    });
    if (!cat) return { error: 'Invalid category' };

    await prisma.budget.create({ data: { ...data, rollover: (data as any).rollover ?? false, userId: user.id, limitAmountMinor: BigInt(data.limitAmountMinor) } });
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[addBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteBudget(id: string) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    await prisma.budget.deleteMany({ where: { id: validId, userId: user.id } });
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[deleteBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editBudget(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    const parsedData = EditBudgetSchema.safeParse(rawData);
    if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;
    const data = parsedData.data;

    if (data.categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } });
      if (!cat) return { error: 'Invalid category' };
    }
    const { count } = await prisma.budget.updateMany({
      where: { id: validId, userId: user.id },
      data: { ...data, limitAmountMinor: data.limitAmountMinor !== undefined ? BigInt(data.limitAmountMinor) : undefined, rollover: data.rollover },
    });
    if (count === 0) return { error: 'Budget not found or ownership failed' };
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[editBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
