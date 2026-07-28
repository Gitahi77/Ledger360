import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface JourneyCardProps {
  /** The entity being tracked (e.g., 'Net Worth', 'Mortgage') */
  title: string;
  /** The amount of movement (e.g., '+KES 220k') */
  primaryMetric: string;
  /** The time horizon for the movement (e.g., 'since January') */
  trendLabel: string;
  /** The explanation for the movement */
  narrative: string;
  /** Visual indicator of the trend direction */
  trendDirection?: 'positive' | 'negative' | 'neutral';
  /** True if the data is loading */
  isLoading?: boolean;
}

export function JourneyCard({
  title,
  primaryMetric,
  trendLabel,
  narrative,
  trendDirection = 'neutral',
  isLoading = false,
}: JourneyCardProps) {

  if (isLoading) {
    return (
      <div className="p-6 border border-border bg-card rounded-2xl shadow-sm h-[180px] flex flex-col justify-between">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-8 w-32 bg-muted/60 rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted/40 rounded animate-pulse" />
          </div>
          <div className="h-4 w-full max-w-[250px] bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const directionColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-foreground',
  };

  return (
    <div className="p-6 border border-border bg-card rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ease-out h-[180px] flex flex-col justify-between cursor-pointer">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
        {title}
      </h3>
      
      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={cn("text-3xl tracking-tight font-medium", directionColors[trendDirection])}>
            {primaryMetric}
          </span>
          <span className="text-sm text-muted-foreground">
            {trendLabel}
          </span>
        </div>
        
        <p className="text-base text-muted-foreground leading-relaxed">
          {narrative}
        </p>
      </div>
    </div>
  );
}
