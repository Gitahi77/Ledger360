import * as React from 'react';
import { cn } from '@/lib/ui/cn';
import { Money, FinancialTone } from '@/lib/finance/types';
import { formatCurrency, CurrencyVariant } from '@/lib/finance/formatCurrency';
import { toMajor } from '@/lib/money';

const toneClasses: Record<FinancialTone, string> = {
  positive: 'text-emerald-600 dark:text-emerald-500',
  negative: 'text-rose-600 dark:text-rose-500',
  neutral: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-500',
  pending: 'text-muted-foreground italic',
};

export interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  money: Money;
  locale?: string;
  variant?: CurrencyVariant;
  tone?: FinancialTone;
  showSymbol?: boolean;
  precision?: number;
}

export const CurrencyDisplay = React.forwardRef<HTMLSpanElement, CurrencyDisplayProps>(
  (
    {
      money,
      locale = 'en-US',
      variant = 'standard',
      tone,
      showSymbol = true,
      precision,
      className,
      ...props
    },
    ref
  ) => {
    const formatted = formatCurrency(money, {
      locale,
      variant,
      showSymbol,
      precision,
    });

    const major = toMajor(money.amountMinor);
    const abs = Math.abs(major);
    
    // For accessibility, read out something like "Negative 1,234 US dollars"
    // We can use Intl.NumberFormat to get the spelled out currency name if we want,
    // but a simple approach works too for SRs. They usually handle localized numbers well.
    // To explicitly handle it per user request:
    const signWord = major < 0 ? 'Negative ' : major > 0 ? 'Positive ' : '';
    const srLabel = `${signWord}${abs} ${money.currency}`;

    return (
      <span
        ref={ref}
        className={cn('tabular-nums tracking-tight', tone ? toneClasses[tone] : '', className)}
        aria-label={srLabel}
        {...props}
      >
        {formatted}
      </span>
    );
  }
);
CurrencyDisplay.displayName = 'CurrencyDisplay';
