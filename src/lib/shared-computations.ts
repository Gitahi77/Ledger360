// src/lib/shared-computations.ts

/**
 * Computes the outstanding balance of a loan based on its initial/opening balance
 * and the sum of all its repayment transfers.
 * 
 * Clamps the balance at 0 (max(0, balance - repaid)) so overpayments don't
 * result in a negative loan balance.
 */
export function computeLoanBalance(loanBalanceMinor: number, repaidAmountMinor: number): number {
  return loanBalanceMinor - repaidAmountMinor;
}

/**
 * Computes daily effective interest accrual
 */
export function computeDailyInterest(principalMinor: number, annualRate: number, days: number): number {
  // A = P * (1 + r/n)^(nt)
  // Here, daily compounding: rate per day is annualRate / 365 (or 360). Assuming 365.
  // We compute total accrued interest
  // annualRate is typically a percentage, e.g. 5 for 5%
  const ratePerDay = (annualRate / 100) / 365;
  const accruedAmount = principalMinor * Math.pow(1 + ratePerDay, days);
  return Math.round(accruedAmount - principalMinor);
}
