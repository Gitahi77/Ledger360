import * as React from "react";
import { cn } from "@/lib/ui/cn";
import { inputVariants } from "./input.variants";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, iconLeft, iconRight, type, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const errorId = React.useId();
    return (
      <div className="relative w-full">
        {iconLeft && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {iconLeft}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ 
              state: error ? "error" : "default", 
              hasIconLeft: !!iconLeft, 
              hasIconRight: !!iconRight, 
              className 
            })
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${errorId} ${ariaDescribedBy || ""}`.trim() : ariaDescribedBy}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {iconRight}
          </div>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
