import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

type TrendBadgeProps = {
  trend: 'Rising' | 'Falling' | 'Stable' | 'Expanding' | 'Contracting';
  sentiment: 'positive' | 'negative' | 'neutral';
};

export function TrendBadge({ trend, sentiment }: TrendBadgeProps) {
  let colorClass = 'bg-gray-50 text-gray-600 border-gray-100';
  if (sentiment === 'positive') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (sentiment === 'negative') colorClass = 'bg-rose-50 text-rose-700 border-rose-100';

  const Icon = trend.includes('Rising') || trend === 'Expanding' 
    ? ArrowUpRight 
    : trend.includes('Falling') || trend === 'Contracting' 
      ? ArrowDownRight 
      : ArrowRight;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {trend}
    </div>
  );
}
