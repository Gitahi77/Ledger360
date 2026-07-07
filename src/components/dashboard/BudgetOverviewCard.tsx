import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Surface } from '@/components/ui/surface/Surface';
import { Stack } from '@/components/layout/stack/Stack';
import { EmptyState } from '@/components/feedback/empty-state/EmptyState';
import { CurrencyDisplay } from '@/components/finance/display/currency-display/CurrencyDisplay';
import { ProgressBar } from '@/components/finance/metrics/ProgressBar';
import { StatusBadge, type FinancialStatus } from '@/components/finance/trend/StatusBadge';
import { DeltaIndicator } from '@/components/finance/display/DeltaIndicator';
import { Button } from '@/components/ui/button/Button';

interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
}

export interface BudgetOverviewCardProps {
  budgets: Budget[];
  currency: string;
}

function getBudgetStatus(limit: number, spent: number): { status: FinancialStatus; label: string; pct: number } {
  const p = limit > 0 ? Math.min(100, (spent / limit) * 100) : (spent > 0 ? 100 : 0);
  if (p >= 100) return { status: 'overdue', label: 'Over', pct: 100 };
  if (p >= 80)  return { status: 'warning', label: 'Warning', pct: p };
  return { status: 'on-track', label: 'Good', pct: p };
}

export function BudgetOverviewCard({ budgets, currency }: BudgetOverviewCardProps) {
  return (
    <Surface padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-foreground">Budget Status</h2>
        <Button variant="ghost" size="sm" asChild className="px-0">
          <Link href="/budgets">
            Manage <ArrowRight size={12} className="ml-1" />
          </Link>
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          layout="vertical"
          title="No budgets set up yet"
          action={
            <Button asChild>
              <Link href="/budgets">Create a budget</Link>
            </Button>
          }
        />
      ) : (
        <Stack gap="lg" direction="column">
          {budgets.slice(0, 5).map(b => {
            const st = getBudgetStatus(b.limit, b.spent);
            const over = b.spent - b.limit;
            
            let barColorState: 'success' | 'warning' | 'destructive' = 'success';
            if (st.status === 'warning') barColorState = 'warning';
            if (st.status === 'overdue') barColorState = 'destructive';

            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{b.name}</span>
                  <div className="flex items-center gap-2">
                    {over > 0 && (
                      <DeltaIndicator value={{ amountMinor: over, currencyCode: currency }} inverted />
                    )}
                    <StatusBadge status={st.status} label={st.label} />
                  </div>
                </div>
                <ProgressBar value={st.pct} colorState={barColorState} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CurrencyDisplay value={{ amountMinor: b.spent, currencyCode: currency }} className="font-medium text-foreground" />
                    <span>spent</span>
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>of</span>
                    <CurrencyDisplay value={{ amountMinor: b.limit, currencyCode: currency }} />
                  </span>
                </div>
              </div>
            );
          })}
        </Stack>
      )}
    </Surface>
  );
}
