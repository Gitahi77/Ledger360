import clsx from 'clsx';

interface BalanceTextProps {
  value: string;
  className?: string;
}

export function BalanceText({
  value,
  className,
}: BalanceTextProps) {
  return (
    <h1
      data-financial
      className={clsx('balance-text', className)}
    >
      {value}
    </h1>
  );
}
