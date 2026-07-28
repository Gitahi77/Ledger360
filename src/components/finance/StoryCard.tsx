import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface StoryCardProps {
  /** The title of the story context (e.g., "Emergency Fund") */
  title: string;
  /** The primary conversational narrative (e.g., "You are 2 months ahead of schedule") */
  narrative: string;
  /** The raw metric supporting the narrative (e.g., "KES 200,000") */
  metric: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Visual state indicating health/pacing */
  status?: 'positive' | 'warning' | 'negative';
  /** Optional call to action */
  actionLabel?: string;
  /** Action handler */
  onAction?: () => void;
  /** True if no data exists yet */
  isEmpty?: boolean;
}

export function StoryCard({
  title,
  narrative,
  metric,
  progress,
  status = 'positive',
  actionLabel,
  onAction,
  isEmpty = false,
}: StoryCardProps) {

  if (isEmpty) {
    return (
      <div className="p-6 border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between min-h-[160px]">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            {title}
          </h3>
          <p className="text-lg leading-relaxed text-muted-foreground/50">
            No active data for this story.
          </p>
        </div>
      </div>
    );
  }

  const statusColors = {
    positive: 'bg-success',
    warning: 'bg-warning',
    negative: 'bg-destructive',
  };

  const statusTextColors = {
    positive: 'text-success',
    warning: 'text-warning',
    negative: 'text-destructive',
  };

  return (
    <div className="p-6 border border-border bg-card rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ease-out flex flex-col justify-between min-h-[160px] cursor-pointer">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {title}
          </h3>
          {/* Supporting Metric is always secondary to the narrative */}
          <span className="text-sm font-medium text-foreground">
            {metric}
          </span>
        </div>
        
        <p className="text-lg leading-relaxed text-foreground font-medium">
          {narrative}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {progress !== undefined && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", statusColors[status])} 
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        
        {actionLabel && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            className={cn(
              "text-sm font-medium transition-colors hover:underline underline-offset-4",
              statusTextColors[status]
            )}
          >
            {actionLabel} &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
