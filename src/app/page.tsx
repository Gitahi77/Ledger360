// src/app/page.tsx — FULLY LIVE Server Component Dashboard
import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CashFlowChart, SpendingDonutChart } from '@/components/DashboardCharts';
import { PeriodSelectorClient } from '@/components/PeriodSelectorClient';
import { getTransactionSummary, getMonthlyChartData, getCategoryBreakdown } from '@/lib/actions/transactions';
import { getBudgetsWithSpend } from '@/lib/actions/budgets';
import { getLoans } from '@/lib/actions/loans';
import { getNetWorth } from '@/lib/actions/networth';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';



function budgetStatus(limit: number, spent: number) {
  const p = Math.min(100, (spent / limit) * 100);
  if (p >= 100) return { bar: 'var(--danger)',  badge: 'badge-danger',  label: 'Over',    pct: 100 };
  if (p >= 80)  return { bar: 'var(--warning)', badge: 'badge-warning', label: 'Warning', pct: p   };
  return              { bar: 'var(--success)', badge: 'badge-success', label: 'Good',    pct: p   };
}

/* ── Main page ────────────────────────────────────────────── */
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod ?? 'this-month';

  // Parallel fetches for production speed (Neon connection poolers support this well).
  const [summary, budgets, loans, netWorth, chartData, donutData, insights] = await Promise.all([
    getTransactionSummary(period),
    getBudgetsWithSpend(period),
    getLoans(),
    getNetWorth(),
    getMonthlyChartData(),
    getCategoryBreakdown(period),
    import('@/lib/intelligence').then(m => m.generateInsights(user.id)),
  ]);

  const overdueLoanCount = loans.filter(l => l.daysOverdue > 0).length;
  const monthsLeft       = 12 - new Date().getMonth();
  const projected        = Math.max(0, summary.savings * monthsLeft + netWorth.netWorth);
  const periodLabel      = period === 'this-week' ? 'This Week' : period === 'this-year' ? 'This Year' : 'This Month';

  return (
    <AppLayout>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <Suspense fallback={<div className="skeleton" style={{ width: 180, height: 34, borderRadius: 8 }} />}>
          <PeriodSelectorClient current={period} />
        </Suspense>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {period === 'this-week' ? 'This week' : period === 'this-year' ? 'This year' : 'This month'}
        </span>
      </div>

      {/* Intelligence Engine Insights */}
      <InsightsFeed initialInsights={insights} />

      {/* KPI Hero Banner — Goals-style gradient strip */}
      <div className="animate-in mb-5" style={{
        borderRadius: 12,
        background: 'linear-gradient(135deg, #0070F3 0%, #7C3AED 55%, #0F766E 100%)',
        boxShadow: '0 10px 32px rgba(0,112,243,0.28), 0 2px 8px rgba(124,58,237,0.2)',
        padding: '1.375rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, left:60, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'1rem', alignItems:'center', position:'relative' }}>
          {/* Primary stat — Net Worth */}
          <div>
            <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.55)', marginBottom:'0.3rem' }}>
              Net Worth
            </p>
            <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.04em', color:'white', lineHeight:1 }}>
              KES {netWorth.netWorth.toLocaleString()}
            </p>
            <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', marginTop:'0.25rem' }}>
              Assets KES {netWorth.totalAssets.toLocaleString()} · Debt KES {netWorth.totalLiabilities.toLocaleString()}
            </p>
          </div>

          {/* Frosted glass stat boxes */}
          {[
            { label: `${periodLabel} Income`,  value: `KES ${summary.income.toLocaleString()}`,   sub: summary.income > 0 ? '↑ coming in' : 'No income yet',      color: '#4ADE80' },
            { label: `${periodLabel} Spent`,   value: `KES ${summary.expenses.toLocaleString()}`, sub: summary.expenses > 0 ? '↓ going out' : 'No expenses yet',  color: '#F87171' },
            { label: 'Saving Rate',            value: `${summary.savingRate}%`,                   sub: summary.savingRate >= 20 ? '🎯 On track' : 'Save more',      color: '#FCD34D' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
            }}>
              <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.55)', marginBottom:'0.2rem' }}>{s.label}</p>
              <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.3rem', fontWeight:800, color: s.color, lineHeight:1, letterSpacing:'-0.03em' }}>{s.value}</p>
              <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.15rem' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Saving rate progress bar */}
        <div style={{ marginTop:'1rem', position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.35rem' }}>
            <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Saving rate progress</span>
            <span style={{ fontSize:'0.68rem', color:'white', fontWeight:700, fontFamily:'Space Grotesk,sans-serif' }}>{summary.savingRate}% of income saved</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.18)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100, summary.savingRate)}%`, background:'rgba(255,255,255,0.85)', borderRadius:999, boxShadow:'0 0 8px rgba(255,255,255,0.5)', transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card animate-in delay-2" style={{ minWidth: 0 }}>
          <div className="section-header">
            <h2 className="card-title" style={{ marginBottom: 0 }}>Income vs Expenses</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          <CashFlowChart data={chartData} />
        </div>

        <div className="card animate-in delay-3" style={{ minWidth: 0, overflow: 'visible' }}>
          <div className="section-header">
            <h2 className="card-title" style={{ marginBottom: 0 }}>Where Money Goes</h2>
          </div>
          <SpendingDonutChart data={donutData} />
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: '1rem' }}>
        {/* Budget status */}
        <div className="card animate-in delay-3">
          <div className="section-header">
            <h2 className="card-title" style={{ marginBottom: 0 }}>Budget Status</h2>
            <Link href="/budgets" className="section-link">Manage <ArrowRight size={12} /></Link>
          </div>

          {budgets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '0.8rem' }}>No budgets set up yet</div>
              <Link href="/budgets" className="btn btn-outline" style={{ marginTop: '0.75rem', display: 'inline-flex', fontSize: '0.78rem' }}>Create a budget</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {budgets.slice(0, 4).map(b => {
                const st  = budgetStatus(b.limit, b.spent);
                const over = b.spent - b.limit;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{b.name}</span>
                      <div className="flex items-center gap-2">
                        {over > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>+KES {over.toLocaleString()}</span>}
                        <span className={`badge ${st.badge}`}>{st.label}</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${st.pct}%`, background: st.bar }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted">KES {b.spent.toLocaleString()}</span>
                      <span className="text-xs text-muted">Limit: KES {b.limit.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Forecast + Loans snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Loans snapshot */}
          {loans.length > 0 && (
            <div className="card animate-in delay-3" style={{ padding: '1rem' }}>
              <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0, fontSize: '0.875rem' }}>Loans</h2>
                <Link href="/loans" className="section-link">View all <ArrowRight size={12} /></Link>
              </div>
              {overdueLoanCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={11} /> {overdueLoanCount} overdue
                </div>
              )}
              {loans.slice(0, 3).map(l => (
                <div key={l.id} className="flex items-center justify-between" style={{ fontSize: '0.78rem', marginBottom: '0.375rem' }}>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{l.name}</span>
                  <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: l.daysOverdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    KES {l.balance.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Year-End Forecast */}
          <div className="hero-card animate-in delay-4" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Year-End Forecast</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.625rem' }}>At your current pace you will save:</p>
              <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'white', lineHeight: 1 }}>
                KES {projected.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>by December {new Date().getFullYear()}</p>
            </div>
            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.75rem' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Saving Rate</span>
                <span style={{ fontSize: '0.72rem', color: 'white', fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif' }}>{summary.savingRate}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, summary.savingRate)}%`, background: 'white', borderRadius: 999 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
