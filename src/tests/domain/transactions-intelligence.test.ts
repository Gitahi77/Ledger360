import { describe, it, expect } from 'vitest';
import { generateTransactionsIntelligence } from '@/lib/domain/calculators/transactions-intelligence';
import type { TransactionSnapshot } from '@/lib/types/transactions-intelligence';

describe('Transactions Intelligence Invariants', () => {
  const createTx = (id: string, amountMinor: number, type: 'expense' | 'income', date: string, name: string, category?: string): TransactionSnapshot => ({
    id,
    name,
    baseMoney: { amountMinor, currency: 'KES' },
    type,
    date,
    category: category ? { id: category, name: category, icon: null } : null
  });

  it('handles an empty dataset without crashing', () => {
    const result = generateTransactionsIntelligence([]);
    expect(result.metrics.netCashFlow.amountMinor).toBe(0);
    expect(result.metrics.transactionCount).toBe(0);
    expect(result.advisor).toBeNull();
    expect(result.behaviour.length).toBe(0);
    expect(result.timeline.length).toBe(0);
  });

  it('handles a single transaction dataset', () => {
    const txs = [
      createTx('1', 500000, 'expense', '2026-08-01T10:00:00Z', 'Single Item', 'Shopping')
    ];
    const result = generateTransactionsIntelligence(txs);
    expect(result.metrics.transactionCount).toBe(1);
    expect(result.metrics.totalExpenses.amountMinor).toBe(500000);
    // Because it is a single transaction, the advisor will not crash, it will return a stable or observation note
    expect(result.advisor).toBeDefined();
    // One transaction cannot create outliers (needs >= 3), but it can create concentration
    expect(result.behaviour.some(b => b.type === 'concentration')).toBe(true);
  });

  it('assigns correct priority ties (tie-breaking)', () => {
    const txs = [
      createTx('1', 1000000, 'expense', '2026-08-01T10:00:00Z', 'Large', 'Dining'),
      createTx('2', 1000000, 'expense', '2026-08-01T10:00:00Z', 'Large', 'Dining'),
      createTx('3', 1000000, 'expense', '2026-08-01T10:00:00Z', 'Large', 'Dining'),
      createTx('4', 1000, 'income', '2026-08-01T10:00:00Z', 'Income') // Negative cash flow!
    ];
    // This dataset has 100% concentration in Dining AND negative cashflow.
    // Concentration priority is 50. Negative cashflow is 100 (CASH_FLOW_RISK).
    const result = generateTransactionsIntelligence(txs);
    
    // Advisor should pick negative cash flow over concentration
    expect(result.advisor?.priority).toBe(100);
    expect(result.advisor?.title).toBe('Attention Required');
  });

  it('handles perfectly stable spending without outliers', () => {
    const txs = [
      createTx('1', 100000, 'expense', '2026-08-01T10:00:00Z', 'Item 1'),
      createTx('2', 100000, 'expense', '2026-08-02T10:00:00Z', 'Item 2'),
      createTx('3', 100000, 'expense', '2026-08-03T10:00:00Z', 'Item 3'),
      createTx('4', 100000, 'expense', '2026-08-04T10:00:00Z', 'Item 4'),
      createTx('5', 100000, 'expense', '2026-08-05T10:00:00Z', 'Item 5'),
      createTx('6', 500000, 'income', '2026-08-05T10:00:00Z', 'Salary'),
    ];
    const result = generateTransactionsIntelligence(txs);
    
    const outliers = result.behaviour.filter(b => b.type === 'outlier');
    expect(outliers.length).toBe(0); // Zero variance

    // Since spending is stable and income == expenses, we should get Stable Cash Flow if no other insights trigger
    expect(result.advisor?.title).not.toBeNull();
  });
});
