import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface RecommendationCardProps {
  /** The header (e.g., 'Recommended Next Step') */
  title?: string;
  /** The primary directive (e.g., 'Transfer KES 8,000') */
  actionStatement: string;
  /** The reasoning (e.g., 'Completing this keeps you on track') */
  narrative: string;
  /** Label for the button */
  actionLabel?: string;
  /** Action handler */
  onAction?: () => void;
  /** Status: active requires user action, peace means they are done. */
  status?: 'active' | 'peace';
  /** True if loading */
  isLoading?: boolean;
}

export function RecommendationCard({
  title = "Recommended Next Step",
  actionStatement,
  narrative,
  actionLabel,
  onAction,
  status = 'active',
  isLoading = false,
}: RecommendationCardProps) {
  
  if (isLoading) {
    return (
      <div className="p-8 md:p-12 border border-border bg-card rounded-3xl text-center shadow-sm">
        <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto mb-6" />
        <div className="h-8 w-3/4 max-w-md bg-muted/60 rounded animate-pulse mx-auto mb-4" />
        <div className="h-5 w-2/3 max-w-sm bg-muted/40 rounded animate-pulse mx-auto mb-8" />
        <div className="h-12 w-32 bg-muted rounded-full animate-pulse mx-auto" />
      </div>
    );
  }

  if (status === 'peace') {
    return (
      <div className="p-8 md:p-12 border border-success/20 bg-success/5 rounded-3xl text-center shadow-sm hover:shadow-md transition-all duration-150 ease-out">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          {title}
        </h2>
        <p className="text-2xl md:text-3xl font-medium tracking-tight text-success mb-4">
          {actionStatement}
        </p>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {narrative}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 border border-border bg-card rounded-3xl text-center shadow-sm hover:shadow-md transition-all duration-150 ease-out">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
        {title}
      </h2>
      
      <p className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mb-4">
        {actionStatement}
      </p>
      
      <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
        {narrative}
      </p>
      
      {actionLabel && (
        <button 
          onClick={onAction}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium transition-transform duration-150 active:scale-95 shadow-sm hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
