import { CurrencyCode, getCurrency } from './Currency';

export class CurrencyFormatter {
  static format(majorAmount: number, currencyCode: CurrencyCode, locale: string = 'en-US'): string {
    const currency = getCurrency(currencyCode);
    
    // Using Intl.NumberFormat for robust localization. 
    // Fallback logic could be added if the browser/environment lacks full ICU data.
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
      }).format(majorAmount);
    } catch (e) {
      // Fallback if currency code is unsupported by Intl
      return `${currency.symbol} ${majorAmount.toFixed(currency.decimals)}`;
    }
  }
}
