import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { emptyStateVariants } from "./empty-state.variants";
import type { VariantProps } from "class-variance-authority";

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, layout, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ layout, className }))}
        {...props}
      >
        {icon && (
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground",
            layout === "horizontal" ? "flex-shrink-0" : ""
          )}>
            {icon}
          </div>
        )}
        <div className="flex flex-col space-y-1">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto md:mx-0">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className={cn(
            "pt-2",
            layout === "horizontal" ? "ml-auto pt-0" : ""
          )}>
            {action}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";
