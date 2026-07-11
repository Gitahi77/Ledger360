export const dynamic = 'force-dynamic';
// src/app/(dashboard)/page.tsx — Monarch-inspired premium dashboard layout
export const metadata = {
  title: 'Dashboard — Ledger360',
  description: 'Your personal financial overview: net worth, income, spending, budgets and insights.',
};

import { Suspense } from 'react';

import { CashFlowChart, SpendingDonutChart } from '@/components/DashboardCharts';
import { PeriodSelectorClient } from '@/components/PeriodSelectorClient';
import { getTransactionSummary, getMonthlyChartData, getCategoryBreakdown } from '@/lib/queries/transactions';
import { getBudgetsWithSpend } from '@/lib/queries/budgets';
import { getLoans } from '@/lib/queries/loans';
import { getNetWorth } from '@/lib/queries/networth';
import { safeToSpend } from '@/lib/behavioral';
import { ArrowRight, Wallet, Target, PiggyBank, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { requireAuth } from '@/lib/actions/_auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';
import { SafeToSpendCard } from '@/components/dashboard/SafeToSpendCard';
import { FxTicker } from '@/components/FxTicker';
import { prisma } from '@/lib/prisma';
import { NsePortfolioBoard } from '@/components/dashboard/NsePortfolioBoard';
import { ChamaBoard } from '@/components/dashboard/ChamaBoard';

// New Design System Components
import { Stack } from '@/components/layout/stack/Stack';
import { Grid } from '@/components/layout/grid/Grid';
import { Surface } from '@/components/ui/surface/Surface';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { StatCard } from '@/components/dashboard/StatCard';
import { BudgetOverviewCard } from '@/components/dashboard/BudgetOverviewCard';
import { ActiveLoansCard } from '@/components/dashboard/ActiveLoansCard';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const ALLOWED_PERIODS = ['this-month', 'this-week', 'this-year', 'all-time'] as const;
  type AllowedPeriod = typeof ALLOWED_PERIODS[number];
  const period: AllowedPeriod = ALLOWED_PERIODS.includes(rawPeriod as AllowedPeriod)
    ? (rawPeriod as AllowedPeriod)
    : 'this-month';

  const user = await requireAuth();
  const session = process.env.npm_lifecycle_event === 'build' ? null : await getServerSession(authOptions);
  const currency = user.currency;
  const firstName = (session?.user?.name ?? '').split(' ')[0] || 'there';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let summary: any, budgets: any[], loans: any[], netWorth: any, chartData: any[], donutData: any[], insights: any[], prefs: any, safeToSpendData: any;
  try {
    [summary, budgets, loans, netWorth, chartData, donutData, insights, prefs, safeToSpendData] =
      await Promise.all([
        getTransactionSummary({ userId: user.id, period }),
        getBudgetsWithSpend({ userId: user.id, period }),
        getLoans({ userId: user.id }),
        getNetWorth({ userId: user.id, currency: user.currency }),
        getMonthlyChartData({ userId: user.id }),
        getCategoryBreakdown({ userId: user.id, period }),
        import('@/lib/intelligence')
          .then(m => m.generateInsights(user.id, user.currency))
          .catch(() => []),   // AI insights are non-critical — fail silently
        prisma.userPreferences.findUnique({ where: { userId: user.id } }),
        safeToSpend(user.id, period === 'this-week' ? 'weekly' : period === 'this-year' ? 'yearly' : 'monthly'),
      ]);
  } catch (err) {
    console.error('[Dashboard] Data fetch failed:', err);
    summary = { income: 0, expenses: 0, savings: 0, savingRate: 0, moneyOut: 0, todaySpend: 0 };
    budgets = []; loans = []; chartData = []; donutData = []; insights = [];
    netWorth = { netWorthMinor: 0, totalAssetsMinor: 0, totalLiabilitiesMinor: 0, totalCashMinor: 0 };
    prefs = null; safeToSpendData = { discretionaryMinor: 0, remainingMinor: 0, perDayMinor: 0, daysLeft: 0, breakdown: {} as any };
  }

  const now          = new Date();
  const periodLabel  = period === 'this-week' ? 'This Week' : period === 'this-year' ? 'This Year' : 'This Month';
  const targetRate   = prefs?.savingRate ?? 20;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Stack gap="lg">

      {/* -- Page Header ---------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here&apos;s your financial snapshot</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="w-[180px] h-9 bg-secondary rounded-lg animate-pulse" />}>
            <PeriodSelectorClient current={period} />
          </Suspense>
        </div>
      </div>

      {/* -- AI Insights Strip ----------------------------------- */}
      <div>
        <InsightsFeed initialInsights={insights} />
      </div>

      {/* -- Safe to Spend Banner -------------------------------- */}
      <div>
        <SafeToSpendCard data={safeToSpendData} currency={currency} />
      </div>

      {/* -- Net Worth Hero -------------------------------------- */}
      <NetWorthHero 
        netWorth={{ amountMinor: netWorth.netWorthMinor, currencyCode: currency }}
        totalAssets={{ amountMinor: netWorth.totalAssetsMinor, currencyCode: currency }}
        totalLiabilities={{ amountMinor: netWorth.totalLiabilitiesMinor, currencyCode: currency }}
        savingRate={summary.savingRate}
        targetSavingRate={targetRate}
      />

      {/* -- 4-KPI Strip ----------------------------------------- */}
      <Grid columns={4} gap="md" responsive>
        <StatCard 
          icon={<Wallet size={18} />}
          label={`${periodLabel} Income`}
          money={{ amountMinor: summary.income, currencyCode: currency }}
          subLabel={summary.income > 0 ? 'Money received' : 'No income yet'}
          iconBgClass="bg-success/10"
          iconColorClass="text-success"
        />
        <StatCard 
          icon={<CreditCard size={18} />}
          label={`${periodLabel} Spent`}
          money={{ amountMinor: summary.moneyOut, currencyCode: currency }}
          subLabel={summary.moneyOut > 0 ? 'Money out' : 'No spend yet'}
          iconBgClass="bg-destructive/10"
          iconColorClass="text-destructive"
        />
        <StatCard 
          icon={<PiggyBank size={18} />}
          label="Total Cash"
          money={{ amountMinor: netWorth.totalCashMinor, currencyCode: currency }}
          subLabel="Liquid assets"
        />
        <StatCard 
          icon={<Target size={18} />}
          label="Today's Spend"
          money={{ amountMinor: summary.todaySpend, currencyCode: currency }}
          subLabel="Running daily total"
          iconBgClass="bg-warning/10"
          iconColorClass="text-warning"
        />
      </Grid>

      {/* -- Charts Row ------------------------------------------ */}
      <Grid columns={2} gap="lg" responsive>
        <Surface padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Cash Flow</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <CashFlowChart data={chartData} currency={currency} />
        </Surface>

        <Surface padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Spending Breakdown</h2>
            <Link href="/transactions" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <SpendingDonutChart data={donutData} currency={currency} />
        </Surface>
      </Grid>

      {/* -- Budgets + Loans -------------------------- */}
      <Grid columns={2} gap="lg" responsive>
        <BudgetOverviewCard budgets={budgets} currency={currency} />
        <ActiveLoansCard loans={loans} currency={currency} />
      </Grid>

      {/* -- Investments & Chamas Row ---------------------------- */}
      <Grid columns={1} gap="lg">
        <NsePortfolioBoard />
        <Suspense fallback={<div className="h-[200px] bg-card border border-border rounded-xl animate-pulse" />}>
          <ChamaBoard />
        </Suspense>
      </Grid>

      {/* -- Live FX Rates --------------------------------------- */}
      <div>
        <FxTicker currency={currency} />
      </div>

    </Stack>
  );
}
