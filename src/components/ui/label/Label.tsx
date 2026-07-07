import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { labelVariants } from "./label.variants";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";
