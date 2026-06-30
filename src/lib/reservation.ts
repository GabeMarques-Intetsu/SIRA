/**
 * Lógica pura da Nova Reserva (F-14 / RF-006) — sem dependências de framework
 * nem de Supabase, para ser testável com `node:test` e reutilizável no servidor.
 *
 * Datas em `YYYY-MM-DD` e horas em `HH:MM`. Toda a aritmética de datas é feita
 * em UTC (igual a `calendar.ts`) para evitar deslocamentos de fuso que jogariam
 * uma ocorrência para o dia errado.
 */
import type { Enums } from "@/lib/supabase/database.types";

export type RecurrenceType = Enums<"recurrence_type">; // none | daily | weekly | custom
export type ResourceKind = Enums<"resource_kind">; // room | equipment

/** Limite de ocorrências geradas por uma recorrência (anti-abuso / sanidade). */
export const MAX_OCCURRENCES = 60;

/** Constrói uma Date UTC a partir de `YYYY-MM-DD` (ou null se malformada). */
export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(mo) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

/** Formata uma Date UTC como `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Hoje à meia-noite UTC. */
export function todayIso(now: Date = new Date()): string {
  return toIsoDate(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ),
  );
}

/** `HH:MM` válido? (00:00–23:59) */
export function isValidTime(time: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

/** Converte `HH:MM` em minutos desde 00:00 (para comparação de intervalos). */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export interface SlotInput {
  date: string;
  start: string;
  end: string;
}

export type SlotError =
  | "date-required"
  | "date-invalid"
  | "date-past" // CA03
  | "time-required"
  | "time-invalid"
  | "time-order"; // CA02

/**
 * Valida o "quando" (CA02 início < fim; CA03 data ≥ hoje).
 * Retorna `null` quando válido, ou o primeiro erro encontrado.
 */
export function validateSlot(
  slot: SlotInput,
  now: Date = new Date(),
): SlotError | null {
  if (!slot.date) return "date-required";
  if (!parseIsoDate(slot.date)) return "date-invalid";
  if (slot.date < todayIso(now)) return "date-past"; // CA03

  if (!slot.start || !slot.end) return "time-required";
  if (!isValidTime(slot.start) || !isValidTime(slot.end)) return "time-invalid";
  if (timeToMinutes(slot.start) >= timeToMinutes(slot.end)) return "time-order"; // CA02

  return null;
}

/** Mensagem em pt-BR para cada erro de slot (exibida com role="alert"). */
export const SLOT_ERROR_MESSAGE: Record<SlotError, string> = {
  "date-required": "Informe a data da reserva.",
  "date-invalid": "Data inválida.",
  "date-past": "A data deve ser igual ou posterior a hoje.", // CA03
  "time-required": "Informe os horários de início e fim.",
  "time-invalid": "Horário inválido.",
  "time-order": "O horário de início deve ser anterior ao de fim.", // CA02
};

export interface RecurrenceInput {
  type: RecurrenceType;
  /** Data inicial `YYYY-MM-DD`. */
  startDate: string;
  /**
   * Número de ocorrências para diária/semanal (inclui a primeira). Padrão 1.
   * Para `custom`, é o nº de semanas varridas a partir da data inicial.
   */
  count?: number;
  /**
   * Dias da semana (0=Dom … 6=Sáb) para `custom`. Cada semana coberta gera
   * uma ocorrência por dia marcado que caia em data ≥ inicial.
   */
  weekdays?: number[];
}

/**
 * Expande a recorrência em uma lista ordenada e deduplicada de datas ISO.
 * - `none`: [startDate]
 * - `daily`: startDate, +1d, +2d… (count ocorrências)
 * - `weekly`: startDate, +7d, +14d… (count ocorrências)
 * - `custom`: para cada uma das `count` semanas, os `weekdays` marcados
 *
 * O resultado é truncado em {@link MAX_OCCURRENCES}. Datas anteriores à inicial
 * nunca entram (relevante no `custom`, onde um weekday pode cair antes).
 */
export function expandReservationDates(input: RecurrenceInput): string[] {
  const base = parseIsoDate(input.startDate);
  if (!base) return [];
  const count = Math.max(1, Math.min(input.count ?? 1, MAX_OCCURRENCES));

  const out: string[] = [];
  const push = (d: Date) => {
    const iso = toIsoDate(d);
    if (iso >= input.startDate && !out.includes(iso)) out.push(iso);
  };

  switch (input.type) {
    case "none":
      push(base);
      break;
    case "daily":
      for (let i = 0; i < count; i++) push(addUtcDays(base, i));
      break;
    case "weekly":
      for (let i = 0; i < count; i++) push(addUtcDays(base, i * 7));
      break;
    case "custom": {
      const weekdays = (input.weekdays ?? []).slice().sort((a, b) => a - b);
      if (weekdays.length === 0) {
        push(base); // sem dias marcados, comporta-se como única
        break;
      }
      // Varre `count` semanas a partir da segunda-feira da semana inicial.
      const weekStart = startOfUtcWeek(base);
      for (let w = 0; w < count; w++) {
        for (const wd of weekdays) {
          // 0=Dom mapeado para offset relativo à segunda-feira (SEG=0…DOM=6).
          const offset = (wd + 6) % 7;
          push(addUtcDays(weekStart, w * 7 + offset));
        }
      }
      break;
    }
  }

  return out.sort().slice(0, MAX_OCCURRENCES);
}

function addUtcDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setUTCDate(date.getUTCDate() + days);
  return r;
}

/** Segunda-feira (UTC) da semana que contém `date`. */
function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day;
  return addUtcDays(date, diff);
}

/**
 * Predicado puro de sobreposição de intervalos de horário (CA09 — conflito
 * parcial elimina): dois intervalos `[aStart,aEnd)` e `[bStart,bEnd)` colidem
 * sse `aStart < bEnd && aEnd > bStart`. Reutilizável pelo motor de conflito.
 */
export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart)
  );
}
