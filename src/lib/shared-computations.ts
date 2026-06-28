// src/lib/shared-computations.ts

/**
 * Returns the outstanding loan balance after repayments.
 * Clamps at 0 — overpayments do not produce negative balances.
 */
export function computeLoanBalance(loanBalanceMinor: number, repaidAmountMinor: number): number {
  return Math.max(0, loanBalanceMinor - repaidAmountMinor);
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
