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
import { TrendingUp, TrendingDown, ArrowRight, AlertTriangle, Wallet, Target, PiggyBank, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { requireAuth } from '@/lib/actions/_auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';
import { SafeToSpendCard } from '@/components/dashboard/SafeToSpendCard';
import { FxTicker } from '@/components/FxTicker';
import { fmtAdaptive } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { NsePortfolioBoard } from '@/components/dashboard/NsePortfolioBoard';
import { ChamaBoard } from '@/components/dashboard/ChamaBoard';

function budgetStatus(limit: number, spent: number) {
  const p = limit > 0 ? Math.min(100, (spent / limit) * 100) : (spent > 0 ? 100 : 0);
  if (p >= 100) return { bar: 'bg-destructive',  badge: 'bg-destructive/10 text-destructive',  label: 'Over',    pct: 100 };
  if (p >= 80)  return { bar: 'bg-warning', badge: 'bg-warning/10 text-warning', label: 'Warning', pct: p   };
  return              { bar: 'bg-brand', badge: 'bg-brand/10 text-brand', label: 'Good',    pct: p   };
}

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

  let summary, budgets, loans, netWorth, chartData, donutData, insights, prefs, safeToSpendData;
  try {
    [summary, budgets, loans, netWorth, chartData, donutData, insights, prefs, safeToSpendData] =
      await Promise.all([
        getTransactionSummary(period),
        getBudgetsWithSpend(period),
        getLoans(),
        getNetWorth(),
        getMonthlyChartData(),
        getCategoryBreakdown(period),
        import('@/lib/intelligence')
          .then(m => m.generateInsights(user.id, user.currency))
          .catch(() => []),   // AI insights are non-critical — fail silently
        prisma.userPreferences.findUnique({ where: { userId: user.id } }),
        safeToSpend(user.id, period === 'this-week' ? 'weekly' : period === 'this-year' ? 'yearly' : 'monthly'),
      ]);
  } catch (err) {
    console.error('[Dashboard] Data fetch failed:', err);
    // Redirect to an error page or show a minimal fallback
    // For now, return a minimal dashboard rather than a 500
    summary = { income: 0, expenses: 0, savings: 0, savingRate: 0, moneyOut: 0, todaySpend: 0 };
    budgets = []; loans = []; chartData = []; donutData = []; insights = [];
    netWorth = { netWorthMinor: 0, totalAssetsMinor: 0, totalLiabilitiesMinor: 0, totalCashMinor: 0 };
    prefs = null; safeToSpendData = { discretionaryMinor: 0, remainingMinor: 0, perDayMinor: 0, daysLeft: 0, breakdown: {} as any };
  }

  const overdueLoanCount = loans.filter(l => (l.daysOverdue ?? 0) > 0).length;
  const now          = new Date();
  const monthsLeft   = Math.max(0, 11 - now.getMonth());
  const projected    = Math.max(0, Number(summary.savings) * monthsLeft + Number(netWorth.netWorthMinor));
  const periodLabel  = period === 'this-week' ? 'This Week' : period === 'this-year' ? 'This Year' : 'This Month';
  const targetRate   = prefs?.savingRate ?? 20;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">

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
      <div className="bg-gradient-to-br from-brand/5 to-transparent border border-brand/10 rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-soft">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase mb-2">Total Net Worth</p>
          <p className="text-4xl md:text-5xl font-display font-bold text-foreground tabular-nums tracking-tight">
            {fmtAdaptive(netWorth.netWorthMinor, currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-3 font-medium">
            Assets <span className="text-foreground">{fmtAdaptive(netWorth.totalAssetsMinor, currency)}</span>
            <span className="mx-2 text-border">•</span>
            Debt <span className="text-foreground">{fmtAdaptive(netWorth.totalLiabilitiesMinor, currency)}</span>
          </p>
        </div>
        
        {/* Saving rate badge */}
        <div className="relative z-10 bg-card border border-border rounded-xl p-4 min-w-[200px] shadow-sm">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Saving Rate</p>
          <p className={`text-2xl font-bold tabular-nums ${summary.savingRate >= targetRate ? 'text-success' : summary.savingRate >= targetRate / 2 ? 'text-warning' : 'text-destructive'}`}>
            {summary.savingRate}%
          </p>
          <div className="h-1.5 w-full bg-secondary rounded-full mt-2 mb-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${summary.savingRate >= targetRate ? 'bg-success' : summary.savingRate >= targetRate / 2 ? 'bg-warning' : 'bg-destructive'}`} 
              style={{ width: `${Math.max(0, Math.min(100, summary.savingRate))}%` }} 
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {summary.savingRate >= targetRate ? `🎯 Target ${targetRate}% met` : `Target: ${targetRate}%`}
          </p>
        </div>
      </div>

      {/* -- 4-KPI Strip ----------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Wallet size={18} />,
            label: `${periodLabel} Income`,
            value: fmtAdaptive(summary.income, currency),
            sub: summary.income > 0 ? 'Money received' : 'No income yet',
            iconBg: 'bg-success/10',
            iconColor: 'text-success',
          },
          {
            icon: <CreditCard size={18} />,
            label: `${periodLabel} Spent`,
            value: fmtAdaptive(summary.moneyOut, currency),
            sub: summary.moneyOut > 0 ? 'Money out' : 'No spend yet',
            iconBg: 'bg-destructive/10',
            iconColor: 'text-destructive',
          },
          {
            icon: <PiggyBank size={18} />,
            label: 'Total Cash',
            value: fmtAdaptive(netWorth.totalCashMinor, currency),
            sub: 'Liquid assets',
            iconBg: 'bg-brand/10',
            iconColor: 'text-brand',
          },
          {
            icon: <Target size={18} />,
            label: "Today's Spend",
            value: fmtAdaptive(summary.todaySpend, currency),
            sub: 'Running daily total',
            iconBg: 'bg-warning/10',
            iconColor: 'text-warning',
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-soft flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.iconBg} ${kpi.iconColor}`}>
              {kpi.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate mb-1">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground tabular-nums truncate">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* -- Charts Row ------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Cash Flow</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <CashFlowChart data={chartData} currency={currency} />
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-soft min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Spending Breakdown</h2>
            <Link href="/transactions" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <SpendingDonutChart data={donutData} currency={currency} />
        </div>
      </div>

      {/* -- Budgets + Loans + Forecast -------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Budget Status */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-foreground">Budget Status</h2>
            <Link href="/budgets" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {budgets.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-3xl mb-3">📊</div>
              <p className="text-sm mb-4">No budgets set up yet</p>
              <Link href="/budgets" className="inline-flex items-center justify-center px-4 py-2 bg-brand text-white font-medium text-sm rounded-lg hover:bg-brand-dark transition-colors">
                Create a budget
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {budgets.slice(0, 5).map(b => {
                const st  = budgetStatus(b.limit, b.spent);
                const over = b.spent - b.limit;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">{b.name}</span>
                      <div className="flex items-center gap-2">
                        {over > 0 && <span className="text-xs font-bold text-destructive">+{fmtAdaptive(over, currency)}</span>}
                        <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${st.badge}`}>{st.label}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${st.bar}`} style={{ width: `${st.pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{fmtAdaptive(b.spent, currency)}</span> spent</span>
                      <span className="text-xs text-muted-foreground">of {fmtAdaptive(b.limit, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Loans + Year-End Forecast */}
        <div className="flex flex-col gap-6">

          {/* Loans snapshot */}
          {loans.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">Active Loans</h2>
                <Link href="/loans" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {overdueLoanCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive text-xs font-bold rounded-lg mb-4">
                  <AlertTriangle size={14} /> {overdueLoanCount} overdue
                </div>
              )}
              <div className="space-y-3">
                {loans.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[60%]">{l.name}</span>
                    <span className={`font-bold tabular-nums ${(l.daysOverdue ?? 0) > 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {fmtAdaptive(l.balanceMinor, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Year-End Forecast card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-soft flex-1 flex flex-col justify-center bg-gradient-to-br from-card to-secondary/30">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Year-End Forecast</p>
            <p className="text-sm text-foreground mb-3">At your current pace you&apos;ll save:</p>
            <p className="text-3xl font-display font-bold text-foreground tabular-nums tracking-tight">{fmtAdaptive(projected, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-5">by December {new Date().getFullYear()}</p>
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Saving Rate</span>
                <span className="text-xs font-bold text-foreground">{summary.savingRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, summary.savingRate))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Investments & Chamas Row ---------------------------- */}
      <div className="grid grid-cols-1 gap-6">
        <NsePortfolioBoard />
        <Suspense fallback={<div className="h-[200px] bg-card border border-border rounded-xl animate-pulse" />}>
          <ChamaBoard />
        </Suspense>
      </div>

      {/* -- Live FX Rates --------------------------------------- */}
      <div>
        <FxTicker currency={currency} />
      </div>

    </div>
  );
}

