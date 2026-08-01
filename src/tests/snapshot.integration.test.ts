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
    
    // Safe to spend = (Income for this month) - (All Budgets Limits) - (Any uncategorized or non-budgeted expenses)
    // Income = 0, Budgets = 0, Unbudgeted = 2000
    expect(snapshot.metrics.safeToSpend).toBe(-2000_00n);
    
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
    prisma.loan.findMany = (() => Promise.reject(new Error('Simulated DB Failure'))) as any;
    
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

  it('verifies the 6 Safe-To-Spend semantic constraints', async () => {
    // 1. User has multiple budgets for the month
    // 2. Budget commitments and actual spending don't reduce available funds twice
    // 3. User has a KES 20,000 Grocery budget but has only spent KES 5,000
    const catGrocery = await prisma.category.create({ data: { userId: testUserId, name: 'Groceries', type: 'expense' } });
    const catTrans = await prisma.category.create({ data: { userId: testUserId, name: 'Transport', type: 'expense' } });
    const acc = await prisma.account.findFirstOrThrow({ where: { userId: testUserId } });

    const catIncome = await prisma.category.create({ data: { userId: testUserId, name: 'Salary', type: 'income' } });
    const catTransfer = await prisma.category.create({ data: { userId: testUserId, name: 'Internal Transfer', type: 'transfer' } });

    // Income includes only the current budget period
    await prisma.transaction.create({
      data: { userId: testUserId, accountId: acc.id, categoryId: catIncome.id, date: new Date(), baseAmountMinor: 100000_00n, currency: 'KES', type: 'income', name: 'Salary' }
    });
    // Old income (should be excluded)
    await prisma.transaction.create({
      data: { userId: testUserId, accountId: acc.id, categoryId: catIncome.id, date: subDays(new Date(), 45), baseAmountMinor: 100000_00n, currency: 'KES', type: 'income', name: 'Old Salary' }
    });

    // Multiple budgets
    await prisma.budget.create({
      data: { userId: testUserId, categoryId: catGrocery.id, name: 'Groceries', limitAmountMinor: 20000_00n, period: 'monthly' }
    });
    await prisma.budget.create({
      data: { userId: testUserId, categoryId: catTrans.id, name: 'Transport', limitAmountMinor: 10000_00n, period: 'monthly' }
    });

    // Spent KES 5,000 on Groceries
    await prisma.transaction.create({
      data: { userId: testUserId, accountId: acc.id, categoryId: catGrocery.id, date: new Date(), baseAmountMinor: 5000_00n, currency: 'KES', type: 'expense', name: 'Supermarket' }
    });
    // Spent KES 12,000 on Transport (over budget)
    await prisma.transaction.create({
      data: { userId: testUserId, accountId: acc.id, categoryId: catTrans.id, date: new Date(), baseAmountMinor: 12000_00n, currency: 'KES', type: 'expense', name: 'Fuel' }
    });

    // Uncategorized expenses are handled exactly once
    const catOther = await prisma.category.create({ data: { userId: testUserId, name: 'Other', type: 'expense' } });
    await prisma.transaction.create({
      data: { userId: testUserId, accountId: acc.id, categoryId: catOther.id, date: new Date(), baseAmountMinor: 8000_00n, currency: 'KES', type: 'expense', name: 'Random' }
    });

    // Transfers are excluded
    await prisma.transaction.create({
      data: { userId: testUserId, accountId: acc.id, categoryId: catTransfer.id, date: new Date(), baseAmountMinor: 20000_00n, currency: 'KES', type: 'transfer', name: 'To Savings' }
    });

    const snapshot = await buildFinancialSnapshot(testUserId);

    // Income = 100000
    // Budgets = 20000 + 10000 = 30000
    // Unbudgeted = 8000 (Random expense) + 2000 (from beforeEach setup) = 10000
    // Total safe to spend = 100000 - 30000 - 10000 = 60000
    // Note: The 12000 spent on transport exceeded the 10000 limit. 
    // Wait, the user's formula is "Safe to Spend = (Income for this month) - (All Budgets Limits) - (Any uncategorized or non-budgeted expenses)".
    // So the overspend of 2000 in Transport is NOT subtracted in this simplified formula.
    
    expect(snapshot.metrics.safeToSpend).toBe(60000_00n);
  });
});
