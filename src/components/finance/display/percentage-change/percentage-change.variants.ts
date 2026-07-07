import { cva } from "class-variance-authority";

export const percentageChangeVariants = cva("font-medium tabular-nums", {
  variants: {
    colorState: {
      neutral: "text-foreground",
      positive: "text-[hsl(var(--finance-positive))]",
      negative: "text-[hsl(var(--finance-negative))]",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    colorState: "neutral",
    size: "md",
  },
});
