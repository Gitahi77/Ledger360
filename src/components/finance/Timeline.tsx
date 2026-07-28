import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface TimelineItemProps {
  /** The main narrative (e.g., 'Your salary arrived') */
  title: string;
  /** Optional secondary context */
  description?: string;
  /** Optional value (e.g., '+KES 120,000') */
  value?: string;
  /** Optional time indicator (e.g., '08:30 AM') */
  time?: string;
  /** Visual indicator */
  status?: 'standard' | 'success' | 'warning';
  /** True if this is the last item in a group (removes the connecting line) */
  isLast?: boolean;
}

export function TimelineItem({
  title,
  description,
  value,
  time,
  status = 'standard',
  isLast = false,
}: TimelineItemProps) {
  
  const statusColors = {
    standard: 'bg-muted-foreground/20 text-muted-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  };

  const statusIcons = {
    standard: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    success: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    warning: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="relative pl-8 py-3 hover:bg-muted/30 transition-colors rounded-xl -ml-2 cursor-pointer group">
      {/* The connecting vertical line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-[-12px] w-[2px] bg-border" />
      )}
      
      {/* The timeline node */}
      <div className={cn(
        "absolute left-1 top-4 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center shadow-sm z-10",
        statusColors[status],
        status === 'standard' && "bg-muted"
      )}>
        {status !== 'standard' && statusIcons[status]}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pl-2">
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">{title}</p>
          {(description || time) && (
            <p className="text-sm text-muted-foreground">
              {time && <span className="mr-2 font-mono text-xs">{time}</span>}
              {description}
            </p>
          )}
        </div>
        {value && (
          <div className="text-base font-medium text-foreground">
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

export interface TimelineGroupProps {
  /** The conversational group label (e.g., 'Today') */
  label: string;
  children: React.ReactNode;
}

export function TimelineGroup({ label, children }: TimelineGroupProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h3>
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}
