'use client';
// src/app/reports/ReportsClient.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { fmtAdaptive, fmtCompact } from '@/lib/format';

type TrendRow     = { label: string; Income: number; Expenses: number; Savings: number; DebtRepayment?: number; };
type Summary      = { 
  income: number; 
  expenses: number; 
  savings: number; 
  debtRepayment: number;
  netCashFlow: number;
  savingRate: number;
  previous: {
    income: number;
    expenses: number;
    savings: number;
    debtRepayment: number;
    netCashFlow: number;
    savingRate: number;
    incomeChange: number;
    expensesChange: number;
    savingsChange: number;
    debtRepaymentChange: number;
    netCashFlowChange: number;
    savingRateChange: number;
  }
};
type CategoryRow  = { name: string; value: number; pct: number; color: string };

const tick = { fontSize: 10, fill: 'var(--color-text-secondary)', fontFamily: 'Inter, sans-serif' };

function BarTip(props: { active?: boolean; payload?: unknown; label?: string; currency?: string; total?: number }) {
  if (typeof props !== 'object' || props === null) return null;
  const { active, payload, label } = props as { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string };
  const currency = (props as { currency?: string }).currency || 'USD';
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--surface-card)', border:'1px solid var(--border)', borderRadius:12, padding:'0.75rem 1rem', boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', gap:'1.5rem', marginBottom:'0.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
            <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)', fontWeight: 500 }}>{p.name}</span>
          </div>
          <span style={{ fontSize:'0.8rem', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', color:'var(--color-text-primary)' }}>{fmtAdaptive(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTip(props: { active?: boolean; payload?: unknown; label?: string; currency?: string; total?: number }) {
  if (typeof props !== 'object' || props === null) return null;
  const { active, payload } = props as { active?: boolean; payload?: { name: string; value: number }[] };
  const total = (props as { total?: number }).total || 0;
  const currency = (props as { currency?: string }).currency || 'USD';
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.75rem 1rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{payload[0].name}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--color-text-primary)' }}>{fmtAdaptive(payload[0].value, currency)}</p>
        {total > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{((payload[0].value / total) * 100).toFixed(1)}%</p>}
      </div>
    </div>
  );
}

