"use client";

/**
 * Filtros da Gestão de Recursos (F-25 CA02 · F-44 CA02/CA03/CA06). Estado na URL
 * (?status=&q=&page=) p/ deep-link e voltar/avançar (F-06). Como cada aba é uma
 * ROTA distinta (/salas, /equipamentos), os filtros já ficam isolados por aba —
 * trocar de aba não vaza o filtro da outra (F-44 CA06). A busca usa debounce
 * curto p/ não empurrar uma entrada de histórico por tecla.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import {
  STATUS_FILTERS,
  statusFilterLabel,
  type StatusFilter,
} from "@/lib/resources";

interface Props {
  status: StatusFilter;
  query: string;
  searchPlaceholder: string;
}

export function ResourceFilters({ status, query, searchPlaceholder }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchId = useId();
  const [term, setTerm] = useState(query);

  const setParams = useCallback(
    (entries: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      // Qualquer mudança de filtro/busca volta à página 1 (F-44 CA05).
      next.delete("page");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    if (term === query) return;
    const id = setTimeout(() => setParams({ q: term.trim() }), 300);
    return () => clearTimeout(id);
  }, [term, query, setParams]);

  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-col rounded-xl border shadow-sm md:flex-row md:items-center">
      <div
        role="tablist"
        aria-label="Filtro por estado"
        className="gap-xs flex flex-wrap"
      >
        {STATUS_FILTERS.map((f) => {
          const active = f === status;
          return (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setParams({ status: f === "all" ? "" : f })}
              className={
                active
                  ? "px-md text-label-md bg-primary text-on-primary rounded-full py-1.5"
                  : "px-md text-label-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high rounded-full py-1.5"
              }
            >
              {statusFilterLabel(f)}
            </button>
          );
        })}
      </div>

      <div className="relative flex-1 md:ml-auto md:flex-initial">
        <span
          className="material-symbols-outlined text-on-surface-variant left-md absolute top-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          search
        </span>
        <label htmlFor={searchId} className="sr-only">
          {searchPlaceholder}
        </label>
        <input
          id={searchId}
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={searchPlaceholder}
          className="border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary text-body-sm pr-md w-full rounded-lg border py-2 pl-[44px] outline-none focus:ring-2 md:w-72"
        />
        {isPending && (
          <span className="sr-only" role="status">
            Atualizando lista
          </span>
        )}
      </div>
    </section>
  );
}
