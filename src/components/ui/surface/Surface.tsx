import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { focusRing } from "@/lib/ui/focus-ring";
import { surfaceVariants } from "./surface.variants";
import type { VariantProps } from "class-variance-authority";

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  asChild?: boolean;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, padding, interactive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? (props as any).as : "div";
    return (
      <Comp
        ref={ref}
        className={cn(surfaceVariants({ variant, padding, interactive, className }), interactive && focusRing)}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      />
    );
  }
);

Surface.displayName = "Surface";
