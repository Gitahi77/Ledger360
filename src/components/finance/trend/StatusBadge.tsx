import React from 'react';
import { Badge } from '@/components/ui/badge/Badge';

export type FinancialStatus = 'on-track' | 'warning' | 'overdue' | 'completed' | 'neutral';

export interface StatusBadgeProps {
  status: FinancialStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  let variant: 'neutral' | 'positive' | 'negative' | 'warning' = 'neutral';
  
  if (status === 'on-track' || status === 'completed') variant = 'positive';
  if (status === 'warning') variant = 'warning';
  if (status === 'overdue') variant = 'negative';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
