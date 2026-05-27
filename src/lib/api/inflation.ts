// src/lib/api/inflation.ts
// Kenya CPI / inflation helpers — no external API needed
// Source: KNBS Consumer Price Index (CPI), 2024-2025 average
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.

/** Current Kenya annual inflation rate (KNBS CPI, 2024-2025 average) */
export const KENYA_ANNUAL_CPI = 0.068; // 6.8%

/** Monthly equivalent */
export const KENYA_MONTHLY_CPI = Math.pow(1 + KENYA_ANNUAL_CPI, 1 / 12) - 1;

/**
 * How much you need to save in the future to equal `currentAmount` in today's money.
 * e.g. inflationAdjustedTarget(500_000, 2) → ~571,122 (need more to keep same value)
 */
export function inflationAdjustedTarget(currentAmount: number, years: number): number {
  return Math.round(currentAmount * Math.pow(1 + KENYA_ANNUAL_CPI, years));
}

/**
 * What a future amount is worth in today's money (real value).
 * e.g. realValue(500_000, 2) → ~438,052
 */
export function realValue(futureAmount: number, years: number): number {
  return Math.round(futureAmount / Math.pow(1 + KENYA_ANNUAL_CPI, years));
}

/**
 * Returns years between now and a target date (can be fractional).
 */
export function yearsUntil(targetDate: Date | string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * How much additional monthly saving is needed to offset inflation
 * on an existing monthly contribution.
 */
export function inflationMonthlyLift(monthlyContribution: number): number {
  return Math.round(monthlyContribution * KENYA_MONTHLY_CPI);
}
