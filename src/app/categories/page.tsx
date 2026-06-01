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
      <div className="animate-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Categories
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your transaction and budget categories.
          </p>
        </div>
        
        <CategoriesClient 
          initialCategories={categories as any} 
          currency={dbUser?.currency ?? 'KES'} 
        />
      </div>
    </AppLayout>
  );
}
