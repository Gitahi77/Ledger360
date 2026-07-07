import React from 'react';
import { Surface } from '@/components/ui/surface/Surface';
import { Stack } from '@/components/layout/stack/Stack';
import { CurrencyDisplay, type MoneyDTO } from '@/components/finance/display/currency-display/CurrencyDisplay';
import { ProgressBar } from '@/components/finance/metrics/ProgressBar';
import { FinancialMetric } from '@/components/finance/metrics/FinancialMetric';

export interface NetWorthHeroProps {
  netWorth: MoneyDTO;
  totalAssets: MoneyDTO;
  totalLiabilities: MoneyDTO;
  savingRate: number;
  targetSavingRate: number;
}

export function NetWorthHero({
  netWorth,
  totalAssets,
  totalLiabilities,
  savingRate,
  targetSavingRate,
}: NetWorthHeroProps) {
  const isTargetMet = savingRate >= targetSavingRate;
  const isTargetWarning = savingRate >= targetSavingRate / 2;
  
  const colorState = isTargetMet ? 'success' : isTargetWarning ? 'warning' : 'destructive';
  const textColor = isTargetMet ? 'text-[hsl(var(--finance-positive))]' : isTargetWarning ? 'text-warning' : 'text-[hsl(var(--finance-negative))]';

  return (
    <Surface 
      padding="lg" 
      className="bg-gradient-to-br from-brand/5 to-transparent border-brand/10 relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-6"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase mb-2">
          Total Net Worth
        </p>
        <CurrencyDisplay 
          value={netWorth}
          className="text-4xl md:text-5xl font-display font-bold text-foreground tabular-nums tracking-tight"
        />
        <p className="text-sm text-muted-foreground mt-3 font-medium flex items-center flex-wrap gap-2">
          <span>Assets</span>
          <CurrencyDisplay value={totalAssets} className="text-foreground" />
          <span className="text-border">•</span>
          <span>Debt</span>
          <CurrencyDisplay value={totalLiabilities} className="text-foreground" />
        </p>
      </div>
      
      <Surface padding="sm" className="relative z-10 min-w-[200px] shadow-sm">
        <FinancialMetric
          label="Saving Rate"
          value={<span className={textColor}>{savingRate}%</span>}
          subLabel={
            <Stack gap="sm" direction="column" className="mt-1">
              <ProgressBar value={savingRate} target={targetSavingRate} colorState={colorState} />
              <span>{isTargetMet ? `🎯 Target ${targetSavingRate}% met` : `Target: ${targetSavingRate}%`}</span>
            </Stack>
          }
        />
      </Surface>
    </Surface>
  );
}
