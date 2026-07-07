import { Loan } from '@prisma/client';
import { toMajor } from '@/lib/money';

export type RepaymentAllocation = {
  principalMinor: number;
  interestMinor: number;
  totalMinor: number;
  remainingLoanBalanceMinor: number;
};

export class LoanRepaymentCalculator {
  /**
   * Calculates the auto-interest dynamically based on the loan settings.
   */
  static calculateAutoInterest(loan: Loan): number {
    // Interest = (Balance * AnnualRate) / 12 months.
    // Ensure we multiply before divide to prevent floating point drift on large balances.
    const interest = Math.round((Number(loan.balanceMinor) * loan.annualRate) / 1200);
    return Math.max(0, interest);
  }

  /**
   * Validates and allocates a repayment amount between principal and interest.
   */
  static allocateRepayment(
    loan: Loan, 
    repaymentAmountMinor: number, 
    overrideInterestMinor?: number
  ): RepaymentAllocation {
    
    if (Number(loan.balanceMinor) <= 0) {
      throw new Error(`This loan is already fully paid off.`);
    }

    const interestMinor = Math.max(0, overrideInterestMinor ?? this.calculateAutoInterest(loan));
    
    // You cannot pay more interest than the total repayment amount
    const actualInterestMinor = Math.min(interestMinor, repaymentAmountMinor);
    const principalMinor = repaymentAmountMinor - actualInterestMinor;

    if (principalMinor > Number(loan.balanceMinor)) {
      throw new Error(`You can't pay more than you owe. This loan's remaining balance is ${toMajor(loan.balanceMinor)}.`);
    }

    const remainingLoanBalanceMinor = Number(loan.balanceMinor) - principalMinor;

    return {
      principalMinor,
      interestMinor: actualInterestMinor,
      totalMinor: repaymentAmountMinor,
      remainingLoanBalanceMinor
    };
  }
}
