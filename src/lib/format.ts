/**
 * Copyright (c) 2024–present Eric Gitahi. All rights reserved.
 * Ledger360 — Financial amount formatting utilities
 *
 * Philosophy: Numbers are the language of financial clarity.
 * Large amounts must never be truncated or broken across lines.
 * We use three display strategies depending on context:
 *
 *  1. full     — USD 1,234,567.00  (tables, modals, precise contexts)
 *  2. compact  — USD 1.2M          (hero banners, KPI cards with large values)
 *  3. adaptive — auto-switches based on magnitude
 */

import { toMajor } from './money';

// Cache formatters so we don't instantiate Intl.NumberFormat repeatedly
const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, precise: boolean = false) {
  const code = currency?.trim().toUpperCase() || 'USD';
  const key = `${code}-${precise}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: precise ? 2 : 0,
      maximumFractionDigits: precise ? 2 : 0,
    }));
  }
  return formatters.get(key)!;
}

/**
 * Full precision: USD 1,234,567
 * Use in tables, modals, any context where precision matters.
 */
export function fmtFull(amountMinor: number, currency: string): string {
  return getFormatter(currency, false).format(toMajor(amountMinor));
}

/**
 * Two-decimal precision: USD 1,234,567.89
 * Use for loan balances, interest, and any calculation outputs.
 */
export function fmtPrecise(amountMinor: number, currency: string): string {
  return getFormatter(currency, true).format(toMajor(amountMinor));
}

/**
 * Compact: USD 1.2M, USD 45K
 * Use for hero banners and KPI cards where space is limited.
 * Switches at 10K to keep numbers from overflowing containers.
 */
export function fmtCompact(amountMinor: number, currency: string): string {
  const major = toMajor(amountMinor);
  const abs = Math.abs(major);
  const sign = major < 0 ? '-' : '';
  const code = currency?.trim().toUpperCase() || 'USD';
  
  // Custom compact format that preserves the currency symbol
  if (abs >= 1_000_000_000) return `${sign}${code} ${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}${code} ${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 100_000)       return `${sign}${code} ${(abs / 1_000).toFixed(0)}K`;
  if (abs >= 10_000)        return `${sign}${code} ${(abs / 1_000).toFixed(1)}K`;
  
  return getFormatter(currency, false).format(major);
}

/**
 * Adaptive: picks compact or full based on magnitude.
 * Threshold: above 999,999 → compact, otherwise → full.
 * Use in goal cards, budget rows, any responsive context.
 */
export function fmtAdaptive(amountMinor: number, currency: string, threshold = 999_999): string {
  return Math.abs(toMajor(amountMinor)) > threshold ? fmtCompact(amountMinor, currency) : fmtFull(amountMinor, currency);
}

/**
 * Raw number with commas (no currency symbol).
 * Use when the unit is stated separately.
 */
export function fmtRaw(amountMinor: number): string {
  return toMajor(amountMinor).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Smart format with subtext — returns { primary, sub } for two-line display.
 * Primary: compact value   Sub: "of USD X full"
 * Use in hero banners and goal progress cards.
 */
export function fmtWithSub(currentMinor: number, currency: string, targetMinor?: number): { primary: string; sub: string } {
  const primary = fmtAdaptive(currentMinor, currency);
  const sub = targetMinor !== undefined ? `of ${fmtAdaptive(targetMinor, currency)}` : '';
  return { primary, sub };
}

/**
 * Percentage — always a whole number with % sign.
 */
export function fmtPct(numerator: number, denominator: number): string {
  if (!denominator) return '0%';
  return `${Math.min(100, Math.round((numerator / denominator) * 100))}%`;
}

/**
 * Phase 6: Strict KES Formatting
 * Single source of truth for all Kenyan Shilling currency rendering.
 */
export function formatKES(amountCents: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function formatKESCompact(amountCents: number): string {
  const amount = amountCents / 100;
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
  return `KES ${amount.toFixed(0)}`;
}
  
/**  
 * Centralized error normalization for UI components.  
 */  
export function getErrorMessage(error: unknown): string {  
  if (error instanceof Error) return error.message;  
  if (typeof error === 'string') return error;  
  if (typeof error === 'object' && error !== null && 'message' in error) return String(error.message);  
  return 'An unexpected error occurred.';  
} 
