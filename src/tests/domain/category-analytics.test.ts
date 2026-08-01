import { describe, it, expect } from 'vitest';
import { calculateCategoryAnalytics, MonthlyCategoryData } from '@/lib/domain/calculators/category-analytics';

describe('calculateCategoryAnalytics', () => {
  it('handles empty history', () => {
    const result = calculateCategoryAnalytics([]);
    expect(result.velocityLabel).toBe('Insufficient data');
    expect(result.stabilityScore).toBe(0);
  });

  it('calculates 3-month and 6-month averages correctly', () => {
    const history: MonthlyCategoryData[] = [
      { month: '2026-01', amountMinor: 10000 },
      { month: '2026-02', amountMinor: 20000 },
      { month: '2026-03', amountMinor: 30000 },
      { month: '2026-04', amountMinor: 40000 },
      { month: '2026-05', amountMinor: 50000 },
      { month: '2026-06', amountMinor: 60000 },
    ]; // Total = 210000, Avg = 35000. Last 3 = 150000, Avg = 50000
    
    const result = calculateCategoryAnalytics(history);
    expect(result.sixMonthAverageMinor).toBe(35000);
    expect(result.threeMonthAverageMinor).toBe(50000);
  });

  it('identifies highly variable volatility', () => {
    const history: MonthlyCategoryData[] = [
      { month: '2026-01', amountMinor: 10000 },
      { month: '2026-02', amountMinor: 90000 },
      { month: '2026-03', amountMinor: 10000 },
      { month: '2026-04', amountMinor: 90000 },
      { month: '2026-05', amountMinor: 10000 },
      { month: '2026-06', amountMinor: 90000 },
    ]; 
    
    const result = calculateCategoryAnalytics(history);
    expect(result.volatilityLabel).toBe('Highly Variable');
  });

  it('identifies very stable volatility', () => {
    const history: MonthlyCategoryData[] = [
      { month: '2026-01', amountMinor: 50000 },
      { month: '2026-02', amountMinor: 51000 },
      { month: '2026-03', amountMinor: 49000 },
      { month: '2026-04', amountMinor: 50000 },
      { month: '2026-05', amountMinor: 51000 },
      { month: '2026-06', amountMinor: 49000 },
    ]; 
    
    const result = calculateCategoryAnalytics(history);
    expect(result.volatilityLabel).toBe('Very Stable');
  });

  it('calculates rapidly rising trend', () => {
    const history: MonthlyCategoryData[] = [
      { month: '2026-01', amountMinor: 10000 },
      { month: '2026-02', amountMinor: 20000 },
      { month: '2026-03', amountMinor: 30000 },
      { month: '2026-04', amountMinor: 40000 },
      { month: '2026-05', amountMinor: 50000 },
      { month: '2026-06', amountMinor: 60000 },
    ]; 
    
    const result = calculateCategoryAnalytics(history);
    expect(result.trendLabel).toBe('Rapidly Rising');
    expect(result.stabilityScore).toBeLessThan(80); // Should be penalized for rising trend & velocity
  });

  it('identifies spending faster than usual', () => {
    const history: MonthlyCategoryData[] = [
      { month: '2026-01', amountMinor: 10000 },
      { month: '2026-02', amountMinor: 10000 },
      { month: '2026-03', amountMinor: 10000 }, // 3mo avg = 10k
      { month: '2026-04', amountMinor: 15000 }, // Current = 15k (50% faster)
    ]; 
    
    const result = calculateCategoryAnalytics(history);
    expect(result.velocityLabel).toBe('Spending faster than usual');
  });

});
