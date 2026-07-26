import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { buttonVariants } from "./button.variants";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot, Slottable } from "@radix-ui/react-slot";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref
  ) => {
    // Using Radix Slot for proper asChild support
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : undefined}
        aria-disabled={disabled || loading ? "true" : undefined}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {!loading && iconLeft && <span className="mr-2">{iconLeft}</span>}
        {asChild ? <Slottable>{children}</Slottable> : children}
        {!loading && iconRight && <span className="ml-2">{iconRight}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";
