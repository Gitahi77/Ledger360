import * as React from 'react';
import { SectionHeader } from '@/components/os/SectionHeader';
import { formatCurrency } from '@/lib/finance/formatCurrency';

type RadarTimelineProps = {
  obligations: Array<{
    id: string;
    dueDate: string;
    amountMinor: number;
    merchantName: string;
    confidencePercentage: number;
  }>;
  currency: string;
};

export function RadarTimeline({ obligations, currency }: RadarTimelineProps) {
  if (!obligations || obligations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="The Radar" subtitle="Upcoming events and predicted obligations" />
      
      <div className="relative border-l-2 border-border ml-3 space-y-6">
        {obligations.map((obs) => {
          const date = new Date(obs.dueDate);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          
          return (
            <div key={obs.id} className="relative pl-6">
              {/* Dot */}
              <div className="absolute w-3 h-3 bg-muted-foreground rounded-full -left-[7px] top-1.5 border-2 border-background" />
              
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{obs.merchantName}</span>
                  <span className="text-xs text-muted-foreground">{formattedDate} • {obs.confidencePercentage}% confidence</span>
                </div>
                
                <div className="text-sm font-medium tabular-nums">
                  {formatCurrency({ amountMinor: obs.amountMinor, currency }, { precision: 0 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
