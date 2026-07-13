'use client';
// src/components/DashboardCharts.tsx
// Accepts live chartData prop from Server Component — no internal mock data.
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, TooltipProps
} from 'recharts';
import { fmtAdaptive, fmtCompact } from '@/lib/format';
import { useRouter } from 'next/navigation';

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

/* -- Shared chart colours ----------------------------------- */
const DONUT_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-income)', 'var(--chart-savings)'
];

/* -- Tooltip components ------------------------------------- */
function FlowTip(props: { active?: boolean; payload?: unknown; label?: string; currency?: string; total?: number }) {
  if (typeof props !== 'object' || props === null) return null;
  const { active, payload, label } = props as { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string };
  const currency = (props as { currency?: string }).currency || 'USD';
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
            {fmtAdaptive(p.value, currency)}
          </span>
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
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{payload[0].name}</p>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--color-text-primary)' }}>{fmtAdaptive(payload[0].value, currency)}</p>
      {total > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{((payload[0].value / total) * 100).toFixed(1)}% of spending</p>}
    </div>
  );
}

const tick = { fontSize: 10, fill: 'var(--color-text-secondary)', fontFamily: 'Inter, sans-serif' };

const RADIAN = Math.PI / 180;
function PieLabel(props: unknown) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props as Record<string, number>;
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

export function EmptyChartState({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-secondary)', background: 'var(--surface-card)', borderRadius: 12, border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }}>📊</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>No data to display</div>
      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{title}</div>
    </div>
  );
}

/* -- Cash Flow Area Chart ----------------------------------- */
export function CashFlowChart({ data, currency = 'KES' }: { data: ChartMonthPoint[], currency?: string }) {
  const router = useRouter();
  
  const hasData = data.some(d => d.income > 0 || d.expenses > 0);
  if (!hasData) {
    return <div style={{ height: 210 }}><EmptyChartState title="Record some income or expenses to see your cash flow trend." /></div>;
  }

  const chartData = data.map(d => ({
    label:    d.month,
    Income:   d.income,
    Expenses: d.expenses,
  }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} onClick={(e) => {
        if (e && e.activeLabel) {
           router.push(`/transactions?search=${encodeURIComponent(e.activeLabel)}`);
        }
      }} style={{ cursor: 'pointer' }}>
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
        <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v, currency)} />
        <Tooltip content={<FlowTip currency={currency} />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.75rem', paddingTop: 8 }} />
        <Area name="Income"   dataKey="Income"   type="monotone" stroke="var(--chart-income)"  strokeWidth={2.5} fill="url(#gIncome)"  activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area name="Expenses" dataKey="Expenses" type="monotone" stroke="var(--chart-expense)" strokeWidth={2.5} fill="url(#gExpense)" activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* -- Spending Donut Chart ----------------------------------- */
export function SpendingDonutChart({ data, currency = 'KES' }: { data: DonutPoint[], currency?: string }) {
  const router = useRouter();
  const total = data.reduce((s, d) => s + d.value, 0);

  // Fallback empty state
  if (data.length === 0 || total === 0) {
    return (
      <div style={{ height: 210 }}>
        <EmptyChartState title="Record some expenses to see your spending breakdown." />
      </div>
    );
  }

  const colored = data.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
      <div style={{ overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={colored} cx="50%" cy="50%" innerRadius={44} outerRadius={74}
              paddingAngle={2} dataKey="value" stroke="none" labelLine={false} label={<PieLabel />}
              onClick={(e) => {
                if (e && e.name) router.push(`/transactions?search=${encodeURIComponent(e.name)}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              {colored.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<PieTip total={total} currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.75rem' }}>
        {colored.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: `0 0 5px ${d.color}99` }} />
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0 }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
