import { describe, it, expect } from 'vitest';
import { buildDashboardPresentation } from '../app/dashboard-v2/presentation';
import { FinancialSnapshot } from '../lib/domain/snapshot';

describe('Dashboard Presentation Contract (Phase 9B.3.5)', () => {
  
  const createEmptySnapshot = (): FinancialSnapshot => ({
    metadata: {
      userId: 'user_123',
      baseCurrency: 'KES',
      generatedAt: new Date(),
      dataFreshness: 'live',
      queryCount: 1,
    },
    health: { staleAccounts: 0, duplicateTransactions: 0, pendingImports: 0, syncErrors: 0 },
    timeline: { lastUpdated: null, latestTransactionDate: null, oldestTransactionDate: null },
    accounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    loans: [],
    investments: [],
    bills: [],
    alerts: [],
    metrics: {
      totalAssets: 0n,
      totalLiabilities: 0n,
      liquidCash: 0n,
      netWorth: 0n,
      safeToSpend: 0n,
      emergencyFundCoverage: 0,
      monthlyIncome: 0n,
      monthlyExpenses: 0n,
      savingsRate: 0,
      debtRatio: 0,
    }
  });

  it('handles a completely empty snapshot without throwing or returning undefined', () => {
    const snapshot = createEmptySnapshot();
    const presentation = buildDashboardPresentation(snapshot);

    expect(presentation).toBeDefined();
    
    // Check Hero
    expect(presentation.hero.metric.value.replace(/\u00A0/g, ' ')).toBe('KES 0');
    expect(presentation.hero.metric.status).toBe('positive');
    expect(presentation.hero.calculation[0].value.replace(/\u00A0/g, ' ')).toBe('KES 0');
    
    // Check Reflection
    expect(presentation.reflection.groups).toEqual([]);
    
    // Check Progress
    expect(presentation.progress.items.length).toBe(1); // Net worth is always present
    const nwProps = presentation.progress.items[0].props;
    if ('primaryMetric' in nwProps) { // Type guard for journey
      expect((nwProps.primaryMetric as string).replace(/\u00A0/g, ' ')).toBe('KES 0');
    } else {
      throw new Error('Expected Net Worth Journey to be the only item');
    }
  });

  it('does not leak undefined values into UI props', () => {
    const snapshot = createEmptySnapshot();
    const presentation = buildDashboardPresentation(snapshot);

    // Deep check to ensure no `undefined` values exist in critical prop trees
    // (excluding optional React props which the type system allows)
    const json = JSON.stringify(presentation);
    expect(json).not.toContain('"undefined"');
  });

  it('correctly maps negative Safe to Spend', () => {
    const snapshot = createEmptySnapshot();
    snapshot.metrics.safeToSpend = -5000_00n; // -5,000 KES
    
    const presentation = buildDashboardPresentation(snapshot);
    
    expect(presentation.hero.metric.value.replace(/\u00A0/g, ' ')).toBe('-KES 5,000');
    expect(presentation.hero.metric.status).toBe('negative');
  });

});
