// src/app/loans/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getLoans } from '@/lib/actions/loans';
import { LoansClient } from './LoansClient';

export default async function Loans() {
  const loans = await getLoans();
  return (
    <AppLayout>
      <LoansClient loans={loans} />
    </AppLayout>
  );
}
