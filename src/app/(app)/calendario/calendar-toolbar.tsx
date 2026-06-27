"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface CalendarToolbarProps {
  /** Rótulo do intervalo da semana (ex.: "13 – 19 Janeiro"). */
  rangeLabel: string;
  /** ISO da segunda-feira da semana exibida (âncora para prev/next). */
  weekStartIso: string;
  /** ISO da segunda da semana anterior. */
  prevIso: string;
  /** ISO da segunda da próxima semana. */
  nextIso: string;
}

export function CalendarToolbar({
  rangeLabel,
  prevIso,
  nextIso,
}: CalendarToolbarProps) {
  return (
    <header className="p-md border-outline-variant gap-md flex flex-wrap items-center border-b">
      Toolbar Inicial
    </header>
  );
}