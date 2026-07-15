export const dynamic = 'force-dynamic';
// src/app/accounts/page.tsx
export const metadata = { title: 'Accounts ?" Ledger360' };

import { requireAuth } from '@/lib/actions/_auth';
import { getAccountBalances } from '@/lib/queries/accounts';
import { AccountsClient } from './AccountsClient';

export default async function AccountsPage() {
  const user = await requireAuth();
  const allAccounts = await getAccountBalances({ userId: user.id });

  return (
    <AccountsClient accounts={allAccounts} currency={user.currency} />
  );
}

