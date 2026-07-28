import React from 'react';

interface MomentumChipProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MomentumChip({ label, value, trend = 'neutral' }: MomentumChipProps) {
  const getColors = () => {
    switch (trend) {
      case 'up':
        return 'bg-[var(--color-finance-positive)]/10 text-[var(--color-finance-positive)] border-[var(--color-finance-positive)]/20';
      case 'down':
        return 'bg-[var(--color-finance-negative)]/10 text-[var(--color-finance-negative)] border-[var(--color-finance-negative)]/20';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getColors()}`}>
      <span className="opacity-80">{label}:</span>
      <span className="tabular-nums font-bold">{value}</span>
    </div>
  );
}
