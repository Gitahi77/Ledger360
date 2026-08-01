'use server';

// src/lib/actions/budgets.ts
import { createBudgetRecord, deleteBudgetRecord, updateBudgetRecord } from '../repositories/budgets';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { z } from 'zod';
import { AuthorizationError, assertOwnsBudget, assertOwnsCategory } from '@/lib/authz';

import { safeValidate } from '@/lib/respond';



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
    const parsed = safeValidate(AddBudgetSchema, raw, 'AddBudgetSchema');
    if (!parsed.success) return parsed.error;
    const data = parsed.data;
    const user = await requireAuth();

    await assertOwnsCategory(user.id, data.categoryId);

    await createBudgetRecord({ ...data, rollover: data.rollover, userId: user.id, limitAmountMinor: BigInt(data.limitAmountMinor) });
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[addBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteBudget(id: string) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    if (!parsedId.success) return parsedId.error;
    const validId = parsedId.data.id;

    await assertOwnsBudget(user.id, validId);
    await deleteBudgetRecord(validId, user.id);
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[deleteBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editBudget(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    const parsedData = safeValidate(EditBudgetSchema, rawData, 'EditBudgetSchema');
    if (!parsedId.success) return parsedId.error;
    if (!parsedData.success) return parsedData.error;
    const validId = parsedId.data.id;
    const data = parsedData.data;

    await assertOwnsBudget(user.id, validId);
    if (data.categoryId) {
      await assertOwnsCategory(user.id, data.categoryId);
    }
    
    await updateBudgetRecord(validId, user.id, { ...data, limitAmountMinor: data.limitAmountMinor !== undefined ? BigInt(data.limitAmountMinor) : undefined, rollover: data.rollover });
    revalidatePath('/budgets');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[editBudget]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
