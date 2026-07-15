'use server';

// src/lib/actions/reports.ts
import { AuthorizationError } from '@/lib/authz';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';


/* -- 6-month trend (single raw SQL) ------------------------ */


/* -- Period summary (KPIs) ---------------------------------- */





/* -- Update profile (Zod-validated) --------------------------
 *  After saving, we call revalidatePath so the Settings page
 *  Server Component re-renders with the latest values.
 *  The JWT trigger='update' in auth.ts then refreshes the token
 *  so currency/accountType changes propagate to all pages without
 *  requiring a re-login.
 */
import { logger } from '@/lib/logger';
import type { ActionResult } from '@/lib/types/action-result';

export async function updateProfile(raw: { name: string; currency: string; accountType: string }): Promise<ActionResult> {
  'use server';
  try {
    const { UpdateProfileSchema } = await import('@/lib/validation');
    const data = UpdateProfileSchema.parse(raw);
    const user = await requireAuth();
    await prisma.user.update({ where: { id: user.id }, data });
    // Revalidate all paths that display user-specific data
    revalidatePath('/settings');
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/budgets');
    revalidatePath('/goals');
    revalidatePath('/loans');
    revalidatePath('/net-worth');
    revalidatePath('/reports');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    const errorId = logger.server(error, { action: 'updateProfile', raw });
    return { success: false, error: 'Failed to update profile', errorId };
  }
}
