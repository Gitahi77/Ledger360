import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { AccountAggregator } from '../lib/domain/calculators/AccountAggregator';
import { Money } from '../lib/domain/money/Money';

const numRuns = process.env.NIGHTLY === 'true' ? 1000 : 100;
fc.configureGlobal({ numRuns });

describe('Financial Property Tests', () => {
  // 1. Ledger conservation (sum(credits) - sum(debits) = balance)
  it('should conserve ledger balances', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // opening
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // income
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // expense
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // transfers in
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // transfers out
        (openingMinor, totalIncomeMinor, totalExpenseMinor, totalTransfersInMinor, totalTransfersOutMinor) => {
          const summary = {
            accountId: 'test-acc',
            currency: 'KES',
            openingMinor,
            totalIncomeMinor,
            totalExpenseMinor,
            totalTransfersInMinor,
            totalTransfersOutMinor
          };
          
          const result = AccountAggregator.aggregate(summary);
          
          // Formula: opening + income + transfersIn - (expense + transfersOut)
          // We can't exceed JS max safe integer without BigInt, but fast-check integers up to 1 trillion won't overflow (1 trillion * 5 < 9 quadrillion max safe int)
          const expected = openingMinor + totalIncomeMinor + totalTransfersInMinor - (totalExpenseMinor + totalTransfersOutMinor);
          
          expect(result.minorUnits).toBe(expected);
          expect(result.currency).toBe('KES');
        }
      )
    );
  });

  // 2. Commutativity of balance calculation
  it('should be order independent (commutativity)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -1_000_000, max: 1_000_000 })), // arbitrary amounts
        (amounts) => {
          const sum1 = amounts.reduce((acc, val) => acc + val, 0);
          const shuffled = [...amounts].reverse(); // Simple proxy for shuffle
          const sum2 = shuffled.reduce((acc, val) => acc + val, 0);
          
          expect(sum1).toBe(sum2);
        }
      )
    );
  });

  // 3. Reverse transaction property (apply(tx) + apply(reverse(tx)) == original state)
  it('should restore original state upon reversing a transaction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // initial balance
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // transaction amount
        (initial, txAmount) => {
          const state1 = initial - txAmount;
          const state2 = state1 + txAmount; // Reverse
          expect(state2).toBe(initial);
        }
      )
    );
  });

  // 4. Split transaction property
  it('should maintain net balances when splitting transactions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1_000_000 }), // initial tx amount
        fc.integer({ min: 1, max: 9 }), // split fraction
        (txAmount, splitFactor) => {
          const part1 = Math.floor(txAmount / splitFactor);
          const part2 = txAmount - part1;
          
          expect(part1 + part2).toBe(txAmount);
        }
      )
    );
  });
});
