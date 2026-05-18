'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type Period = 'this-week' | 'this-month' | 'this-year' | 'custom';

const LABELS: Record<Period, string> = {
  'this-week':  'This Week',
  'this-month': 'This Month',
  'this-year':  'This Year',
  'custom':     'Custom',
};

interface PeriodSelectorProps {
  value?: Period;
  onChange?: (period: Period, from?: string, to?: string) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [period, setPeriod] = useState<Period>(value ?? 'this-month');
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');

  const set = (p: Period) => {
    setPeriod(p);
    if (p !== 'custom') onChange?.(p);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
      <div className="segmented-control">
        {(Object.keys(LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => set(p)} className={`segmented-btn ${period === p ? 'active' : ''}`}>
            {LABELS[p]}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); onChange?.('custom', from, e.target.value); }} className="input-field" />
        </div>
      )}
    </div>
  );
}
