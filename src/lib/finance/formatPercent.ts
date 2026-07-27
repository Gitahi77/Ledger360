export interface FormatPercentOptions {
  locale?: string;
  decimals?: number;
  forceSign?: boolean; // If true, adds '+' for positive values
}

/**
 * Format a number into a localized percentage string.
 * This is the ONLY place where percentages should be formatted.
 * 
 * @param value The value to format (e.g., 0.052 for 5.2%)
 */
export function formatPercent(
  value: number,
  options: FormatPercentOptions = {}
): string {
  const {
    locale = 'en-US',
    decimals = 1,
    forceSign = false,
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    // Intl.NumberFormat supports signDisplay: 'always' for forcing the sign
    signDisplay: forceSign ? 'always' : 'auto',
  });

  return formatter.format(value);
}
