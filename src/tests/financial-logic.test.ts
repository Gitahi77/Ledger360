import { describe, it, expect, vi } from 'vitest';
import { computeLoanBalance } from '../lib/shared-computations';

describe('Shared Computations', () => {
  describe('computeLoanBalance', () => {
    it('computes balance correctly with partial repayment', () => {
      expect(computeLoanBalance(1000, 200)).toBe(800);
    });

    it('allows exact payoff', () => {
      expect(computeLoanBalance(1000, 1000)).toBe(0);
    });

    it('clamps balance at 0 for overpayment', () => {
      expect(computeLoanBalance(1000, 1200)).toBe(0);
    });
  });
});

// For integration tests against DB, we'd need a test DB setup.
// Let's at least test the pure logic for now.
