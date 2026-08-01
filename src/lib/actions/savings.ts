'use server';

// src/lib/actions/savings.ts
// Save-More-Tomorrow commitment device (B-5, WO-15).
// Manages SavingsPlan CRUD, lazy rate escalation, and auto-save trigger.
// Every auto-save is a Transfer with source='SAVE_MORE_TOMORROW' —
// transparent and reversible (B-0). In-app modelling only.
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';

import { UpsertSavingsPlanSchema } from '@/lib/validation';
import { z } from 'zod';
import { AuthorizationError } from '@/lib/authz';

import { safeValidate } from '@/lib/respond';

/* -- Lazy escalation (no cron — B-5, design point 6) -------- */
// Advances nextEscalation in a loop until it is in the future,
// bumping currentRatePct by escalationPct each elapsed period,
// capped at maxRatePct.
function advanceEscalation(plan: {
  currentRatePct: number;
  escalationPct: number;
  maxRatePct: number;
  nextEscalation: Date;
}): { currentRatePct: number; nextEscalation: Date; changed: boolean } {
  let rate = plan.currentRatePct;
  const next = new Date(plan.nextEscalation);
  const now = new Date();
  let changed = false;

  const isDue = (d1: Date, d2: Date) => {
    if (d1.getFullYear() < d2.getFullYear()) return true;
    if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() <= d2.getMonth()) return true;
    return false;
  };

  while (isDue(next, now)) {
    rate = Math.min(rate + plan.escalationPct, plan.maxRatePct);
    next.setMonth(next.getMonth() + 1);
    changed = true;
  }

  return { currentRatePct: rate, nextEscalation: next, changed };
}

/* -- Get plan (with lazy escalation applied) ---------------- */


