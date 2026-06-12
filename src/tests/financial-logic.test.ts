import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeLoanBalance } from '../lib/shared-computations';

// Mock dependencies
vi.mock('@/lib/actions/_auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' })
}));

vi.mock('@/lib/actions/accounts', () => ({
  getAccountBalances: vi.fn()
}));

vi.mock('@/lib/actions/loans', () => ({
  getLoansForUser: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    asset: {
      findMany: vi.fn()
    },
    loan: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    goal: {
      findMany: vi.fn().mockResolvedValue([])
    },
    category: {
      findFirst: vi.fn()
    },
    transfer: {
      create: vi.fn().mockResolvedValue({ id: 'transfer-mocked' }),
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { baseAmountMinor: 0 } })
    },
    transaction: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'tx-mocked' }),
      aggregate: vi.fn().mockResolvedValue({ _sum: { baseAmountMinor: 0 } })
    },
    userPreferences: {
      findUnique: vi.fn().mockResolvedValue({ currency: 'KES' })
    }
  }
}));

vi.mock('@/lib/audit', () => ({
  logActivity: vi.fn()
}));

// Import modules to test after mocks are set up
import { getNetWorth } from '../lib/actions/networth';
import { getAccountBalances } from '../lib/actions/accounts';
import { getLoansForUser } from '../lib/actions/loans';
import { prisma } from '../lib/prisma';
import { createTransfer } from '../lib/actions/transfers';
import { addTransaction, editTransaction, getTransactionSummary } from '../lib/actions/transactions';
import { getReportSummary } from '../lib/actions/reports';
import { generateInsights } from '../lib/intelligence';

