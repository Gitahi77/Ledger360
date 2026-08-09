import * as React from "react"
import { cn } from "@/lib/ui/cn"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
}

export function SectionHeader({ title, subtitle, action, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)} {...props}>
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <div className="text-sm md:text-base text-muted-foreground">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
