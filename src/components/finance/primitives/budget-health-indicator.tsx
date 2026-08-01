'use client';
import React from 'react';
import { cn } from '@/lib/ui/cn';
import { Star, ShieldAlert, Activity } from 'lucide-react';

interface BudgetHealthIndicatorProps {
  score: number;
}

export function BudgetHealthIndicator({ score }: BudgetHealthIndicatorProps) {
  let status = 'Excellent';
  let colorClass = 'text-success';
  let bgClass = 'bg-success/10 border-success/20';
  let Icon = Star;
  let stars = 5;

  if (score < 60) {
    status = 'Needs Attention';
    colorClass = 'text-destructive';
    bgClass = 'bg-destructive/10 border-destructive/20';
    Icon = ShieldAlert;
    stars = Math.max(1, Math.round((score / 100) * 5));
  } else if (score < 85) {
    status = 'Fair';
    colorClass = 'text-warning';
    bgClass = 'bg-warning/10 border-warning/20';
    Icon = Activity;
    stars = Math.max(3, Math.round((score / 100) * 5));
  }

  return (
    <div className={cn("inline-flex items-center gap-4 px-4 py-3 rounded-xl border", bgClass)}>
      <div className="flex flex-col">
        <span className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Budget Health</span>
        <div className={cn("text-lg font-bold font-heading", colorClass)}>
          {status}
        </div>
      </div>
      
      <div className="flex items-center gap-2 border-l border-border/50 pl-4">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={cn(
                "transition-colors",
                i < stars ? `fill-current ${colorClass}` : "text-muted-foreground/30"
              )} 
            />
          ))}
        </div>
        <span className={cn("text-xl font-bold font-heading ml-1 tabular", colorClass)}>
          {score}
        </span>
      </div>
    </div>
  );
}
