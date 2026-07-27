import * as React from 'react';
import { cn } from '@/lib/ui/cn';
import { FinancialStatus, FinancialDirection } from '@/lib/finance/types';

export interface AmountBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: FinancialStatus;
  direction?: FinancialDirection;
}

function getDirectionStyles(direction: FinancialDirection): string {
  switch (direction) {
    case 'Income':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Expense':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
    case 'Transfer':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getStatusStyles(status: FinancialStatus): string {
  switch (status) {
    case 'Cleared':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Failed':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export const AmountBadge = React.forwardRef<HTMLDivElement, AmountBadgeProps>(
  ({ status, direction, className, ...props }, ref) => {
    // If neither is provided, don't render anything
    if (!status && !direction) return null;

    return (
      <div ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props}>
        {direction && (
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getDirectionStyles(direction))}>
            {direction}
          </span>
        )}
        {status && (
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusStyles(status))}>
            {status}
          </span>
        )}
      </div>
    );
  }
);
AmountBadge.displayName = 'AmountBadge';
