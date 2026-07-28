import * as React from 'react';
import { HeroMetric, HeroMetricProps } from './HeroMetric';
import { CalculationPills, CalculationItem } from './CalculationPill';

export interface HeroSectionProps {
  /** Props for the primary hero metric */
  metric: HeroMetricProps;
  /** Optional calculation items to explain the metric */
  calculation?: CalculationItem[];
}

export function HeroSection({ metric, calculation }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center justify-center py-16 px-4">
      <HeroMetric {...metric} />
      
      {calculation && calculation.length > 0 && !metric.isLoading && !metric.isEmpty && (
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <CalculationPills items={calculation} />
        </div>
      )}
    </section>
  );
}
