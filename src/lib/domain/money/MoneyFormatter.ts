import { Money } from './Money';
import { CurrencyFormatter } from './CurrencyFormatter';

export class MoneyFormatter {
  /**
   * Formats a Money object into a localized string (e.g. "$1,234.56" or "KSh 1,234.56").
   */
  static format(money: Money, locale: string = 'en-US'): string {
    return CurrencyFormatter.format(money.majorUnits, money.currency, locale);
  }

  /**
   * Formats a Money object without the currency symbol (e.g. "1,234.56").
   */
  static formatAmountOnly(money: Money, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(money.majorUnits);
  }
}
