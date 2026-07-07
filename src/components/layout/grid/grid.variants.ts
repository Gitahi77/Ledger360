import { cva } from "class-variance-authority";

export const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      12: "grid-cols-12",
    },
    gap: {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    },
    responsive: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      responsive: true,
      columns: 2,
      className: "grid-cols-1 sm:grid-cols-2",
    },
    {
      responsive: true,
      columns: 3,
      className: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    },
    {
      responsive: true,
      columns: 4,
      className: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
  ],
  defaultVariants: {
    columns: 1,
    gap: "md",
    responsive: true,
  },
});
