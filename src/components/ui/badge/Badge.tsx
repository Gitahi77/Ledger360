import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { badgeVariants } from "./badge.variants";
import type { VariantProps } from "class-variance-authority";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
