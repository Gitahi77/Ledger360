// src/app/transactions/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getTransactions, getCategories } from '@/lib/actions/transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { TransactionsClient } from './TransactionsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Transactions({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const { period: rawPeriod, type: rawType } = await searchParams;
  const period     = rawPeriod ?? 'this-month';
  const typeFilter = rawType   ?? 'all';

  const [user, transactions, categories, accounts] = await Promise.all([
    requireAuth(),
    getTransactions(period, typeFilter === 'all' ? undefined : typeFilter),
    getCategories(),
    getAccounts(),
  ]);

  // Compute summary totals from the unfiltered period (all types)
  const allForPeriod = typeFilter !== 'all'
    ? await getTransactions(period)
    : transactions;

  const totalIncome  = allForPeriod.filter(t => t.type === 'income').reduce((s, t) => s + t.baseAmountMinor, 0);
  const totalExpense = allForPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + t.baseAmountMinor, 0);

  return (
    <AppLayout>
      <TransactionsClient
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        period={period}
        typeFilter={typeFilter}
        currency={user.currency}
      />
    </AppLayout>
  );
}
