// src/lib/money.ts
// Centralised money helpers — the ONLY place minor↔major conversion happens.
// Constitution: "Convert minor<->major ONLY in src/lib/money.ts."

/**
 * Convert a major-unit value (e.g. 12.50) to minor units (1250).
 * Rounds to nearest integer to avoid floating-point drift.
 */
export function toMinor(major: number): number {
  return Math.round(major * 100);
}

/**
 * Convert minor units (1250) back to major (12.50) for display only.
 */
export function toMajor(minor: number | bigint): number {
  return Number(minor) / 100;
}

/**
 * Type-guard: assert a value is a safe integer (minor units).
 * Use at API boundaries before writing to DB.
 */
export function assertMinor(amount: unknown): number {
  if (typeof amount === 'bigint') return Number(amount);
  return Number(amount);
}

export const MAX_TRANSACTION_AMOUNT_MAJOR = 100_000_000_000;

export const CurrencyPrecision: Record<string, number> = {
  KES: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  KWD: 3,
};

export function getCurrencyDecimals(currency: string): number {
  return CurrencyPrecision[currency.toUpperCase()] ?? 2; // Default to 2
}
