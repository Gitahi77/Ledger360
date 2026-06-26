// src/app/goals/page.tsx — FULLY LIVE Server Component

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
    <>
      <GoalsClient 
        goals={goals}
        currency={user.currency}
        categories={categories}
      />
    </>
  );
}
