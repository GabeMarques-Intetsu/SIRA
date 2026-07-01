/**
 * Button — primitivo shadcn/ui (cva + Radix Slot + cn) estilizado com os tokens
 * Material Design 3 do projeto (bg-primary, text-on-primary, border-outline…),
 * NUNCA cores hardcoded. Mantém a11y: focus-visible ring, alvo de toque ≥44px,
 * `disabled` opaco. `asChild` permite renderizar como <Link>/outro elemento.
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-sm rounded-lg text-label-md font-medium whitespace-nowrap outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] [&_.material-symbols-outlined]:text-[18px]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary shadow-sm hover:bg-surface-tint",
        outline:
          "border border-outline-variant text-on-surface hover:bg-surface-container",
        ghost: "text-on-surface hover:bg-surface-container",
        destructive: "border border-error text-error hover:bg-error-container",
      },
      size: {
        md: "px-lg py-3",
        sm: "px-md py-2",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renderiza o filho como elemento raiz (ex.: <Link>) em vez de <button>. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
