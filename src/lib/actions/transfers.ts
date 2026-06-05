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

  // Validate that accounts belong to the user
  const fromAccount = await prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } });
  if (!fromAccount) throw new Error('Invalid From Account');

  let toAccount = null;
  if (data.toAccountId) {
    toAccount = await prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } });
    if (!toAccount) throw new Error('Invalid To Account');
    
    // Same-currency transfers only for now
    if (fromAccount.currency !== toAccount.currency) {
      throw new Error('Multi-currency transfers are not yet supported. Both accounts must have the same currency.');
    }
  }

  if (data.goalId) {
    const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId: user.id } });
    if (!goal) throw new Error('Invalid Goal');
  }

  if (data.loanId) {
    const loan = await prisma.loan.findFirst({ where: { id: data.loanId, userId: user.id } });
    if (!loan) throw new Error('Invalid Loan');
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
