// src/app/transactions/page.tsx — Live Server Component

import { getTransactions, getCategories, getTransactionSummary } from '@/lib/queries/transactions';
import { getAccounts } from '@/lib/queries/accounts';
import { getTransfers } from '@/lib/queries/transfers';
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

  const [user, transactions, transfers, categories, accounts, goals, loans] = await Promise.all([
    requireAuth(),
    getTransactions(period, typeFilter === 'all' || typeFilter === 'transfer' ? undefined : typeFilter),
    typeFilter === 'all' || typeFilter === 'transfer' ? getTransfers(period as Parameters<typeof getTransfers>[0]) : Promise.resolve([]),
    getCategories(),
    getAccounts(),
    getGoals(),
    getLoans(),
  ]);

  const mappedTransfers = transfers.map(t => ({
    id: t.id,
    name: 'Transfer',
    baseAmountMinor: Number(t.amountMinor),
    type: 'transfer',
    date: t.date,
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
    interestMinor: t.interestMinor ? Number(t.interestMinor) : undefined,
  }));

  const mappedTransactions = transactions.map(t => ({
    ...t,
    baseAmountMinor: Number(t.baseAmountMinor)
  }));

  const allItems = [...mappedTransactions, ...mappedTransfers]
    .filter(t => typeFilter === 'all' ? true : t.type === typeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute summary totals from the unfiltered period (all types)
  const allForPeriod = typeFilter !== 'all'
    ? await getTransactions(period)
    : transactions;

  const totalIncome  = allForPeriod.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.baseAmountMinor), 0);
  const totalExpense = allForPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.baseAmountMinor), 0);

  const { moneyOut } = await getTransactionSummary(period);

  return (
    <>
      <TransactionsClient
        transactions={allItems}
        categories={categories}
        accounts={accounts}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        moneyOut={moneyOut}
        period={period}
        typeFilter={typeFilter}
        currency={user.currency}
        goals={goals}
        loans={loans}
      />
    </>
  );
}
