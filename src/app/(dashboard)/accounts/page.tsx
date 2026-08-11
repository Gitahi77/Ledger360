export const dynamic = 'force-dynamic';
// src/app/accounts/page.tsx
export const metadata = { title: 'Accounts - Ledger360' };

import { requireAuth } from '@/lib/actions/_auth';
import { getAccountsIntelligence } from '@/lib/actions/accounts';
import { AccountsClient } from './AccountsClient';
import { redirect } from 'next/navigation';

export default async function AccountsPage() {
  const user = await requireAuth();
  const res = await getAccountsIntelligence();
  
  if (!res.success) {
    throw new Error('Failed to load accounts intelligence');
  }

  return (
    <AccountsClient intelligence={res.data} currency={user.currency} />
  );
}

