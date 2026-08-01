export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/actions/_auth';
import { prisma } from '@/lib/prisma';
import { CategoriesClient } from './CategoriesClient';
import { getCategoryAnalytics } from '@/lib/queries/analytics';

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

  // Fetch 6-month analytics for all categories
  const analytics = await getCategoryAnalytics({ userId: user.id });

  // Get user currency
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { currency: true }
  });

  return (
    <div className="animate-in page-container">
      <CategoriesClient 
        initialCategories={categories} 
        analytics={analytics}
        currency={dbUser?.currency ?? 'KES'} 
      />
    </div>
  );
}
