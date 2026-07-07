import { cva } from "class-variance-authority";

export const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow transition-all",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      padding: "none",
    },
  }
);
