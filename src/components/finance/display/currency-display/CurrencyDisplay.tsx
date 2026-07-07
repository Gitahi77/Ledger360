import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { currencyDisplayVariants } from "./currency-display.variants";
import type { VariantProps } from "class-variance-authority";

export interface MoneyDTO {
  amountMinor: number;
  currencyCode: string; // e.g. 'KES', 'USD'
}

export interface CurrencyDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof currencyDisplayVariants>, "colorState"> {
  value: MoneyDTO | null | undefined;
  signDisplay?: "auto" | "always" | "never";
  colorize?: boolean;
}

export const CurrencyDisplay = React.forwardRef<HTMLSpanElement, CurrencyDisplayProps>(
  ({ className, value, size, signDisplay = "auto", colorize = false, ...props }, ref) => {
    // Missing data rule: "— not KES 0.00"
    if (!value) {
      return (
        <span ref={ref} className={cn(currencyDisplayVariants({ size, colorState: "neutral" }), className)} {...props}>
          —
        </span>
      );
    }

    const { amountMinor, currencyCode } = value;
    const isZero = amountMinor === 0;
    const isNegative = amountMinor < 0;
    const isPositive = amountMinor > 0;
    
    // We calculate the float value for formatting
    const floatValue = Math.abs(amountMinor) / 100;

    // We manually enforce the mathematical minus sign and sign rules 
    // to strictly adhere to FINANCIAL_COMPONENT_GUIDELINES.md.
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    const formattedNumber = formatter.format(floatValue);
    
    // Determine the sign string
    let signStr = "";
    if (signDisplay === "always" && isPositive) signStr = "+";
    if (signDisplay !== "never" && isNegative) signStr = "\u2212"; // Mathematical minus

    // Final string format: "−KES 540.00" or "KES 1,234.56"
    const displayString = `${signStr}${currencyCode} ${formattedNumber}`;

    // Determine color
    let colorState: "neutral" | "positive" | "negative" = "neutral";
    if (colorize && !isZero) {
      colorState = isPositive ? "positive" : "negative";
    }

    return (
      <span
        ref={ref}
        className={cn(currencyDisplayVariants({ size, colorState }), className)}
        {...props}
      >
        {displayString}
      </span>
    );
  }
);

CurrencyDisplay.displayName = "CurrencyDisplay";
