import { Suspense } from 'react';
export const dynamic = 'force-dynamic';
// src/app/transactions/page.tsx — Live Server Component

import { getTransactions, getCategories, getTransactionSummary } from '@/lib/queries/transactions';
import { getAccounts } from '@/lib/queries/accounts';
import { getTransfers } from '@/lib/queries/transfers';
import { generateTransactionsIntelligence } from '@/lib/domain/calculators/transactions-intelligence';
import { TransactionsClient } from './TransactionsClient';
import { requireAuth } from '@/lib/actions/_auth';

import { getGoals } from '@/lib/queries/goals';
import { getLoans } from '@/lib/queries/loans';

export default async function Transactions({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const { period: rawPeriod, type: rawType } = await searchParams;
  // Strict allowlist: never trust URL query params. Unknown values could corrupt
  // date range calculations or be passed unsanitised into Prisma filter clauses.
  const ALLOWED_PERIODS = ['this-month', 'this-week', 'this-year', 'all-time'] as const;
  type AllowedPeriod = typeof ALLOWED_PERIODS[number];
  const period: AllowedPeriod = ALLOWED_PERIODS.includes(rawPeriod as AllowedPeriod)
    ? (rawPeriod as AllowedPeriod)
    : 'this-month';

  const ALLOWED_TYPES = ['all', 'income', 'expense', 'transfer'] as const;
  type AllowedType = typeof ALLOWED_TYPES[number];
  const typeFilter: AllowedType = ALLOWED_TYPES.includes(rawType as AllowedType)
    ? (rawType as AllowedType)
    : 'all';

  const user = await requireAuth();
  const [transactionsPage, transfers, categories, accounts, goals, loans] = await Promise.all([
    getTransactions({ userId: user.id, period, type: typeFilter === 'all' || typeFilter === 'transfer' ? undefined : typeFilter }),
    typeFilter === 'all' || typeFilter === 'transfer' ? getTransfers({ userId: user.id, period }) : Promise.resolve([]),
    getCategories({ userId: user.id }),
    getAccounts({ userId: user.id }),
    getGoals({ userId: user.id }),
    getLoans({ userId: user.id }),
  ]);

  const mappedTransfers = transfers.map(t => ({
    id: t.id,
    name: 'Transfer',
    baseMoney: t.baseMoney,
    type: 'transfer',
    date: t.date, // already an ISO string
    note: t.note,
    category: {
      id: 'transfer',
      name: `${t.fromAccount ? t.fromAccount.name : 'External'} → ${t.toAccount ? t.toAccount.name : 'External'}`,
      icon: 'transfer',
    },
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    goalId: t.goalId,
    loanId: t.loanId,
    interestMoney: t.interestMoney,
  }));

  const mappedTransactions = transactionsPage.items;

  const allItems = [...mappedTransactions, ...mappedTransfers]
    .filter(t => typeFilter === 'all' ? true : t.type === typeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const { moneyOut, income: totalIncome, expenses: totalExpense } = await getTransactionSummary({ userId: user.id, period });

  const intelligencePeriodDays = period === 'this-week' ? 7 : period === 'this-month' ? 30 : period === 'this-year' ? 365 : 30;
  const intelligence = generateTransactionsIntelligence(allItems, intelligencePeriodDays);

  return (
    <>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading transactions...</div>}>
        <TransactionsClient
          transactions={allItems}
          nextCursor={transactionsPage.nextCursor}
          hasNextPage={transactionsPage.hasNextPage}
          categories={categories}
          accounts={accounts}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          moneyOut={moneyOut}
          period={period}
          typeFilter={typeFilter}
          currency={user.currency}
          intelligence={intelligence}
          goals={goals}
          loans={loans}
        />
      </Suspense>
    </>
  );
}

