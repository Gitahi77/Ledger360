import { prisma } from '@/lib/prisma';
import { startOfMonth, subDays, startOfWeek } from 'date-fns';

export interface AccountSnapshot {
  id: string;
  name: string;
  type: string;
  currency: string;
  balanceMinor: bigint;
}

export interface TransactionSnapshot {
  id: string;
  date: Date;
  amountMinor: bigint; // Signed based on type
  currency: string;
  type: string;
  name: string;
  categoryId: string;
}

export interface BudgetSnapshot {
  id: string;
  name: string;
  limitAmountMinor: bigint;
  spentAmountMinor: bigint;
  period: string;
  categoryId: string;
}

export interface GoalSnapshot {
  id: string;
  name: string;
  targetAmountMinor: bigint;
  savedAmountMinor: bigint;
  deadline: Date | null;
}

export interface LoanSnapshot {
  id: string;
  name: string;
  lender: string;
  balanceMinor: bigint;
  originalAmountMinor: bigint;
  nextDue: Date;
  monthlyPaymentMinor: bigint;
}

export interface InvestmentSnapshot {
  id: string;
  name: string;
  valueMinor: bigint;
  symbol: string | null;
}

export interface BillSnapshot {
  id: string;
  name: string;
  amountMinor: bigint;
  dueDate: Date;
  isPaid: boolean;
}

export interface AlertSnapshot {
  severity: 'info' | 'success' | 'warning' | 'critical';
  title?: string;
  content: string;
  actionLabel?: string;
}

export interface SnapshotMetrics {
  totalAssets: bigint;
  totalLiabilities: bigint;
  liquidCash: bigint;
  netWorth: bigint;
  safeToSpend: bigint;
  emergencyFundCoverage: number; // months covered
  monthlyIncome: bigint;
  monthlyExpenses: bigint;
  savingsRate: number; // percentage (0-100)
  debtRatio: number; // percentage (0-100)
}

export interface FinancialSnapshot {
  metadata: {
    userId: string;
    baseCurrency: string;
    generatedAt: Date;
    dataFreshness: 'live' | 'cached';
  };
  health: {
    staleAccounts: number;
    duplicateTransactions: number;
    pendingImports: number;
    syncErrors: number;
  };
  timeline: {
    lastUpdated: Date | null;
    latestTransactionDate: Date | null;
    oldestTransactionDate: Date | null;
  };

  accounts: AccountSnapshot[];
  transactions: TransactionSnapshot[];
  budgets: BudgetSnapshot[];
  goals: GoalSnapshot[];
  loans: LoanSnapshot[];
  investments: InvestmentSnapshot[];
  bills: BillSnapshot[];
  alerts: AlertSnapshot[];
  metrics: SnapshotMetrics;
}

/**
 * Builds the comprehensive Financial Snapshot domain object.
 * This function is the ONLY place that talks to Prisma for the dashboard.
 */
