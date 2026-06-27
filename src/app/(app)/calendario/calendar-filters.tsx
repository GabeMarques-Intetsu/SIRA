"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface CalendarFiltersProps {
  blocks: string[];
  activeKind: string;
  activeBlock: string;
}

export function CalendarFilters({ blocks, activeKind, activeBlock }: CalendarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(
        next.toString() ? `${pathname}?${next.toString()}` : pathname,
      );
    },
    [params, pathname, router],
  );

  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-col rounded-xl border shadow-sm">
      <h2 className="text-label-md text-on-surface">Filtros</h2>
    </section>
  );
}