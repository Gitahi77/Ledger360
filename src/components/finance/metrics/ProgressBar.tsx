import React from 'react';
import { cn } from '@/lib/ui/cn';

export interface ProgressBarProps {
  value: number; // 0 to 100
  target?: number; // 0 to 100
  colorState?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function ProgressBar({ value, target, colorState = 'default', className }: ProgressBarProps) {
  let barColor = 'bg-primary';
  if (colorState === 'success') barColor = 'bg-[hsl(var(--finance-positive))]';
  if (colorState === 'warning') barColor = 'bg-warning';
  if (colorState === 'destructive') barColor = 'bg-[hsl(var(--finance-negative))]';

  return (
    <div className={cn("h-1.5 w-full bg-secondary rounded-full overflow-hidden relative", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div 
        className={cn("h-full rounded-full transition-all duration-500", barColor)} 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }} 
      />
      {target !== undefined && (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/20" 
          style={{ left: `${Math.max(0, Math.min(100, target))}%` }} 
          aria-hidden="true"
        />
      )}
    </div>
  );
}
