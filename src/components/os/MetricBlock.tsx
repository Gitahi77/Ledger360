import * as React from "react"
import { cn } from "@/lib/ui/cn"
import { Surface } from "@/components/ui/surface"

export interface MetricBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  trend?: React.ReactNode
}

export function MetricBlock({ label, value, trend, className, ...props }: MetricBlockProps) {
  return (
    <Surface variant="raised" className={cn("p-5 flex flex-col justify-center rounded-2xl", className)} {...props}>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-semibold tracking-tight text-foreground font-tabular-nums">{value}</div>
      {trend && <div className="mt-2 text-sm">{trend}</div>}
    </Surface>
  )
}
