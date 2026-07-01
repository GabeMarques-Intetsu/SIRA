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

/**
 * Filtros do calendário (CA08/CA09/CA10): por tipo de recurso (sala/equipamento)
 * e por bloco, combináveis. Aplicados via URL (?tipo=&bloco=) → a filtragem
 * acontece no Server Component (sem expor dados de outros usuários; RLS-safe).
 * Os filtros são preservados ao navegar/alternar visão (CA12), pois vivem na URL.
 */
export function CalendarFilters({
  blocks,
  activeKind,
  activeBlock,
}: CalendarFiltersProps) {
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

  const KINDS: { value: string; label: string; swatch: string }[] = [
    { value: "", label: "Todos os recursos", swatch: "bg-on-surface-variant" },
    { value: "room", label: "Salas", swatch: "bg-primary" },
    { value: "equipment", label: "Equipamentos", swatch: "bg-tertiary" },
  ];

  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-col rounded-xl border shadow-sm">
      <h2 className="text-label-md text-on-surface">Filtros</h2>

      <fieldset className="gap-sm flex flex-col">
        <legend className="text-label-sm text-on-surface-variant mb-xs">
          Tipo de recurso
        </legend>
        {KINDS.map((k) => (
          <label
            key={k.value}
            className="gap-sm flex cursor-pointer items-center"
          >
            <input
              type="radio"
              name="tipo"
              checked={activeKind === k.value}
              onChange={() => setParam("tipo", k.value)}
              className="text-primary h-4 w-4"
            />
            <span className="text-body-sm text-on-surface gap-xs flex items-center">
              <span
                className={`h-3 w-3 rounded-sm ${k.swatch}`}
                aria-hidden="true"
              />
              {k.label}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="border-outline-variant pt-md border-t">
        <label htmlFor="bloco" className="text-label-sm text-on-surface">
          Bloco
        </label>
        <select
          id="bloco"
          value={activeBlock}
          onChange={(e) => setParam("bloco", e.target.value)}
          className="mt-xs px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-sm w-full rounded-lg border py-2 outline-none focus:ring-2"
        >
          <option value="">Todos</option>
          {blocks.map((b) => (
            <option key={b} value={b}>
              Bloco {b}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}