import React from 'react';
import { Decision } from '@/lib/os/contracts';

interface DecisionCardProps {
  decision: Decision | null;
  onAccept?: () => void;
  onReject?: () => void;
}

export function DecisionCard({ decision, onAccept, onReject }: DecisionCardProps) {
  if (!decision) return null;

  const { winningRecommendation: rec } = decision;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Decorative accent based on impact */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-80" />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Recommendation</span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {rec.confidence}% Confidence
            </span>
          </div>
          
          <h3 className="text-xl font-heading font-bold text-foreground">
            {rec.actionTitle}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            {rec.reason}
          </p>

          {/* Trust Layer details */}
          <div className="pt-2 border-t border-border mt-3 grid grid-cols-2 gap-y-2 gap-x-4">
            <div>
              <span className="block text-xs text-muted-foreground">Expected Benefit</span>
              <span className="text-sm font-medium text-foreground">{rec.expectedBenefit}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Time Required</span>
              <span className="text-sm font-medium text-foreground">{rec.timeRequired}</span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 shrink-0 sm:min-w-[140px]">
          <button 
            onClick={onAccept}
            className="w-full bg-primary hover:bg-brand-dark text-primary-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-sm"
          >
            Take Action
          </button>
          <button 
            onClick={onReject}
            className="w-full bg-secondary hover:bg-muted text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
