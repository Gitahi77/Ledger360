export const dynamic = 'force-dynamic';
// src/app/goals/page.tsx — FULLY LIVE Server Component

import { getGoals } from '@/lib/queries/goals';
import { GoalsClient } from './GoalsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Goals() {
  const user = await requireAuth();
  const [goals] = await Promise.all([
    getGoals({ userId: user.id }),
  ]);
  return (
    <>
      <GoalsClient 
        goals={goals}
        currency={user.currency}
      />
    </>
  );
}

