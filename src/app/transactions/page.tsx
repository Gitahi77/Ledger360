// src/app/transactions/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getTransactions, getCategories } from '@/lib/actions/transactions';
import { TransactionsClient } from './TransactionsClient';

export default async function Transactions({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const { period: rawPeriod, type: rawType } = await searchParams;
  const period     = rawPeriod ?? 'this-month';
  const typeFilter = rawType   ?? 'all';

  const [transactions, categories] = await Promise.all([
    getTransactions(period, typeFilter === 'all' ? undefined : typeFilter),
    getCategories(),
  ]);

  // Compute summary totals from the unfiltered period (all types)
  const allForPeriod = typeFilter !== 'all'
    ? await getTransactions(period)
    : transactions;

  const totalIncome  = allForPeriod.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = allForPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <AppLayout>
      <TransactionsClient
        transactions={transactions}
        categories={categories}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        period={period}
        typeFilter={typeFilter}
      />
    </AppLayout>
  );
}
