import * as React from 'react';
import { cn } from '@/lib/ui/cn';
import { FinancialTone } from '@/lib/finance/types';
import { formatPercent } from '@/lib/finance/formatPercent';
import { getToneFromAmount } from '@/lib/finance/financialColors';

const toneClasses: Record<FinancialTone, string> = {
  positive: 'text-emerald-600 dark:text-emerald-500',
  negative: 'text-rose-600 dark:text-rose-500',
  neutral: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-500',
  pending: 'text-muted-foreground italic',
};

export interface PercentageChangeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number; // e.g., 0.05 for 5%
  locale?: string;
  decimals?: number;
  forceSign?: boolean;
  tone?: FinancialTone | 'auto'; // If 'auto', derives from value
}

export const PercentageChange = React.forwardRef<HTMLSpanElement, PercentageChangeProps>(
  (
    {
      value,
      locale,
      decimals = 1,
      forceSign = false,
      tone = 'auto',
      className,
      ...props
    },
    ref
  ) => {
    const formatted = formatPercent(value, { locale, decimals, forceSign });
    
    let resolvedTone: FinancialTone | undefined;
    if (tone === 'auto') {
      resolvedTone = getToneFromAmount(value);
    } else {
      resolvedTone = tone;
    }

    // Accessibility label
    const signWord = value < 0 ? 'Negative ' : value > 0 ? 'Positive ' : '';
    const absPercent = Math.abs(value * 100).toFixed(decimals);
    const srLabel = `${signWord}${absPercent} percent`;

    return (
      <span
        ref={ref}
        className={cn('tabular-nums tracking-tight', resolvedTone ? toneClasses[resolvedTone] : '', className)}
        aria-label={srLabel}
        {...props}
      >
        {formatted}
      </span>
    );
  }
);
PercentageChange.displayName = 'PercentageChange';
