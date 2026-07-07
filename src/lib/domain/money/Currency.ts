export type CurrencyCode = string; // e.g., 'KES', 'USD', 'EUR'

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
  name: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, Currency> = {
  KES: { code: 'KES', symbol: 'KSh', decimals: 2, name: 'Kenyan Shilling' },
  USD: { code: 'USD', symbol: '$', decimals: 2, name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, name: 'British Pound' },
};

export function getCurrency(code: CurrencyCode): Currency {
  return SUPPORTED_CURRENCIES[code] || { code, symbol: code, decimals: 2, name: code };
}
