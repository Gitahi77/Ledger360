import * as React from 'react';
import { ActivityFeed } from './ActivityFeed';
import { TimelineGroup, TimelineItem, TimelineItemProps } from './Timeline';

export interface TimelineGroupData {
  label: string;
  items: TimelineItemProps[];
}

export interface ReflectionSectionProps {
  title?: string;
  groups: TimelineGroupData[];
}

export function ReflectionSection({ title, groups }: ReflectionSectionProps) {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <ActivityFeed title={title}>
      {groups.map((group, groupIndex) => (
        <TimelineGroup key={groupIndex} label={group.label}>
          {group.items.map((item, itemIndex) => (
            <TimelineItem
              key={itemIndex}
              {...item}
              isLast={itemIndex === group.items.length - 1}
            />
          ))}
        </TimelineGroup>
      ))}
    </ActivityFeed>
  );
}
