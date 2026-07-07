import React from 'react';
import { Stack } from '@/components/layout/stack/Stack';

export interface FinancialMetricProps {
  label: React.ReactNode;
  value: React.ReactNode;
  subLabel?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export function FinancialMetric({ label, value, subLabel, align = 'left', className }: FinancialMetricProps) {
  return (
    <Stack gap="none" className={`min-w-0 ${align === 'right' ? 'items-end text-right' : align === 'center' ? 'items-center text-center' : 'items-start text-left'} ${className || ''}`}>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate mb-1">
        {label}
      </div>
      <div className="text-lg font-bold text-foreground tabular-nums truncate">
        {value}
      </div>
      {subLabel && (
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {subLabel}
        </div>
      )}
    </Stack>
  );
}
