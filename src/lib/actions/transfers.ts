'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/audit';

/* ── Fetch ────────────────────────────────────────────────── */
export async function getTransfers(period?: 'this-month' | 'last-30-days' | 'all-time') {
  const user = await requireAuth();

  // Basic date filtering
  let dateFilter = {};
  if (period === 'this-month') {
    const now = new Date();
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  } else if (period === 'last-30-days') {
    const d = new Date();
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
export async function createTransfer(raw: {
  fromAccountId: string;
  toAccountId?: string | null;
  amountMinor: number;
  date: string;
  note?: string;
  goalId?: string | null;
  loanId?: string | null;
}) {
  const { AddTransferSchema } = await import('@/lib/validation');
  const data = AddTransferSchema.parse(raw);
  const user = await requireAuth();

  const { toMajor } = await import('@/lib/money');

  // Validate that accounts belong to the user
  const fromAccount = await prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } });
  if (!fromAccount) throw new Error('Please choose a valid From Account.');

  let toAccount = null;
  if (data.toAccountId) {
    toAccount = await prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } });
    if (!toAccount) throw new Error('Please choose a valid To Account.');
    
    // Same-currency transfers only for now
    if (fromAccount.currency !== toAccount.currency) {
      throw new Error('Multi-currency transfers are not yet supported. Both accounts must have the same currency.');
    }
  }

  if (data.goalId) {
    const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId: user.id } });
    if (!goal) throw new Error('Please choose a valid goal.');
  }

  if (data.loanId) {
    const { getLoansForUser } = await import('@/lib/actions/loans');
    const loans = await getLoansForUser(user.id);
    const loan = loans.find(l => l.id === data.loanId);
    if (!loan) throw new Error('Please choose a valid loan.');
    
    if (data.amountMinor > loan.balanceMinor) {
      throw new Error(`You can't pay more than you owe. This loan's remaining balance is ${loan.currency} ${toMajor(loan.balanceMinor)}.`);
    }
  }

  // Overdraft prevention
  if (fromAccount.type !== 'credit_card') {
    const { getAccountBalances } = await import('@/lib/actions/accounts');
    const balances = await getAccountBalances(user.id);
    const acc = balances.find(a => a.id === fromAccount.id);
    if (acc && acc.balanceMinor - data.amountMinor < 0) {
      throw new Error(`Not enough money in ${fromAccount.name}. Available: ${fromAccount.currency} ${toMajor(acc.balanceMinor)}.`);
    }
  }

  const newTransfer = await prisma.transfer.create({
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
      source: 'MANUAL',
    },
  });

  // Security Audit
  await logActivity({
    userId: user.id,
    action: 'CREATE',
    resource: 'Transfer',
    metadata: { transferId: newTransfer.id, amount: data.amountMinor, from: data.fromAccountId, to: data.toAccountId ?? undefined, goal: data.goalId ?? undefined, loan: data.loanId ?? undefined },
  });

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/finance');
  revalidatePath('/');
}

export async function editTransfer(id: string, raw: {
  fromAccountId: string;
  toAccountId?: string | null;
  amountMinor: number;
  date: string;
  note?: string;
  goalId?: string | null;
  loanId?: string | null;
}) {
  const { AddTransferSchema } = await import('@/lib/validation');
  const data = AddTransferSchema.parse(raw);
  const user = await requireAuth();
  const { toMajor } = await import('@/lib/money');

  const oldTransfer = await prisma.transfer.findFirst({ where: { id, userId: user.id } });
  if (!oldTransfer) throw new Error('Transfer not found');

  const fromAccount = await prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } });
  if (!fromAccount) throw new Error('Please choose a valid From Account.');

  let toAccount = null;
  if (data.toAccountId) {
    toAccount = await prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } });
    if (!toAccount) throw new Error('Please choose a valid To Account.');
    if (fromAccount.currency !== toAccount.currency) {
      throw new Error('Multi-currency transfers are not yet supported. Both accounts must have the same currency.');
    }
  }

  if (data.goalId) {
    const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId: user.id } });
    if (!goal) throw new Error('Please choose a valid goal.');
  }

  if (data.loanId) {
    const { getLoansForUser } = await import('@/lib/actions/loans');
    const loans = await getLoansForUser(user.id);
    const loan = loans.find(l => l.id === data.loanId);
    if (!loan) throw new Error('Please choose a valid loan.');
    
    // Headroom = outstanding + oldRepaymentAmount (if editing the SAME loan repayment)
    const isSameLoan = oldTransfer.loanId === data.loanId;
    const oldRepaymentAmount = isSameLoan ? oldTransfer.amountMinor : 0;
    const headroom = loan.balanceMinor + oldRepaymentAmount;

    if (data.amountMinor > headroom) {
      throw new Error(`You can't pay more than you owe. This loan's remaining balance is ${loan.currency} ${toMajor(headroom)}.`);
    }
  }

  if (fromAccount.type !== 'credit_card') {
    const { getAccountBalances } = await import('@/lib/actions/accounts');
    const balances = await getAccountBalances(user.id);
    const acc = balances.find(a => a.id === fromAccount.id);
    if (acc) {
      // Effective Balance = currentBalance + oldAmount (if editing from the SAME account)
      const isSameAccount = oldTransfer.fromAccountId === data.fromAccountId;
      const oldAmount = isSameAccount ? oldTransfer.amountMinor : 0;
      const effectiveBalance = acc.balanceMinor + oldAmount;
      
      if (effectiveBalance - data.amountMinor < 0) {
        throw new Error(`Not enough money in ${fromAccount.name}. Available: ${fromAccount.currency} ${toMajor(effectiveBalance)}.`);
      }
    }
  }

  // Atomic ownership update
  const { count } = await prisma.transfer.updateMany({
    where: { id, userId: user.id },
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
    },
  });

  if (count === 0) throw new Error('Transfer not found or unauthorized');

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    resource: 'Transfer',
    metadata: { transferId: id, amount: data.amountMinor },
  });

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/finance');
  revalidatePath('/');
}

/* ── Delete (atomic — no TOCTOU race) ────────────────────── */
export async function deleteTransfer(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');

  // atomic ownership enforce
  const { count } = await prisma.transfer.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) throw new Error('Transfer not found or already deleted');

  // Security Audit
  await logActivity({
    userId:   user.id,
    action:   'DELETE',
    resource: 'Transfer',
    metadata: { transferId: id },
  });

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/');
}
