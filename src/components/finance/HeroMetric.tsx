import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface HeroMetricProps {
  /** The descriptive label above the metric */
  label: string;
  /** The primary massive number */
  value: string;
  /** Optional secondary text below the metric */
  subtitle?: string;
  /** State of the metric, defaults to neutral */
  status?: 'neutral' | 'positive' | 'warning' | 'negative';
  /** True if the data is currently loading */
  isLoading?: boolean;
  /** True if there is no data to display */
  isEmpty?: boolean;
  /** Controls if the entry animation should play */
  animate?: boolean;
}

export function HeroMetric({
  label,
  value,
  subtitle,
  status = 'neutral',
  isLoading = false,
  isEmpty = false,
  animate = true,
}: HeroMetricProps) {
  
  // Skeleton Loader that completely matches the typography height to prevent CLS
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
        {/* Height of text-6xl md:text-7xl with 1.05 leading is approx 72px */}
        <div className="h-[72px] w-64 bg-muted/60 rounded animate-pulse mb-3" />
        {subtitle && <div className="h-5 w-48 bg-muted rounded animate-pulse" />}
      </div>
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          {label}
        </h2>
        <div className="text-6xl md:text-7xl font-normal tracking-tighter leading-[1.05] text-muted-foreground/30">
          --
        </div>
        {subtitle && (
          <p className="text-muted-foreground mt-3 text-lg">
            No data available
          </p>
        )}
      </div>
    );
  }

  // Optional status colors (though typically Hero is neutral)
  const statusColors = {
    neutral: 'text-foreground',
    positive: 'text-success',
    warning: 'text-warning',
    negative: 'text-destructive',
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-8",
      animate && "animate-fade-in"
    )}
    style={animate ? { animationDuration: '500ms' } : {}}
    >
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        {label}
      </h2>
      
      <div className={cn(
        "text-6xl md:text-7xl font-normal tracking-tighter leading-[1.05]",
        statusColors[status]
      )}>
        {value}
      </div>

      {subtitle && (
        <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
