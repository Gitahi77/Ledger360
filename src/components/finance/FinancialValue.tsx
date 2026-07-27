import * as React from 'react';
import { cn } from '@/lib/ui/cn';
import { Money } from '@/lib/finance/types';
import { CurrencyDisplay, CurrencyDisplayProps } from './CurrencyDisplay';
import { TrendIndicator, TrendIndicatorProps } from './TrendIndicator';

export interface FinancialValueProps extends React.HTMLAttributes<HTMLDivElement> {
  money: Money;
  trendValue?: number; // The percentage change (e.g. 0.045 for 4.5%)
  
  // Overrides for subcomponents
  currencyProps?: Partial<CurrencyDisplayProps>;
  trendProps?: Partial<TrendIndicatorProps>;
}

export const FinancialValue = React.forwardRef<HTMLDivElement, FinancialValueProps>(
  (
    {
      money,
      trendValue,
      currencyProps,
      trendProps,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        <CurrencyDisplay
          money={money}
          className={cn('text-2xl font-semibold', currencyProps?.className)}
          {...currencyProps}
        />
        {trendValue !== undefined && (
          <TrendIndicator
            value={trendValue}
            className={cn('mt-1 text-sm', trendProps?.className)}
            {...trendProps}
          />
        )}
      </div>
    );
  }
);
FinancialValue.displayName = 'FinancialValue';
