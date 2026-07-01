import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  formatWeekRange,
  getWeekDays,
  isSameWeek,
  resolveWeekAnchor,
  todayUtc,
  toIso,
} from "@/lib/calendar";
import {
  reservationsToEvents,
  resourceBlock,
  type ReservationRow,
} from "@/lib/calendar-events";
import { WeekGrid } from "./week-grid";
import { CalendarToolbar } from "./calendar-toolbar";
import { MiniCalendar } from "./mini-calendar";
import { CalendarFilters } from "./calendar-filters";

export const metadata: Metadata = { title: "Calendário · SIRA" };

interface SearchParams {
  date?: string;
  semana?: string;
  tipo?: string;
  bloco?: string;
}

/**
 * Calendário semanal (F-13 / RF-005). Server Component: resolve a semana visível
 * a partir da URL (?date= ou ?semana=offset → estado na URL, suporta voltar/
 * avançar e deep-link — F-06), busca as reservas da semana e as renderiza na
 * grade. Os dados chegam no HTML (bom LCP) sem libs de calendário no cliente.
 *
 * ESCOPO (v1): a agenda é PESSOAL — o RLS de `reservations` só devolve as
 * reservas do próprio usuário (admin vê todas). Não tentamos mostrar a ocupação
 * de outros usuários aqui: seria bloqueado pelo RLS e/ou vazaria dados.
 *
 * TODO: visão de ocupação compartilhada via view/RPC — Nova Reserva (F-14)
 * tratará a detecção de conflito no servidor.
 */
export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  // 1. Semana visível (CA04/CA07) a partir do estado na URL.
  const weekStart = resolveWeekAnchor(params);
  const weekEnd = addDays(weekStart, 6);
  const weekStartIso = toIso(weekStart);
  const weekEndIso = toIso(weekEnd);
  const days = getWeekDays(weekStart);
  const weekIsos = days.map((d) => d.iso);
  const isCurrentWeek = isSameWeek(weekStart, todayUtc());

  // 2. Reservas da semana (RLS já restringe ao usuário/admin). Join p/ nomes.
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `id, reservation_date, start_time, end_time, status, resource_kind, purpose,
       rooms ( name, block ),
       equipment ( name, block ),
       profiles ( full_name )`,
    )
    .gte("reservation_date", weekStartIso)
    .lte("reservation_date", weekEndIso)
    // Só reservas ATIVAS na agenda: recusadas/canceladas somem (não recolorem).
    .in("status", ["pending", "approved"])
    .order("start_time", { ascending: true });

  const rows = error ? [] : ((data ?? []) as unknown as ReservationRow[]);

  // 3. Filtros server-side (CA08/CA09/CA10), combináveis.
  const activeKind =
    params.tipo === "room" || params.tipo === "equipment" ? params.tipo : "";
  const activeBlock = params.bloco ?? "";
  const blocks = Array.from(
    new Set(rows.map(resourceBlock).filter((b): b is string => Boolean(b))),
  ).sort();

  const filtered = rows.filter((r) => {
    if (activeKind && r.resource_kind !== activeKind) return false;
    if (activeBlock && resourceBlock(r) !== activeBlock) return false;
    return true;
  });

  const events = reservationsToEvents(filtered, weekIsos);
  const rangeLabel = formatWeekRange(weekStart);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-2">
      <div className="gap-lg flex flex-col lg:flex-row">
        {/* Aside: mini-calendário + filtros */}
        <aside className="gap-md flex flex-shrink-0 flex-col lg:w-64">
          <MiniCalendar weekStartIso={weekStartIso} />
          <CalendarFilters
            blocks={blocks}
            activeKind={activeKind}
            activeBlock={activeBlock}
          />
        </aside>

        {/* Grade semanal */}
        <section
          className="bg-surface-container-lowest border-outline-variant flex-1 overflow-hidden rounded-xl border shadow-sm"
          aria-label={`Grade semanal, ${rangeLabel}${isCurrentWeek ? " (semana atual)" : ""}`}
        >
          <CalendarToolbar
            rangeLabel={`${rangeLabel}${isCurrentWeek ? " · esta semana" : ""}`}
            weekStartIso={weekStartIso}
            prevIso={toIso(addDays(weekStart, -7))}
            nextIso={toIso(addDays(weekStart, 7))}
          />

          {events.length === 0 ? (
            <EmptyState hasReservations={rows.length > 0} />
          ) : (
            <WeekGrid days={days} events={events} />
          )}

          <footer className="p-md border-outline-variant gap-md text-label-sm text-on-surface-variant flex flex-wrap items-center border-t">
            <span className="gap-xs flex items-center">
              <span
                className="bg-primary h-3 w-3 rounded-sm"
                aria-hidden="true"
              />
              Confirmada
            </span>
            <span className="gap-xs flex items-center">
              <span
                className="bg-tertiary h-3 w-3 rounded-sm"
                aria-hidden="true"
              />
              Pendente
            </span>
            <span className="ml-auto hidden md:inline">
              Sua agenda pessoal de reservas.
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}

/** Estado vazio amigável (sem reservas na semana) com CTA para Nova Reserva. */
function EmptyState({ hasReservations }: { hasReservations: boolean }) {
  return (
    <div className="p-xxl gap-md flex flex-col items-center text-center">
      <span
        className="material-symbols-outlined text-primary"
        style={{ fontSize: 48 }}
        aria-hidden="true"
      >
        event_busy
      </span>
      <p className="text-body-md text-on-surface-variant max-w-[24rem]">
        {hasReservations
          ? "Nenhuma reserva corresponde aos filtros nesta semana."
          : "Você não tem reservas nesta semana."}
      </p>
      <Link
        href="/nova-reserva"
        className="bg-primary text-on-primary px-md gap-sm text-label-md hover:bg-surface-tint inline-flex items-center rounded-lg py-2.5 shadow-sm transition-all active:scale-[0.98]"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          add
        </span>
        Nova Reserva
      </Link>
    </div>
  );
}
