import { requireAuth } from '@/lib/actions/_auth';
import { prisma } from '@/lib/prisma';
import { CategoriesClient } from './CategoriesClient';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata = { title: 'Categories - Ledger360' };

export default async function CategoriesPage() {
  const user = await requireAuth();

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { transactions: true, budgets: true }
      }
    }
  });

  // Get user currency
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { currency: true }
  });

  return (
    <AppLayout>
      <div className="animate-in" style={{ padding: '1.25rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <CategoriesClient 
          initialCategories={categories} 
          currency={dbUser?.currency ?? 'KES'} 
        />
      </div>
    </AppLayout>
  );
}
