// src/lib/actions/loans.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { computeLoanBalance } from '@/lib/shared-computations';
import type { Loan } from '@prisma/client';
import { z } from 'zod';

const DeleteSchema = z.object({ id: z.string().cuid() });
const EditLoanSchema = z.object({
  name: z.string().optional(),
  lender: z.string().optional(),
  type: z.string().optional(),
  originalAmountMinor: z.number().int().positive().optional(),
  balanceMinor: z.number().int().optional(),
  annualRate: z.number().optional(),
  amortization: z.string().optional(),
  monthlyPaymentMinor: z.number().int().positive().optional(),
  nextDue: z.string().optional(),
});

export async function getLoansForUser(userId: string) {
  const today = new Date();

  const loans = await prisma.loan.findMany({
    where:   { userId: userId },
    orderBy: { annualRate: 'desc' },
  });

  const transferAgg = await prisma.transfer.groupBy({
    by: ['loanId'],
    where: { userId, loanId: { not: null }, toAccountId: null },
    _sum: { baseAmountMinor: true, interestMinor: true }
  });

  const transferMap = new Map(transferAgg.map((t: any) => [
    t.loanId,
    (t._sum.baseAmountMinor ?? 0) - (t._sum.interestMinor ?? 0)
  ]));

  return loans.map((l: any) => {
    const due  = new Date(l.nextDue);
    const auto = due < today
      ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
      : 0;
    const repaidAmount = transferMap.get(l.id) ?? 0;
    const currentBalanceMinor = computeLoanBalance(l.balanceMinor, repaidAmount);
    
    return { ...l, balanceMinor: currentBalanceMinor, daysOverdue: auto };
  });
}

export async function getLoans() {
  const user = await requireAuth();
  return getLoansForUser(user.id);
}

/* ── Add (Zod-validated) ──────────────────────────────────── */
export async function addLoan(raw: unknown) {
  'use server';
  try {
    const { AddLoanSchema } = await import('@/lib/validation');
    const parsed = AddLoanSchema.safeParse(raw);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;
    const user = await requireAuth();
    
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          name: data.name,
          lender: data.lender,
          type: data.type,
          userId: user.id,
          nextDue: new Date(data.nextDue),
          originalAmountMinor: data.originalAmountMinor,
          balanceMinor: data.balanceMinor,
          monthlyPaymentMinor: data.monthlyPaymentMinor,
          annualRate: data.annualRate,
          amortization: data.amortization,
        },
      });

      if (data.disbursementType === 'received_funds' && data.disbursementAccountId) {
        await tx.transfer.create({
          data: {
            userId: user.id,
            fromAccountId: null,
            toAccountId: data.disbursementAccountId,
            amountMinor: data.balanceMinor,
            currency: user.currency || 'KES',
            baseAmountMinor: data.balanceMinor,
            fxRate: 1,
            date: new Date(),
            source: 'loan_disbursement',
            loanId: loan.id,
          }
        });
      }
    });
    revalidatePath('/loans');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[addLoan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteLoan(id: string) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    await prisma.loan.deleteMany({ where: { id: validId, userId: user.id } });
    revalidatePath('/loans');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[deleteLoan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editLoan(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    const parsedData = EditLoanSchema.safeParse(rawData);
    if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;
    const data = parsedData.data;

    const updateData: Record<string, unknown> = { ...data };
    if (data.nextDue) updateData.nextDue = new Date(data.nextDue);

    const { count } = await prisma.loan.updateMany({
      where: { id: validId, userId: user.id },
      data: updateData,
    });
    if (count === 0) return { error: 'Loan not found or ownership failed' };
    
    revalidatePath('/loans');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[editLoan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
