
// src/lib/actions/settings.ts
// All Settings-related server actions.
// These are separate from reports.ts to keep concerns clean.
import { prisma } from '@/lib/prisma';

/* -- Validation schemas ------------------------------------- */


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

