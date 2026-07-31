import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "flex h-11 w-full rounded-xl border border-border/80 bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
      },
      hasIconLeft: {
        true: "pl-11",
        false: "",
      },
      hasIconRight: {
        true: "pr-11",
        false: "",
      },
    },
    defaultVariants: {
      state: "default",
      hasIconLeft: false,
      hasIconRight: false,
    },
  }
);
