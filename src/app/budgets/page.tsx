// src/app/budgets/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getBudgetsWithSpend } from '@/lib/actions/budgets';
import { getCategories } from '@/lib/actions/transactions';
import { BudgetsClient } from './BudgetsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Budgets({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod ?? 'this-month';

  const [user, budgets, categories] = await Promise.all([
    requireAuth(),
    getBudgetsWithSpend(period),
    getCategories('expense'),
  ]);

  const totalBudgeted = budgets.reduce((s: number, b: ReturnType<typeof JSON.parse>) => s + b.limit, 0);
  const totalSpent    = budgets.reduce((s: number, b: ReturnType<typeof JSON.parse>) => s + b.spent, 0);

  return (
    <AppLayout>
      <BudgetsClient
        budgets={budgets}
        categories={categories}
        totalBudgeted={totalBudgeted}
        totalSpent={totalSpent}
        period={period}
        currency={user.currency}
      />
    </AppLayout>
  );
}
