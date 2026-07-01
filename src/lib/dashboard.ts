/**
 * Lógica pura do Painel administrativo (EP-04 — F-12 · RF-004).
 * Sem dependências de framework nem de Supabase, para ser testável com
 * `node:test` e reutilizável no Server Component e no client island do filtro.
 *
 * Datas em `YYYY-MM-DD` (UTC, igual a `calendar.ts`/`my-reservations.ts`).
 * Toda agregação é feita aqui sobre conjuntos JÁ limitados pelo período
 * (CA08), evitando trazer linhas desnecessárias do banco (RNF-desempenho).
 */
import type { Enums } from "@/lib/supabase/database.types";
import { addDays, toIso, todayUtc } from "@/lib/calendar";

export type ReservationStatus = Enums<"reservation_status">;
export type ApprovalAction = Enums<"approval_action">;

// ─────────────────────────── Filtro de período (CA07) ───────────────────────

export type PeriodKey = "today" | "week" | "month";

export interface Period {
  key: PeriodKey;
  /** Rótulo curto p/ o seletor. */
  label: string;
  /** Rótulo descritivo p/ o gráfico/cabeçalho. */
  longLabel: string;
  /** Início (inclusivo) em ISO YYYY-MM-DD. */
  startIso: string;
  /** Fim (inclusivo) em ISO YYYY-MM-DD. */
  endIso: string;
}

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "week", label: "Esta semana" },
  { key: "month", label: "Este mês" },
];

/** Normaliza o parâmetro `?periodo=` da URL para uma chave válida (default week). */
export function parsePeriodKey(raw: string | undefined): PeriodKey {
  if (raw === "today" || raw === "week" || raw === "month") return raw;
  return "week";
}

/**
 * Resolve o intervalo [start, end] (inclusivo) do período a partir de hoje.
 * - today: só o dia de hoje;
 * - week: segunda → domingo da semana corrente (igual à âncora do calendário);
 * - month: dia 1 → último dia do mês corrente.
 */
export function resolvePeriod(
  key: PeriodKey,
  today: Date = todayUtc(),
): Period {
  if (key === "today") {
    const iso = toIso(today);
    return {
      key,
      label: "Hoje",
      longLabel: "Hoje",
      startIso: iso,
      endIso: iso,
    };
  }
  if (key === "month") {
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0)); // dia 0 do mês seguinte = último deste
    return {
      key,
      label: "Este mês",
      longLabel: "Este mês",
      startIso: toIso(start),
      endIso: toIso(end),
    };
  }
  // week (default): segunda da semana corrente → +6
  const dow = today.getUTCDay(); // 0=domingo
  const deltaToMonday = dow === 0 ? -6 : 1 - dow;
  const start = addDays(today, deltaToMonday);
  const end = addDays(start, 6);
  return {
    key: "week",
    label: "Esta semana",
    longLabel: "Esta semana",
    startIso: toIso(start),
    endIso: toIso(end),
  };
}

// ─────────────────────────── KPIs (CA02) ────────────────────────────────────

export interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export const EMPTY_STATUS_COUNTS: StatusCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0,
};

/** Total de reservas do período (todos os status). */
export function totalReservations(counts: StatusCounts): number {
  return counts.pending + counts.approved + counts.rejected + counts.cancelled;
}

/**
 * Taxa de aprovação = aprovadas / (aprovadas + recusadas), em % inteira.
 * Pendentes/canceladas não entram no denominador (ainda não decididas).
 * Sem decisões → null (renderiza "—", CA04).
 */
export function approvalRate(counts: StatusCounts): number | null {
  const decided = counts.approved + counts.rejected;
  if (decided === 0) return null;
  return Math.round((counts.approved / decided) * 100);
}

// ─────────────────────── Ocupação por dia (CA05/CA06) ───────────────────────

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface OccupancyBar {
  /** ISO do dia. */
  iso: string;
  /** Rótulo curto (Seg, Ter…). */
  label: string;
  /** Nº de reservas aprovadas no dia. */
  count: number;
  /** Altura relativa 0–100 (count / pico do período). */
  heightPct: number;
  /** Fim de semana? (cor distinta no gráfico). */
  weekend: boolean;
}

interface DatedRow {
  reservation_date: string;
  status: ReservationStatus;
}

/**
 * Série de ocupação por dia do período, derivada das reservas APROVADAS
 * (ocupação efetiva). Limita-se aos primeiros `maxBars` dias para não explodir
 * o eixo X em períodos longos (mês → mostra os primeiros 31 dias do range).
 * Alturas são normalizadas pelo pico para o gráfico CSS (sem lib).
 */
