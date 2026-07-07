import { cva } from "class-variance-authority";

export const surfaceVariants = cva(
  "block w-full transition-shadow duration-200",
  {
    variants: {
      variant: {
        flat: "bg-transparent",
        raised: "bg-card border border-border shadow-sm rounded-xl",
        sunken: "bg-secondary border border-border/50 rounded-xl",
      },
      padding: {
        none: "",
        sm: "p-3 sm:p-4",
        md: "p-4 sm:p-6",
        lg: "p-6 sm:p-8",
      },
      interactive: {
        true: "hover:shadow-md cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "raised",
      padding: "md",
      interactive: false,
    },
  }
);