export async function buildFinancialSnapshot(userId: string): Promise<FinancialSnapshot> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currency: true },
  });
  const baseCurrency = user.currency;

  // 1. Fetch raw facts
  const rawAccounts = await prisma.account.findMany({ where: { userId, archived: false } });
  const rawTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 50,
  });
  const rawBudgets = await prisma.budget.findMany({ where: { userId } });
  const rawGoals = await prisma.goal.findMany({ where: { userId }, include: { transfers: true } });
  const rawLoans = await prisma.loan.findMany({ where: { userId } });
  const rawAssets = await prisma.asset.findMany({ where: { userId } });

  // Compute transaction spent amounts for budgets
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: thisMonthStart } }
  });

  const budgets: BudgetSnapshot[] = rawBudgets.map(b => {
    const spent = thisMonthTransactions
      .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.baseAmountMinor, 0n);
    return {
      id: b.id,
      name: b.name,
      limitAmountMinor: b.limitAmountMinor,
      spentAmountMinor: spent,
      period: b.period,
      categoryId: b.categoryId,
    };
  });

  const goals: GoalSnapshot[] = rawGoals.map(g => {
    const saved = g.transfers.reduce((sum, t) => sum + t.baseAmountMinor, 0n);
    return {
      id: g.id,
      name: g.name,
      targetAmountMinor: g.targetAmountMinor,
      savedAmountMinor: saved,
      deadline: g.deadline,
    };
  });

  const investments: InvestmentSnapshot[] = rawAssets
    .filter(a => a.category === 'Investment')
    .map(a => ({
      id: a.id,
      name: a.name,
      valueMinor: a.valueMinor,
      symbol: a.symbol,
    }));
    
  // Map specialized accounts (SACCO, Crypto, Brokerage) as investments too
  rawAccounts.filter(a => ['SACCO_DEPOSIT', 'CRYPTO', 'BROKERAGE'].includes(a.type)).forEach(a => {
    investments.push({
      id: a.id,
      name: a.name,
      valueMinor: a.balanceMinor,
      symbol: null,
    });
  });

  // Calculate Metrics
  const liquidCash = rawAccounts
    .filter(a => ['CHECKING', 'SAVINGS', 'MPESA', 'AIRTEL_MONEY'].includes(a.type))
    .reduce((sum, a) => sum + a.balanceMinor, 0n);

  const totalAssets = rawAccounts
    .filter(a => !['CREDIT_CARD', 'MORTGAGE', 'AUTO_LOAN', 'SACCO_LOAN'].includes(a.type))
    .reduce((sum, a) => sum + a.balanceMinor, 0n) +
    investments.reduce((sum, i) => sum + i.valueMinor, 0n);

  const totalLiabilities = rawLoans.reduce((sum, l) => sum + l.balanceMinor, 0n) +
    rawAccounts.filter(a => a.type === 'CREDIT_CARD').reduce((sum, a) => sum + (a.balanceMinor < 0n ? -a.balanceMinor : a.balanceMinor), 0n);

  const netWorth = totalAssets - totalLiabilities;

  const monthlyIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.baseAmountMinor, 0n);

  const monthlyExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.baseAmountMinor, 0n);

  const upcomingBillsAmount = rawLoans.reduce((sum, l) => sum + l.monthlyPaymentMinor, 0n); // simplified
  const safeToSpend = liquidCash - upcomingBillsAmount;

  const emergencyFundCoverage = monthlyExpenses > 0n ? Number(liquidCash) / Number(monthlyExpenses) : 0;
  const savingsRate = monthlyIncome > 0n ? (Number(monthlyIncome - monthlyExpenses) / Number(monthlyIncome)) * 100 : 0;
  const debtRatio = totalAssets > 0n ? (Number(totalLiabilities) / Number(totalAssets)) * 100 : 0;

  // Alerts
  const alerts: AlertSnapshot[] = [];
  if (safeToSpend < 0n) {
    alerts.push({
      severity: 'critical',
      title: 'Negative Safe to Spend',
      content: 'Your upcoming obligations exceed your liquid cash.',
      actionLabel: 'Review Cash Flow',
    });
  } else if (liquidCash > monthlyExpenses * 2n && monthlyExpenses > 0n) {
    alerts.push({
      severity: 'info',
      title: 'Excess Liquidity',
      content: 'Consider moving some liquid cash into an interest-bearing account or MMF.',
      actionLabel: 'Transfer Funds',
    });
  }

  // Timeline
  const latestTx = rawTransactions.length > 0 ? rawTransactions[0].date : null;
  const oldestTx = rawTransactions.length > 0 ? rawTransactions[rawTransactions.length - 1].date : null;

  return {
    metadata: {
      userId,
      baseCurrency,
      generatedAt: new Date(),
      dataFreshness: 'live',
    },
    health: {
      staleAccounts: 0,
      duplicateTransactions: 0,
      pendingImports: 0,
      syncErrors: 0,
    },
    timeline: {
      lastUpdated: latestTx,
      latestTransactionDate: latestTx,
      oldestTransactionDate: oldestTx,
    },
    accounts: rawAccounts.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      balanceMinor: a.balanceMinor,
    })),
    transactions: rawTransactions.map(t => ({
      id: t.id,
      date: t.date,
      amountMinor: t.type === 'expense' ? -t.baseAmountMinor : t.baseAmountMinor,
      currency: t.currency,
      type: t.type,
      name: t.name,
      categoryId: t.categoryId,
    })),
    budgets,
    goals,
    loans: rawLoans.map(l => ({
      id: l.id,
      name: l.name,
      lender: l.lender,
      balanceMinor: l.balanceMinor,
      originalAmountMinor: l.originalAmountMinor,
      nextDue: l.nextDue,
      monthlyPaymentMinor: l.monthlyPaymentMinor,
    })),
    investments,
    bills: [], // Simplification for now
    alerts,
    metrics: {
      totalAssets,
      totalLiabilities,
      liquidCash,
      netWorth,
      safeToSpend,
      emergencyFundCoverage,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      debtRatio,
    },
  };
}
