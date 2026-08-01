import { describe, it, expect } from 'vitest';
import { calculateBudgetUsage } from '../domain/calculators/budget-engine';

describe('Budget Engine (Domain)', () => {
  it('correctly calculates budget usage for non-rollover budgets', () => {
    const budget = {
      id: 'b-1',
      categoryId: 'c-1',
      limitAmountMinor: 10000n,
      period: 'monthly' as const,
      rollover: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    
    const result = calculateBudgetUsage(
      budget,
      { 'c-1': 3000 },
      { 'b-1': 3000 }, // shouldn't matter since not rollover
      new Date('2026-01-01T00:00:00Z')
    );
    
    expect(result.limit).toBe(10000);
    expect(result.spent).toBe(3000);
  });

  it('rollover never creates money (underspent)', () => {
    const budget = {
      id: 'b-1',
      categoryId: 'c-1',
      limitAmountMinor: 10000n,
      period: 'monthly' as const,
      rollover: true,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    };
    
    // In month 1 (June), limit = 10000, spent = 3000. Under-spend of 7000.
    // In month 2 (July), limit should be 10000 + 7000 = 17000.
    // Let's say in July we spend 2000. Total spent since creation = 5000.
    const result = calculateBudgetUsage(
      budget,
      { 'c-1': 2000 }, // spend this period
      { 'b-1': 5000 }, // spend since creation
      new Date('2026-07-05T00:00:00Z')
    );
    
    // Past limit = 10000 (1 month). Past spend = 5000 - 2000 = 3000.
    // Rollover = 7000. Effective limit = 10000 + 7000 = 17000.
    expect(result.limit).toBe(17000);
    expect(result.spent).toBe(2000);
  });

  it('negative balance handling (overspent)', () => {
    const budget = {
      id: 'b-1',
      categoryId: 'c-1',
      limitAmountMinor: 10000n,
      period: 'monthly' as const,
      rollover: true,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    };
    
    // In June, spend 12000 (overspend 2000).
    // In July, spend 1000. Total = 13000.
    const result = calculateBudgetUsage(
      budget,
      { 'c-1': 1000 },
      { 'b-1': 13000 },
      new Date('2026-07-05T00:00:00Z')
    );
    
    // Past limit = 10000. Past spend = 12000.
    // Rollover = -2000.
    // Effective limit = 10000 - 2000 = 8000.
    expect(result.limit).toBe(8000);
    expect(result.spent).toBe(1000);
  });

  it('December -> January transition', () => {
    const budget = {
      id: 'b-1',
      categoryId: 'c-1',
      limitAmountMinor: 10000n,
      period: 'monthly' as const,
      rollover: true,
      createdAt: new Date('2025-12-15T00:00:00Z'),
    };
    
    // In Jan 2026, 1 past period (Dec 2025).
    // Dec spend = 0.
    // Jan spend = 500. Total = 500.
    const result = calculateBudgetUsage(
      budget,
      { 'c-1': 500 },
      { 'b-1': 500 },
      new Date('2026-01-10T00:00:00Z')
    );
    
    // Past limit = 10000. Past spend = 0.
    // Effective limit = 10000 + 10000 = 20000.
    expect(result.limit).toBe(20000);
    expect(result.spent).toBe(500);
  });

  it('Timezone boundary (Africa/Nairobi)', () => {
    const budget = {
      id: 'b-1',
      categoryId: 'c-1',
      limitAmountMinor: 10000n,
      period: 'monthly' as const,
      rollover: true,
      // Created at 22:00 UTC on Jan 31st. In Nairobi (UTC+3), it's 01:00 on Feb 1st!
      // So the creation month is Feb, not Jan.
      createdAt: new Date('2026-01-31T22:00:00Z'), 
    };
    
    // When querying for March 15th:
    // Feb is the 1 past period. Not Jan & Feb!
    const result = calculateBudgetUsage(
      budget,
      { 'c-1': 1000 },
      { 'b-1': 1000 },
      new Date('2026-03-15T12:00:00Z')
    );
    
    // Created in Feb (Nairobi). Current is March. Past periods = 1 (Feb).
    // Past limit = 10000. Past spend = 0.
    // Effective limit = 10000 + 10000 = 20000.
    expect(result.limit).toBe(20000);
  });

  it('zero-budget edge case', () => {
    const budget = {
      id: 'b-1',
      categoryId: 'c-1',
      limitAmountMinor: 0n,
      period: 'monthly' as const,
      rollover: true,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    };
    
    // Past limit = 0.
    // June spend = 500 (overspend 500).
    // July limit = 0 - 500 = -500.
    const result = calculateBudgetUsage(
      budget,
      { 'c-1': 0 },
      { 'b-1': 500 },
      new Date('2026-07-05T00:00:00Z')
    );
    
    expect(result.limit).toBe(-500);
    expect(result.spent).toBe(0);
  });
});
