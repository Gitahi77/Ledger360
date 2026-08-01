'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/ui/cn';
import { BudgetWithPacing } from '@/app/(dashboard)/budgets/intelligence';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import { ChevronDown, ChevronUp, AlertCircle, ArrowRight, Settings2, Receipt, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetCardProps {
  budget: BudgetWithPacing;
  currency: string;
  onAction: (actionId: string, budgetId: string) => void;
}

export function BudgetCard({ budget, currency, onAction }: BudgetCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { spent, limit, status, pacing, name, category, period, rollover } = budget;
  
  const percentage = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
  const remaining = Math.max(0, limit - spent);
  const overSpent = Math.max(0, spent - limit);

  // Derive "Financial Calm" semantic styling
  let statusColorClass = 'text-success';
  let barColorClass = 'bg-success';
  let badgeClass = 'bg-success/10 text-success border-success/20';
  let calmMessage = 'On track';
  let ctaLabel = 'Edit budget';
  let ctaIcon = <Settings2 size={14} />;
  let ctaAction = 'edit';

  if (status === 'exceeded') {
    statusColorClass = 'text-destructive';
    barColorClass = 'bg-destructive';
    badgeClass = 'bg-destructive/10 text-destructive border-destructive/20';
    calmMessage = 'Spending is ahead of plan';
    ctaLabel = 'Review spending';
    ctaIcon = <Receipt size={14} />;
    ctaAction = 'review';
  } else if (status === 'critical' || status === 'warning') {
    statusColorClass = 'text-warning';
    barColorClass = 'bg-warning';
    badgeClass = 'bg-warning/10 text-warning border-warning/20';
    calmMessage = 'Immediate attention recommended';
    ctaLabel = 'Reduce spending';
    ctaIcon = <TrendingDown size={14} />;
    ctaAction = 'reduce';
  } else if (pacing.isAheadOfSchedule) {
    statusColorClass = 'text-warning'; // subtle warning
    barColorClass = 'bg-warning/60';
    badgeClass = 'bg-warning/10 text-warning border-warning/20';
    calmMessage = 'Pacing ahead of schedule';
    ctaLabel = 'Review allocation';
    ctaIcon = <Settings2 size={14} />;
    ctaAction = 'edit';
  }

  // Pacing narrative
  let pacingText = 'On pace';
  if (pacing.isAheadOfSchedule && status !== 'exceeded') {
    pacingText = `Running ${Math.round(pacing.pacingVariancePercent * 100)}% ahead of schedule`;
  } else if (status === 'exceeded') {
    pacingText = `${formatCurrency({ amountMinor: overSpent, currency }, { variant: 'compact' })} over plan`;
  }

  // Projected Spend (simplified straight-line projection)
  const projectedSpend = pacing.percentTimeElapsed > 0 
    ? (spent / pacing.percentTimeElapsed) 
    : 0;

  return (
    <div className={cn(
      "card group overflow-hidden transition-all duration-300 relative bg-card border",
      expanded ? "shadow-md" : "hover:shadow-md",
      status === 'exceeded' ? "border-destructive/30" : (status === 'warning' || status === 'critical' ? "border-warning/30" : "border-border")
    )}>
      {/* Top Border Indicator */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", barColorClass)} />
      
      <div 
        className="p-5 cursor-pointer select-none flex flex-col" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground font-heading">{name}</h3>
              {rollover && (
                <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                  Envelope
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5 capitalize">
              {category} · {period}
            </div>
          </div>
          <div className={cn("px-2 py-1 rounded-md text-[0.7rem] font-bold uppercase tracking-widest border flex items-center gap-1.5", badgeClass)}>
            {status !== 'healthy' && <AlertCircle size={12} />}
            {calmMessage}
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Spent</span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-3xl font-extrabold font-heading tracking-tighter tabular", statusColorClass)}>
                {Math.round(percentage)}%
              </span>
              <span className="text-sm font-medium text-muted-foreground">used</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pacing</span>
            <span className="text-sm font-medium text-foreground">{pacingText}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-secondary rounded-full mt-4 overflow-hidden relative">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", barColorClass)}
            style={{ width: `${percentage}%` }}
          />
          {/* Pacing Marker */}
          {pacing.percentTimeElapsed > 0 && pacing.percentTimeElapsed < 1 && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
              style={{ left: `${pacing.percentTimeElapsed * 100}%` }}
              title="Current time in period"
            />
          )}
        </div>
      </div>

      {/* Expanded Content (Progressive Disclosure) */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-2 border-t border-border bg-secondary/30">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Remaining Allowance</p>
                <p className="text-base font-semibold text-foreground tabular">
                  {formatCurrency({ amountMinor: remaining, currency }, { variant: 'compact' })}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Limit</p>
                <p className="text-base font-semibold text-foreground tabular">
                  {formatCurrency({ amountMinor: limit, currency }, { variant: 'compact' })}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Projected Spend</p>
                <p className={cn("text-base font-semibold tabular", 
                  projectedSpend > limit ? "text-warning" : "text-foreground")}>
                  {formatCurrency({ amountMinor: projectedSpend, currency }, { variant: 'compact' })}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Daily Pace</p>
                <p className="text-base font-semibold text-foreground tabular">
                  {formatCurrency({ amountMinor: spent / Math.max(1, (pacing.percentTimeElapsed * 30)), currency }, { variant: 'compact' })} / day
                </p>
              </div>
            </div>

            <button 
              className="btn btn-primary w-full justify-center group/btn"
              onClick={(e) => { e.stopPropagation(); onAction(ctaAction, budget.id); }}
            >
              {ctaIcon}
              <span>{ctaLabel}</span>
              <ArrowRight size={14} className="ml-1 opacity-70 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expand/Collapse Toggle Hint */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-card border border-border rounded-full p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
    </div>
  );
}
