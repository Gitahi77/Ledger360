import * as React from "react"
import { cn } from "@/lib/ui/cn"

export type FilterBarProps = React.HTMLAttributes<HTMLDivElement>;

export function FilterBar({ className, children, ...props }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent", className)} {...props}>
      {children}
    </div>
  )
}

export function FilterGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
}
