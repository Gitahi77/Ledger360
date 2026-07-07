import React from 'react';
import { CurrencyDisplay, type MoneyDTO } from './currency-display/CurrencyDisplay';
import { cn } from '@/lib/ui/cn';

export interface DeltaIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: MoneyDTO;
  inverted?: boolean; // if true, positive is bad (e.g. expenses)
}

export function DeltaIndicator({ value, inverted = false, className, ...props }: DeltaIndicatorProps) {
  const isPositive = value.amountMinor > 0;
  const isNegative = value.amountMinor < 0;

  // By default, positive is good (positive color state). If inverted, positive is bad (negative color state).
  let colorClass = 'text-muted-foreground';
  if (isPositive) colorClass = inverted ? 'text-[hsl(var(--finance-negative))]' : 'text-[hsl(var(--finance-positive))]';
  if (isNegative) colorClass = inverted ? 'text-[hsl(var(--finance-positive))]' : 'text-[hsl(var(--finance-negative))]';

  return (
    <span className={cn("text-xs font-bold inline-flex items-center", colorClass, className)} {...props}>
      {isPositive && '+'}
      <CurrencyDisplay value={value} signDisplay={isNegative ? "always" : "never"} colorize={false} />
    </span>
  );
}
