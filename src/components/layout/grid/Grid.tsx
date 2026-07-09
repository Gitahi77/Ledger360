import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { gridVariants } from "./grid.variants";
import type { VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  asChild?: boolean;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, columns, gap, responsive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    
    return (
      <Comp
        ref={ref}
        className={cn(gridVariants({ columns, gap, responsive, className }))}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";
