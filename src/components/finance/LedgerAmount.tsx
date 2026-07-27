import clsx from 'clsx';
import { formatCurrency } from '@/lib/finance/formatCurrency';

interface LedgerAmountProps {
  amountMinor: number;
  /** Pass 'income' | 'savings' to show green; anything else (expense) shows red. */
  type?: string;
  currency?: string;
  className?: string;
}

export function LedgerAmount({
  amountMinor,
  type,
  currency = "KES",
  className,
}: LedgerAmountProps) {
  // Direction is determined by transaction type, NOT by sign.
  // All DB amounts are stored as positive values; 'type' carries direction.
  const isPositive = type === 'income' || type === 'savings';

  // We let fmtFull handle the currency formatting. It will include the currency symbol.
  // We remove the Math.abs here because fmtFull handles the value, but since we are
  // adding +/- manually, we might want to pass Math.abs to fmtFull.
  const formatted = formatCurrency({ amountMinor: Math.abs(amountMinor), currency });

  return (
    <div
      data-financial
      className={clsx(
        "ledger-amount",
        isPositive ? "positive" : "negative",
        className
      )}
    >
      {/* Screen-reader semantic label for colour-blind and assistive tech users */}
      <span className="sr-only">{isPositive ? 'credit' : 'debit'}: </span>
      {isPositive ? '+' : '−'}{formatted}
    </div>
  );
}
