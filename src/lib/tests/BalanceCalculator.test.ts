import { describe, it, expect } from 'vitest';
import { BalanceCalculator } from '../domain/calculators/BalanceCalculator';
import { Money } from '../domain/money/Money';

describe('BalanceCalculator', () => {
  const KES = 'KES';
  
  it('computes account with opening balance only', () => {
    const opening = Money.fromMajor(100, KES); // 100.00
    const zero = Money.zero(KES);
    const balance = BalanceCalculator.compute(opening, zero, zero, zero, zero);
    expect(balance.majorUnits).toBe(100);
  });

  it('computes income only', () => {
    const opening = Money.zero(KES);
    const income = Money.fromMajor(500, KES);
    const zero = Money.zero(KES);
    const balance = BalanceCalculator.compute(opening, income, zero, zero, zero);
    expect(balance.majorUnits).toBe(500);
  });

  it('computes expenses only', () => {
    const opening = Money.fromMajor(200, KES);
    const expense = Money.fromMajor(50, KES);
    const zero = Money.zero(KES);
    const balance = BalanceCalculator.compute(opening, zero, expense, zero, zero);
    expect(balance.majorUnits).toBe(150);
  });

  it('computes transfers in and out', () => {
    const opening = Money.zero(KES);
    const zero = Money.zero(KES);
    const txIn = Money.fromMajor(300, KES);
    const txOut = Money.fromMajor(100, KES);
    const balance = BalanceCalculator.compute(opening, zero, zero, txIn, txOut);
    expect(balance.majorUnits).toBe(200);
  });

  it('handles loan repayments (treated as transfer out)', () => {
    const opening = Money.fromMajor(1000, KES);
    const zero = Money.zero(KES);
    const loanRepayment = Money.fromMajor(150, KES);
    const balance = BalanceCalculator.compute(opening, zero, zero, zero, loanRepayment);
    expect(balance.majorUnits).toBe(850);
  });

  it('computes negative balance correctly (overdrawn)', () => {
    const opening = Money.zero(KES);
    const zero = Money.zero(KES);
    const expense = Money.fromMajor(100, KES);
    const balance = BalanceCalculator.compute(opening, zero, expense, zero, zero);
    expect(balance.majorUnits).toBe(-100);
    expect(balance.isNegative()).toBe(true);
  });

  it('computes exact zero balance', () => {
    const opening = Money.fromMajor(100, KES);
    const expense = Money.fromMajor(100, KES);
    const zero = Money.zero(KES);
    const balance = BalanceCalculator.compute(opening, zero, expense, zero, zero);
    expect(balance.majorUnits).toBe(0);
    expect(balance.isZero()).toBe(true);
  });

  it('rejects cross-currency math', () => {
    const opening = Money.fromMajor(100, KES);
    const income = Money.fromMajor(50, 'USD');
    const zero = Money.zero(KES);
    
    expect(() => {
      BalanceCalculator.compute(opening, income, zero, zero, zero);
    }).toThrow(/Currency mismatch/);
  });
  
  it('maintains rounding consistency avoiding floating point drift', () => {
    // JS floats: 0.1 + 0.2 = 0.30000000000000004
    const opening = Money.fromMajor(0.10, KES);
    const income = Money.fromMajor(0.20, KES);
    const zero = Money.zero(KES);
    const balance = BalanceCalculator.compute(opening, income, zero, zero, zero);
    expect(balance.majorUnits).toBe(0.30);
    expect(balance.minorUnits).toBe(30);
  });
});
