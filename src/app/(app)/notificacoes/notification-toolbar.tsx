"use client";

/**
 * Barra de filtros (chips) + ação "Marcar todas como lidas" da Central de
 * Notificações (F-34 CA01 · F-36 CA01/CA02). O filtro vive na URL (?filtro=)
 * para deep-link e voltar/avançar (F-06); o recorte é aplicado em memória sobre
 * o cache TanStack Query. "Marcar todas" dispara uma mutation otimista — o
 * cache zera as não lidas na hora e reconcilia no settle (RLS-safe).
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  filterLabel,
  NOTIFICATION_FILTERS,
  type NotificationFilter,
} from "@/lib/notifications";
import { useMarkAllRead } from "@/hooks/queries/use-notifications";

interface Props {
  active: NotificationFilter;
  counts: Record<NotificationFilter, number>;
  /** Habilita o botão "marcar todas" só quando há não lidas (F-36 idempotência). */
  hasUnread: boolean;
}

export function NotificationToolbar({ active, counts, hasUnread }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isNavPending, startTransition] = useTransition();
  const markAll = useMarkAllRead();

  const setFilter = useCallback(
    (filter: NotificationFilter) => {
      const next = new URLSearchParams(params.toString());
      if (filter === "all") next.delete("filtro");
      else next.set("filtro", filter);
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [params, pathname, router],
  );

  const handleMarkAll = () => {
    markAll.mutate();
  };

  const isPending = isNavPending || markAll.isPending;

  return (
    <div className="gap-md flex flex-col" aria-busy={isPending}>
      <div className="gap-md flex flex-wrap items-center justify-between">
        <h1 className="text-headline-sm text-on-surface gap-sm flex items-center">
          Notificações
          {counts.unread > 0 && (
            <span
              className="bg-error text-on-error text-label-sm rounded-full px-2 py-0.5"
              aria-live="polite"
            >
              {counts.unread} {counts.unread === 1 ? "nova" : "novas"}
            </span>
          )}
        </h1>

        <button
          type="button"
          onClick={handleMarkAll}
          disabled={!hasUnread || isPending}
          className="text-label-md text-primary hover:bg-surface-container gap-xs px-md flex items-center rounded-lg py-2 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            done_all
          </span>
          Marcar todas como lidas
        </button>
      </div>

      {/* Chips de filtro por categoria (mockup 10) */}
      <div
        role="tablist"
        aria-label="Filtrar notificações"
        className="gap-xs -mx-md px-md flex overflow-x-auto pb-1 md:mx-0 md:px-0"
      >
        {NOTIFICATION_FILTERS.map((f) => {
          const selected = active === f;
          const count = counts[f];
          return (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setFilter(f)}
              className={`px-md text-label-md flex items-center gap-1 rounded-full py-1.5 whitespace-nowrap transition-colors ${
                selected
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {filterLabel(f)}
              {count > 0 && (
                <span
                  className={`text-label-sm ml-1 rounded-full px-1.5 py-0.5 ${
                    selected
                      ? "bg-on-primary/20"
                      : f === "unread"
                        ? "bg-error/20 text-error"
                        : "bg-surface-container-high"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
