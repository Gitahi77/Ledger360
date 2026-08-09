import * as React from 'react';
import { SectionHeader } from '@/components/os/SectionHeader';

type PlanHealthCardProps = {
  health: {
    activeBudgetsCount: number;
    budgetsOnTrack: number;
    overallPacingPercentage: number;
  };
};

export function PlanHealthCard({ health }: PlanHealthCardProps) {
  if (!health || health.activeBudgetsCount === 0) {
    return null;
  }

  const isUnderBudget = health.overallPacingPercentage <= 100;
  
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Plan Health" subtitle="How you're pacing against your goals" />
      
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Overall Pacing</span>
            <span className={`text-2xl font-semibold ${isUnderBudget ? 'text-foreground' : 'text-destructive'}`}>
              {health.overallPacingPercentage}%
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-muted-foreground">Budgets on Track</span>
            <span className="text-xl font-semibold">
              {health.budgetsOnTrack} / {health.activeBudgetsCount}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${isUnderBudget ? 'bg-primary' : 'bg-destructive'}`}
            style={{ width: `${Math.min(health.overallPacingPercentage, 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          {isUnderBudget 
            ? `You are pacing ${100 - health.overallPacingPercentage}% under your total budget.`
            : `You are pacing ${health.overallPacingPercentage - 100}% over your total budget.`
          }
        </p>
      </div>
    </div>
  );
}
