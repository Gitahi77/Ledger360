export const dynamic = 'force-dynamic';
// src/app/budgets/page.tsx — Live Server Component

import { getBudgetsWithSpend } from '@/lib/queries/budgets';
import { getCategories } from '@/lib/queries/transactions';
import { BudgetsClient } from './BudgetsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Budgets({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod ?? 'this-month';

  const user = await requireAuth();
  const [budgets, categories] = await Promise.all([
    getBudgetsWithSpend({ userId: user.id, period }),
    getCategories({ userId: user.id, type: 'expense' }),
  ]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent    = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <BudgetsClient
        budgets={budgets}
        categories={categories}
        totalBudgeted={totalBudgeted}
        totalSpent={totalSpent}
        period={period}
        currency={user.currency}
      />
    </>
  );
}

