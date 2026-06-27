"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface CalendarToolbarProps {
  rangeLabel: string;
  weekStartIso: string;
  prevIso: string;
  nextIso: string;
}

export function CalendarToolbar({
  rangeLabel,
  prevIso,
  nextIso,
}: CalendarToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const goToDate = useCallback(
    (iso: string) => {
      const next = new URLSearchParams(params.toString());
      next.set("date", iso);
      next.delete("semana");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const goToday = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("date");
    next.delete("semana");
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }, [params, pathname, router]);

  return (
    <header className="p-md border-outline-variant gap-md flex flex-wrap items-center border-b">
      Toolbar com Lógica Ativa
    </header>
  );
}