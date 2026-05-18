'use client';
// src/components/PeriodSelectorClient.tsx
// URL-param driven period selector — works with Server Component pages.
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const PERIODS = [
  { value: 'this-week',  label: 'Week'  },
  { value: 'this-month', label: 'Month' },
  { value: 'this-year',  label: 'Year'  },
] as const;

type PeriodValue = typeof PERIODS[number]['value'];

interface Props {
  current: string;
}

export function PeriodSelectorClient({ current }: Props) {
  const router     = useRouter();
  const params     = useSearchParams();
  const [, startT] = useTransition();

  function select(value: PeriodValue) {
    startT(() => {
      const next = new URLSearchParams(params.toString());
      next.set('period', value);
      router.push(`?${next.toString()}`);
    });
  }

  return (
    <div className="segmented-control">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => select(p.value)}
          className={`segmented-btn ${current === p.value ? 'active' : ''}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
