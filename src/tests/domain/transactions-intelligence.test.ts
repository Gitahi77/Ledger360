import { describe, it, expect } from 'vitest';
import { generateTransactionsIntelligence } from '@/lib/domain/calculators/transactions-intelligence';
import type { TransactionSnapshot } from '@/lib/types/transactions-intelligence';
import { toMajor } from '@/lib/money';

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
    expect(result.observations.length).toBe(0);
    expect(result.timeline.length).toBe(0);
  });

  it('handles a single transaction dataset', () => {
    const txs = [
      createTx('1', 500000, 'expense', '2026-08-01T10:00:00Z', 'Single Item', 'Shopping')
    ];
    const result = generateTransactionsIntelligence(txs);
    expect(result.metrics.transactionCount).toBe(1);
    expect(result.metrics.totalExpenses.amountMinor).toBe(500000);
    // One transaction cannot create outliers (needs >= 3), but it can create concentration
    expect(result.observations.some(b => b.type === 'concentration')).toBe(true);
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
    
    const outliers = result.observations.filter(b => b.type === 'outlier');
    expect(outliers.length).toBe(0); // Zero variance
  });
});
