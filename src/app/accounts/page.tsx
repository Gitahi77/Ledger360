// src/app/accounts/page.tsx
export const metadata = { title: 'Accounts ?" Ledger360' };

import { requireAuth } from '@/lib/actions/_auth';
import { getAccountBalances } from '@/lib/actions/accounts';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccountsClient } from './AccountsClient';

export default async function AccountsPage() {
  const user = await requireAuth();
  // Fetch ALL accounts (including archived) to show in the UI list,
  // where the user can manage them.
  const allAccounts = await getAccountBalances(user.id);

  return (
    <AppLayout>
      <AccountsClient initialAccounts={allAccounts} currency={user.currency} />
    </AppLayout>
  );
}
