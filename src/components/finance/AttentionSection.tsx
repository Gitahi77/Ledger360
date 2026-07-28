import * as React from 'react';
import { InsightCard, InsightCardProps } from './InsightCard';
import { InsightGrid } from './InsightGrid';

export interface AttentionSectionProps {
  insights: InsightCardProps[];
}

export function AttentionSection({ insights }: AttentionSectionProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <section>
      <InsightGrid>
        {insights.map((insight, index) => (
          <InsightCard key={index} {...insight} />
        ))}
      </InsightGrid>
    </section>
  );
}
