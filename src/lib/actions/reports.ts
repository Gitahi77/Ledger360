'use server';

// src/lib/actions/reports.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import type { Category } from '@prisma/client';

/* -- 6-month trend (single raw SQL) ------------------------ */


/* -- Period summary (KPIs) ---------------------------------- */


/* -- Category breakdown ------------------------------------- */
export async function getReportCategories(period: string, type: 'expense' | 'income' = 'expense'): Promise<{ name: string; value: number; pct: number; color: string }[]> {
  const user = await requireAuth();
  const now  = new Date();
  let from: Date, to: Date;
  if (period === 'this-week') {
    const day = now.getDay() || 7;
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day), 23, 59, 59, 999);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
    to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, type: type, date: { gte: from, lte: to } },
    _sum: { baseAmountMinor: true },
    orderBy: { _sum: { baseAmountMinor: 'desc' } },
    take: 8,
  });

  if (rows.length === 0) return [] as { name: string; value: number; pct: number; color: string }[];

  const categoryIds = rows.map((r: any) => r.categoryId).filter((id): id is string => id !== null);
  const cats: Category[] = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const catMap = Object.fromEntries(cats.map((c: any) => [c.id, c]));
  const total  = rows.reduce((s, r: any) => s + Number(r._sum.baseAmountMinor ?? 0), 0);

  const EXPENSE_PALETTE_HEX = ['#3b82f6','#f59e0b','#ef4444','#a855f7','#1d4ed8','#10b981'];
  const INCOME_PALETTE_HEX  = ['#10b981','#a855f7','#1d4ed8','#f59e0b','#ef4444','#06b6d4'];
  const PALETTE = type === 'expense' ? EXPENSE_PALETTE_HEX : INCOME_PALETTE_HEX;

  return rows.map((r: any, i) => ({
    name:  r.categoryId ? (catMap[r.categoryId]?.name ?? 'Other') : 'Other',
    value: Number(r._sum.baseAmountMinor ?? 0),
    pct:   total > 0 ? Math.round((Number(r._sum.baseAmountMinor ?? 0) / total) * 100) : 0,
    color: PALETTE[i % PALETTE.length],
  }));
}

/* -- User profile ------------------------------------------- */


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
    const errorId = logger.server(error, { action: 'updateProfile', raw });
    return { success: false, error: 'Failed to update profile', errorId };
  }
}
