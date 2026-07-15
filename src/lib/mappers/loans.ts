import type { Loan } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';
import type { MoneyDTO } from '../types/domain';

export type LoanDTO = {
  id: string;
  name: string;
  lender: string;
  type: string;
  originalMoney: MoneyDTO;
  balanceMoney: MoneyDTO;
  annualRate: number;
  amortization: string;
  monthlyPaymentMoney: MoneyDTO;
  nextDue: string;
  userId: string;
  createdAt: string;
  daysOverdue?: number; // added during hydration
};

export function mapLoanToDTO(
  loan: Loan & { daysOverdue?: number },
  baseCurrency: string = 'KES'
): LoanDTO {
  return {
    id: loan.id,
    name: loan.name,
    lender: loan.lender,
    type: loan.type,
    originalMoney: { amountMinor: toMoneyDTO(loan.originalAmountMinor), currency: baseCurrency },
    balanceMoney: { amountMinor: toMoneyDTO(loan.balanceMinor), currency: baseCurrency },
    annualRate: Number(loan.annualRate),
    amortization: loan.amortization,
    monthlyPaymentMoney: { amountMinor: toMoneyDTO(loan.monthlyPaymentMinor), currency: baseCurrency },
    nextDue: toDateDTO(loan.nextDue) as string,
    userId: loan.userId,
    createdAt: toDateDTO(loan.createdAt) as string,
    daysOverdue: loan.daysOverdue,
  };
}
