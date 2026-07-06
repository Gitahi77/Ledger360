/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// src/lib/actions/savings.ts
// Save-More-Tomorrow commitment device (B-5, WO-15).
// Manages SavingsPlan CRUD, lazy rate escalation, and auto-save trigger.
// Every auto-save is a Transfer with source='SAVE_MORE_TOMORROW' â€”
// transparent and reversible (B-0). In-app modelling only.
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/audit';
import { UpsertSavingsPlanSchema } from '@/lib/validation';
import { z } from 'zod';

/* -- Lazy escalation (no cron â€” B-5, design point 6) -------- */
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

  while (next <= now) {
    rate = Math.min(rate + plan.escalationPct, plan.maxRatePct);
    next.setMonth(next.getMonth() + 1);
    changed = true;
  }

  return { currentRatePct: rate, nextEscalation: next, changed };
}

/* -- Get plan (with lazy escalation applied) ---------------- */
export async function getSavingsPlan() {
  const user = await requireAuth();

  const plan = await prisma.savingsPlan.findUnique({
    where: { userId: user.id },
    include: {
      fromAccount: { select: { id: true, name: true, type: true, currency: true } },
      toAccount:   { select: { id: true, name: true, type: true, currency: true } },
      goal:        { select: { id: true, name: true } },
    },
  });

  if (!plan) return null;

  // Lazy escalation: advance rate if nextEscalation is past
  const esc = advanceEscalation(plan);
  if (esc.changed) {
    await prisma.savingsPlan.updateMany({
      where: { id: plan.id, userId: user.id },
      data: { currentRatePct: esc.currentRatePct, nextEscalation: esc.nextEscalation },
    });
    return { ...plan, currentRatePct: esc.currentRatePct, nextEscalation: esc.nextEscalation };
  }

  return plan;
}

/* -- Upsert plan -------------------------------------------- */


/* -- Toggle active ------------------------------------------ */


/* -- Get recent auto-saves for UI --------------------------- */
export async function getRecentAutoSaves() {
  const user = await requireAuth();
  const saves = await prisma.transfer.findMany({
    where: { userId: user.id, source: 'SAVE_MORE_TOMORROW' },
    include: {
      fromAccount: { select: { name: true, currency: true } },
      toAccount:   { select: { name: true, currency: true } },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  return saves.map(s => ({
    ...s,
    baseAmountMinor: Number(s.baseAmountMinor),
    amountMinor: Number(s.amountMinor),
    interestMinor: Number(s.interestMinor),
  }));
}

/* -- Delete plan -------------------------------------------- */


/* -- Auto-save trigger (called from addTransaction / importTransactions) -- */
// Design point 3: self-contained prisma.transfer.create (like loan disbursement).
// Design point 4: idempotency via unique sourceTransactionId.
// Design point 5: failure isolation â€” never throws; returns warning string or null.
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
    const validIncomes = incomeTransactions.filter((tx: any) => new Date(tx.date) >= plan.createdAt);
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
    const transfersToCreate: any[] = [];
    const logEntries: any[] = [];
    let totalNeeded = 0;

    for (const tx of validIncomes) {
      const autoSaveMinor = Math.round(tx.baseAmountMinor * rate / 100);
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
    const { getAccountBalances } = await import('@/lib/actions/accounts');
    const balances = await getAccountBalances(userId);
    const sourceAcc = balances.find((a: any) => a.id === plan.fromAccountId);
    if (sourceAcc && sourceAcc.type !== 'CREDIT_CARD' && sourceAcc.balanceMinor < totalNeeded) {
      return `Auto-save skipped: not enough funds in ${sourceAcc.name ?? 'source account'} (available: ${sourceAcc.currency} ${(sourceAcc.balanceMinor / 100).toFixed(2)}, needed: ${(totalNeeded / 100).toFixed(2)}).`;
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
  } catch (err: unknown) {
    // Design point 4 â€” idempotency: unique constraint violation = already saved
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Unique constraint') && message.includes('sourceTransactionId')) {
      // Already created â€” idempotent, no error
      return null;
    }

    // Design point 5 â€” failure isolation: log and return warning, never throw
    console.error('[SaveMoreTomorrow] Auto-save failed (non-blocking):', message);
    return `Auto-save failed: ${message}`;
  }
}
