import { cva } from "class-variance-authority";

export const cardVariants = cva(
  "rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 ease-out hover:shadow-md",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:-translate-y-1",
        false: "",
      },
    },
    defaultVariants: {
      padding: "none",
      interactive: false,
    },
  }
);
