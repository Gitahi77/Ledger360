'use client';
import React from 'react';
import { cn } from '@/lib/ui/cn';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import { BudgetHealthIndicator } from './budget-health-indicator';
import { BudgetIntelligenceResult } from '@/app/(dashboard)/budgets/intelligence';
import { Info, Sparkles } from 'lucide-react';

interface BudgetCommandCenterHeroProps {
  intelligence: BudgetIntelligenceResult;
  currency: string;
  totalCapacity: number;
  totalSpent: number;
  income: number;
}

export function BudgetCommandCenterHero({
  intelligence,
  currency,
  totalCapacity,
  totalSpent,
  income,
}: BudgetCommandCenterHeroProps) {
  const { advisorNote, healthScore } = intelligence;

  // Safe to Spend = Income - Total Capacity - (any uncategorized spend, which we'll omit here for simplicity or assume is passed via snapshot in future)
  // The user defined Safe to Spend: "Remaining Disposable Income for the Current Budget Period"
  // Safe to spend = Income - Total Capacity (Budget Limits).
  const safeToSpend = Math.max(0, income - totalCapacity);
  
  const remainingAllocation = Math.max(0, totalCapacity - totalSpent);
  
  let noteClass = 'bg-secondary text-foreground';
  let iconClass = 'text-foreground';
  
  if (advisorNote.status === 'negative') {
    noteClass = 'bg-destructive/10 border border-destructive/20 text-destructive';
    iconClass = 'text-destructive';
  } else if (advisorNote.status === 'warning') {
    noteClass = 'bg-warning/10 border border-warning/20 text-warning-foreground';
    iconClass = 'text-warning';
  } else if (advisorNote.status === 'positive') {
    noteClass = 'bg-success/10 border border-success/20 text-success';
    iconClass = 'text-success';
  }

  return (
    <div className="flex flex-col gap-6 w-full mb-8">
      {/* Advisor Note */}
      <div className={cn("p-4 rounded-xl flex items-start gap-3", noteClass)}>
        <Sparkles className={cn("mt-0.5 shrink-0", iconClass)} size={18} />
        <p className="text-sm font-medium leading-relaxed">
          {advisorNote.narrative}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex gap-8 items-start">
          <div className="flex flex-col">
            <span className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Safe to Spend</span>
            <div className="text-3xl font-extrabold font-heading tracking-tight tabular">
              {formatCurrency({ amountMinor: safeToSpend, currency }, { variant: 'compact' })}
            </div>
            <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Info size={12} />
              Unbudgeted income
            </span>
          </div>

          <div className="w-px h-12 bg-border hidden md:block" />

          <div className="flex flex-col">
            <span className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Budget Used</span>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold font-heading tracking-tight tabular text-foreground">
                {formatCurrency({ amountMinor: totalSpent, currency }, { variant: 'compact' })}
              </div>
              <div className="text-sm font-medium text-muted-foreground tabular">
                / {formatCurrency({ amountMinor: totalCapacity, currency }, { variant: 'compact' })}
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {formatCurrency({ amountMinor: remainingAllocation, currency }, { variant: 'compact' })} remaining in budgets
            </span>
          </div>
        </div>

        <div>
          <BudgetHealthIndicator score={healthScore} />
        </div>
      </div>
    </div>
  );
}
