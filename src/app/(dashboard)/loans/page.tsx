// src/app/loans/page.tsx — Live Server Component

import { getLoans } from '@/lib/queries/loans';
import { getAccountBalances } from '@/lib/queries/accounts';
import { getCategories } from '@/lib/queries/transactions';
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
    <>
      <LoansClient loans={loans} currency={user.currency} categories={categories} accounts={accounts} />
    </>
  );
}
