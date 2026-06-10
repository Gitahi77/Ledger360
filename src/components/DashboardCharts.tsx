'use client';
// src/components/DashboardCharts.tsx
// Accepts live chartData prop from Server Component — no internal mock data.
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

export type ChartMonthPoint = {
  month: string;
  income: number;
  expenses: number;
};

export type DonutPoint = {
  name: string;
  value: number;
  pct: number;
};

/* ── Shared chart colours ─────────────────────────────────── */
const DONUT_COLORS = [
  '#2980B9', '#27AE60', '#E74C3C', '#E67E22',
  '#8E44AD', '#16A085', '#D4AC0D', '#1ABC9C',
];

/* ── Tooltip components ───────────────────────────────────── */
function FlowTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            KES {Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{payload[0].name}</p>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>KES {payload[0].value.toLocaleString()}</p>
      {total > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{((payload[0].value / total) * 100).toFixed(1)}% of spending</p>}
    </div>
  );
}

const tick = { fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' };

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

/* ── Cash Flow Area Chart ─────────────────────────────────── */
export function CashFlowChart({ data }: { data: ChartMonthPoint[] }) {
  const chartData = data.map(d => ({
    label:    d.month,
    Income:   d.income,
    Expenses: d.expenses,
  }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome"  x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--chart-income)"  stopOpacity={0.22}/>
            <stop offset="100%" stopColor="var(--chart-income)"  stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--chart-expense)" stopOpacity={0.18}/>
            <stop offset="100%" stopColor="var(--chart-expense)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} dy={6} />
        <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<FlowTip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.75rem', paddingTop: 8 }} />
        <Area name="Income"   dataKey="Income"   type="monotone" stroke="var(--chart-income)"  strokeWidth={2.5} fill="url(#gIncome)"  activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area name="Expenses" dataKey="Expenses" type="monotone" stroke="var(--chart-expense)" strokeWidth={2.5} fill="url(#gExpense)" activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Spending Donut Chart ─────────────────────────────────── */
export function SpendingDonutChart({ data }: { data: DonutPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  // Fallback empty state
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontSize: '0.8rem' }}>No expense data yet</div>
      </div>
    );
  }

  const colored = data.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
      <div style={{ filter: 'drop-shadow(0 6px 18px rgba(0,112,243,0.22))', overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={colored} cx="50%" cy="50%" innerRadius={44} outerRadius={74}
              paddingAngle={2} dataKey="value" stroke="none" labelLine={false} label={<PieLabel />}>
              {colored.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<PieTip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.75rem' }}>
        {colored.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: `0 0 5px ${d.color}99` }} />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0 }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
