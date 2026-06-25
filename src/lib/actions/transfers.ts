'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/audit';
import { getNairobiNow } from '@/lib/dateUtils';
import { z } from 'zod';

const DeleteSchema = z.object({ id: z.string().cuid() });

/* ── Fetch ────────────────────────────────────────────────── */
export async function getTransfers(period?: 'this-month' | 'last-30-days' | 'all-time') {
  const user = await requireAuth();

  // Basic date filtering
  let dateFilter = {};
  if (period === 'this-month') {
    const now = getNairobiNow();
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  } else if (period === 'last-30-days') {
    const d = getNairobiNow();
    d.setDate(d.getDate() - 30);
    dateFilter = { gte: d };
  }

  return prisma.transfer.findMany({
    where: { 
      userId: user.id,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    },
    include: {
      fromAccount: { select: { name: true, currency: true } },
      toAccount: { select: { name: true, currency: true } },
    },
    orderBy: { date: 'desc' },
  });
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function createTransfer(raw: unknown) {
  try {
    const { AddTransferSchema } = await import('@/lib/validation');
    const parsed = AddTransferSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();

    const { toMajor } = await import('@/lib/money');

    const [fromAccount, toAccount, goal] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } }),
      data.toAccountId ? prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } }) : Promise.resolve(null),
      data.goalId ? prisma.goal.findFirst({ where: { id: data.goalId, userId: user.id } }) : Promise.resolve(null)
    ]);

    if (!fromAccount) throw new Error('Please choose a valid From Account.');
    if (data.toAccountId) {
      if (!toAccount) throw new Error('Please choose a valid To Account.');
      // Same-currency transfers only for now
      if (fromAccount.currency !== toAccount.currency) {
        throw new Error('Multi-currency transfers are not yet supported. Both accounts must have the same currency.');
      }
    }
    if (data.goalId && !goal) {
      throw new Error('Please choose a valid goal.');
    }

    let finalInterestMinor = 0;
    if (data.loanId) {
      const { getLoansForUser } = await import('@/lib/actions/loans');
      const loans = await getLoansForUser(user.id);
      const loan = loans.find((l: any) => l.id === data.loanId);
      if (!loan) throw new Error('Please choose a valid loan.');
      
      // Auto-compute default interest (multiply before divide to prevent FP drift)
      const autoInterest = Math.round((loan.balanceMinor * loan.annualRate) / 1200);
      finalInterestMinor = data.interestMinor ?? autoInterest;

      // Server-side validation
      if (finalInterestMinor < 0) finalInterestMinor = 0;
      if (finalInterestMinor > data.amountMinor) {
        finalInterestMinor = data.amountMinor;
      }
      
      const principal = data.amountMinor - finalInterestMinor;
      if (principal > loan.balanceMinor) {
        throw new Error(`You can't pay more than you owe. This loan's remaining balance is  ${toMajor(loan.balanceMinor)}.`);
      }
    }

    // Overdraft prevention
    if (fromAccount.type !== 'CREDIT_CARD') {
      const { getAccountBalances } = await import('@/lib/actions/accounts');
      const balances = await getAccountBalances(user.id);
      const acc = balances.find((a: any) => a.id === fromAccount.id);
      if (acc && acc.balanceMinor - data.amountMinor < 0) {
        throw new Error(`Not enough money in ${fromAccount.name}. Available: ${fromAccount.currency} ${toMajor(acc.balanceMinor)}.`);
      }
    }

    const newTransfer = await prisma.$transaction(async (tx) => {
      const createdTransfer = await tx.transfer.create({
        data: {
          userId: user.id,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId || null,
          amountMinor: data.amountMinor,
          currency: fromAccount.currency,
          baseAmountMinor: data.amountMinor, // fxRate = 1
          fxRate: 1,
          date: new Date(data.date),
          note: data.note,
          goalId: data.goalId || null,
          loanId: data.loanId || null,
          interestMinor: finalInterestMinor,
          source: 'MANUAL',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          resource: 'Transfer',
          metadata: JSON.stringify({ transferId: createdTransfer.id, amount: data.amountMinor, from: data.fromAccountId, to: data.toAccountId ?? undefined, goal: data.goalId ?? undefined, loan: data.loanId ?? undefined }),
        }
      });

      return createdTransfer;
    });

    revalidatePath('/transactions');
    revalidatePath('/accounts');
    revalidatePath('/finance');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[createTransfer]', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
    return { error: msg };
  }
}

