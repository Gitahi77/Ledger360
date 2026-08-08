import * as React from "react"
import { cn } from "@/lib/ui/cn"

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: "default" | "fluid" | "article" | "transactions" | "compact"
}

export function PageShell({ className, width = "default", ...props }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-10",
        {
          "max-w-7xl": width === "default",
          "max-w-5xl": width === "transactions",
          "max-w-3xl": width === "compact",
          "max-w-4xl": width === "article",
          "max-w-none": width === "fluid",
        },
        className
      )}
      {...props}
    />
  )
}
