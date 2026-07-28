import * as React from 'react';
import { RecommendationCard, RecommendationCardProps } from './RecommendationCard';

export interface ActionSectionProps {
  recommendation?: RecommendationCardProps;
}

export function ActionSection({ recommendation }: ActionSectionProps) {
  if (!recommendation) {
    return null;
  }

  return (
    <section>
      <RecommendationCard {...recommendation} />
    </section>
  );
}
