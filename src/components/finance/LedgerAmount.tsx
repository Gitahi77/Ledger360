import clsx from 'clsx';

interface LedgerAmountProps {
  amount: number;
  /** Pass 'income' | 'savings' to show green; anything else (expense) shows red. */
  type?: string;
  currency?: string;
  className?: string;
}

export function LedgerAmount({
  amount,
  type,
  currency = "KES",
  className,
}: LedgerAmountProps) {
  // Direction is determined by transaction type, NOT by sign.
  // All DB amounts are stored as positive values; 'type' carries direction.
  const isPositive = type === 'income' || type === 'savings';

  const formatted = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
  }).format(Math.abs(amount));

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
