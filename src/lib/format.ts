/**
 * Copyright (c) 2024–present Eric Gitahi. All rights reserved.
 * Ledger360 — Financial amount formatting utilities
 *
 * Philosophy: Numbers are the language of financial clarity.
 * Large amounts must never be truncated or broken across lines.
 * We use three display strategies depending on context:
 *
 *  1. full     — KES 1,234,567.00  (tables, modals, precise contexts)
 *  2. compact  — KES 1.2M          (hero banners, KPI cards with large values)
 *  3. adaptive — auto-switches based on magnitude
 */

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const KES_PRECISE = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Full precision: KES 1,234,567
 * Use in tables, modals, any context where precision matters.
 */
export function fmtFull(amount: number): string {
  return KES.format(amount);
}

/**
 * Two-decimal precision: KES 1,234,567.89
 * Use for loan balances, interest, and any calculation outputs.
 */
export function fmtPrecise(amount: number): string {
  return KES_PRECISE.format(amount);
}

/**
 * Compact: KES 1.2M, KES 45K
 * Use for hero banners and KPI cards where space is limited.
 * Switches at 10K to keep numbers from overflowing containers.
 */
export function fmtCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}KES ${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}KES ${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 100_000)       return `${sign}KES ${(abs / 1_000).toFixed(0)}K`;
  if (abs >= 10_000)        return `${sign}KES ${(abs / 1_000).toFixed(1)}K`;
  return KES.format(amount);
}

/**
 * Adaptive: picks compact or full based on magnitude.
 * Threshold: above 999,999 → compact, otherwise → full.
 * Use in goal cards, budget rows, any responsive context.
 */
export function fmtAdaptive(amount: number, threshold = 999_999): string {
  return Math.abs(amount) > threshold ? fmtCompact(amount) : fmtFull(amount);
}

/**
 * Raw number with commas (no currency symbol).
 * Use when the unit is stated separately.
 */
export function fmtRaw(amount: number): string {
  return amount.toLocaleString('en-KE', { maximumFractionDigits: 0 });
}

/**
 * Smart format with subtext — returns { primary, sub } for two-line display.
 * Primary: compact value   Sub: "of KES X full"
 * Use in hero banners and goal progress cards.
 */
export function fmtWithSub(current: number, target?: number): { primary: string; sub: string } {
  const primary = fmtAdaptive(current);
  const sub = target !== undefined ? `of ${fmtAdaptive(target)}` : '';
  return { primary, sub };
}

/**
 * Percentage — always a whole number with % sign.
 */
export function fmtPct(numerator: number, denominator: number): string {
  if (!denominator) return '0%';
  return `${Math.min(100, Math.round((numerator / denominator) * 100))}%`;
}
