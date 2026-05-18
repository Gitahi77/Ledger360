// src/app/goals/page.tsx — FULLY LIVE Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getGoals } from '@/lib/actions/goals';
import { GoalsClient } from './GoalsClient';

export default async function Goals() {
  const goals = await getGoals();
  return (
    <AppLayout>
      <GoalsClient goals={goals} />
    </AppLayout>
  );
}
