// src/lib/actions/settings.ts
// All Settings-related server actions.
// These are separate from reports.ts to keep concerns clean.
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { z } from 'zod';

/* ── Validation schemas ───────────────────────────────────── */
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

/* ── Save appearance settings ─────────────────────────────── */
export async function saveAppearance(raw: z.infer<typeof AppearanceSchema>) {
  'use server';
  const data = AppearanceSchema.parse(raw);
  const user = await requireAuth();
  await prisma.userPreferences.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  revalidatePath('/settings');
}

/* ── Save preferences ─────────────────────────────────────── */
export async function savePreferences(raw: z.infer<typeof PrefsSchema>) {
  'use server';
  const data = PrefsSchema.parse(raw);
  const user = await requireAuth();
  await prisma.userPreferences.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  revalidatePath('/settings');
  // savingRate and dateFormat affect the dashboard and reports
  revalidatePath('/');
  revalidatePath('/reports');
}

/* ── Save notification preferences ───────────────────────── */
export async function saveNotifications(raw: z.infer<typeof NotifSchema>) {
  'use server';
  const data = NotifSchema.parse(raw);
  const user = await requireAuth();

  // Map short Zod keys → Prisma field names (notifOverbudget, notifGoals, etc.)
  const prismaData = {
    notifOverbudget: data.overbudget,
    notifGoals:      data.goals,
    notifBills:      data.bills,
    notifInsights:   data.insights,
    notifLoanDue:    data.loanDue,
  };

  await prisma.userPreferences.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, ...prismaData },
    update: prismaData,
  });
  revalidatePath('/settings');
}

/* ── Get all user preferences ─────────────────────────────── */
export async function getUserPreferences() {
  const user = await requireAuth();
  return prisma.userPreferences.findUnique({ where: { userId: user.id } });
}

/* ── Export all user data as JSON ─────────────────────────── */
export async function exportUserData() {
  'use server';
  const user = await requireAuth();
  const [transactions, budgets, goals, loans, assets, categories, accounts, transfers] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: user.id }, include: { category: true }, orderBy: { date: 'desc' } }),
    prisma.budget.findMany({ where: { userId: user.id }, include: { category: true } }),
    prisma.goal.findMany({ where: { userId: user.id } }),
    prisma.loan.findMany({ where: { userId: user.id } }),
    prisma.asset.findMany({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transfer.findMany({ where: { userId: user.id } }),
  ]);
  return { transactions, budgets, goals, loans, assets, categories, accounts, transfers, exportedAt: new Date().toISOString() };
}

/* ── Delete all user financial data (keeps account) ─────── */
export async function deleteAllUserData() {
  'use server';
  const user = await requireAuth();

  // Wrap every delete in a single transaction so the wipe is all-or-nothing.
  // A partial wipe (e.g., transfers deleted but loans fail) leaves the ledger
  // in an irrecoverably inconsistent state — unacceptable for a finance app.
  //
  // Delete order respects FK dependencies:
  //   Transfer & Transaction reference Account/Category → delete those first.
  //   SavingsPlan has no hard FKs to the others → safe to delete early.
  await prisma.$transaction([
    prisma.savingsPlan.deleteMany({ where: { userId: user.id } }),
    prisma.transfer.deleteMany({    where: { userId: user.id } }),
    prisma.transaction.deleteMany({ where: { userId: user.id } }),
    prisma.budget.deleteMany({      where: { userId: user.id } }),
    prisma.goal.deleteMany({        where: { userId: user.id } }),
    prisma.loan.deleteMany({        where: { userId: user.id } }),
    prisma.asset.deleteMany({       where: { userId: user.id } }),
    prisma.account.deleteMany({     where: { userId: user.id } }),
    prisma.category.deleteMany({    where: { userId: user.id } }),
    prisma.userPreferences.deleteMany({ where: { userId: user.id } }),
  ]);

  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  revalidatePath('/goals');
  revalidatePath('/loans');
  revalidatePath('/net-worth');
  revalidatePath('/reports');
  revalidatePath('/settings');
}

/* ── Delete Account (wipes user from DB) ────────────────── */
export async function deleteUserAccount() {
  'use server';
  const user = await requireAuth();
  // With onDelete: Cascade on the schema, deleting the user deletes all their data.
  await prisma.user.delete({
    where: { id: user.id },
  });
}
