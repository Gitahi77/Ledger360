import * as React from 'react';
import { cn } from '@/lib/ui/cn';
import { Money, FinancialStatus, FinancialDirection } from '@/lib/finance/types';
import { FinancialValue, FinancialValueProps } from './FinancialValue';
import { AmountBadge, AmountBadgeProps } from './AmountBadge';

export interface BalanceCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  money: Money;
  trendValue?: number;
  status?: FinancialStatus;
  direction?: FinancialDirection;
  
  // Overrides
  valueProps?: Partial<FinancialValueProps>;
  badgeProps?: Partial<AmountBadgeProps>;
}

export const BalanceCard = React.forwardRef<HTMLDivElement, BalanceCardProps>(
  (
    {
      title,
      money,
      trendValue,
      status,
      direction,
      valueProps,
      badgeProps,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col', className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          {(status || direction) && (
            <AmountBadge status={status} direction={direction} {...badgeProps} />
          )}
        </div>
        
        <FinancialValue
          money={money}
          trendValue={trendValue}
          {...valueProps}
        />
      </div>
    );
  }
);
BalanceCard.displayName = 'BalanceCard';
