import { describe, it, expect } from 'vitest';
import {
  calculateCashFlow,
  validateSplitTotal,
  calculateRunningBalance,
  LedgerEntry,
} from '../finance/transactions';

describe('Transaction Financial Logic', () => {
  describe('calculateCashFlow', () => {
    it('calculates net cash flow correctly, excluding VOIDED and ARCHIVED', () => {
      const txs: LedgerEntry[] = [
        { id: '1', baseAmountMinor: 1000n, type: 'income', status: 'ACTIVE', date: new Date(), accountId: 'a1' },
        { id: '2', baseAmountMinor: 400n, type: 'expense', status: 'ACTIVE', date: new Date(), accountId: 'a1' },
        { id: '3', baseAmountMinor: 200n, type: 'expense', status: 'VOIDED', date: new Date(), accountId: 'a1' }, // ignored
        { id: '4', baseAmountMinor: 500n, type: 'expense', status: 'ARCHIVED', date: new Date(), accountId: 'a1' }, // ignored
      ];

      const { incomeMinor, expenseMinor, netMinor } = calculateCashFlow(txs);
      
      expect(incomeMinor).toBe(1000n);
      expect(expenseMinor).toBe(400n);
      expect(netMinor).toBe(600n);
    });
  });

  describe('validateSplitTotal', () => {
    it('preserves total exactly across split allocations', () => {
      const parentAmt = 15000n; // $150.00
      
      const validChildren = [
        { baseAmountMinor: 5000, categoryId: 'c1' },
        { baseAmountMinor: 10000, categoryId: 'c2' }
      ];
      expect(validateSplitTotal(parentAmt, validChildren)).toBe(true);

      const invalidChildren = [
        { baseAmountMinor: 5000, categoryId: 'c1' },
        { baseAmountMinor: 9999, categoryId: 'c2' } // Missing 1 cent
      ];
      expect(validateSplitTotal(parentAmt, invalidChildren)).toBe(false);
    });
  });

  describe('calculateRunningBalance', () => {
    it('is deterministic and excludes VOIDED and ARCHIVED', () => {
      const startBalance = 5000n; // 50.00
      const txs: LedgerEntry[] = [
        { id: '1', baseAmountMinor: 2000n, type: 'income', status: 'ACTIVE', date: new Date('2023-01-01'), accountId: 'a1' },
        { id: '2', baseAmountMinor: 1500n, type: 'expense', status: 'ACTIVE', date: new Date('2023-01-02'), accountId: 'a1' },
        { id: '3', baseAmountMinor: 500n, type: 'expense', status: 'VOIDED', date: new Date('2023-01-03'), accountId: 'a1' },
        { id: '4', baseAmountMinor: 3000n, type: 'expense', status: 'ARCHIVED', date: new Date('2023-01-03'), accountId: 'a1' },
      ];

      const balances = calculateRunningBalance(startBalance, txs);
      
      expect(balances.length).toBe(2);
      expect(balances[0].balanceMinor).toBe(7000n); // 5000 + 2000
      expect(balances[1].balanceMinor).toBe(5500n); // 7000 - 1500
    });
  });
});
