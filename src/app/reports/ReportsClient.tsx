'use client';
// src/app/reports/ReportsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.08) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: '0.62rem', fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function Tip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--surface-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0.625rem 0.875rem', boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.1rem' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.78rem', color:'var(--color-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontSize:'0.78rem', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', color:'var(--color-text-primary)' }}>{fmtAdaptive(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTip({ active, payload, total, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{payload[0].name}</p>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--color-text-primary)' }}>{fmtAdaptive(payload[0].value, currency)}</p>
      {total > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{((payload[0].value / total) * 100).toFixed(1)}%</p>}
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
  const [tab, setTab] = useState<'cash-flow'|'spending'|'income'>('cash-flow');
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
    <div className="page-container">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3 print-hide">
        <div style={{ display:'flex', gap:'0.5rem', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 8 }}>
          {['cash-flow', 'spending', 'income'].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{
                background: tab === t ? 'var(--surface-card)' : 'transparent',
                border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 6,
                padding: '0.35rem 0.875rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                textTransform: 'capitalize'
              }}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {['this-week','this-month','this-year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={period === p ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding:'0.35rem 0.875rem', fontSize:'0.78rem' }}>
              {p === 'this-week' ? 'Week' : p === 'this-month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="dashboard-hero animate-in mb-5">
        <div className="dashboard-hero-grid">
          <div>
            <p className="hero-label">Net Cash Flow · {periodLabel}</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: Math.abs(summary.netCashFlow) > 9_999_999 ? '1.6rem' : Math.abs(summary.netCashFlow) > 999_999 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color: summary.netCashFlow >= 0 ? 'var(--hero-income)' : 'var(--hero-expense)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {summary.netCashFlow >= 0 ? '+' : '−'}{fmtAdaptive(Math.abs(summary.netCashFlow), currency)}
            </p>
            <p className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Saving rate: {summary.savingRate}%
              <span style={{ 
                color: summary.previous.netCashFlowChange > 0 ? 'var(--hero-income)' : summary.previous.netCashFlowChange < 0 ? 'var(--hero-expense)' : 'var(--hero-text-muted)',
                fontSize: '0.68rem',
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
          <div className="hero-stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="hero-stat-card">
              <p className="hero-label">{periodLabel} Income</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--hero-income)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>+{fmtAdaptive(summary.income, currency)}</p>
              <p className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: summary.previous.incomeChange > 0 ? 'var(--hero-income)' : summary.previous.incomeChange < 0 ? 'var(--hero-expense)' : 'var(--hero-text-muted)' }}>
                {renderTrendIcon(summary.previous.incomeChange)}
                {Math.abs(summary.previous.incomeChange)}% vs {prevLabel}
              </p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">{periodLabel} Spending</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--hero-expense)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>−{fmtAdaptive(summary.expenses, currency)}</p>
              <p className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: summary.previous.expensesChange < 0 ? 'var(--hero-income)' : summary.previous.expensesChange > 0 ? 'var(--hero-expense)' : 'var(--hero-text-muted)' }}>
                {renderTrendIcon(summary.previous.expensesChange, true)}
                {Math.abs(summary.previous.expensesChange)}% vs {prevLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="card" style={{ textAlign:'left', padding:'3rem', color:'var(--color-text-secondary)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📊</div>
          <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>No data for {periodLabel.toLowerCase()}</div>
          <div style={{ fontSize:'0.78rem' }}>Add transactions to start seeing reports and insights.</div>
        </div>
      ) : (
        <div className="card animate-in delay-1">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: 0, textTransform: 'capitalize' }}>{tab.replace('-', ' ')} Overview</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 8 }}>
              {['breakdown', 'trends'].map(v => (
                <button key={v} onClick={() => setView(v as any)}
                  style={{
                    background: view === v ? 'var(--surface-card)' : 'transparent',
                    border: view === v ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 6,
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.7rem',
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
          </div>

          <div style={{ marginTop: '1rem', minHeight: 320 }}>
            {tab === 'cash-flow' && view === 'breakdown' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trend} margin={{ top:0, right:4, left:-28, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v, currency)} />
                  <Tooltip content={<Tip currency={currency} />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:'0.75rem', paddingTop: 8 }} />
                  <Bar name="Income"   dataKey="Income"   fill="var(--chart-income)"  stackId="a" radius={[0,0,4,4]} onClick={(e: any) => { if(e?.payload?.label) handleDrillDown(String(e.payload.label)); }} style={{ cursor: 'pointer' }} />
                  <Bar name="Spending" dataKey="Expenses" fill="var(--chart-expense)" stackId="a" radius={[4,4,0,0]} onClick={(e: any) => { if(e?.payload?.label) handleDrillDown(String(e.payload.label)); }} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {tab === 'cash-flow' && view === 'trends' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trend} margin={{ top:0, right:4, left:-28, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v, currency)} />
                  <Tooltip content={<Tip currency={currency} />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:'0.75rem', paddingTop: 8 }} />
                  <Bar name="Income"   dataKey="Income"   fill="var(--chart-income)"  radius={[4,4,0,0]} onClick={(e: any) => { if(e?.payload?.label) handleDrillDown(String(e.payload.label)); }} style={{ cursor: 'pointer' }} />
                  <Bar name="Spending" dataKey="Expenses" fill="var(--chart-expense)" radius={[4,4,0,0]} onClick={(e: any) => { if(e?.payload?.label) handleDrillDown(String(e.payload.label)); }} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {(tab === 'spending' || tab === 'income') && view === 'breakdown' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div style={{ height: 300, filter: 'drop-shadow(0 6px 18px rgba(0,112,243,0.15))' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentCategories} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                        paddingAngle={2} dataKey="value" stroke="none" labelLine={false} label={<PieLabel />}
                        onClick={(e) => { if (e && e.name) handleDrillDown(e.name); }}
                        style={{ cursor: 'pointer' }}
                      >
                        {currentCategories.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<PieTip total={totalCategoryValue} currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem', maxHeight: 300, overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {currentCategories.length === 0 && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>No categories to display.</p>}
                  {currentCategories.map(cat => (
                    <div key={cat.name} onClick={() => handleDrillDown(cat.name)} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div style={{ width:10, height:10, borderRadius:'50%', background:cat.color, flexShrink:0, boxShadow:`0 0 6px ${cat.color}88` }} />
                          <span style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-text-primary)' }}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span style={{ fontSize:'0.78rem', color:'var(--color-text-secondary)', fontWeight:500 }}>{cat.pct}%</span>
                          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'0.8125rem', fontWeight:700, minWidth:90, textAlign:'right', color:'var(--color-text-primary)' }}>
                            {fmtAdaptive(cat.value, currency)}
                          </span>
                        </div>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width:`${Math.min(100, cat.pct)}%`, background:`linear-gradient(90deg, ${cat.color}99, ${cat.color})` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(tab === 'spending' || tab === 'income') && view === 'trends' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trend} margin={{ top:0, right:4, left:-28, bottom:0 }} onClick={(e: any) => { if(e && e.activeLabel) handleDrillDown(String(e.activeLabel)); }} style={{ cursor: 'pointer' }}>
                  <defs>
                    <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)'} stopOpacity={0.3}/>
                      <stop offset="100%" stopColor={tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v, currency)} />
                  <Tooltip content={<Tip currency={currency} />} />
                  <Area name={tab === 'income' ? 'Income' : 'Spending'} dataKey={tab === 'income' ? 'Income' : 'Expenses'} type="monotone"
                    stroke={tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)'} strokeWidth={2.5} fill="url(#gTrend)"
                    dot={{ fill: tab === 'income' ? 'var(--chart-income)' : 'var(--chart-expense)', r:4, strokeWidth:0 }} activeDot={{ r:6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
