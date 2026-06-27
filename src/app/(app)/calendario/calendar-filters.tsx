"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface CalendarFiltersProps {
  /** Blocos disponíveis (derivados das reservas da semana). */
  blocks: string[];
  /** Filtro de tipo ativo ("", "room" ou "equipment"). */
  activeKind: string;
  /** Bloco ativo ("" = todos). */
  activeBlock: string;
}

export function CalendarFilters({
  blocks,
  activeKind,
  activeBlock,
}: CalendarFiltersProps) {
  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-col rounded-xl border shadow-sm">
      <h2 className="text-label-md text-on-surface">Filtros</h2>
    </section>
  );
}