export function ReportsClient({
  period, trend, summary, expenseCategories, incomeCategories, currency,
}: {
  period: string;
  trend: TrendRow[];
  summary: Summary;
  expenseCategories: CategoryRow[];
  incomeCategories: CategoryRow[];
  currency: string;
}) {
  const router      = useRouter();
  const [tab, setTab] = useState<'cash-flow'|'spending'|'income'|'insights'>('cash-flow');
  const [view, setView] = useState<'breakdown'|'trends'>('breakdown');

  const periodLabel = period === 'this-week' ? 'This Week' : period === 'this-year' ? 'This Year' : 'This Month';
  const prevLabel   = period === 'this-week' ? 'last week' : period === 'this-year' ? 'last year' : 'last month';

  function setPeriod(p: string) {
    router.push(`/reports?period=${p}`);
  }

  function handleDrillDown(search: string) {
    router.push(`/transactions?search=${encodeURIComponent(search)}`);
  }

  const isEmpty = summary.income === 0 && summary.expenses === 0;

  const renderTrendIcon = (change: number, reverseColors = false) => {
    if (change === 0) return <Minus size={12} />;
    const upColor = reverseColors ? 'var(--hero-expense)' : 'var(--hero-income)';
    const downColor = reverseColors ? 'var(--hero-income)' : 'var(--hero-expense)';
    return change > 0 
      ? <TrendingUp size={12} style={{ color: upColor }} /> 
      : <TrendingDown size={12} style={{ color: downColor }} />;
  };

  const currentCategories = tab === 'spending' ? expenseCategories : incomeCategories;
  const totalCategoryValue = currentCategories.reduce((s, c) => s + c.value, 0);

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 animate-in flex-wrap gap-4 print-hide">
        <div style={{ display:'flex', gap:'0.25rem', background: 'var(--surface-sunken)', padding: '0.35rem', borderRadius: 10, border: '1px solid var(--border)' }}>
          {(['cash-flow', 'spending', 'income', 'insights'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'var(--surface-card)' : 'transparent',
                border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 8,
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: tab === t ? 700 : 600,
                color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                boxShadow: tab === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'0.5rem', background: 'var(--surface-sunken)', padding: '0.35rem', borderRadius: 10, border: '1px solid var(--border)' }}>
          {['this-week','this-month','this-year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                background: period === p ? 'var(--surface-card)' : 'transparent',
                border: period === p ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 8,
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: period === p ? 700 : 600,
                color: period === p ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                boxShadow: period === p ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}>
              {p === 'this-week' ? 'Week' : p === 'this-month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="dashboard-hero animate-in mb-6" style={{ borderRadius: 16 }}>
        <div className="dashboard-hero-grid">
          <div>
            <p className="hero-label">Net Cash Flow · {periodLabel}</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: Math.abs(summary.netCashFlow) > 9_999_999 ? '1.8rem' : Math.abs(summary.netCashFlow) > 999_999 ? '2.2rem' : '2.75rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color: summary.netCashFlow >= 0 ? 'var(--hero-income)' : 'var(--hero-expense)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              margin: '0.5rem 0'
            }}>
              {summary.netCashFlow >= 0 ? '+' : '−'}{fmtAdaptive(Math.abs(summary.netCashFlow), currency)}
            </p>
            <p className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.1)', padding: '0.25rem 0.6rem', borderRadius: 6, width: 'fit-content' }}>
              <span style={{ fontWeight: 600 }}>Saving rate: {summary.savingRate}%</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
              <span style={{ 
                color: summary.previous.netCashFlowChange > 0 ? 'var(--hero-income)' : summary.previous.netCashFlowChange < 0 ? 'var(--hero-expense)' : 'var(--hero-text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.15rem'
              }}>
                {renderTrendIcon(summary.previous.netCashFlowChange)}
                ({Math.abs(summary.previous.netCashFlowChange)}% vs {prevLabel})
              </span>
            </p>
          </div>
          <div className="hero-stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem' }}>
            <div className="hero-stat-card" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '1.25rem' }}>
              <p className="hero-label">{periodLabel} Income</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--hero-income)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontSize: '1.5rem', margin: '0.25rem 0' }}>+{fmtAdaptive(summary.income, currency)}</p>
              <p className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: summary.previous.incomeChange > 0 ? 'var(--hero-income)' : summary.previous.incomeChange < 0 ? 'var(--hero-expense)' : 'var(--hero-text-muted)', fontWeight: 600 }}>
                {renderTrendIcon(summary.previous.incomeChange)}
                {Math.abs(summary.previous.incomeChange)}% vs {prevLabel}
              </p>
            </div>
            <div className="hero-stat-card" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '1.25rem' }}>
              <p className="hero-label">{periodLabel} Spending</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--hero-expense)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontSize: '1.5rem', margin: '0.25rem 0' }}>−{fmtAdaptive(summary.expenses, currency)}</p>
              <p className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: summary.previous.expensesChange < 0 ? 'var(--hero-income)' : summary.previous.expensesChange > 0 ? 'var(--hero-expense)' : 'var(--hero-text-muted)', fontWeight: 600 }}>
                {renderTrendIcon(summary.previous.expensesChange, true)}
                {Math.abs(summary.previous.expensesChange)}% vs {prevLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="card" style={{ textAlign:'left', padding:'4rem 3rem', color:'var(--color-text-secondary)', borderStyle: 'dashed' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📊</div>
          <div style={{ fontWeight:700, fontSize: '1.2rem', marginBottom:'0.5rem', color: 'var(--color-text-primary)' }}>No data for {periodLabel.toLowerCase()}</div>
          <div style={{ fontSize:'0.9rem' }}>Add transactions to start seeing rich reports, cashflow insights, and categorized spending.</div>
        </div>
      ) : tab === 'insights' ? (
        <div className="animate-in delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} className="text-brand" /> Deep Analysis & Insights
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'var(--surface-sunken)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem' }}>Cashflow Health</h4>
                {summary.netCashFlow > 0 ? (
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                    You have a <strong className="text-success">positive cashflow</strong> of {fmtAdaptive(summary.netCashFlow, currency)} this {periodLabel.split(' ')[1].toLowerCase()}. You are saving <strong>{summary.savingRate}%</strong> of your income, which is a great sign of financial health.
                  </p>
                ) : (
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                    Your expenses have exceeded your income by <strong className="text-danger">{fmtAdaptive(Math.abs(summary.netCashFlow), currency)}</strong> this {periodLabel.split(' ')[1].toLowerCase()}. Consider reviewing your top spending categories to find areas to cut back.
                  </p>
                )}
              </div>

              <div style={{ padding: '1.5rem', background: 'var(--surface-sunken)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem' }}>Spending Behavior</h4>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                  Compared to {prevLabel}, your spending has {summary.previous.expensesChange > 0 ? <strong className="text-danger">increased by {summary.previous.expensesChange}%</strong> : <strong className="text-success">decreased by {Math.abs(summary.previous.expensesChange)}%</strong>}.
                  {expenseCategories.length > 0 && ` Your top expense category is ${expenseCategories[0].name}, making up ${expenseCategories[0].pct}% of total spending.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card animate-in delay-1" style={{ padding: '2rem' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: 0, textTransform: 'capitalize', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{tab.replace('-', ' ')} Overview</h2>
            </div>
            {tab !== 'cash-flow' && (
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                {(['breakdown', 'trends'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    style={{
                      background: view === v ? 'var(--surface-card)' : 'transparent',
                      border: view === v ? '1px solid var(--border)' : '1px solid transparent',
                      borderRadius: 6,
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: view === v ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
                      textTransform: 'capitalize'
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ minHeight: 350 }}>
            {tab === 'cash-flow' && (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={trend} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v, currency)} />
                  <Tooltip content={<BarTip currency={currency} />} cursor={{ fill: 'var(--bg-hover)', opacity: 0.5 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.8rem', paddingTop: 20, fontWeight: 600 }} />
                  {/* Monarch-style grouped bar chart for cash flow */}
                  <Bar name="Income" dataKey="Income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} barSize={32} onClick={(e: unknown) => { const label = (e as Record<string, unknown>)?.payload ? ((e as Record<string, unknown>).payload as Record<string, unknown>)?.label : null; if(label) handleDrillDown(String(label)); }} style={{ cursor: 'pointer' }} />
                  <Bar name="Spending" dataKey="Expenses" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} barSize={32} onClick={(e: unknown) => { const label = (e as Record<string, unknown>)?.payload ? ((e as Record<string, unknown>).payload as Record<string, unknown>)?.label : null; if(label) handleDrillDown(String(label)); }} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {(tab === 'spending' || tab === 'income') && view === 'breakdown' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                <div style={{ height: 350, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={currentCategories} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={95} 
                        outerRadius={125}
                        paddingAngle={3} 
                        dataKey="value" 
                        stroke="none" 
                        labelLine={false} 
                        onClick={(e) => { if (e && e.name) handleDrillDown(e.name); }}
                        style={{ cursor: 'pointer', outline: 'none' }}
                      >
                        {currentCategories.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<PieTip total={totalCategoryValue} currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label for Donut Chart */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total {tab}</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--color-text-primary)' }}>{fmtAdaptive(totalCategoryValue, currency)}</p>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', maxHeight: 350, overflowY: 'auto', paddingRight: '1rem' }}>
                  {currentCategories.length === 0 && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No categories to display.</p>}
                  {currentCategories.map(cat => (
                    <div key={cat.name} onClick={() => handleDrillDown(cat.name)} className="group" style={{ cursor: 'pointer' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div style={{ width:12, height:12, borderRadius:'50%', background:cat.color, flexShrink:0 }} />
                          <span style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--color-text-primary)' }}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)', fontWeight:600 }}>{cat.pct}%</span>
                          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'0.9rem', fontWeight:700, minWidth:90, textAlign:'right', color:'var(--color-text-primary)' }}>
                            {fmtAdaptive(cat.value, currency)}
                          </span>
                        </div>
                      </div>
                      <div className="progress-track" style={{ background: 'var(--surface-sunken)', height: 8, borderRadius: 999 }}>
                        <div className="progress-fill" style={{ width:`${Math.min(100, cat.pct)}%`, background: cat.color, height: '100%', borderRadius: 999, transition: 'width 0.5s ease-out' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(tab === 'spending' || tab === 'income') && view === 'trends' && (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trend} margin={{ top:10, right:10, left:-20, bottom:0 }} onClick={(e: unknown) => { const obj = e as Record<string, unknown> | undefined; if(obj?.activeLabel) handleDrillDown(String(obj.activeLabel)); }} style={{ cursor: 'pointer' }}>
                  <defs>
                    <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)'} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v, currency)} />
                  <Tooltip content={<BarTip currency={currency} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area name={tab === 'income' ? 'Income' : 'Spending'} dataKey={tab === 'income' ? 'Income' : 'Expenses'} type="monotone"
                    stroke={tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)'} strokeWidth={3} fill="url(#gTrend)"
                    dot={{ fill: tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)', r:4, strokeWidth:0 }} activeDot={{ r:6, strokeWidth: 2, stroke: 'var(--surface-card)' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
