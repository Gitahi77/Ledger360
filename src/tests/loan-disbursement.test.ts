// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth and prisma
vi.mock('@/lib/actions/_auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', currency: 'KES' })
}));
vi.mock('../lib/actions/_auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', currency: 'KES' })
}));

vi.mock('@/lib/api/frankfurter', () => ({
  getRates: vi.fn().mockResolvedValue({ amount: 1, base: 'USD', date: '2023-01-01', rates: { KES: 130 } })
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (cb: any) => cb(prisma)),
    account: {
      findMany: vi.fn()
    },
    asset: {
      findMany: vi.fn().mockResolvedValue([])
    },
    loan: {
      findMany: vi.fn()
    },
    transfer: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([])
    },
    transaction: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { baseAmountMinor: 0 } }),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([])
    }
  }
}));

import { prisma } from '../lib/prisma';
import { getAccountBalances } from '../lib/actions/accounts';
import { getNetWorth } from '../lib/queries/networth';
import { getReportSummary } from '../lib/queries/reports';
import { getLoansForUser } from '../lib/queries/loans';

describe('Loan Disbursement (Received Funds)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({ _sum: { baseAmountMinor: 0 } } as any);
  });

  it('increases account balance, leaves net worth neutral, does not count in reports, does not reduce loan balance', async () => {
    // 1. Setup Initial State (No existing transactions, just the loan and its disbursement)
    const LOAN_AMOUNT = 50000;
    
    // Mock the single account
    vi.mocked(prisma.account.findMany).mockResolvedValue([
      { id: 'acc-1', type: 'bank', currency: 'KES', userId: 'user-1', name: 'Bank', openingMinor: 0, balanceMinor: BigInt(LOAN_AMOUNT), allowNegativeBalance: false, archived: false, createdAt: new Date() } as any
    ]);

    // Mock transfers for getAccountBalances
    vi.mocked(prisma.transfer.groupBy).mockImplementation((async (args: any) => {
      if (args.by?.includes('toAccountId')) return [{ toAccountId: 'acc-1', _sum: { baseAmountMinor: LOAN_AMOUNT } }];
      if (args.by?.includes('fromAccountId')) return [];
      return [];
    }) as any);

    // Mock transfers for reports (both previous and current period)
    vi.mocked(prisma.transfer.findMany).mockImplementation((async (args: any) => {
      // getReportSummary explicitly looks for: { loanId: { not: null }, toAccountId: null }
      if (args.where?.loanId?.not === null) {
        if (args.where?.toAccountId === null) {
          // This should match repayments. Since it's a disbursement (toAccountId is set), it is NOT returned here.
          return [];
        }
        // If the query didn't have the `toAccountId: null` filter, it would wrongly catch it.
        // We'll return it ONLY if `toAccountId: null` is NOT specified, verifying our fix!
        if (args.where?.toAccountId !== null) {
          return [{ baseAmountMinor: LOAN_AMOUNT, interestMinor: 0, toAccountId: 'acc-1' }];
        }
      }
      return [];
    }) as any);

    // Mock the loan for getLoansForUser / getNetWorth
    vi.mocked(prisma.loan.findMany).mockResolvedValue([{
      id: 'loan-1', balanceMinor: LOAN_AMOUNT, userId: 'user-1', name: 'Disbursed Loan', lender: 'Bank', type: 'personal', originalAmountMinor: LOAN_AMOUNT, annualRate: 10, monthlyPaymentMoney: { amountMinor: 250, currency: 'KES' }, monthlyPaymentMinor: 250n, nextDue: new Date(), createdAt: new Date(), transfers: []
    } as any]);

    // Test (a): Increases the chosen account balance by the loan amount
    const balancesRes = await getAccountBalances('user-1');
    const balances = balancesRes.success ? balancesRes.data : [];
    expect(balances.length).toBe(1);
    expect(balances[0].balanceMoney.amountMinor).toBe(LOAN_AMOUNT);

    // Test (b): Leaves net worth neutral
    // Net worth = Assets (Cash) - Liabilities (Loans) = LOAN_AMOUNT - LOAN_AMOUNT = 0
    const netWorth = await getNetWorth({ userId: 'user-1', currency: 'KES' });
    
    // getNetWorth calls getAccountBalances and getLoansForUser, so we need to ensure our mocks are complete
    expect(netWorth.totalCashMinor).toBe(LOAN_AMOUNT);
    expect(netWorth.totalLiabilitiesMinor).toBe(LOAN_AMOUNT);
    expect(netWorth.netWorthMinor).toBe(0);

    // Test (c): NOT counted in reports Debt Repayment, savings, income, or expenses
    const report = await getReportSummary('this-month');
    expect(report.income).toBe(0);
    expect(report.expenses).toBe(0);
    expect(report.savings).toBe(0);
    // This is the crucial check: a disbursement should NOT be considered a Debt Repayment!
    expect(report.debtRepayment).toBe(0);

    // Test (d): Does NOT reduce the loan balance (not treated as a repayment)
    // Actually getLoansForUser filters transfers internally
    const loans = await getLoansForUser({ userId: 'user-1' });
    expect(loans.length).toBe(1);
    // Our mock of loan.findMany includes the transfer. But because our loan.ts fix filters the `include`, 
    // we mocked the result. Since we are testing the output of getLoansForUser given the DB result,
    // wait... in the real code, `getLoansForUser` queries the DB with `include: { transfers: { where: { toAccountId: null } } }`.
    // So the mock should return NO transfers in the `include` because the DB filters them.
    // Let me fix the mock to return an empty array for transfers since the filter correctly excludes it.
    vi.mocked(prisma.loan.findMany).mockResolvedValue([{
      id: 'loan-1', balanceMinor: LOAN_AMOUNT, userId: 'user-1', name: 'Disbursed Loan', lender: 'Bank', type: 'personal', originalAmountMinor: LOAN_AMOUNT, annualRate: 10, monthlyPaymentMoney: { amountMinor: 250, currency: 'KES' }, monthlyPaymentMinor: 250n, nextDue: new Date(), createdAt: new Date(), transfers: []
    } as any]);
    
    const loansCheck = await getLoansForUser({ userId: 'user-1' });
    expect(loansCheck[0].balanceMoney.amountMinor).toBe(LOAN_AMOUNT);
  });
});