export function occupancyByDay(
  rows: DatedRow[],
  period: Period,
  maxBars = 31,
): OccupancyBar[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.status !== "approved") continue;
    counts.set(r.reservation_date, (counts.get(r.reservation_date) ?? 0) + 1);
  }

  const start = isoToUtc(period.startIso);
  const end = isoToUtc(period.endIso);
  const days: { iso: string; count: number; weekend: boolean }[] = [];
  for (
    let d = start;
    d.getTime() <= end.getTime() && days.length < maxBars;
    d = addDays(d, 1)
  ) {
    const iso = toIso(d);
    const dow = d.getUTCDay();
    days.push({
      iso,
      count: counts.get(iso) ?? 0,
      weekend: dow === 0 || dow === 6,
    });
  }

  const peak = days.reduce((max, d) => Math.max(max, d.count), 0);
  return days.map((d) => ({
    iso: d.iso,
    label: labelForIso(d.iso),
    count: d.count,
    heightPct: peak === 0 ? 0 : Math.round((d.count / peak) * 100),
    weekend: d.weekend,
  }));
}

/** Alternativa textual do gráfico p/ leitores de tela (CA06). */
export function occupancyAriaLabel(bars: OccupancyBar[]): string {
  if (bars.length === 0) return "Sem dados de ocupação no período.";
  const parts = bars.map((b) => `${b.label} ${b.count}`);
  return `Ocupação por dia (reservas aprovadas): ${parts.join(", ")}.`;
}

// ─────────────────────── Salas mais ocupadas (CA02) ─────────────────────────

export interface RoomRanking {
  name: string;
  count: number;
  /** Largura relativa 0–100 da barra (count / líder). */
  widthPct: number;
}

interface RoomRow {
  status: ReservationStatus;
  rooms: { name: string } | null;
}

/**
 * Top-N salas por reservas aprovadas no período. Equipamentos e linhas sem
 * sala resolvida são ignorados. Ordena desc por contagem.
 */
export function topRooms(rows: RoomRow[], limit = 5): RoomRanking[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.status !== "approved") continue;
    const name = r.rooms?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const leader = ranked[0]?.count ?? 0;
  return ranked.map((r) => ({
    ...r,
    widthPct: leader === 0 ? 0 : Math.round((r.count / leader) * 100),
  }));
}

// ─────────────────────── Atividade recente (CA09/CA10) ──────────────────────

export interface ActivityEntry {
  id: string;
  /** ISO datetime do evento. */
  at: string;
  /** "há 2 min" / "há 1 h" / "ontem" … */
  relative: string;
  who: string;
  action: ApprovalAction;
  actionLabel: string;
  resource: string;
  /** Texto + cor do badge (status resultante). */
  badgeLabel: string;
  badgeClass: string;
}

interface ApprovalEventRow {
  id: string;
  created_at: string;
  action: ApprovalAction;
  actor: { full_name: string } | null;
  reservation: {
    rooms: { name: string } | null;
    equipment: { name: string } | null;
  } | null;
}

const ACTION_META: Record<
  ApprovalAction,
  { label: string; badgeLabel: string; badgeClass: string }
> = {
  submitted: {
    label: "Solicitou reserva",
    badgeLabel: "Pendente",
    badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  },
  approved: {
    label: "Aprovou reserva",
    badgeLabel: "Aprovada",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },
  rejected: {
    label: "Recusou reserva",
    badgeLabel: "Recusada",
    badgeClass: "bg-error-container text-on-error-container",
  },
};

/** Mapeia eventos de aprovação → linhas da tabela de atividade recente. */
export function toActivity(
  rows: ApprovalEventRow[],
  now: Date = new Date(),
): ActivityEntry[] {
  return rows.map((r) => {
    const meta = ACTION_META[r.action];
    const resource =
      r.reservation?.rooms?.name ??
      r.reservation?.equipment?.name ??
      "Recurso indisponível";
    return {
      id: r.id,
      at: r.created_at,
      relative: relativeTime(r.created_at, now),
      who: r.actor?.full_name ?? "Usuário do sistema",
      action: r.action,
      actionLabel: meta.label,
      resource,
      badgeLabel: meta.badgeLabel,
      badgeClass: meta.badgeClass,
    };
  });
}

/** "há 2 min", "há 3 h", "ontem", "12/06" — pt-BR, sem libs (CA09). */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = now.getTime() - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ─────────────────────────── helpers internos ───────────────────────────────

function isoToUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function labelForIso(iso: string): string {
  return WEEKDAY_LABELS[isoToUtc(iso).getUTCDay()];
}
