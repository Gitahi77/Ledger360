import * as React from 'react';
import { cn } from '@/lib/ui/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PercentageChange, PercentageChangeProps } from './PercentageChange';

export type TrendIndicatorProps = Omit<PercentageChangeProps, 'forceSign'>;

export const TrendIndicator = React.forwardRef<HTMLSpanElement, TrendIndicatorProps>(
  ({ value, tone = 'auto', className, ...props }, ref) => {
    // Determine the icon
    let Icon = Minus;
    if (value > 0) Icon = TrendingUp;
    else if (value < 0) Icon = TrendingDown;

    return (
      <span ref={ref} className={cn('inline-flex items-center gap-1', className)}>
        <Icon className="h-3 w-3" aria-hidden="true" />
        <PercentageChange
          value={value}
          tone={tone}
          forceSign={false}
          {...props}
        />
      </span>
    );
  }
);
TrendIndicator.displayName = 'TrendIndicator';
