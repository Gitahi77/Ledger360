// src/lib/queries/loans.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../actions/_auth';
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

/* -- Add (Zod-validated) ------------------------------------ */





