import type { Loan } from '@prisma/client';
import { serializeMoney, serializeDate } from './core';

export type LoanDTO = {
  id: string;
  name: string;
  lender: string;
  type: string;
  originalAmountMinor: number;
  balanceMinor: number;
  annualRate: number;
  amortization: string;
  monthlyPaymentMinor: number;
  nextDue: string;
  userId: string;
  createdAt: string;
  daysOverdue?: number; // added during hydration
};

export function mapLoanToDTO(
  loan: Loan & { daysOverdue?: number }
): LoanDTO {
  return {
    id: loan.id,
    name: loan.name,
    lender: loan.lender,
    type: loan.type,
    originalAmountMinor: serializeMoney(loan.originalAmountMinor),
    balanceMinor: serializeMoney(loan.balanceMinor),
    annualRate: Number(loan.annualRate),
    amortization: loan.amortization,
    monthlyPaymentMinor: serializeMoney(loan.monthlyPaymentMinor),
    nextDue: serializeDate(loan.nextDue) as string,
    userId: loan.userId,
    createdAt: serializeDate(loan.createdAt) as string,
    daysOverdue: loan.daysOverdue,
  };
}
