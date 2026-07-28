import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface CalculationItem {
  /** The descriptive label (e.g., 'Liquid Cash') */
  label: string;
  /** The monetary value (e.g., 'KES 50,000') */
  value: string;
  /** The mathematical operator that follows this item (e.g., '-', '=') */
  operator?: string;
  /** True if this is the final calculated result */
  isResult?: boolean;
}

export interface CalculationPillsProps {
  /** The sequence of calculation items */
  items: CalculationItem[];
}

export function CalculationPills({ items }: CalculationPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm md:text-base">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <div 
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-colors cursor-default",
              item.isResult 
                ? "bg-foreground text-background border-foreground font-medium" 
                : "bg-card border-border text-foreground hover:bg-muted/50"
            )}
          >
            <span className={item.isResult ? "text-background/70 font-normal" : "text-muted-foreground"}>
              {item.label}
            </span>
            <span>{item.value}</span>
          </div>
          
          {item.operator && (
            <div className="text-muted-foreground font-medium px-1">
              {item.operator}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
