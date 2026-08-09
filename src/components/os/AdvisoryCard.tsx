import * as React from "react"
import { cn } from "@/lib/ui/cn"
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react"

export interface AdvisoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  explainer: string
  priority?: "low" | "medium" | "high" | "critical" | "success"
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function AdvisoryCard({ title, explainer, priority = "medium", action, icon, className, ...props }: AdvisoryCardProps) {
  const isHigh = priority === "high" || priority === "critical"
  const isSuccess = priority === "success"
  
  return (
    <div 
      className={cn(
        "p-5 rounded-2xl border flex flex-col gap-2 shadow-sm", 
        isHigh ? "bg-destructive/10 border-destructive/30 text-destructive" : 
        isSuccess ? "bg-success/10 border-success/30 text-success" :
        "bg-primary/10 border-primary/20 text-primary",
        className
      )} 
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {icon ? icon : isHigh ? <AlertTriangle size={18} /> : isSuccess ? <CheckCircle2 size={18} /> : <Info size={18} />}
          {title}
        </h3>
      </div>
      <p className="text-sm opacity-90 leading-relaxed">{explainer}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
