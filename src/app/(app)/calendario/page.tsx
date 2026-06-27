import { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
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

export const metadata: Metadata = { title: "Calendário · SIRA" };

interface SearchParams {
  date?: string;
  semana?: string;
  tipo?: string;
  bloco?: string;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  const weekStart = resolveWeekAnchor(params);
  const weekStartIso = toIso(weekStart);
  const weekEndIso = toIso(addDays(weekStart, 6));
  const days = getWeekDays(weekStart);
  const weekIsos = days.map((d) => d.iso);

  const { data, error } = await supabase
    .from("reservations")
    .select(`id, reservation_date, start_time, end_time, status, resource_kind, purpose, rooms(name, block), equipment(name, block), profiles(full_name)`)
    .gte("reservation_date", weekStartIso)
    .lte("reservation_date", weekEndIso)
    .order("start_time", { ascending: true });

  const rows = error ? [] : ((data ?? []) as unknown as ReservationRow[]);
  const activeKind = params.tipo === "room" || params.tipo === "equipment" ? params.tipo : "";
  const activeBlock = params.bloco ?? "";
  
  const blocks = Array.from(new Set(rows.map(resourceBlock).filter((b): b is string => Boolean(b)))).sort();
  const filtered = rows.filter((r) => {
    if (activeKind && r.resource_kind !== activeKind) return false;
    if (activeBlock && resourceBlock(r) !== activeBlock) return false;
    return true;
  });

  const events = reservationsToEvents(filtered, weekIsos);

  return <div className="p-4">Dados processados: {events.length} eventos encontrados.</div>;
}