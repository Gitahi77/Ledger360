// src/app/page.tsx — Monarch-inspired premium dashboard layout
export const metadata = {
  title: 'Dashboard — Ledger360',
  description: 'Your personal financial overview: net worth, income, spending, budgets and insights.',
};

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CashFlowChart, SpendingDonutChart } from '@/components/DashboardCharts';
import { PeriodSelectorClient } from '@/components/PeriodSelectorClient';
import { getTransactionSummary, getMonthlyChartData, getCategoryBreakdown } from '@/lib/actions/transactions';
import { getBudgetsWithSpend } from '@/lib/actions/budgets';
import { getLoans } from '@/lib/actions/loans';
import { getNetWorth } from '@/lib/actions/networth';
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

function budgetStatus(limit: number, spent: number) {
  const p = limit > 0 ? Math.min(100, (spent / limit) * 100) : (spent > 0 ? 100 : 0);
  if (p >= 100) return { bar: 'var(--danger)',  badge: 'badge-danger',  label: 'Over',    pct: 100 };
  if (p >= 80)  return { bar: 'var(--warning)', badge: 'badge-warning', label: 'Warning', pct: p   };
  return              { bar: 'var(--success)', badge: 'badge-success', label: 'Good',    pct: p   };
}

function DeltaChip({ value, suffix = '' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
      fontSize: '0.72rem', fontWeight: 700,
      color: up ? 'var(--success)' : 'var(--danger)',
    }}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
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
  const session = await getServerSession(authOptions);
  const currency = user.currency;
  const firstName = (session?.user?.name ?? '').split(' ')[0] || 'there';

  const [summary, budgets, loans, netWorth, chartData, donutData, insights, prefs, safeToSpendData] = await Promise.all([
    getTransactionSummary(period),
    getBudgetsWithSpend(period),
    getLoans(),
    getNetWorth(),
    getMonthlyChartData(),
    getCategoryBreakdown(period),
    import('@/lib/intelligence').then(m => m.generateInsights(user.id, user.currency)),
    prisma.userPreferences.findUnique({ where: { userId: user.id } }),
    safeToSpend(user.id, period as Parameters<typeof safeToSpend>[1]),
  ]);

  const overdueLoanCount = loans.filter(l => l.daysOverdue > 0).length;
  const now          = new Date();
  const monthsLeft   = Math.max(0, 11 - now.getMonth());
  const projected    = Math.max(0, summary.savings * monthsLeft + netWorth.netWorthMinor);
  const periodLabel  = period === 'this-week' ? 'This Week' : period === 'this-year' ? 'This Year' : 'This Month';
  const targetRate   = prefs?.savingRate ?? 20;



  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="dash-page-header animate-in">
        <div>
          <h1 className="dash-greeting">{greeting}, {firstName} 👋</h1>
          <p className="dash-greeting-sub">Here&apos;s your financial snapshot</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Suspense fallback={<div className="skeleton" style={{ width: 180, height: 36, borderRadius: 8 }} />}>
            <PeriodSelectorClient current={period} />
          </Suspense>
        </div>
      </div>

      {/* ── AI Insights Strip ─────────────────────────────────── */}
      <div className="animate-in delay-1" style={{ marginBottom: '1.5rem' }}>
        <InsightsFeed initialInsights={insights} />
      </div>

      {/* ── Safe to Spend Banner ──────────────────────────────── */}
      <div className="animate-in delay-1" style={{ marginBottom: '1.5rem' }}>
        <SafeToSpendCard data={safeToSpendData} currency={currency} />
      </div>

      {/* ── Net Worth Hero ────────────────────────────────────── */}
      <div className="dashboard-hero animate-in delay-2" style={{ marginBottom: '1.5rem' }}>
        {/* Decorative background circle */}
        <div aria-hidden className="hero-bg-circle" />
        <div className="hero-content">
          <div>
            <p className="hero-eyebrow">Total Net Worth</p>
            <p className="hero-net-worth tabular">{fmtAdaptive(netWorth.netWorthMinor, currency)}</p>
            <p className="hero-net-worth-sub">
              Assets&nbsp;{fmtAdaptive(netWorth.totalAssetsMinor, currency)}
              &nbsp;·&nbsp;
              Debt&nbsp;{fmtAdaptive(netWorth.totalLiabilitiesMinor, currency)}
            </p>
          </div>
          {/* Saving rate badge */}
          <div className="hero-rate-badge">
            <p className="hero-rate-label">Saving Rate</p>
            <p className="hero-rate-value tabular" style={{ color: summary.savingRate >= targetRate ? '#4ade80' : summary.savingRate >= targetRate / 2 ? '#fbbf24' : '#f87171' }}>
              {summary.savingRate}%
            </p>
            <div className="hero-rate-bar-track">
              <div className="hero-rate-bar-fill" style={{ width: `${Math.max(0, Math.min(100, summary.savingRate))}%` }} />
            </div>
            <p className="hero-rate-sub">
              {summary.savingRate >= targetRate ? `🎯 Target ${targetRate}% met` : `Target: ${targetRate}%`}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4-KPI Strip ───────────────────────────────────────── */}
      <div className="kpi-grid animate-in delay-2" style={{ marginBottom: '1.5rem' }}>
        {[
          {
            icon: <Wallet size={18} />,
            label: `${periodLabel} Income`,
            value: fmtAdaptive(summary.income, currency),
            sub: summary.income > 0 ? 'Money received' : 'No income yet',
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
            delta: null,
          },
          {
            icon: <CreditCard size={18} />,
            label: `${periodLabel} Spent`,
            value: fmtAdaptive(summary.moneyOut, currency),
            sub: summary.moneyOut > 0 ? 'Money out' : 'No spend yet',
            iconBg: 'var(--danger-light)',
            iconColor: 'var(--danger)',
            delta: null,
          },
          {
            icon: <PiggyBank size={18} />,
            label: 'Total Cash',
            value: fmtAdaptive(netWorth.totalCashMinor, currency),
            sub: 'Liquid assets',
            iconBg: 'var(--primary-light)',
            iconColor: 'var(--primary)',
            delta: null,
          },
          {
            icon: <Target size={18} />,
            label: "Today's Spend",
            value: fmtAdaptive(summary.todaySpend, currency),
            sub: 'Running daily total',
            iconBg: 'var(--warning-light)',
            iconColor: 'var(--warning)',
            delta: null,
          },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="kpi-icon" style={{ background: kpi.iconBg, color: kpi.iconColor }}>
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="kpi-label">{kpi.label}</p>
              <p className="kpi-value tabular">{kpi.value}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className="dashboard-charts-row animate-in delay-3">
        <div className="card" style={{ minWidth: 0 }}>
          <div className="section-header">
            <h2 className="card-title" style={{ marginBottom: 0 }}>Cash Flow</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          <CashFlowChart data={chartData} />
        </div>

        <div className="card" style={{ minWidth: 0, overflow: 'visible' }}>
          <div className="section-header">
            <h2 className="card-title" style={{ marginBottom: 0 }}>Spending Breakdown</h2>
            <Link href="/transactions" className="section-link">Details <ArrowRight size={12} /></Link>
          </div>
          <SpendingDonutChart data={donutData} />
        </div>
      </div>

      {/* ── Budgets + Loans + Forecast ────────────────────────── */}
      <div className="dashboard-charts-row animate-in delay-4">

        {/* Budget Status */}
        <div className="card">
          <div className="section-header">
            <h2 className="card-title" style={{ marginBottom: 0 }}>Budget Status</h2>
            <Link href="/budgets" className="section-link">Manage <ArrowRight size={12} /></Link>
          </div>
          {budgets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>No budgets set up yet</p>
              <Link href="/budgets" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Create a budget</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {budgets.slice(0, 5).map(b => {
                const st  = budgetStatus(b.limit, b.spent);
                const over = b.spent - b.limit;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{b.name}</span>
                      <div className="flex items-center gap-2">
                        {over > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>+{fmtAdaptive(over, currency)}</span>}
                        <span className={`badge ${st.badge}`}>{st.label}</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${st.pct}%`, background: st.bar }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted">{fmtAdaptive(b.spent, currency)} spent</span>
                      <span className="text-xs text-muted">of {fmtAdaptive(b.limit, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Loans + Year-End Forecast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Loans snapshot */}
          {loans.length > 0 && (
            <div className="card" style={{ padding: '1.125rem' }}>
              <div className="section-header" style={{ marginBottom: '0.875rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>Active Loans</h2>
                <Link href="/loans" className="section-link">View all <ArrowRight size={12} /></Link>
              </div>
              {overdueLoanCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.625rem', padding: '0.4rem 0.6rem', background: 'var(--danger-light)', borderRadius: 8 }}>
                  <AlertTriangle size={11} /> {overdueLoanCount} overdue
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {loans.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-center justify-between" style={{ fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '58%' }}>{l.name}</span>
                    <span style={{ fontWeight: 700, color: l.daysOverdue > 0 ? 'var(--danger)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {fmtAdaptive(l.balanceMinor, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Year-End Forecast card */}
          <div className="card dash-forecast-card" style={{ flex: 1 }}>
            <p className="dash-forecast-eyebrow">Year-End Forecast</p>
            <p className="dash-forecast-sub">At your current pace you&apos;ll save:</p>
            <p className="dash-forecast-value tabular">{fmtAdaptive(projected, currency)}</p>
            <p className="dash-forecast-year">by December {new Date().getFullYear()}</p>
            <div className="dash-forecast-bar-wrap">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.8 }}>Saving Rate</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{summary.savingRate}%</span>
              </div>
              <div className="dash-forecast-bar-track">
                <div className="dash-forecast-bar-fill" style={{ width: `${Math.max(0, Math.min(100, summary.savingRate))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live FX Rates ─────────────────────────────────────── */}
      <div className="animate-in delay-5" style={{ marginTop: '1.5rem' }}>
        <FxTicker currency={currency} />
      </div>

    </AppLayout>
  );
}
