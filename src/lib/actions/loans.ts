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
  originalAmountMinor: number; balanceMinor: number;
  annualRate: number; monthlyPaymentMinor: number; nextDue: string;
}) {
  const { AddLoanSchema } = await import('@/lib/validation');
  const data = AddLoanSchema.parse(raw);
  const user = await requireAuth();
  await prisma.loan.create({
    data: {
      ...data,
      userId: user.id,
      nextDue: new Date(data.nextDue),
      originalAmountMinor: data.originalAmountMinor,
      balanceMinor: data.balanceMinor,
      monthlyPaymentMinor: data.monthlyPaymentMinor,
    },
  });
  revalidatePath('/loans');
  revalidatePath('/');
}

export async function updateLoanBalance(
  id: string,
  balanceMinor: number,
  daysOverdue: number,
  nextDue?: string,
) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.loan.updateMany({
    where: { id, userId: user.id },
    data:  {
      balanceMinor:     Math.max(0, Number(balanceMinor)),
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

export async function editLoan(id: string, data: {
  name?: string; lender?: string; type?: string; originalAmountMinor?: number; balanceMinor?: number;
  annualRate?: number; monthlyPaymentMinor?: number; nextDue?: string; daysOverdue?: number;
}) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');

  const updateData: any = { ...data };
  if (data.nextDue) updateData.nextDue = new Date(data.nextDue);

  const { count } = await prisma.loan.updateMany({
    where: { id, userId: user.id },
    data: updateData,
  });
  if (count === 0) throw new Error('Loan not found or ownership failed');
  
  revalidatePath('/loans');
  revalidatePath('/');
}
