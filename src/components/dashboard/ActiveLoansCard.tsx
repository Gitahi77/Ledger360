import React from 'react';
import Link from 'next/link';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { Surface } from '@/components/ui/surface/Surface';
import { Stack } from '@/components/layout/stack/Stack';
import { Button } from '@/components/ui/button/Button';
import { CurrencyDisplay } from '@/components/finance/display/currency-display/CurrencyDisplay';
import { StatusBadge } from '@/components/finance/trend/StatusBadge';

interface Loan {
  id: string;
  name: string;
  balanceMoney: import('@/lib/types/domain').MoneyDTO;
  daysOverdue?: number;
}

export interface ActiveLoansCardProps {
  loans: Loan[];
  currency: string;
}

export function ActiveLoansCard({ loans, currency }: ActiveLoansCardProps) {
  if (loans.length === 0) return null;

  const overdueLoanCount = loans.filter(l => (l.daysOverdue ?? 0) > 0).length;

  return (
    <Surface padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Active Loans</h2>
        <Button variant="ghost" size="sm" asChild className="px-0">
          <Link href="/loans">
            View all <ArrowRight size={12} className="ml-1" />
          </Link>
        </Button>
      </div>
      
      {overdueLoanCount > 0 && (
        <div className="mb-4 flex items-center gap-1 text-[hsl(var(--finance-negative))]">
          <TriangleAlert size={14} />
          <StatusBadge 
            status="overdue" 
            label={`${overdueLoanCount} overdue`} 
          />
        </div>
      )}
      
      <Stack gap="sm" direction="column">
        {loans.slice(0, 3).map(l => {
          const isOverdue = (l.daysOverdue ?? 0) > 0;
          return (
            <div key={l.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[60%]">{l.name}</span>
              <CurrencyDisplay 
                value={{ amountMinor: l.balanceMoney.amountMinor, currencyCode: currency }}
                className={`font-bold tabular-nums ${isOverdue ? 'text-[hsl(var(--finance-negative))]' : 'text-foreground'}`}
              />
            </div>
          );
        })}
      </Stack>
    </Surface>
  );
}
