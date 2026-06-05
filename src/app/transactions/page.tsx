// src/app/transactions/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getTransactions, getCategories } from '@/lib/actions/transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransfers } from '@/lib/actions/transfers';
import { TransactionsClient } from './TransactionsClient';
import { requireAuth } from '@/lib/actions/_auth';

import { getGoals } from '@/lib/actions/goals';
import { getLoans } from '@/lib/actions/loans';

export default async function Transactions({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const { period: rawPeriod, type: rawType } = await searchParams;
  const period     = rawPeriod ?? 'this-month';
  const typeFilter = rawType   ?? 'all';

  const [user, transactions, transfers, categories, accounts, goals, loans] = await Promise.all([
    requireAuth(),
    getTransactions(period, typeFilter === 'all' || typeFilter === 'transfer' ? undefined : typeFilter),
    typeFilter === 'all' || typeFilter === 'transfer' ? getTransfers(period as any) : Promise.resolve([]),
    getCategories(),
    getAccounts(),
    getGoals(),
    getLoans(),
  ]);

  const mappedTransfers = transfers.map(t => ({
    id: t.id,
    name: 'Transfer',
    baseAmountMinor: t.amountMinor,
    type: 'transfer',
    date: t.date,
    note: t.note,
    category: {
      id: 'transfer',
      name: `${t.fromAccount.name} → ${t.toAccount ? t.toAccount.name : 'External'}`,
      icon: 'transfer',
    }
  }));

  const allItems = [...transactions, ...mappedTransfers]
    .filter(t => typeFilter === 'all' ? true : t.type === typeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute summary totals from the unfiltered period (all types)
  const allForPeriod = typeFilter !== 'all'
    ? await getTransactions(period)
    : transactions;

  const totalIncome  = allForPeriod.filter(t => t.type === 'income').reduce((s, t) => s + t.baseAmountMinor, 0);
  const totalExpense = allForPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + t.baseAmountMinor, 0);

  return (
    <AppLayout>
      <TransactionsClient
        transactions={allItems}
        categories={categories}
        accounts={accounts}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        period={period}
        typeFilter={typeFilter}
        currency={user.currency}
        goals={goals}
        loans={loans}
      />
    </AppLayout>
  );
}
