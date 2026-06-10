// src/app/loans/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getLoans } from '@/lib/actions/loans';
import { getCategories } from '@/lib/actions/transactions';
import { LoansClient } from './LoansClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Loans() {
  const [user, loans, categories] = await Promise.all([
    requireAuth(),
    getLoans(),
    getCategories(),
  ]);
  return (
    <AppLayout>
      <LoansClient loans={loans} currency={user.currency} categories={categories as ReturnType<typeof JSON.parse>} />
    </AppLayout>
  );
}
