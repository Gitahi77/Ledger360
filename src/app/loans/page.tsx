// src/app/loans/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getLoans } from '@/lib/actions/loans';
import { getAccountBalances } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/transactions';
import { LoansClient } from './LoansClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Loans() {
  const user = await requireAuth();
  const [loans, categories, accounts] = await Promise.all([
    getLoans(),
    getCategories(),
    getAccountBalances(user.id)
  ]);
  return (
    <AppLayout>
      <LoansClient loans={loans} currency={user.currency} categories={categories} accounts={accounts} />
    </AppLayout>
  );
}
