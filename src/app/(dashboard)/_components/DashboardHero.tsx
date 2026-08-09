import * as React from 'react';
import { SectionHeader } from '@/components/os/SectionHeader';
import { formatCurrency } from '@/lib/finance/formatCurrency';

type DashboardHeroProps = {
  briefing: {
    greeting: string;
    primaryInsight: string;
  };
  safeToSpend: {
    amountMinor: number | null;
    currency: string;
    status: 'available' | 'insufficient_data' | 'stale';
    reasoning: string;
  };
  isStale: boolean;
};

export function DashboardHero({ briefing, safeToSpend, isStale }: DashboardHeroProps) {
  const isAvailable = safeToSpend.status === 'available' && safeToSpend.amountMinor !== null;

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
      <div className="flex-1 max-w-2xl">
        <SectionHeader 
          title={briefing.greeting}
          subtitle={briefing.primaryInsight}
        />
      </div>
      
      <div className="shrink-0 flex flex-col items-start md:items-end">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Safe to Spend
        </div>
        
        {isAvailable ? (
          <div className={`text-4xl md:text-5xl font-semibold tracking-tight ${isStale ? 'text-muted-foreground' : 'text-foreground'}`}>
            <span className="tabular-nums">
              {formatCurrency({ amountMinor: safeToSpend.amountMinor!, currency: safeToSpend.currency }, { precision: 0, showSymbol: false })}
            </span>
            <span className="text-xl md:text-2xl ml-1.5 text-muted-foreground font-medium">
              {safeToSpend.currency}
            </span>
          </div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-muted-foreground">
            ---
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 max-w-[200px] md:text-right">
          {safeToSpend.status === 'insufficient_data' 
            ? 'Needs 30 days of history to calculate securely.'
            : safeToSpend.reasoning}
        </p>
      </div>
    </div>
  );
}
