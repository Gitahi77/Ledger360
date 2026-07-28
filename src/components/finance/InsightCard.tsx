import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface InsightCardProps {
  /** The severity dictates both color AND layout hierarchy */
  severity: 'info' | 'success' | 'warning' | 'critical';
  /** Optional title (required for critical) */
  title?: string;
  /** The core narrative of the insight */
  content: string;
  /** Label for the action button (required for critical) */
  actionLabel?: string;
  /** Action handler */
  onAction?: () => void;
  /** True if the insight is loading */
  isLoading?: boolean;
}

export function InsightCard({
  severity,
  title,
  content,
  actionLabel,
  onAction,
  isLoading = false,
}: InsightCardProps) {
  
  if (isLoading) {
    return (
      <div className="p-6 border rounded-2xl bg-card">
        <div className="h-4 w-1/4 bg-muted rounded animate-pulse mb-3" />
        <div className="h-5 w-3/4 bg-muted/60 rounded animate-pulse" />
      </div>
    );
  }

  if (severity === 'critical') {
    return (
      <div className="p-8 md:p-12 border-2 border-destructive/20 bg-destructive/5 rounded-3xl col-span-full shadow-sm hover:shadow-md transition-all duration-150 ease-out">
        {title && (
          <h3 className="text-xs uppercase tracking-widest font-semibold text-destructive mb-4">
            {title}
          </h3>
        )}
        <p className="text-2xl md:text-3xl tracking-tight leading-tight mb-8 max-w-2xl text-foreground font-medium">
          {content}
        </p>
        {actionLabel && (
          <button 
            onClick={onAction}
            className="px-6 py-3 bg-destructive text-destructive-foreground rounded-full font-medium transition-transform duration-150 active:scale-95"
          >
            {actionLabel} &rarr;
          </button>
        )}
      </div>
    );
  }

  if (severity === 'warning') {
    return (
      <div className="p-6 border-l-4 border-l-warning border-y border-r border-border bg-card rounded-2xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 ease-out cursor-pointer">
        {title && (
          <h3 className="text-sm font-semibold mb-2">
            {title}
          </h3>
        )}
        <p className="text-lg leading-relaxed text-foreground">
          {content}
        </p>
      </div>
    );
  }
  
  if (severity === 'success') {
    return (
      <div className="p-6 border border-border bg-success/5 rounded-2xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 ease-out cursor-pointer">
        {title && (
          <h3 className="text-sm font-semibold text-success mb-2">
            {title}
          </h3>
        )}
        <p className="text-lg leading-relaxed text-foreground">
          {content}
        </p>
      </div>
    );
  }

  // Info (blends into background)
  return (
    <div className="p-6 border border-border bg-card rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 ease-out cursor-pointer">
      {title && (
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
          {title}
        </h3>
      )}
      <p className="text-base leading-relaxed text-muted-foreground">
        {content}
      </p>
    </div>
  );
}
