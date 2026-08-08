export const metadata = { title: 'Loans - Ledger360' };
export const dynamic = 'force-dynamic';
// src/app/loans/page.tsx — Live Server Component

import { getLoans } from '@/lib/queries/loans';
import { getAccountBalances } from '@/lib/queries/accounts';
import { LoansClient } from './LoansClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Loans() {
  const user = await requireAuth();
  const [loans, accounts] = await Promise.all([
    getLoans({ userId: user.id }),
    getAccountBalances({ userId: user.id })
  ]);
  return (
    <>
      <LoansClient loans={loans} currency={user.currency} accounts={accounts} />
    </>
  );
}

