import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/ui/cn';

export interface TrendChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  trend: 'up' | 'down' | 'flat';
  label?: string;
  inverted?: boolean; // if 'up' is bad
}

export function TrendChip({ trend, label, inverted = false, className, ...props }: TrendChipProps) {
  let colorClass = 'text-muted-foreground bg-secondary/50';
  let Icon = Minus;

  if (trend === 'up') {
    colorClass = inverted ? 'text-[hsl(var(--finance-negative))] bg-[hsl(var(--finance-negative)_/_0.1)]' : 'text-[hsl(var(--finance-positive))] bg-[hsl(var(--finance-positive)_/_0.1)]';
    Icon = TrendingUp;
  } else if (trend === 'down') {
    colorClass = inverted ? 'text-[hsl(var(--finance-positive))] bg-[hsl(var(--finance-positive)_/_0.1)]' : 'text-[hsl(var(--finance-negative))] bg-[hsl(var(--finance-negative)_/_0.1)]';
    Icon = TrendingDown;
  }

  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", colorClass, className)} {...props}>
      <Icon size={12} />
      {label && <span>{label}</span>}
    </span>
  );
}
