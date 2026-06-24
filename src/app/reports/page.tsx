// src/app/reports/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getMonthlyTrend, getReportSummary, getReportCategories } from '@/lib/actions/reports';
import { ReportsClient } from './ReportsClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod ?? 'this-month';

  const [user, trend, summary, expenseCategories, incomeCategories] = await Promise.all([
    requireAuth(),
    getMonthlyTrend(),
    getReportSummary(period),
    getReportCategories(period, 'expense'),
    getReportCategories(period, 'income'),
  ]);

  return (
    <AppLayout>
      <ReportsClient
        period={period}
        trend={trend}
        summary={summary}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        currency={user.currency}
      />
    </AppLayout>
  );
}
