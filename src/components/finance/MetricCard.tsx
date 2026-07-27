import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  primaryMetric: React.ReactNode;
  secondaryMetric?: React.ReactNode;
  trend?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      primaryMetric,
      secondaryMetric,
      trend,
      icon,
      footer,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col', className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold">
            {primaryMetric}
          </div>
          
          {(secondaryMetric || trend) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {trend && <div>{trend}</div>}
              {secondaryMetric && <div>{secondaryMetric}</div>}
            </div>
          )}
        </div>

        {footer && (
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    );
  }
);
MetricCard.displayName = 'MetricCard';
