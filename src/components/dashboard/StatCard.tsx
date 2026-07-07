import React from 'react';
import { Surface } from '@/components/ui/surface/Surface';
import { CurrencyDisplay, type MoneyDTO } from '@/components/finance/display/currency-display/CurrencyDisplay';
import { FinancialMetric } from '@/components/finance/metrics/FinancialMetric';

export interface StatCardProps {
  label: string;
  subLabel?: string;
  money?: MoneyDTO;
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
  iconBgClass = "bg-brand/10",
  iconColorClass = "text-brand",
}: StatCardProps) {
  return (
    <Surface padding="sm" className="flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`} aria-hidden="true">
          {icon}
        </div>
      )}
      <FinancialMetric 
        label={label}
        value={money ? <CurrencyDisplay value={money} /> : value}
        subLabel={subLabel}
        className="flex-1"
      />
    </Surface>
  );
}
