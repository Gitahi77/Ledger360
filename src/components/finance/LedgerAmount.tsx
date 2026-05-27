import clsx from 'clsx';

interface LedgerAmountProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function LedgerAmount({
  amount,
  currency = "KES",
  className,
}: LedgerAmountProps) {
  const negative = amount < 0;

  return (
    <div
      data-financial
      className={clsx(
        "ledger-amount",
        negative ? "negative" : "positive",
        className
      )}
    >
      {new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
      }).format(amount)}
    </div>
  );
}
