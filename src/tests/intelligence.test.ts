import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { generateInsights } from '@/lib/intelligence';
import { getLoansForUser } from '@/lib/actions/loans';
import { startOfMonth, subMonths } from 'date-fns';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPreferences: { findUnique: vi.fn() },
    transaction: { findMany: vi.fn() },
    transfer: { findMany: vi.fn() },
    goal: { findMany: vi.fn() },
  }
}));

vi.mock('@/lib/actions/loans', () => ({
  getLoansForUser: vi.fn()
}));

describe('generateInsights', () => {
  const userId = 'user-1';
  const now = new Date(2026, 5, 3); // June 3, 2026 (day <= 5 for fresh start)
  const thisMonthStart = startOfMonth(now);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.setSystemTime(now);
    
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    vi.mocked(getLoansForUser).mockResolvedValue([] as any);
    vi.mocked(prisma.goal.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transfer.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
  });

  it('generates Endowment insight when money is kept', async () => {
    // Need at least 5 transactions to pass the minimum data check
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { id: '1', date: now, type: 'expense', categoryId: 'cat-1', category: { name: 'Cat 1' }, baseAmountMinor: 1000, name: 'T1' },
      { id: '2', date: now, type: 'expense', categoryId: 'cat-1', category: { name: 'Cat 1' }, baseAmountMinor: 1000, name: 'T2' },
      { id: '3', date: now, type: 'expense', categoryId: 'cat-1', category: { name: 'Cat 1' }, baseAmountMinor: 1000, name: 'T3' },
      { id: '4', date: now, type: 'expense', categoryId: 'cat-1', category: { name: 'Cat 1' }, baseAmountMinor: 1000, name: 'T4' },
      { id: '5', date: now, type: 'expense', categoryId: 'cat-1', category: { name: 'Cat 1' }, baseAmountMinor: 1000, name: 'T5' },
    ] as any);

    vi.mocked(prisma.transfer.findMany).mockResolvedValue([
      { id: 't1', baseAmountMinor: 50000, toAccount: { type: 'savings' } }
    ] as any);

    const insights = await generateInsights(userId);
    const endowment = insights.find(i => i.type === 'endowment');
    
    expect(endowment).toBeDefined();
    expect(endowment?.title).toBe('Money kept this month');
    expect(endowment?.severity).toBe('success');
  });

  it('enhances Anomaly insight with goal-linked opportunity cost', async () => {
    vi.mocked(prisma.goal.findMany).mockResolvedValue([
      { id: 'g1', name: 'Emergency Fund', targetAmountMinor: 100000, transfers: [] }
    ] as any);

    const pastMonth = subMonths(thisMonthStart, 1);
    
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      // Past tx to establish average (say 2000)
      { id: 'p1', date: pastMonth, type: 'expense', categoryId: 'dining', category: { name: 'Dining' }, baseAmountMinor: 2000, name: 'D1' },
      // Current tx that is higher than average (say 4000) -> 2000 overspend
      { id: 'c1', date: now, type: 'expense', categoryId: 'dining', category: { name: 'Dining' }, baseAmountMinor: 4000, name: 'D2' },
      // Padding
      { id: 'pad1', date: now, type: 'expense', categoryId: 'other', category: { name: 'O' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad2', date: now, type: 'expense', categoryId: 'other', category: { name: 'O' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad3', date: now, type: 'expense', categoryId: 'other', category: { name: 'O' }, baseAmountMinor: 10, name: 'P' },
    ] as any);

    const insights = await generateInsights(userId);
    const anomaly = insights.find(i => i.type === 'anomaly');
    
    expect(anomaly).toBeDefined();
    expect(anomaly?.description).toContain('above your typical monthly average');
    expect(anomaly?.description).toContain('That difference is about 2% of your Emergency Fund target');
  });

  it('generates Fresh Start targeting the largest discretionary category, ignoring essentials', async () => {
    const pastMonth = subMonths(thisMonthStart, 1);
    
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      // Essential but largest
      { id: 'p1', date: pastMonth, type: 'expense', categoryId: 'rent', category: { name: 'Rent' }, baseAmountMinor: 50000, name: 'S1' },
      // Discretionary and smaller
      { id: 'p2', date: pastMonth, type: 'expense', categoryId: 'dining', category: { name: 'Dining' }, baseAmountMinor: 5000, name: 'D1' },
      // Padding
      { id: 'pad1', date: now, type: 'expense', categoryId: 'other', category: { name: 'Other' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad2', date: now, type: 'expense', categoryId: 'other', category: { name: 'Other' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad3', date: now, type: 'expense', categoryId: 'other', category: { name: 'Other' }, baseAmountMinor: 10, name: 'P' },
    ] as any);

    const insights = await generateInsights(userId);
    const freshStart = insights.find(i => i.type === 'fresh-start');
    
    expect(freshStart).toBeDefined();
    expect(freshStart?.title).toBe('A fresh start');
    expect(freshStart?.description).toContain('Last month, your largest expense was Dining');
    expect(freshStart?.description).not.toContain('Rent');
  });

  it('generates Fresh Start soft message when only essential categories exist', async () => {
    const pastMonth = subMonths(thisMonthStart, 1);
    
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      // Only essentials
      { id: 'p1', date: pastMonth, type: 'expense', categoryId: 'rent', category: { name: 'Rent' }, baseAmountMinor: 50000, name: 'R1' },
      { id: 'p2', date: pastMonth, type: 'expense', categoryId: 'utilities', category: { name: 'Utilities' }, baseAmountMinor: 5000, name: 'U1' },
      // Padding
      { id: 'pad1', date: now, type: 'expense', categoryId: 'other', category: { name: 'Other' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad2', date: now, type: 'expense', categoryId: 'other', category: { name: 'Other' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad3', date: now, type: 'expense', categoryId: 'other', category: { name: 'Other' }, baseAmountMinor: 10, name: 'P' },
    ] as any);

    const insights = await generateInsights(userId);
    const freshStart = insights.find(i => i.id === 'fresh-start-soft');
    
    expect(freshStart).toBeDefined();
    expect(freshStart?.title).toBe('A fresh start');
    expect(freshStart?.description).toContain('A great time to review your upcoming expenses');
    expect(freshStart?.description).not.toContain('Rent');
    expect(freshStart?.description).not.toContain('Utilities');
  });

  it('respects the 4-insight cap and severity sorting', async () => {
    vi.mocked(prisma.goal.findMany).mockResolvedValue([
      { id: 'g1', name: 'Milestone Goal', targetAmountMinor: 100000, transfers: [{ baseAmountMinor: 50000 }] }
    ] as any);

    vi.mocked(prisma.transfer.findMany).mockResolvedValue([
      { id: 't1', baseAmountMinor: 50000, toAccount: { type: 'savings' } }
    ] as any);

    const pastMonth = subMonths(thisMonthStart, 1);
    
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { id: 'p1', date: pastMonth, type: 'expense', categoryId: 'dining', category: { name: 'Dining' }, baseAmountMinor: 2000, name: 'D1' },
      { id: 'c1', date: now, type: 'expense', categoryId: 'dining', category: { name: 'Dining' }, baseAmountMinor: 4000, name: 'D2' },
      { id: 'inc1', date: now, type: 'income', categoryId: 'salary', category: { name: 'Salary' }, baseAmountMinor: 100000, name: 'S' },
      { id: 'pad2', date: now, type: 'expense', categoryId: 'other', category: { name: 'O' }, baseAmountMinor: 10, name: 'P' },
      { id: 'pad3', date: now, type: 'expense', categoryId: 'other', category: { name: 'O' }, baseAmountMinor: 10, name: 'P' },
    ] as any);

    const insights = await generateInsights(userId);
    
    expect(insights.length).toBeLessThanOrEqual(4);
    
    const severities = insights.map(i => i.severity);
    const sorted = [...severities].sort((a, b) => {
      const order = { danger: 0, warning: 1, success: 2, info: 3 };
      return order[a as keyof typeof order] - order[b as keyof typeof order];
    });
    
    expect(severities).toEqual(sorted);
  });
});
