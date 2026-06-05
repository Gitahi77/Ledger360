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
  toAccountId: string;
  amountMinor: number;
  date: string;
  note?: string;
}) {
  const { AddTransferSchema } = await import('@/lib/validation');
  const data = AddTransferSchema.parse(raw);
  const user = await requireAuth();

  // Validate that accounts belong to the user
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({ where: { id: data.fromAccountId, userId: user.id } }),
    prisma.account.findFirst({ where: { id: data.toAccountId, userId: user.id } }),
  ]);

  if (!fromAccount) throw new Error('Invalid From Account');
  if (!toAccount) throw new Error('Invalid To Account');

  // Same-currency transfers only for now
  if (fromAccount.currency !== toAccount.currency) {
    throw new Error('Multi-currency transfers are not yet supported. Both accounts must have the same currency.');
  }

  const newTransfer = await prisma.transfer.create({
    data: {
      userId: user.id,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amountMinor: data.amountMinor,
      currency: fromAccount.currency,
      baseAmountMinor: data.amountMinor, // fxRate = 1
      fxRate: 1,
      date: new Date(data.date),
      note: data.note,
      source: 'MANUAL',
    },
  });

  // Security Audit
  await logActivity({
    userId: user.id,
    action: 'CREATE',
    resource: 'Transfer',
    metadata: { transferId: newTransfer.id, amount: data.amountMinor, from: data.fromAccountId, to: data.toAccountId },
  });

  revalidatePath('/transactions');
  revalidatePath('/accounts');
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
