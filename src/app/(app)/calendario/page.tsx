import { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReservationRow } from "@/lib/calendar-events";

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
  const supabase = await createClient();
  const params = await searchParams;

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `id, reservation_date, start_time, end_time, status, resource_kind, purpose,
       rooms ( name, block ),
       equipment ( name, block ),
       profiles ( full_name )`,
    )
    .order("start_time", { ascending: true });

  const rows = error ? [] : ((data ?? []) as unknown as ReservationRow[]);

  return <div className="p-4">Carregando dados...</div>;
}