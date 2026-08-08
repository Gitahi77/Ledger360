import * as React from "react"
import { cn } from "@/lib/ui/cn"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-24 text-center px-4", className)} {...props}>
      {icon && <div className="text-5xl mb-4 text-muted-foreground/60">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