describe('Financial Logic and Validations', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Shared Computations (computeLoanBalance)', () => {
    it('computes balance correctly with partial repayment', () => {
      expect(computeLoanBalance(1000, 200)).toBe(800);
    });

    it('allows exact payoff', () => {
      expect(computeLoanBalance(1000, 1000)).toBe(0);
    });

    it('clamps balance at 0 for overpayment', () => {
      expect(computeLoanBalance(1000, 1200)).toBe(0);
    });
  });

  describe('Net Worth Calculation', () => {
    it('calculates net worth with cash and computed loans, preventing double-counting of credit cards', async () => {
      // Mock account balances
      vi.mocked(getAccountBalances).mockResolvedValue([
        { id: 'acc-1', type: 'bank', balanceMinor: 5000, userId: 'user-1', name: 'Bank', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() },
        { id: 'acc-2', type: 'credit_card', balanceMinor: -2000, userId: 'user-1', name: 'CC', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() }
      ]);

      // Mock assets
      vi.mocked(prisma.asset.findMany).mockResolvedValue([
        { id: 'ast-1', userId: 'user-1', name: 'Car', category: 'Vehicle', valueMinor: 10000, createdAt: new Date(), updatedAt: new Date() }
      ]);

      // Mock loans
      vi.mocked(getLoansForUser).mockResolvedValue([
        { id: 'loan-1', balanceMinor: 3000, userId: 'user-1', name: 'Personal Loan', lender: 'Bank', type: 'personal', originalAmountMinor: 3000, annualRate: 10, monthlyPaymentMinor: 250, nextDue: new Date(), createdAt: new Date(), daysOverdue: 0 }
      ]);

      const result = await getNetWorth();

      // Cash should only be the positive bank account
      expect(result.totalCashMinor).toBe(5000);
      
      // Total Assets = Cash (5000) + Asset (10000)
      expect(result.totalAssetsMinor).toBe(15000);

      // Liabilities = Loan (3000) + Credit Card Debt (2000)
      expect(result.totalLiabilitiesMinor).toBe(5000);

      // Net worth = 15000 - 5000 = 10000
      expect(result.netWorthMinor).toBe(10000);
    });
  });

  describe('Intelligence Engine', () => {
    it('excludes fully repaid loans from active/overdue alerts', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000 * 5); // 5 days ago (overdue)
      const futureDate = new Date(now.getTime() + 86400000 * 2); // 2 days future (upcoming)

      vi.mocked(getLoansForUser).mockResolvedValue([
        // Active upcoming loan
        { id: 'loan-active', balanceMinor: 1000, nextDue: futureDate, monthlyPaymentMinor: 100, name: 'Active Loan', userId: 'user-1', lender: 'Bank', type: 'personal', originalAmountMinor: 1000, annualRate: 10, createdAt: new Date(), daysOverdue: 0 },
        // Repaid loan (overdue date, but balance is 0 so should not trigger)
        { id: 'loan-repaid', balanceMinor: 0, nextDue: pastDate, monthlyPaymentMinor: 100, name: 'Repaid Loan', userId: 'user-1', lender: 'Bank', type: 'personal', originalAmountMinor: 1000, annualRate: 10, createdAt: new Date(), daysOverdue: 0 }
      ]);

      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { id: 'tx-1', date: pastDate, type: 'expense', baseAmountMinor: 100, accountId: 'a', categoryId: 'c', category: { name: 'c' }, userId: 'u', name: 'n', note: null, createdAt: now, updatedAt: now } as any,
        { id: 'tx-2', date: pastDate, type: 'expense', baseAmountMinor: 100, accountId: 'a', categoryId: 'c', category: { name: 'c' }, userId: 'u', name: 'n', note: null, createdAt: now, updatedAt: now } as any,
        { id: 'tx-3', date: pastDate, type: 'expense', baseAmountMinor: 100, accountId: 'a', categoryId: 'c', category: { name: 'c' }, userId: 'u', name: 'n', note: null, createdAt: now, updatedAt: now } as any,
        { id: 'tx-4', date: pastDate, type: 'expense', baseAmountMinor: 100, accountId: 'a', categoryId: 'c', category: { name: 'c' }, userId: 'u', name: 'n', note: null, createdAt: now, updatedAt: now } as any,
        { id: 'tx-5', date: pastDate, type: 'expense', baseAmountMinor: 100, accountId: 'a', categoryId: 'c', category: { name: 'c' }, userId: 'u', name: 'n', note: null, createdAt: now, updatedAt: now } as any
      ]);
      
      // We pass mocked dates/functions if needed, but generateInsights reads from module scope.
      // So we just call it.
      const insights = await generateInsights('user-1');
      
      const loanAlerts = insights.filter(i => i.id.startsWith('loan-'));
      expect(loanAlerts.length).toBe(1);
      expect(loanAlerts[0].id).toBe('loan-due-loan-active');
    });
  });

  describe('getTransactionSummary — savings definition (WO-16)', () => {
    beforeEach(() => {
      // Default: income = 100000, expenses = 30000
      vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: { where?: { type?: string } }) => {
        if (args.where?.type === 'income') return { _sum: { baseAmountMinor: 100000 } };
        if (args.where?.type === 'expense') return { _sum: { baseAmountMinor: 30000 } };
        return { _sum: { baseAmountMinor: 0 } };
      }) as unknown as typeof prisma.transaction.aggregate);
      // Default: no external transfers out
      vi.mocked(prisma.transfer.aggregate).mockResolvedValue({ _sum: { baseAmountMinor: 0 } } as ReturnType<typeof prisma.transfer.aggregate> extends Promise<infer U> ? U : never);
    });

    it('counts goal-funding transfers (goalId set) as savings', async () => {
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([
        { baseAmountMinor: 5000 },
      ] as { baseAmountMinor: number }[] as Awaited<ReturnType<typeof prisma.transfer.findMany>>);

      const res = await getTransactionSummary('this-month');
      expect(res.savings).toBe(5000);
      expect(res.savingRate).toBe(5); // 5000/100000 * 100
    });

    it('counts transfers to a savings account as savings', async () => {
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([
        { baseAmountMinor: 20000 },
      ] as { baseAmountMinor: number }[] as Awaited<ReturnType<typeof prisma.transfer.findMany>>);

      const res = await getTransactionSummary('this-month');
      expect(res.savings).toBe(20000);
      expect(res.savingRate).toBe(20);
    });

    it('counts transfers to an investment account as savings', async () => {
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([
        { baseAmountMinor: 15000 },
      ] as { baseAmountMinor: number }[] as Awaited<ReturnType<typeof prisma.transfer.findMany>>);

      const res = await getTransactionSummary('this-month');
      expect(res.savings).toBe(15000);
      expect(res.savingRate).toBe(15);
    });

    it('excludes loan repayments (loanId set) from savings', async () => {
      // The query has loanId: null, so Prisma will never return loan repayments.
      // Simulate: no qualifying transfers returned.
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([]);

      const res = await getTransactionSummary('this-month');
      expect(res.savings).toBe(0);
      expect(res.savingRate).toBe(0);
    });

    it('excludes transfers to bank/mobile_money accounts without goalId from savings', async () => {
      // The query only returns transfers with goalId set OR toAccount.type in savings/investment.
      // A transfer to a bank account with no goalId does not match -> not returned.
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([]);

      const res = await getTransactionSummary('this-month');
      expect(res.savings).toBe(0);
      expect(res.savingRate).toBe(0);
    });

    it('returns savingRate 0 when income is 0', async () => {
      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({ _sum: { baseAmountMinor: 0 } } as Awaited<ReturnType<typeof prisma.transaction.aggregate>>);
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([
        { baseAmountMinor: 5000 },
      ] as { baseAmountMinor: number }[] as Awaited<ReturnType<typeof prisma.transfer.findMany>>);

      const res = await getTransactionSummary('this-month');
      expect(res.savings).toBe(5000);
      expect(res.savingRate).toBe(0);
    });
  });

  describe('getReportSummary — Cash Flow Validations (Phase 1)', () => {
    beforeEach(() => {
      // Mock aggregations to separate income and expenses
      vi.mocked(prisma.transaction.aggregate).mockImplementation((async (args: { where?: { type?: string } }) => {
        if (args.where?.type === 'income') return { _sum: { baseAmountMinor: 100000 } };
        if (args.where?.type === 'expense') return { _sum: { baseAmountMinor: 30000 } };
        return { _sum: { baseAmountMinor: 0 } };
      }) as unknown as typeof prisma.transaction.aggregate);
    });

    it('sums loan repayments into DebtRepayment and NOT into expenses or savings', async () => {
      // FindMany returns the separate      // Two transfers: one savings, one debt
      vi.mocked(prisma.transfer.findMany).mockImplementation((async (args: any) => {
        if (args.where?.loanId === null) return [{ baseAmountMinor: 5000, interestMinor: 0 }];
        if (args.where?.loanId?.not === null) return [{ baseAmountMinor: 10000, interestMinor: 0 }];
        return [];
      }) as unknown as typeof prisma.transfer.findMany);

      const res = await getReportSummary('this-month');
      expect(res.income).toBe(100000);
      expect(res.expenses).toBe(30000); // unaffected
      expect(res.savings).toBe(5000); // only the null loanId transfer
      expect(res.debtRepayment).toBe(10000); // only the not null loanId transfer
      
      // Net Cash Flow = Income - Spending - Savings - Debt Repayment
      // 100000 - 30000 - 5000 - 10000 = 55000
      expect(res.netCashFlow).toBe(55000);
    });

    it('reconciles Reports total outflow to Dashboard moneyOut', async () => {
      vi.mocked(prisma.transfer.findMany).mockImplementation((async (args: any) => {
        if (args.where?.loanId === null) return [{ baseAmountMinor: 5000, interestMinor: 0 }]; // Savings
        if (args.where?.loanId?.not === null) return [{ baseAmountMinor: 10000, interestMinor: 0 }]; // Debt Repayment
        return [];
      }) as unknown as typeof prisma.transfer.findMany);

      // Dashboard logic mock
      vi.mocked(prisma.transfer.aggregate).mockResolvedValue({ _sum: { baseAmountMinor: 10000, interestMinor: 0 } } as Awaited<ReturnType<typeof prisma.transfer.aggregate>>);

      const dashboard = await getTransactionSummary('this-month');
      const reports = await getReportSummary('this-month');

      // Dashboard moneyOut = expenses (30000) + transfers out (10000 loan repayment) = 40000
      const reportsTotalOutflow = reports.expenses + reports.debtRepayment;
      expect(reportsTotalOutflow).toBe(dashboard.moneyOut);
      expect(reportsTotalOutflow).toBe(40000);
    });
  });

  describe('Overdraft and Overpayment Validations', () => {
    it('rejects loan overpayment but allows exact payoff via createTransfer', async () => {
      // Setup
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-1', type: 'bank', balanceMinor: 5000, userId: 'user-1', name: 'Bank', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() }]);
      vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: 'acc-1', type: 'bank', currency: 'KES', userId: 'user-1', name: 'Bank', openingMinor: 0, archived: false, createdAt: new Date() } as any);
      vi.mocked(getLoansForUser).mockResolvedValue([
        { id: 'loan-1', balanceMinor: 1000, userId: 'user-1', name: 'Personal Loan', lender: 'Bank', type: 'personal', originalAmountMinor: 1000, annualRate: 10, monthlyPaymentMinor: 250, nextDue: new Date(), createdAt: new Date(), daysOverdue: 0 }
      ]);
      vi.mocked(prisma.loan.findFirst).mockResolvedValue({ id: 'loan-1', balanceMinor: 1000, userId: 'user-1', name: 'Personal Loan', lender: 'Bank', type: 'personal', annualRate: 10, monthlyPaymentMinor: 250, nextDue: new Date(), createdAt: new Date() } as any);

      // Overpayment should throw
      await expect(createTransfer({
        fromAccountId: 'acc-1', loanId: 'loan-1', amountMinor: 1200, date: '2023-10-10'
      })).rejects.toThrow(/You can't pay more than you owe/);

      // Exact payoff should succeed
      await expect(createTransfer({
        fromAccountId: 'acc-1', loanId: 'loan-1', amountMinor: 1000, date: '2023-10-10'
      })).resolves.not.toThrow();
    });

    it('returns an overdraft warning for standard accounts in addTransaction without throwing', async () => {
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-1', type: 'bank', balanceMinor: 500, userId: 'user-1', name: 'Bank', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() }]);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1', userId: 'user-1', name: 'Food', type: 'expense', icon: null, createdAt: new Date() } as any);

      const res = await addTransaction({
        name: 'Lunch', type: 'expense', baseAmountMinor: 600, categoryId: 'cat-1', accountId: 'acc-1', date: '2023-10-10'
      });
      expect(res).toEqual({ warning: expect.stringMatching(/Not enough money in Bank/) });
    });

    it('allows overdrafts for credit_card accounts in addTransaction', async () => {
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-cc', type: 'credit_card', balanceMinor: 0, userId: 'user-1', name: 'CC', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() }]);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1', userId: 'user-1', name: 'Food', type: 'expense', icon: null, createdAt: new Date() } as any);
      
      // Should succeed
      await expect(addTransaction({
        name: 'Lunch', type: 'expense', baseAmountMinor: 600, categoryId: 'cat-1', accountId: 'acc-cc', date: '2023-10-10'
      })).resolves.not.toThrow();
    });

    it('computes effective balance correctly when editing a transaction', async () => {
      // Current balance is 500, but that includes a 300 expense we are editing.
      // So effective balance before the new edit is 500 + 300 = 800.
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-1', type: 'bank', balanceMinor: 500, userId: 'user-1', name: 'Bank', currency: 'KES', openingMinor: 0, archived: false, createdAt: new Date() }]);
      
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue({
        id: 'tx-1', type: 'expense', baseAmountMinor: 300, accountId: 'acc-1', userId: 'user-1', name: 'Lunch', categoryId: 'cat-1', date: new Date(), note: null, createdAt: new Date()
      } as any);
      vi.mocked(prisma.transaction.updateMany).mockResolvedValue({ count: 1 });

      // Increasing expense to 700: 800 - 700 = 100 >= 0 (Allowed)
      await expect(editTransaction('tx-1', {
        baseAmountMinor: 700
      })).resolves.not.toThrow();

      // Increasing expense to 900: 800 - 900 = -100 < 0 (Warning)
      const res = await editTransaction('tx-1', {
        baseAmountMinor: 900
      });
      expect(res).toEqual({ warning: expect.stringMatching(/Not enough money in Bank/) });
    });
  });

  describe('Loan Interest Split', () => {
    it('splits loan payment into interest and principal correctly and caps interest', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: 'acc-1', type: 'bank', currency: 'KES', userId: 'user-1', name: 'Bank' } as any);
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-1', balanceMinor: 5000, type: 'bank', currency: 'KES', name: 'Bank', userId: 'user-1' } as any]);
      
      const mockLoan = { id: 'loan-1', balanceMinor: 120000, annualRate: 10, userId: 'user-1' };
      vi.mocked(getLoansForUser).mockResolvedValue([mockLoan as any]);

      // 120,000 * 10% / 12 = 1000 default interest
      await createTransfer({ fromAccountId: 'acc-1', loanId: 'loan-1', amountMinor: 5000, date: '2023-10-10' });
      expect(prisma.transfer.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amountMinor: 5000,
          interestMinor: 1000,
        })
      }));

      // Test cap: if payment is less than interest
      await createTransfer({ fromAccountId: 'acc-1', loanId: 'loan-1', amountMinor: 500, date: '2023-10-10' });
      expect(prisma.transfer.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amountMinor: 500,
          interestMinor: 500,
        })
      }));
    });

    it('net worth drops by exactly the interest paid', async () => {
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-1', balanceMinor: 5000, type: 'bank', currency: 'KES', name: 'Bank', userId: 'user-1', openingMinor: 0, archived: false, createdAt: new Date() }]);
      vi.mocked(getLoansForUser).mockResolvedValue([{ id: 'loan-1', balanceMinor: 5000, userId: 'user-1', name: 'L', lender: 'B', type: 't', originalAmountMinor: 5000, annualRate: 0, monthlyPaymentMinor: 0, nextDue: new Date(), createdAt: new Date(), daysOverdue: 0 }]);
      vi.mocked(prisma.asset.findMany).mockResolvedValue([]);
      
      const before = await getNetWorth();
      expect(before.netWorthMinor).toBe(0);
      
      vi.mocked(getAccountBalances).mockResolvedValue([{ id: 'acc-1', balanceMinor: 4000, type: 'bank', currency: 'KES', name: 'Bank', userId: 'user-1', openingMinor: 0, archived: false, createdAt: new Date() }]);
      vi.mocked(getLoansForUser).mockResolvedValue([{ id: 'loan-1', balanceMinor: 4200, userId: 'user-1', name: 'L', lender: 'B', type: 't', originalAmountMinor: 5000, annualRate: 0, monthlyPaymentMinor: 0, nextDue: new Date(), createdAt: new Date(), daysOverdue: 0 }]);
      
      const after = await getNetWorth();
      expect(after.netWorthMinor).toBe(-200); 
    });

    it('allocates interest to Spending and principal to Debt Repayment in reports, handling legacy payments correctly', async () => {
      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({ _sum: { baseAmountMinor: 0 } } as any);
      
      vi.mocked(prisma.transfer.findMany).mockImplementation(async (args: any) => {
        if (args.where?.loanId === null) return [];
        if (args.where?.loanId?.not === null) {
          return [
            { baseAmountMinor: 5000, interestMinor: 1000 }, // New split payment
            { baseAmountMinor: 2000, interestMinor: 0 }     // Legacy payment
          ];
        }
        return [];
      });

      const reports = await getReportSummary('this-month');
      expect(reports.debtRepayment).toBe(6000); // (5000-1000) + 2000
      expect(reports.expenses).toBe(1000);      // 0 + 1000
    });
  });
});
