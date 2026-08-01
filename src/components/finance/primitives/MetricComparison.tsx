import React from 'react';
import { formatCurrency } from '@/lib/finance/formatCurrency';

type MetricComparisonProps = {
  label: string;
  actual: number;
  benchmark: number;
  benchmarkLabel: string;
  currency?: string;
  isGoodIfActualIsHigher?: boolean;
};

export function MetricComparison({
  label,
  actual,
  benchmark,
  benchmarkLabel,
  currency = 'KES',
  isGoodIfActualIsHigher = true
}: MetricComparisonProps) {
  const diff = actual - benchmark;
  const isPositiveDiff = diff > 0;
  
  let statusColor = 'text-gray-500 bg-gray-50';
  if (diff !== 0) {
    if (isPositiveDiff === isGoodIfActualIsHigher) {
      statusColor = 'text-emerald-700 bg-emerald-50';
    } else {
      statusColor = 'text-rose-700 bg-rose-50';
    }
  }

  const diffPct = benchmark > 0 ? (Math.abs(diff) / benchmark) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-100">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
          {diff > 0 ? '+' : ''}{diffPct.toFixed(1)}%
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-1">
        <div className="flex flex-col">
          <span className="text-2xl font-light text-gray-900 tracking-tight">
            {formatCurrency({ amountMinor: actual, currency }, { variant: 'compact' })}
          </span>
          <span className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">Actual</span>
        </div>
        
        <div className="flex flex-col border-l border-gray-100 pl-4">
          <span className="text-lg font-light text-gray-500 tracking-tight">
            {formatCurrency({ amountMinor: benchmark, currency }, { variant: 'compact' })}
          </span>
          <span className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{benchmarkLabel}</span>
        </div>
      </div>
    </div>
  );
}