export async function editTransfer(id: string, rawData: unknown) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    const { AddTransferSchema } = await import('@/lib/validation');
    const parsedData = AddTransferSchema.safeParse(rawData);
    if (!parsedData.success) return { error: 'Invalid input' };
    const data = parsedData.data;

    const { toMajor } = await import('@/lib/money');

    const [oldTransfer, fromAccount, toAccount, goal] = await Promise.all([
      prisma.transfer.findFirst({ where: { id: validId, userId: user.id } }),
      prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } }),
      data.toAccountId ? prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } }) : Promise.resolve(null),
      data.goalId ? prisma.goal.findFirst({ where: { id: data.goalId, userId: user.id } }) : Promise.resolve(null)
    ]);

    if (!oldTransfer) return { error: 'Transfer not found' };
    if (!fromAccount) return { error: 'Please choose a valid From Account.' };

    if (data.toAccountId) {
      if (!toAccount) return { error: 'Please choose a valid To Account.' };
      if (fromAccount.currency !== toAccount.currency) {
        return { error: 'Multi-currency transfers are not yet supported. Both accounts must have the same currency.' };
      }
    }

    if (data.goalId && !goal) {
      return { error: 'Please choose a valid goal.' };
    }

    if (data.loanId) {
      const { getLoansForUser } = await import('@/lib/actions/loans');
      const loans = await getLoansForUser(user.id);
      const loan = loans.find((l: any) => l.id === data.loanId);
      if (!loan) return { error: 'Please choose a valid loan.' };
      
      // Headroom = outstanding + oldRepaymentAmount (if editing the SAME loan repayment)
      const isSameLoan = oldTransfer.loanId === data.loanId;
      
      let finalInterestMinor = 0;
      const autoInterest = Math.round((loan.balanceMinor * loan.annualRate) / 1200);
      finalInterestMinor = data.interestMinor ?? autoInterest;
      if (finalInterestMinor < 0) finalInterestMinor = 0;

      const principal = data.amountMinor - finalInterestMinor;
      const oldRepaymentPrincipal = isSameLoan ? (oldTransfer.baseAmountMinor - oldTransfer.interestMinor) : 0;
      const headroom = loan.balanceMinor + oldRepaymentPrincipal;

      if (principal > headroom) {
        return { error: `You can't pay more than you owe. This loan's remaining balance is  ${toMajor(headroom)}.` };
      }
    }

    if (fromAccount.type !== 'CREDIT_CARD') {
      const { getAccountBalances } = await import('@/lib/actions/accounts');
      const balances = await getAccountBalances(user.id);
      const acc = balances.find((a: any) => a.id === fromAccount.id);
      if (acc) {
        // Effective Balance = currentBalance + oldAmount (if editing from the SAME account)
        const isSameAccount = oldTransfer.fromAccountId === data.fromAccountId;
        const oldAmount = isSameAccount ? oldTransfer.amountMinor : 0;
        const effectiveBalance = acc.balanceMinor + oldAmount;
        
        if (effectiveBalance - data.amountMinor < 0) {
          return { error: `Not enough money in ${fromAccount.name}. Available: ${fromAccount.currency} ${toMajor(effectiveBalance)}.` };
        }
      }
    }
    let finalInterestMinor = 0;
    if (data.loanId) {
      const { getLoansForUser } = await import('@/lib/actions/loans');
      const loans = await getLoansForUser(user.id);
      const loan = loans.find((l: any) => l.id === data.loanId);
      if (loan) {
        const autoInterest = Math.round((loan.balanceMinor * loan.annualRate) / 1200);
        finalInterestMinor = data.interestMinor ?? autoInterest;
        if (finalInterestMinor < 0) finalInterestMinor = 0;
      }
    }

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.transfer.updateMany({
        where: { id: validId, userId: user.id },
        data: {
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId || null,
          amountMinor: data.amountMinor,
          currency: fromAccount.currency,
          baseAmountMinor: data.amountMinor,
          date: new Date(data.date),
          note: data.note,
          goalId: data.goalId || null,
          loanId: data.loanId || null,
          interestMinor: finalInterestMinor,
        },
      });

      if (count === 0) throw new Error('Transfer not found or unauthorized');

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resource: 'Transfer',
          metadata: JSON.stringify({ transferId: validId, amount: data.amountMinor }),
        }
      });
    });

    revalidatePath('/transactions');
    revalidatePath('/accounts');
    revalidatePath('/finance');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[editTransfer]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/* ── Delete (atomic — no TOCTOU race) ────────────────────── */
export async function deleteTransfer(id: string) {
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.transfer.deleteMany({
        where: { id: validId, userId: user.id },
      });
      if (count === 0) throw new Error('Transfer not found or already deleted');

      await tx.auditLog.create({
        data: {
          userId:   user.id,
          action:   'DELETE',
          resource: 'Transfer',
          metadata: JSON.stringify({ transferId: validId }),
        }
      });
    });

    revalidatePath('/transactions');
    revalidatePath('/accounts');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[deleteTransfer]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
