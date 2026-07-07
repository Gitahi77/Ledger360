import { cva } from "class-variance-authority";

export const currencyDisplayVariants = cva("font-medium tabular-nums", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      hero: "text-4xl font-display font-semibold tracking-tight",
    },
    colorState: {
      neutral: "text-foreground",
      positive: "text-[hsl(var(--finance-positive))]",
      negative: "text-[hsl(var(--finance-negative))]",
    },
  },
  defaultVariants: {
    size: "md",
    colorState: "neutral",
  },
});
