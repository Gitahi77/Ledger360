import * as React from 'react';
import { StoryStack } from './StoryStack';
import { StoryCard, StoryCardProps } from './StoryCard';
import { JourneyCard, JourneyCardProps } from './JourneyCard';

export type ProgressItemData = 
  | { type: 'story'; props: StoryCardProps }
  | { type: 'journey'; props: JourneyCardProps };

export interface ProgressSectionProps {
  title?: string;
  items: ProgressItemData[];
}

export function ProgressSection({ title = 'Progress', items }: ProgressSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <StoryStack title={title}>
      {items.map((item, index) => {
        if (item.type === 'story') {
          return <StoryCard key={index} {...item.props} />;
        }
        if (item.type === 'journey') {
          return <JourneyCard key={index} {...item.props} />;
        }
        return null;
      })}
    </StoryStack>
  );
}
