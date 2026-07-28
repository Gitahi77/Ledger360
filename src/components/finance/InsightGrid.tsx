import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface InsightGridProps {
  children: React.ReactNode;
}

export function InsightGrid({ children }: InsightGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}
