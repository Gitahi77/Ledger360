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
export function toMajor(minor: number): number {
  return minor / 100;
}

/**
 * Type-guard: assert a value is a safe integer (minor units).
 * Use at API boundaries before writing to DB.
 */
export function assertMinor(value: number, label = 'amount'): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer (minor units), got ${value}`);
  }
}
