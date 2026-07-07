import { Money } from '../money/Money';

export class TransactionValidator {
  static validate(amount: Money, date: Date, now: Date = new Date()): void {
    if (amount.isNegative() || amount.isZero()) {
      throw new Error('Transaction amounts must be strictly positive.');
    }

    // Allow slightly future-dated transactions (e.g., timezones), but not absurdly in the future
    const maxFutureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days
    
    if (date > maxFutureDate) {
      throw new Error('Transactions cannot be dated significantly in the future.');
    }
  }
}
