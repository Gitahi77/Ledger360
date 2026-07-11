export const dynamic = 'force-dynamic';
// src/app/reports/page.tsx — Live Server Component

import { getMonthlyTrend, getReportSummary, getReportCategories } from '@/lib/queries/reports';
import { ReportsClient } from './ReportsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod ?? 'this-month';

  const user = await requireAuth();
  const [trend, summary, expenseCategories, incomeCategories] = await Promise.all([
    getMonthlyTrend({ userId: user.id }),
    getReportSummary({ userId: user.id, period }),
    getReportCategories({ userId: user.id, period, type: 'expense' }),
    getReportCategories({ userId: user.id, period, type: 'income' }),
  ]);

  return (
    <>
      <ReportsClient
        period={period}
        trend={trend}
        summary={summary}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        currency={user.currency}
      />
    </>
  );
}

