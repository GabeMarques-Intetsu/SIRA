/**
 * Mapeamento reserva → evento posicionável na grade semanal (F-13 · CA02/CA03).
 * Funções puras: recebem as linhas já buscadas (com join de room/equipment) e
 * produzem eventos com a faixa horária inicial e a duração em faixas (row-span),
 * para que eventos multi-hora ocupem as células correspondentes.
 */
import type { Enums } from "@/lib/supabase/database.types";
import { FIRST_HOUR, LAST_HOUR, timeToHours } from "@/lib/calendar";

export type ReservationStatus = Enums<"reservation_status">;
export type ResourceKind = Enums<"resource_kind">;

/**
 * Só reservas ATIVAS ocupam a agenda: `pending` (tentativa) e `approved`
 * (confirmada). `rejected`/`cancelled` NÃO aparecem na grade — uma reserva
 * recusada ou cancelada deve SUMIR do calendário, não apenas mudar de cor.
 */
export const CALENDAR_VISIBLE_STATUSES: ReservationStatus[] = [
  "pending",
  "approved",
];

/** Linha de reserva com os nomes do recurso já resolvidos via join. */
export interface ReservationRow {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  resource_kind: ResourceKind;
  purpose: string | null;
  rooms: { name: string; block: string | null } | null;
  equipment: { name: string; block: string | null } | null;
  profiles: { full_name: string } | null;
}

export interface CalendarEvent {
  id: string;
  /** Coluna 0–6 (SEG→DOM). */
  dayIndex: number;
  /** Faixa de início (0 = 07h) já recortada ao intervalo visível. */
  slotIndex: number;
  /** Quantas faixas o evento ocupa (mínimo 1). */
  span: number;
  resourceName: string;
  authorName: string;
  status: ReservationStatus;
  resourceKind: ResourceKind;
  /** `08:00 – 10:00` (horário real da reserva, não recortado). */
  timeLabel: string;
}

/** Nome do recurso da reserva (sala ou equipamento), com fallback seguro. */
export function resourceName(row: ReservationRow): string {
  return row.rooms?.name ?? row.equipment?.name ?? "Recurso indisponível";
}

/** Bloco do recurso (para o filtro de bloco — CA09). */
export function resourceBlock(row: ReservationRow): string | null {
  return row.rooms?.block ?? row.equipment?.block ?? null;
}

/**
 * Converte reservas em eventos posicionados na grade da semana.
 *
 * @param rows     reservas já filtradas pelo RLS (agenda pessoal do usuário)
 * @param weekIsos os 7 ISOs (YYYY-MM-DD) da semana, em ordem SEG→DOM
 *
 * Reservas fora do intervalo visível (07h–19h) são recortadas; as que não
 * tocam nenhuma faixa visível ou não estão na semana são descartadas.
 */
export function reservationsToEvents(
  rows: ReservationRow[],
  weekIsos: string[],
): CalendarEvent[] {
  const dayIndexByIso = new Map(weekIsos.map((iso, i) => [iso, i]));

  return rows.flatMap((row): CalendarEvent[] => {
    // Recusadas/canceladas não ocupam a grade (somem, não recolorem).
    if (!CALENDAR_VISIBLE_STATUSES.includes(row.status)) return [];

    const dayIndex = dayIndexByIso.get(row.reservation_date);
    if (dayIndex === undefined) return [];

    const startHour = timeToHours(row.start_time);
    const endHour = timeToHours(row.end_time);

    // Recorte ao intervalo visível e cálculo da faixa/duração.
    const clampedStart = Math.max(startHour, FIRST_HOUR);
    const clampedEnd = Math.min(endHour, LAST_HOUR);
    if (clampedEnd <= clampedStart) return [];

    const slotIndex = Math.floor(clampedStart - FIRST_HOUR);
    const span = Math.max(1, Math.ceil(clampedEnd - FIRST_HOUR) - slotIndex);

    return [
      {
        id: row.id,
        dayIndex,
        slotIndex,
        span,
        resourceName: resourceName(row),
        authorName: row.profiles?.full_name ?? "—",
        status: row.status,
        resourceKind: row.resource_kind,
        timeLabel: `${row.start_time.slice(0, 5)} – ${row.end_time.slice(0, 5)}`,
      },
    ];
  });
}
