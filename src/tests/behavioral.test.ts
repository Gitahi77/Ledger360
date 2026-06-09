import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { safeToSpend } from '@/lib/behavioral';
import { getLoansForUser } from '@/lib/actions/loans';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPreferences: { findUnique: vi.fn() },
    transaction: { aggregate: vi.fn(), findFirst: vi.fn() },
    budget: { findMany: vi.fn() },
  }
}));

vi.mock('@/lib/actions/loans', () => ({
  getLoansForUser: vi.fn()
}));

describe('safeToSpend', () => {
  const userId = 'user-1';

  beforeEach(() => {
    vi.resetAllMocks();
    vi.setSystemTime(new Date(2026, 5, 8)); // June 8, 2026
    
    // Default mocks
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    vi.mocked(getLoansForUser).mockResolvedValue([]);
    vi.mocked(prisma.budget.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({ _sum: { baseAmountMinor: 0 } } as any);
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);
  });

  it('calculates discretionary and remaining correctly with basic inputs', async () => {
    // Expected income fallback
    vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: any) => {
      if (args.where?.type === 'income') return { _sum: { baseAmountMinor: 100000 } } as any;
      return { _sum: { baseAmountMinor: 0 } } as any;
    }) as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 100000
    // planned savings = 30000 (30% default)
    // discretionary = 70000
    // remaining = 70000
    // days left = 30 - 8 + 1 = 23
    // perDay = 70000 / 23 = 3043
    
    expect(res.discretionaryMinor).toBe(70000);
    expect(res.remainingMinor).toBe(70000);
    expect(res.daysLeft).toBe(23);
    expect(res.perDayMinor).toBe(3043);
  });

  it('uses expectedMonthlyIncomeMinor override when present', async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      expectedMonthlyIncomeMinor: 200000,
      savingRate: 20
    } as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 200000
    // savings = 40000 (20%)
    // discretionary = 160000
    
    expect(res.discretionaryMinor).toBe(160000);
    expect(res.remainingMinor).toBe(160000);
  });

  it('deducts loan payments correctly', async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ expectedMonthlyIncomeMinor: 100000, savingRate: 0 } as any);
    
    // Loan next due on June 15
    vi.mocked(getLoansForUser).mockResolvedValue([
      { monthlyPaymentMinor: 15000, nextDue: new Date(2026, 5, 15) },
      // loan outside period (July 5)
      { monthlyPaymentMinor: 5000, nextDue: new Date(2026, 6, 5) }
    ] as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 100000
    // savings = 0
    // loans = 15000
    // discretionary = 85000
    
    expect(res.discretionaryMinor).toBe(85000);
  });

  it('separates envelope vs unbudgeted spend without double counting', async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ expectedMonthlyIncomeMinor: 100000, savingRate: 0 } as any);
    
    // One budget
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { categoryId: 'cat-env', limitAmountMinor: 20000, rollover: false, createdAt: new Date() }
    ] as any);

    vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: any) => {
      // Spend in envelope
      if (args.where?.categoryId === 'cat-env') return { _sum: { baseAmountMinor: 15000 } } as any;
      // Spend outside envelope
      if (args.where?.categoryId?.notIn) return { _sum: { baseAmountMinor: 10000 } } as any;
      return { _sum: { baseAmountMinor: 0 } } as any;
    }) as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 100000
    // envelope limits = 20000
    // discretionary = 80000 (base limits withheld)
    
    // envelopeSpend = 15000. Limit = 20000. Overspend = 0.
    // unbudgetedSpend = 10000.
    // remaining = 80000 - 10000 - 0 = 70000.
    
    expect(res.discretionaryMinor).toBe(80000);
    expect(res.remainingMinor).toBe(70000);
  });

  it('positive rollover does NOT reduce this months Safe-to-Spend (no double-withhold)', async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ expectedMonthlyIncomeMinor: 100000, savingRate: 0 } as any);
    
    const createdAt = new Date(2026, 4, 1); // Created May 1
    // It existed for May and June -> 2 periods
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { categoryId: 'cat-env', limitAmountMinor: 20000, rollover: true, createdAt }
    ] as any);

    vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: any) => {
      // Historical spend: only 10000 spent out of the 40000 cumulative limit.
      // So there is 30000 positive rollover effective limit.
      if (args.where?.categoryId === 'cat-env') return { _sum: { baseAmountMinor: 10000 } } as any;
      return { _sum: { baseAmountMinor: 0 } } as any;
    }) as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 100000
    // BASE envelope limits = 20000
    // discretionary = 80000 (We do NOT double withhold the rolled over 10000)
    // cumulativeLimit = 40000, cumulativeSpend = 10000, overspend = 0.
    // remaining = 80000
    
    expect(res.discretionaryMinor).toBe(80000);
    expect(res.remainingMinor).toBe(80000);
  });

  it('overspending an envelope effective limit reduces this months remaining (no overstatement)', async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ expectedMonthlyIncomeMinor: 100000, savingRate: 0 } as any);
    
    const createdAt = new Date(2026, 4, 1); // Created May 1 (2 periods = May, June)
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { categoryId: 'cat-env', limitAmountMinor: 20000, rollover: true, createdAt }
    ] as any);

    vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: any) => {
      // Cumulative limit = 40000
      // Let's say user spent 50000 (10000 overspend)
      if (args.where?.categoryId === 'cat-env') return { _sum: { baseAmountMinor: 50000 } } as any;
      return { _sum: { baseAmountMinor: 0 } } as any;
    }) as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 100000
    // BASE envelope limits = 20000
    // discretionary = 80000
    
    // cumulativeLimit = 40000, cumulativeSpend = 50000.
    // overspendPenalty = 10000.
    // remaining = 80000 - 10000 = 70000.
    
    expect(res.discretionaryMinor).toBe(80000);
    expect(res.remainingMinor).toBe(70000);
  });

  it('allows remainingMinor to be negative (honest negative) when massively overspending unbudgeted', async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ expectedMonthlyIncomeMinor: 100000, savingRate: 0 } as any);
    
    // Spend 120,000 on unbudgeted things
    vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: any) => {
      if (args.where?.categoryId?.notIn) return { _sum: { baseAmountMinor: 120000 } } as any;
      return { _sum: { baseAmountMinor: 0 } } as any;
    }) as any);

    const res = await safeToSpend(userId, 'monthly');
    // expected = 100000
    // discretionary = 100000
    // unbudgetedSpend = 120000
    // remaining = -20000
    // perDay = 0 (clamped)
    
    expect(res.discretionaryMinor).toBe(100000);
    expect(res.remainingMinor).toBe(-20000);
    expect(res.perDayMinor).toBe(0);
  });
});
