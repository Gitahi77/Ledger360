
// src/lib/actions/settings.ts
// All Settings-related server actions.
// These are separate from reports.ts to keep concerns clean.
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../actions/_auth';
import { z } from 'zod';

/* -- Validation schemas ------------------------------------- */
const PrefsSchema = z.object({
  dateFormat:    z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  weekStartDay:  z.enum(['Monday', 'Sunday']),
  savingRate:    z.number().int().min(1).max(80),
  expectedMonthlyIncomeMinor: z.number().int().nullable().optional(),
});

const NotifSchema = z.object({
  overbudget: z.boolean(),
  goals:      z.boolean(),
  bills:      z.boolean(),
  insights:   z.boolean(),
  loanDue:    z.boolean(),
});

const AppearanceSchema = z.object({
  accentColor:    z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  compactMode:    z.boolean(),
  smoothAnims:    z.boolean(),
});

/* -- Save appearance settings ------------------------------- */


/* -- Save preferences --------------------------------------- */


/* -- Save notification preferences ------------------------- */


/* -- Get all user preferences ------------------------------- */
export async function getUserPreferences({ userId }: { userId: string }) {
  return prisma.userPreferences.findUnique({ where: { userId } });
}

/* -- Export all user data as JSON --------------------------- */


/* -- Delete all user financial data (keeps account) ------- */


/* -- Delete Account (wipes user from DB) ------------------ */

