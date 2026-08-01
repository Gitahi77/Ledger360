import React from 'react';
import { formatCurrency } from '@/lib/finance/formatCurrency';

type KPIHeroProps = {
  label: string;
  amount?: number;
  percentage?: number;
  currency?: string;
  trendChange?: number;
  isGoodIfPositive?: boolean;
};

export function KPIHero({ label, amount, percentage, currency = 'KES', trendChange, isGoodIfPositive = true }: KPIHeroProps) {
  const hasAmount = amount !== undefined;
  const hasPercentage = percentage !== undefined;
  
  let changeColor = 'text-gray-400';
  if (trendChange !== undefined && trendChange !== 0) {
    const isPositive = trendChange > 0;
    if (isPositive === isGoodIfPositive) {
      changeColor = 'text-emerald-500';
    } else {
      changeColor = 'text-rose-500';
    }
  }

  return (
    <div className="flex flex-col gap-1 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className="text-3xl font-light text-gray-900 tracking-tight flex items-baseline gap-2">
        {hasAmount && <span>{formatCurrency({ amountMinor: amount!, currency })}</span>}
        {hasPercentage && <span>{percentage}%</span>}
      </div>
      {trendChange !== undefined && (
        <div className={`text-sm font-medium ${changeColor} flex items-center gap-1`}>
          {trendChange > 0 ? '+' : ''}{trendChange}%
          <span className="text-gray-400 font-normal ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
