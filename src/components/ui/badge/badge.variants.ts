import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tabular-nums",
  {
    variants: {
      variant: {
        neutral: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        positive: "border-transparent bg-[hsl(var(--finance-positive)_/_0.15)] text-[hsl(var(--finance-positive))]",
        negative: "border-transparent bg-[hsl(var(--finance-negative)_/_0.15)] text-[hsl(var(--finance-negative))]",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.65rem]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);
