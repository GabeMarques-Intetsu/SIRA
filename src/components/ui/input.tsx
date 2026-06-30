/**
 * Input — primitivo shadcn/ui estilizado com tokens M3 do projeto. Reflete o
 * estado de erro via `aria-invalid` (anel `error`), mantém focus ring e usa
 * `bg-surface`/`text-on-surface`/`border-outline-variant` — sem cores hardcoded.
 */
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary text-body-md px-md w-full rounded-lg border py-3 transition-all outline-none focus:ring-2",
          "aria-[invalid=true]:border-error aria-[invalid=true]:ring-error aria-[invalid=true]:ring-1",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
