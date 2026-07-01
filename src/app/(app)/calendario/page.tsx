import Link from "next/link";
import { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { 
  addDays, 
  formatWeekRange, 
  getWeekDays, 
  isSameWeek, 
  resolveWeekAnchor, 
  todayUtc, 
  toIso 
} from "@/lib/calendar";
import { 
  reservationsToEvents, 
  resourceBlock, 
  type ReservationRow 
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

export default async function CalendarioPage({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams> 
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  const weekStart = resolveWeekAnchor(params);
  const weekStartIso = toIso(weekStart);
  const days = getWeekDays(weekStart);
  const isCurrentWeek = isSameWeek(weekStart, todayUtc());

  const { data } = await supabase
    .from("reservations")
    .select(`
      id, 
      reservation_date, 
      start_time, 
      end_time, 
      status, 
      resource_kind, 
      purpose, 
      rooms(name, block), 
      equipment(name, block), 
      profiles(full_name)
    `)
    .gte("reservation_date", toIso(weekStart))
    .lte("reservation_date", toIso(addDays(weekStart, 6)))
    .order("start_time", { ascending: true });

  const rows = (data ?? []) as unknown as ReservationRow[];
  const activeKind = params.tipo === "room" || params.tipo === "equipment" ? params.tipo : "";
  const activeBlock = params.bloco ?? "";
  const blocks = Array.from(new Set(rows.map(resourceBlock).filter((b): b is string => Boolean(b)))).sort();
  
  const events = reservationsToEvents(
    rows.filter(r => (!activeKind || r.resource_kind === activeKind) && (!activeBlock || resourceBlock(r) === activeBlock)), 
    days.map(d => d.iso)
  );
  
  const rangeLabel = formatWeekRange(weekStart);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-2">
      <div className="gap-lg flex flex-col lg:flex-row">
        <aside className="gap-md flex flex-shrink-0 flex-col lg:w-64">
          <MiniCalendar weekStartIso={weekStartIso} />
          <CalendarFilters blocks={blocks} activeKind={activeKind} activeBlock={activeBlock} />
        </aside>
        
        <section className="bg-surface-container-lowest border-outline-variant flex-1 overflow-hidden rounded-xl border shadow-sm">
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
              <span className="bg-primary h-3 w-3 rounded-sm" aria-hidden="true" /> Confirmada
            </span>
            <span className="gap-xs flex items-center">
              <span className="bg-tertiary h-3 w-3 rounded-sm" aria-hidden="true" /> Pendente
            </span>
            <span className="gap-xs flex items-center">
              <span className="bg-error h-3 w-3 rounded-sm" aria-hidden="true" /> Recusada
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

function EmptyState({ hasReservations }: { hasReservations: boolean }) {
  return (
    <div className="p-xxl gap-md flex flex-col items-center text-center">
      <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }} aria-hidden="true">
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
        <span className="material-symbols-outlined" aria-hidden="true">add</span> Nova Reserva
      </Link>
    </div>
  );
}