// src/lib/actions/loans.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

export async function getLoans() {
  const user  = await requireAuth();
  const today = new Date();

  const loans = await prisma.loan.findMany({
    where:   { userId: user.id },
    orderBy: { annualRate: 'desc' },
  });

  return loans.map(l => {
    const due  = new Date(l.nextDue);
    const auto = due < today
      ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
      : 0;
    return { ...l, daysOverdue: Math.max(l.daysOverdue, auto) };
  });
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addLoan(raw: {
  name: string; lender: string; type: string;
  originalAmt: number; balance: number;
  annualRate: number; monthlyPmt: number; nextDue: string;
}) {
  const { AddLoanSchema } = await import('@/lib/validation');
  const data = AddLoanSchema.parse(raw);
  const user = await requireAuth();
  await prisma.loan.create({
    data: { ...data, nextDue: new Date(data.nextDue), userId: user.id },
  });
  revalidatePath('/loans');
  revalidatePath('/');
}

export async function updateLoanBalance(
  id: string,
  balance: number,
  daysOverdue: number,
  nextDue?: string,
) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.loan.updateMany({
    where: { id, userId: user.id },
    data:  {
      balance:     Math.max(0, Number(balance)),
      daysOverdue: Math.max(0, Math.floor(Number(daysOverdue))),
      ...(nextDue ? { nextDue: new Date(nextDue) } : {}),
    },
  });
  revalidatePath('/loans');
  revalidatePath('/');
}

export async function deleteLoan(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.loan.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/loans');
  revalidatePath('/');
}
