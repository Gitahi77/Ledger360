import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { stackVariants } from "./stack.variants";
import type { VariantProps } from "class-variance-authority";

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  asChild?: boolean;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, align, justify, gap, wrap, asChild = false, ...props }, ref) => {
    const Comp = asChild ? (props as any).as : "div";
    
    return (
      <Comp
        ref={ref}
        className={cn(stackVariants({ direction, align, justify, gap, wrap, className }))}
        {...props}
      />
    );
  }
);
Stack.displayName = "Stack";