/* -- Upsert plan -------------------------------------------- */
export async function upsertSavingsPlan(raw: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsed = safeValidate(UpsertSavingsPlanSchema, raw, 'UpsertSavingsPlanSchema');
    if (!parsed.success) return parsed.error;
    const data = parsed.data;

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } }),
      prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } }),
    ]);
    if (!fromAccount) return { error: 'Please choose a valid source account.' };
    if (!toAccount) return { error: 'Please choose a valid destination account.' };

    const isSavingsAccount = ['SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'].includes(toAccount.type);
    if (!isSavingsAccount && !data.goalId) {
      return { error: 'The destination must be a savings or investment account, or you must select a goal.' };
    }

    if (data.goalId) {
      const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId: user.id } });
      if (!goal) return { error: 'Please choose a valid goal.' };
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.savingsPlan.findUnique({ where: { userId: user.id } });

      if (existing) {
        const { count } = await tx.savingsPlan.updateMany({
          where: { id: existing.id, userId: user.id },
          data: {
            fromAccountId:  data.fromAccountId,
            toAccountId:    data.toAccountId,
            goalId:         data.goalId || null,
            baseRatePct:    data.baseRatePct,
            escalationPct:  data.escalationPct,
            maxRatePct:     data.maxRatePct,
            active:         data.active,
          },
        });
        if (count === 0) throw new Error('Plan not found or unauthorized');
      } else {
        const prefs = await tx.userPreferences.findUnique({ where: { userId: user.id } });
        const seedRate = prefs?.savingRate ?? data.baseRatePct;

        const nextEsc = new Date();
        nextEsc.setMonth(nextEsc.getMonth() + 1);

        await tx.savingsPlan.create({
          data: {
            userId:         user.id,
            fromAccountId:  data.fromAccountId,
            toAccountId:    data.toAccountId,
            goalId:         data.goalId || null,
            baseRatePct:    data.baseRatePct,
            escalationPct:  data.escalationPct,
            maxRatePct:     data.maxRatePct,
            currentRatePct: Math.min(seedRate, data.maxRatePct),
            nextEscalation: nextEsc,
            active:         data.active,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: existing ? 'UPDATE' : 'CREATE',
          resource: 'SavingsPlan',
          metadata: JSON.stringify({ active: data.active }),
        }
      });
    });

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[upsertSavingsPlan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* -- Toggle active ------------------------------------------ */
export async function toggleSavingsPlan(active: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsed = z.boolean().safeParse(active);
    if (!parsed.success) return { error: 'Invalid input' };

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.savingsPlan.updateMany({
        where: { userId: user.id },
        data: { active: parsed.data },
      });
      if (count === 0) throw new Error('No savings plan found.');

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resource: 'SavingsPlan',
          metadata: JSON.stringify({ active: parsed.data }),
        }
      });
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[toggleSavingsPlan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* -- Get recent auto-saves for UI --------------------------- */


/* -- Delete plan -------------------------------------------- */
export async function deleteSavingsPlan() {
  'use server';
  const user = await requireAuth();
  try {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.savingsPlan.deleteMany({
        where: { userId: user.id },
      });
      if (count === 0) throw new Error('No savings plan found.');

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resource: 'SavingsPlan',
          metadata: JSON.stringify({}),
        }
      });
    });

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'AUTHORIZATION', message: error.message };
    console.error('[deleteSavingsPlan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* -- Auto-save trigger (called from addTransaction / importTransactions) -- */
// Design point 3: self-contained prisma.transfer.create (like loan disbursement).
// Design point 4: idempotency via unique sourceTransactionId.
// Design point 5: failure isolation — never throws; returns warning string or null.
// Design point 6: lazy escalation applied before computing amount.
// REQUIRED ADDITION: only fires when income date >= plan.createdAt.
// SAFETY: skips if source account has insufficient funds.
export async function triggerAutoSave(
  userId: string,
  incomeTransactions: { id: string; baseAmountMinor: number; date: Date }[],
  userCurrency: string,
): Promise<string | null> {
  if (!incomeTransactions.length) return null;
  try {
    // 1. Get the plan
    const plan = await prisma.savingsPlan.findUnique({
      where: { userId },
      include: {
        fromAccount: { select: { id: true, type: true, currency: true } },
      },
    });

    // Guard: no plan, or inactive
    if (!plan || !plan.active) return null;

    // Filter to valid transactions on/after plan.createdAt
    const validIncomes = incomeTransactions.filter(tx => new Date(tx.date) >= plan.createdAt);
    if (validIncomes.length === 0) return null;

    // 2. Lazy escalation
    const esc = advanceEscalation(plan);
    if (esc.changed) {
      await prisma.savingsPlan.updateMany({
        where: { id: plan.id, userId },
        data: { currentRatePct: esc.currentRatePct, nextEscalation: esc.nextEscalation },
      });
    }

    const rate = esc.currentRatePct;

    // 3. Compute amounts
    const transfersToCreate: import('@prisma/client').Prisma.TransferCreateManyInput[] = [];
    const logEntries: { source: string; amount: number; rate: number; triggeredBy: string }[] = [];
    let totalNeeded = 0;

    for (const tx of validIncomes) {
      const autoSaveMinor = Math.round(Number(tx.baseAmountMinor) * rate / 100);
      if (autoSaveMinor > 0) {
        transfersToCreate.push({
          userId,
          fromAccountId: plan.fromAccountId,
          toAccountId: plan.toAccountId,
          amountMinor: autoSaveMinor,
          currency: plan.fromAccount?.currency || userCurrency || 'KES',
          baseAmountMinor: autoSaveMinor,
          fxRate: 1,
          date: new Date(tx.date),
          source: 'SAVE_MORE_TOMORROW',
          goalId: plan.goalId || null,
          loanId: null,
          sourceTransactionId: tx.id,
        });
        logEntries.push({
          source: 'SAVE_MORE_TOMORROW',
          amount: autoSaveMinor,
          rate,
          triggeredBy: tx.id,
        });
        totalNeeded += autoSaveMinor;
      }
    }

    if (transfersToCreate.length === 0) return null;

    // 4. Balance check
    const { getAccountBalances } = await import('@/lib/queries/accounts');
    const balances = await getAccountBalances({ userId });
    const sourceAcc = balances.find((a) => a.id === plan.fromAccountId);
    if (sourceAcc && sourceAcc.type !== 'CREDIT_CARD' && Number(sourceAcc.balanceMoney.amountMinor) < totalNeeded) {
      return `Auto-save skipped: not enough funds in ${sourceAcc.name ?? 'source account'} (available: ${sourceAcc.balanceMoney.currency} ${(Number(sourceAcc.balanceMoney.amountMinor) / 100).toFixed(2)}, needed: ${(totalNeeded / 100).toFixed(2)}).`;
    }

    // 5. Create transfers in bulk, ignoring conflicts for idempotency
    await prisma.$transaction(async (tx) => {
      await tx.transfer.createMany({
        data: transfersToCreate,
        skipDuplicates: true,
      });

      for (const log of logEntries) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREATE',
            resource: 'Transfer',
            metadata: JSON.stringify(log),
          }
        });
      }
    });

    return null; // success, no warning
  } catch (err) {
    if (err instanceof AuthorizationError) return err.message;
    // Design point 4 — idempotency: unique constraint violation = already saved
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Unique constraint') && message.includes('sourceTransactionId')) {
      // Already created — idempotent, no error
      return null;
    }

    // Design point 5 — failure isolation: log and return warning, never throw
    console.error('[SaveMoreTomorrow] Auto-save failed (non-blocking):', message);
    return `Auto-save failed: ${message}`;
  }
}
