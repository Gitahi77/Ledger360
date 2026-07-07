import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { percentageChangeVariants } from "./percentage-change.variants";
import type { VariantProps } from "class-variance-authority";

export interface PercentageChangeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof percentageChangeVariants>, "colorState"> {
  value: number | null | undefined;
  invertColors?: boolean;
}

export const PercentageChange = React.forwardRef<HTMLSpanElement, PercentageChangeProps>(
  ({ className, value, size, invertColors = false, ...props }, ref) => {
    if (value === null || value === undefined) {
      return (
        <span ref={ref} className={cn(percentageChangeVariants({ size, colorState: "neutral" }), className)} {...props}>
          —
        </span>
      );
    }

    const isZero = value === 0;
    const isNegative = value < 0;
    const isPositive = value > 0;
    
    // Determine the exact display string with no spaces: "+4.8%" or "−4.8%"
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    
    let signStr = "";
    if (isPositive) signStr = "+";
    if (isNegative) signStr = "\u2212"; // Mathematical minus
    
    const formattedNumber = formatter.format(Math.abs(value));
    const displayString = `${signStr}${formattedNumber}%`;

    // Determine semantic color
    let colorState: "neutral" | "positive" | "negative" = "neutral";
    if (!isZero) {
      if (invertColors) {
        // e.g. An increase in expenses is "negative" contextually
        colorState = isPositive ? "negative" : "positive";
      } else {
        colorState = isPositive ? "positive" : "negative";
      }
    }

    return (
      <span
        ref={ref}
        className={cn(percentageChangeVariants({ size, colorState }), className)}
        {...props}
      >
        {displayString}
      </span>
    );
  }
);

PercentageChange.displayName = "PercentageChange";
