// src/lib/shared-computations.ts

/**
 * Computes the outstanding balance of a loan based on its initial/opening balance
 * and the sum of all its repayment transfers.
 * 
 * Clamps the balance at 0 (max(0, balance - repaid)) so overpayments don't
 * result in a negative loan balance.
 */
export function computeLoanBalance(loanBalanceMinor: number, repaidAmountMinor: number): number {
  return Math.max(0, loanBalanceMinor - repaidAmountMinor);
}
