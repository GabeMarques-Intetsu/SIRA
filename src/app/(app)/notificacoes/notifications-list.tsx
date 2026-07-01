"use client";

/**
 * Client island da Central de Notificações (F-34/F-35/F-36 · RF-011). Consome o
 * cache TanStack Query (`useNotifications`) hidratado com o fetch do Server
 * Component (`initialData`), e deriva — em memória, a partir do cache — o
 * filtro ativo, os contadores, o agrupamento (Hoje/Esta semana/Anteriores) e o
 * estado "tem não lidas". Marcar lida (item) e marcar todas (toolbar) são
 * mutations otimistas: a UI reflete a leitura na hora, sem round-trip, e o cache
 * reconcilia no settle.
 *
 * A UI/UX e a a11y da versão Server Component são preservadas: lista semântica
 * (`role="list"`), grupos rotulados, `aria-live` no contador, chips de filtro.
 */
import { useMemo } from "react";
import {
  applyFilter,
  filterCounts,
  groupByRecency,
  unreadCount,
  type NotificationFilter,
  type NotificationRow,
} from "@/lib/notifications";
import { useNotifications } from "@/hooks/queries/use-notifications";
import { NotificationItem } from "./notification-item";
import { NotificationToolbar } from "./notification-toolbar";

interface Props {
  initialData: NotificationRow[];
  filter: NotificationFilter;
}

export function NotificationsList({ initialData, filter }: Props) {
  // Estado de servidor via cache: 1ª pintura usa `initialData` (SSR), depois o
  // TanStack assume (refetch só após staleTime). As mutations otimistas mutam
  // este mesmo cache, então a lista re-renderiza sem refetch.
  const { data } = useNotifications(initialData);
  const allRows = data ?? initialData;

  const { counts, groups, hasUnread, hasAny } = useMemo(() => {
    return {
      counts: filterCounts(allRows),
      groups: groupByRecency(applyFilter(allRows, filter)),
      hasUnread: unreadCount(allRows) > 0,
      hasAny: allRows.length > 0,
    };
  }, [allRows, filter]);

  return (
    <div className="gap-lg mx-auto flex w-full max-w-[48rem] flex-col">
      <NotificationToolbar
        active={filter}
        counts={counts}
        hasUnread={hasUnread}
      />

      {groups.length === 0 ? (
        <EmptyState hasAny={hasAny} />
      ) : (
        groups.map((group) => (
          <section
            key={group.key}
            aria-labelledby={`grupo-${group.key}`}
            className="gap-sm flex flex-col"
          >
            <h2
              id={`grupo-${group.key}`}
              className="text-label-md text-on-surface-variant px-sm tracking-wider uppercase"
            >
              {group.label}
            </h2>
            <ul className="gap-sm flex flex-col" role="list">
              {group.items.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem notification={notification} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/** Caixa vazia (F-34 CA05) — distingue "sem notificações" de "filtro vazio". */
function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="bg-surface-container-lowest border-outline-variant p-xxl gap-md flex flex-col items-center rounded-xl border text-center shadow-sm">
      <span
        className="material-symbols-outlined text-on-surface-variant"
        style={{ fontSize: 48 }}
        aria-hidden="true"
      >
        notifications_off
      </span>
      <p className="text-body-md text-on-surface-variant max-w-[24rem]">
        {hasAny
          ? "Nenhuma notificação para este filtro."
          : "Você não tem notificações. Avisos sobre suas reservas aparecerão aqui."}
      </p>
    </div>
  );
}
