import React from 'react';
import { MetricCard } from '@/components/finance';
import { CurrencyDisplay } from '@/components/finance';

export interface StatCardProps {
  label: string;
  subLabel?: string;
  money?: { amountMinor: number | bigint; currencyCode: string };
  value?: string | React.ReactNode;
  icon?: React.ReactNode;
  iconBgClass?: string;
  iconColorClass?: string;
}

export function StatCard({
  label,
  subLabel,
  money,
  value,
  icon,
  iconBgClass = "bg-brand/10 text-brand",
  iconColorClass = "", // Unused now, merged with bg class for simplicity, or keeping for compatibility
}: StatCardProps) {
  
  const iconNode = icon ? (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`} aria-hidden="true">
      {icon}
    </div>
  ) : undefined;

  const primaryMetric = money ? (
    <CurrencyDisplay money={{ amountMinor: money.amountMinor, currency: money.currencyCode }} />
  ) : value;

  return (
    <MetricCard
      title={label}
      primaryMetric={primaryMetric}
      secondaryMetric={subLabel}
      icon={iconNode}
    />
  );
}
