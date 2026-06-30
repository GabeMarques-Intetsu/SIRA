import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — combina classes condicionais (clsx) resolvendo conflitos do Tailwind
 * (tailwind-merge). Convenção shadcn/ui, usada pelos componentes de `components/ui`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
