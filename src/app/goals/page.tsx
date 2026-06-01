// src/app/goals/page.tsx — FULLY LIVE Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getGoals } from '@/lib/actions/goals';
import { getCategories } from '@/lib/actions/transactions';
import { GoalsClient } from './GoalsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Goals() {
  const [user, goals, categories] = await Promise.all([
    requireAuth(),
    getGoals(),
    getCategories(),
  ]);
  return (
    <AppLayout>
      <GoalsClient 
        goals={goals} 
        currency={user.currency}
        categories={categories as any}
      />
    </AppLayout>
  );
}
