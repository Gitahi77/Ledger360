// src/app/reports/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getMonthlyTrend, getReportSummary, getReportCategories } from '@/lib/actions/reports';
import { ReportsClient } from './ReportsClient';

export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod ?? 'this-month';

  const [trend, summary, categories] = await Promise.all([
    getMonthlyTrend(),
    getReportSummary(period),
    getReportCategories(period),
  ]);

  return (
    <AppLayout>
      <ReportsClient
        period={period}
        trend={trend}
        summary={summary}
        categories={categories}
      />
    </AppLayout>
  );
}
