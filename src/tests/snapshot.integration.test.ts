import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma';
import { buildFinancialSnapshot } from '../lib/domain/snapshot';
import { randomUUID } from 'crypto';
import { subDays } from 'date-fns';

describe('FinancialSnapshot Integration (Phase 9B.3.5)', () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `snapshot-test-${randomUUID()}@example.com`,
        name: 'Snapshot Tester',
        currency: 'KES',
      }
    });
    testUserId = user.id;

    // Create Checking Account (Liquid)
    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Main Checking',
        type: 'CHECKING',
        currency: 'KES',
        allowNegativeBalance: false,
        openingMinor: 50000_00n, // 50,000 KES
        balanceMinor: 50000_00n
      }
    });

    // Create Loan (Liability)
    await prisma.loan.create({
      data: {
        userId: user.id,
        name: 'Personal Loan',
        lender: 'Bank',
        type: 'Personal',
        originalAmountMinor: 100000_00n,
        balanceMinor: 80000_00n,
        annualRate: 14,
        monthlyPaymentMinor: 5000_00n,
        nextDue: new Date(),
      }
    });

    // Create a transaction today (expense)
    const acc = await prisma.account.findFirstOrThrow({ where: { userId: user.id } });
    const cat = await prisma.category.create({
      data: { userId: user.id, name: 'Groceries', type: 'expense' }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: acc.id,
        categoryId: cat.id,
        date: new Date(),
        baseAmountMinor: 2000_00n,
        currency: 'KES',
        type: 'expense',
        name: 'Supermarket'
      }
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('buildFinancialSnapshot computes metrics correctly and respects query budget', async () => {
    const snapshot = await buildFinancialSnapshot(testUserId);

    // 1. Validate Metrics
    expect(snapshot.metrics.liquidCash).toBe(50000_00n);
    expect(snapshot.metrics.totalAssets).toBe(50000_00n);
    expect(snapshot.metrics.totalLiabilities).toBe(80000_00n);
    expect(snapshot.metrics.netWorth).toBe(-30000_00n); // 50k - 80k
    
    // Safe to spend = liquidCash - upcomingBillsAmount (50k - 5k = 45k)
    expect(snapshot.metrics.safeToSpend).toBe(45000_00n);
    
    // Monthly expenses should capture the 2000 KES transaction
    expect(snapshot.metrics.monthlyExpenses).toBe(2000_00n);

    // 2. Validate Raw Facts
    expect(snapshot.accounts.length).toBe(1);
    expect(snapshot.loans.length).toBe(1);
    expect(snapshot.transactions.length).toBe(1);
    expect(snapshot.transactions[0].amountMinor).toBe(-2000_00n); // Expense is negative in snapshot

    // 3. Validate Query Budget (Should be exactly 8 or fewer parallelized queries + 1 for user)
    // 1 user, 1 accounts, 1 tx, 1 budgets, 1 goals, 1 loans, 1 assets, 1 thisMonthTx = 8
    expect(snapshot.metadata.queryCount).toBeLessThanOrEqual(8);
  });

  it('buildFinancialSnapshot gracefully degrades if a query fails', async () => {
    // We mock Prisma momentarily to force a failure
    const originalFindMany = prisma.loan.findMany;
    prisma.loan.findMany = () => Promise.reject(new Error('Simulated DB Failure'));
    
    try {
      const snapshot = await buildFinancialSnapshot(testUserId);
      
      // The snapshot should still build successfully
      expect(snapshot).toBeDefined();
      // The loans collection should gracefully default to empty
      expect(snapshot.loans).toEqual([]);
      // The net worth should exclude the missing liability
      expect(snapshot.metrics.totalLiabilities).toBe(0n);
    } finally {
      // Restore Prisma
      prisma.loan.findMany = originalFindMany;
    }
  });
});
