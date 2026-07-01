"use client";

/**
 * Abas de status + busca textual da Fila de Aprovações (F-21 CA07). O estado
 * vive na URL (?status=&q=) para suportar voltar/avançar e deep-link (F-06) e
 * para o Server Component refazer a leitura/filtragem RLS-safe. A busca usa
 * debounce curto para não empurrar uma entrada no histórico por tecla.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import { APPROVAL_TABS, tabLabel, type ApprovalTab } from "@/lib/approvals";

interface Props {
  tab: ApprovalTab;
  query: string;
  /** Total da aba ativa (badge "Pendentes N"). */
  pendingCount: number;
}

export function ApprovalFilters({ tab, query, pendingCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchId = useId();
  const [term, setTerm] = useState(query);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [params, pathname, router],
  );

  // Debounce da busca (300 ms) — evita um push por tecla.
  useEffect(() => {
    if (term === query) return;
    const id = setTimeout(() => setParam("q", term.trim()), 300);
    return () => clearTimeout(id);
  }, [term, query, setParam]);

  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-col rounded-xl border shadow-sm md:flex-row md:items-center">
      <div
        role="tablist"
        aria-label="Filtro por status"
        className="gap-xs flex flex-wrap"
      >
        {APPROVAL_TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setParam("status", t === "pending" ? "" : t)}
              className={
                active
                  ? "px-md text-label-md gap-xs bg-primary text-on-primary flex items-center rounded-full py-2"
                  : "px-md text-label-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high rounded-full py-2"
              }
            >
              {tabLabel(t)}
              {t === "pending" && (
                <span className="bg-on-primary/20 text-label-sm ml-1 rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
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
          Buscar solicitante ou recurso
        </label>
        <input
          id={searchId}
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar solicitante ou recurso…"
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
