// src/lib/actions/loans.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { computeLoanBalance } from '@/lib/shared-computations';

export async function getLoansForUser(userId: string) {
  const today = new Date();

  const loans = await prisma.loan.findMany({
    where:   { userId: userId },
    include: {
      transfers: { select: { baseAmountMinor: true } }
    },
    orderBy: { annualRate: 'desc' },
  });

  return loans.map(l => {
    const due  = new Date(l.nextDue);
    const auto = due < today
      ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
      : 0;
    const repaidAmount = l.transfers.reduce((s, t) => s + t.baseAmountMinor, 0);
    const currentBalanceMinor = computeLoanBalance(l.balanceMinor, repaidAmount);
    
    const { transfers, ...rest } = l;
    return { ...rest, balanceMinor: currentBalanceMinor, daysOverdue: auto };
  });
}

export async function getLoans() {
  const user = await requireAuth();
  return getLoansForUser(user.id);
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

export async function deleteLoan(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.loan.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/loans');
  revalidatePath('/');
}

export async function editLoan(id: string, data: {
  name?: string; lender?: string; type?: string; originalAmountMinor?: number; balanceMinor?: number;
  annualRate?: number; monthlyPaymentMinor?: number; nextDue?: string;
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
