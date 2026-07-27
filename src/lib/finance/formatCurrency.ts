import { toMajor } from '@/lib/money';
import { Money } from './types';

// Cache formatters so we don't instantiate Intl.NumberFormat repeatedly
const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(
  currency: string,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
) {
  const key = `${locale}-${currency}-${JSON.stringify(options)}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat(locale, options));
  }
  return formatters.get(key)!;
}

export type CurrencyVariant = 'standard' | 'compact' | 'accounting';

export interface FormatCurrencyOptions {
  locale?: string;
  variant?: CurrencyVariant;
  showSymbol?: boolean;
  precision?: number;
}

/**
 * Format a Money object into a localized string.
 * This is the ONLY place where Intl.NumberFormat should be called for money.
 */
export function formatCurrency(
  money: Money,
  options: FormatCurrencyOptions = {}
): string {
  const {
    locale = 'en-US',
    variant = 'standard',
    showSymbol = true,
    precision,
  } = options;

  const code = money.currency.trim().toUpperCase() || 'USD';
  const major = toMajor(money.amountMinor);
  const abs = Math.abs(major);
  const isNegative = major < 0;

  // Determine precision
  // If explicitly provided, use it. Otherwise, default to 2 for standard/accounting, and 0/1 for compact.
  // We can refine default precision by currency in the future.
  const minFractionDigits = precision ?? 2;
  const maxFractionDigits = precision ?? 2;

  // Compact variant logic
  if (variant === 'compact') {
    const sign = isNegative ? '-' : '';
    // Use Intl.NumberFormat with notation: 'compact'
    const compactFormatter = getFormatter(code, locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? code : undefined,
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: precision ?? (abs >= 100_000 ? 0 : 1),
      maximumFractionDigits: precision ?? (abs >= 100_000 ? 0 : 1),
    });
    
    // For accounting in compact? Unlikely, but if needed, we format abs and add parens.
    return compactFormatter.format(major);
  }

  // Formatting options for standard/accounting
  const formatOptions: Intl.NumberFormatOptions = {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? code : undefined,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  };

  const formatter = getFormatter(code, locale, formatOptions);

  if (variant === 'accounting' && isNegative) {
    // Format absolute value and wrap in parens
    return `(${formatter.format(abs)})`;
  }

  return formatter.format(major);
}
