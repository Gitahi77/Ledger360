// @ts-nocheck
// src/tests/savings-plan.test.ts
// WO-15: Save-More-Tomorrow unit tests.
// Tests all 9 acceptance criteria including the date-guard and insufficient-funds-skip.
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* -- Mock dependencies -------------------------------------- */
vi.mock('@/lib/actions/_auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', currency: 'KES' }),
}));

vi.mock('@/lib/queries/accounts', () => ({
  getAccounts: vi.fn().mockResolvedValue([]),
  getAccountBalances: vi.fn().mockResolvedValue([]),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logActivity: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (cb: any) => cb(prisma)),
    savingsPlan: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'plan-1' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    account: {
      findFirst: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    transfer: {
      create: vi.fn().mockResolvedValue({ id: 'transfer-auto-1' }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 'tx-income-1' }),
      aggregate: vi.fn().mockResolvedValue({ _sum: { baseAmountMinor: 0 } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: {
      findFirst: vi.fn(),
    },
    userPreferences: {
      findUnique: vi.fn().mockResolvedValue({ savingRate: 30 }),
    },
    auditLog: {
      create: vi.fn(),
    },
  }
}));

/* -- Imports after mocks ------------------------------------ */
import { triggerAutoSave, upsertSavingsPlan } from '../lib/actions/savings';
import { getAccountBalances } from '@/lib/queries/accounts';
import { prisma } from '../lib/prisma';

/* -- Helper: build a mock plan ------------------------------ */
function makePlan(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const future = new Date(now);
  future.setMonth(future.getMonth() + 1);
  return {
    id: 'plan-1',
    userId: 'user-1',
    fromAccountId: 'acc-mpesa',
    toAccountId: 'acc-savings',
    goalId: null,
    baseRatePct: 10,
    escalationPct: 2,
    maxRatePct: 20,
    currentRatePct: 10,
    nextEscalation: future,
    active: true,
    createdAt: new Date('2026-01-01'),
    fromAccount: { id: 'acc-mpesa', type: 'MPESA', currency: 'KES' },
    ...overrides,
  };
}

describe('Save-More-Tomorrow (WO-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -- Test 1: Rate escalates correctly -------------------- */
  describe('Lazy Escalation', () => {
    it('rate escalates by escalationPct for each elapsed period', async () => {
      // Plan with nextEscalation 3 months in the past
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const plan = makePlan({
        currentRatePct: 10,
        escalationPct: 2,
        maxRatePct: 20,
        nextEscalation: threeMonthsAgo,
      });

      vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);
      vi.mocked(getAccountBalances).mockResolvedValue([
        { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 1000000, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() },
      ]);

      await triggerAutoSave(
        'user-1',
        [{ id: 'tx-1', baseAmountMinor: 100000n, date: new Date() }],
        'KES',
      );

      // After 4 elapsed periods (3 past, 1 due today): 10 + 4*2 = 18%
      // Transfer amount = round(100000 * 18 / 100) = 18000
      expect(prisma.transfer.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              amountMinor: 18000,
              source: 'SAVE_MORE_TOMORROW',
            }),
          ]),
        }),
      );

      // Escalation should have been persisted
      expect(prisma.savingsPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentRatePct: 18,
          }),
        }),
      );
    });

    /* -- Test 2: Rate caps at max -------------------------- */
    it('rate caps at maxRatePct and does not exceed it', async () => {
      // Plan with nextEscalation 10 months ago, but max is 20
      const tenMonthsAgo = new Date();
      tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

      const plan = makePlan({
        currentRatePct: 10,
        escalationPct: 2,
        maxRatePct: 20,
        nextEscalation: tenMonthsAgo,
      });

      vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);
      vi.mocked(getAccountBalances).mockResolvedValue([
        { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 1000000, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() },
      ]);

      await triggerAutoSave(
        'user-1',
        [{ id: 'tx-2', baseAmountMinor: 100000, date: new Date() }],
        'KES',
      );

      // 10 + 10*2 = 30, but capped at 20
      // Amount = round(100000 * 20 / 100) = 20000
      expect(prisma.transfer.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              amountMinor: 20000,
            }),
          ]),
        }),
      );

      expect(prisma.savingsPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentRatePct: 20,
          }),
        }),
      );
    });
  });

  /* -- Test 3: Paused plan fires nothing ------------------- */
  it('paused plan (active=false) does NOT create an auto-save', async () => {
    const plan = makePlan({ active: false });
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);

    const result = await triggerAutoSave(
      'user-1',
      [{ id: 'tx-3', baseAmountMinor: 100000, date: new Date() }],
      'KES',
    );

    expect(result).toBeNull();
    expect(prisma.transfer.createMany).not.toHaveBeenCalled();
  });

  /* -- Test 4: One income = one auto-save (idempotent) ---- */
  it('idempotent: duplicate trigger for same income returns null, no second transfer', async () => {
    const plan = makePlan();
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);
    vi.mocked(getAccountBalances).mockResolvedValue([
      { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 1000000, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0n, archived: false, createdAt: new Date() },
    ]);

    // First call succeeds
    await triggerAutoSave(
      'user-1',
      [{ id: 'tx-dup', baseAmountMinor: 100000, date: new Date() }],
      'KES',
    );
    expect(prisma.transfer.createMany).toHaveBeenCalledTimes(1);

    // Second call: simulate unique constraint violation
    vi.mocked(prisma.transfer.createMany).mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`sourceTransactionId`)'),
    );

    const result = await triggerAutoSave(
      'user-1',
      [{ id: 'tx-dup', baseAmountMinor: 100000, date: new Date() }],
      'KES',
    );

    // Should silently succeed (idempotent)
    expect(result).toBeNull();
  });

  /* -- Test 5: Failed auto-save does NOT block income ------ */
  it('a failed auto-save returns a warning string, never throws', async () => {
    const plan = makePlan();
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);
    vi.mocked(getAccountBalances).mockResolvedValue([
      { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 1000000, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0n, archived: false, createdAt: new Date() },
    ]);

    // Simulate a random DB error
    vi.mocked(prisma.transfer.createMany).mockRejectedValueOnce(
      new Error('Database connection lost'),
    );

    // Should NOT throw — returns a warning string
    const result = await triggerAutoSave(
      'user-1',
      [{ id: 'tx-fail', baseAmountMinor: 100000, date: new Date() }],
      'KES',
    );

    expect(result).toContain('Auto-save failed');
    expect(result).toContain('Database connection lost');
  });

  /* -- Test 6: Auto-save counts as Savings in dashboard ---- */
  it('auto-save transfer has loanId=null + savings destination = included in savings metric', async () => {
    const plan = makePlan();
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);
    vi.mocked(getAccountBalances).mockResolvedValue([
      { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 1000000, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0n, archived: false, createdAt: new Date() },
    ]);

    await triggerAutoSave(
      'user-1',
      [{ id: 'tx-sav', baseAmountMinor: 100000, date: new Date() }],
      'KES',
    );

    // The created transfer must have:
    // - source: SAVE_MORE_TOMORROW
    // - loanId: null
    // - toAccountId: acc-savings (a savings account)
    // This means the existing savings query (loanId IS NULL AND toAccount.type IN savings/investment)
    // will automatically include it.
    expect(prisma.transfer.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            source: 'SAVE_MORE_TOMORROW',
            loanId: null,
            toAccountId: 'acc-savings',
          }),
        ]),
      }),
    );
  });

  /* -- Test 7: Auto-save counts as Savings in reports ------ */
  // This test verifies the same property from the reports perspective.
  // The reports SQL uses: loanId IS NULL AND (goalId IS NOT NULL OR toAccount.type IN savings/investment)
  // Our transfer meets this because toAccount.type = 'savings' and loanId is null.
  it('auto-save transfer fields match the reports savings query criteria', async () => {
    const planWithGoal = makePlan({ goalId: 'goal-1' });
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(planWithGoal as any);
    vi.mocked(getAccountBalances).mockResolvedValue([
      { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 1000000, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0n, archived: false, createdAt: new Date() },
    ]);

    await triggerAutoSave(
      'user-1',
      [{ id: 'tx-report', baseAmountMinor: 50000, date: new Date() }],
      'KES',
    );

    // With a goalId set, the transfer has both goalId != null AND toAccountId = savings
    // Either condition satisfies the reports query
    expect(prisma.transfer.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            goalId: 'goal-1',
            loanId: null,
          }),
        ]),
      }),
    );
  });

  /* -- Test 8: Destination validation rejects non-savings without goal -- */
  it('rejects non-savings destination with no goal', async () => {
    // Mock accounts: from = bank, to = bank (not savings/investment)
    vi.mocked(prisma.account.findFirst)
      .mockResolvedValueOnce({ id: 'acc-bank', type: 'bank', userId: 'user-1', name: 'Bank', currency: 'KES' } as any)
      .mockResolvedValueOnce({ id: 'acc-bank2', type: 'bank', userId: 'user-1', name: 'Bank2', currency: 'KES' } as any);
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(null);

    const res = await upsertSavingsPlan({
      fromAccountId: 'acc-bank',
      toAccountId: 'acc-bank2',
      goalId: null,
      baseRatePct: 10,
      escalationPct: 1,
      maxRatePct: 30,
      active: true,
    });
    
    expect(res).toEqual({ error: expect.stringMatching(/savings or investment account/) });
  });

  /* -- Test 9: Income dated before plan creation does NOT trigger -- */
  it('income dated before SavingsPlan.createdAt does NOT trigger an auto-save', async () => {
    const plan = makePlan({
      createdAt: new Date('2026-06-01'),
    });
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);

    // Income date is BEFORE plan creation
    const result = await triggerAutoSave(
      'user-1',
      [{ id: 'tx-old', baseAmountMinor: 100000, date: new Date('2026-05-15') }],
      'KES',
    );

    expect(result).toBeNull();
    expect(prisma.transfer.createMany).not.toHaveBeenCalled();
  });

  /* -- Test 10: Insufficient funds skips gracefully -------- */
  it('skips auto-save with warning when source account has insufficient funds', async () => {
    const plan = makePlan();
    vi.mocked(prisma.savingsPlan.findUnique).mockResolvedValue(plan as any);

    // Source account has only 500 minor units, but 10% of 100000 = 10000
    vi.mocked(getAccountBalances).mockResolvedValue([
      { id: 'acc-mpesa', type: 'MPESA', balanceMinor: 500, userId: 'user-1', name: 'M-Pesa', currency: 'KES', openingMinor: 0n, archived: false, createdAt: new Date() },
    ]);

    const result = await triggerAutoSave(
      'user-1',
      [{ id: 'tx-broke', baseAmountMinor: 100000, date: new Date() }],
      'KES',
    );

    expect(result).toContain('not enough funds');
    expect(prisma.transfer.createMany).not.toHaveBeenCalled();
  });
});
