'use client';
// src/app/reports/ReportsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtAdaptive } from '@/lib/format';

type TrendRow     = { label: string; Income: number; Expenses: number; Savings: number };
type Summary      = { income: number; expenses: number; savings: number; savingRate: number };
type CategoryRow  = { name: string; value: number; pct: number; color: string };

const tick = { fontSize: 10, fill: 'var(--text-muted)' };

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0.625rem 0.875rem', boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:'0.35rem' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.1rem' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontSize:'0.78rem', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', color:'var(--text-primary)' }}>KES {Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsClient({
  period, trend, summary, categories,
}: {
  period: string;
  trend: TrendRow[];
  summary: Summary;
  categories: CategoryRow[];
}) {
  const router      = useRouter();
  const periodLabel = period === 'this-week' ? 'This Week' : period === 'this-year' ? 'This Year' : 'This Month';

  function setPeriod(p: string) {
    router.push(`/reports?period=${p}`);
  }

  const isEmpty = summary.income === 0 && summary.expenses === 0;

  // KPI color mapping via CSS tokens only — no hardcoded hex
  const kpis = [
    { label: `${periodLabel} Income`,   value: summary.income,   color: 'var(--success)', sign: '+' },
    { label: `${periodLabel} Expenses`, value: summary.expenses, color: 'var(--danger)',  sign: '−' },
    { label: 'Net Savings',             value: summary.savings,  color: summary.savings >= 0 ? 'var(--success)' : 'var(--danger)', sign: summary.savings >= 0 ? '+' : '−' },
    { label: 'Saving Rate',             value: null,             color: 'var(--warning)', sign: '' },
  ];

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {['this-week','this-month','this-year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={period === p ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding:'0.35rem 0.875rem', fontSize:'0.78rem' }}>
              {p === 'this-week' ? 'Week' : p === 'this-month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
        <button className="btn btn-outline"><Download size={13}/> Export CSV</button>
      </div>

      {/* Hero — matches dashboard style exactly: dark surface, clear readable text */}
      <div className="dashboard-hero animate-in mb-5">
        <div className="dashboard-hero-grid">
          <div>
            <p className="hero-label">Net Savings · {periodLabel}</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: Math.abs(summary.savings) > 9_999_999 ? '1.6rem' : Math.abs(summary.savings) > 999_999 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color: summary.savings >= 0 ? 'var(--success)' : 'var(--danger)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {summary.savings >= 0 ? '+' : '−'}{fmtAdaptive(Math.abs(summary.savings))}
            </p>
            <p className="hero-sub">Saving rate: {summary.savingRate}% of income</p>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">{periodLabel} Income</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--success)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>+{fmtAdaptive(summary.income)}</p>
              <p className="hero-sub">↑ coming in</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">{periodLabel} Expenses</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--danger)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>−{fmtAdaptive(summary.expenses)}</p>
              <p className="hero-sub">↓ going out</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Saving Rate</p>
              <p className="hero-stat-value tabular" style={{ color: summary.savingRate >= 20 ? 'var(--success)' : summary.savingRate >= 10 ? 'var(--warning)' : 'var(--danger)' }}>{summary.savingRate}%</p>
              <p className="hero-sub">{summary.savingRate >= 20 ? '✓ Great' : summary.savingRate >= 10 ? '⚠ Ok' : '⛔ Low'}</p>
            </div>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📊</div>
          <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>No data for {periodLabel.toLowerCase()}</div>
          <div style={{ fontSize:'0.78rem' }}>Add transactions to start seeing reports and insights.</div>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr)', gap:'1rem', marginBottom:'1rem' }}>
            {/* Bar chart — 6-month trend */}
            <div className="card animate-in delay-1">
              <div className="section-header">
                <h2 className="card-title" style={{ marginBottom:0 }}>6-Month Overview</h2>
                <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trend} margin={{ top:0, right:4, left:-28, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<Tip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:'0.75rem' }} />
                  <Bar name="Income"   dataKey="Income"   fill="var(--chart-income)"  radius={[4,4,0,0]} />
                  <Bar name="Expenses" dataKey="Expenses" fill="var(--chart-expense)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Area chart — savings trend */}
            <div className="card animate-in delay-2">
              <h2 className="card-title">Savings Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top:0, right:4, left:-28, bottom:0 }}>
                  <defs>
                    <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--chart-savings)" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="var(--chart-savings)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<Tip />} />
                  <Area name="Savings" dataKey="Savings" type="monotone"
                    stroke="var(--chart-savings)" strokeWidth={2.5} fill="url(#gSav)"
                    dot={{ fill:'var(--chart-savings)', r:4, strokeWidth:0 }} activeDot={{ r:6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spending breakdown */}
          {categories.length > 0 && (
            <div className="card animate-in delay-3">
              <h2 className="card-title">Spending Breakdown — {periodLabel}</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                {categories.map(cat => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div style={{ width:10, height:10, borderRadius:'50%', background:cat.color, flexShrink:0, boxShadow:`0 0 6px ${cat.color}88` }} />
                        <span style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text-primary)' }}>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:500 }}>{cat.pct}%</span>
                        <span style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'0.8125rem', fontWeight:700, minWidth:90, textAlign:'right', color:'var(--text-primary)' }}>
                          KES {cat.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width:`${Math.min(100, cat.pct * 2.5)}%`, background:`linear-gradient(90deg, ${cat.color}99, ${cat.color})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
