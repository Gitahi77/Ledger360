import { cva } from "class-variance-authority";

export const emptyStateVariants = cva(
  "flex w-full rounded-xl border border-dashed border-border p-8 text-center animate-in fade-in-50",
  {
    variants: {
      layout: {
        vertical: "flex-col items-center justify-center space-y-4",
        horizontal: "flex-row items-center justify-start space-x-4 text-left p-6",
      },
    },
    defaultVariants: {
      layout: "vertical",
    },
  }
);
