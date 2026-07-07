import { CurrencyCode, getCurrency } from './Currency';

export class Money {
  constructor(
    public readonly minorUnits: number,
    public readonly currency: CurrencyCode
  ) {
    if (!Number.isSafeInteger(minorUnits)) {
      throw new Error('Money minorUnits must be a safe integer');
    }
  }

  static fromMajor(major: number, currency: CurrencyCode): Money {
    const info = getCurrency(currency);
    const multiplier = Math.pow(10, info.decimals);
    return new Money(Math.round(major * multiplier), currency);
  }

  static fromMinor(minorUnits: number | bigint, currency: CurrencyCode): Money {
    return new Money(Number(minorUnits), currency);
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(0, currency);
  }

  get majorUnits(): number {
    return this.minorUnits / 100;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  multiply(multiplier: number): Money {
    return new Money(Math.round(this.minorUnits * multiplier), this.currency);
  }

  isNegative(): boolean {
    return this.minorUnits < 0;
  }

  isPositive(): boolean {
    return this.minorUnits > 0;
  }

  isZero(): boolean {
    return this.minorUnits === 0;
  }

  private assertSameCurrency(other: Money) {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
