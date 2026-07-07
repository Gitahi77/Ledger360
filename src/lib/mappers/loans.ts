import type { Loan } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';

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
    originalAmountMinor: toMoneyDTO(loan.originalAmountMinor),
    balanceMinor: toMoneyDTO(loan.balanceMinor),
    annualRate: Number(loan.annualRate),
    amortization: loan.amortization,
    monthlyPaymentMinor: toMoneyDTO(loan.monthlyPaymentMinor),
    nextDue: toDateDTO(loan.nextDue) as string,
    userId: loan.userId,
    createdAt: toDateDTO(loan.createdAt) as string,
    daysOverdue: loan.daysOverdue,
  };
}
