import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      state: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
      },
      hasIconLeft: {
        true: "pl-10",
        false: "",
      },
      hasIconRight: {
        true: "pr-10",
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
