// src/app/accounts/page.tsx
export const metadata = { title: 'Accounts ?" Ledger360' };

import { requireAuth } from '@/lib/actions/_auth';
import { getAccountBalances } from '@/lib/actions/accounts';
import { AccountsClient } from './AccountsClient';

export default async function AccountsPage() {
  const user = await requireAuth();
  const allAccounts = await getAccountBalances(user.id);
  const mappedAccounts = allAccounts.map(a => ({
    ...a,
    openingMinor: Number(a.openingMinor),
    balanceMinor: Number(a.balanceMinor)
  }));

  return (
    <AccountsClient accounts={mappedAccounts} currency={user.currency} />
  );
}
