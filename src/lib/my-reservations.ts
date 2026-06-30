/**
 * Lógica pura de "Minhas Reservas" (EP-07 — F-16/F-17/F-18/F-19/F-20 · RF-007).
 * Sem dependências de framework nem de Supabase, para ser testável com
 * `node:test` e reutilizável tanto no Server Component quanto no client.
 *
 * Datas em `YYYY-MM-DD` (UTC, igual a `calendar.ts`/`reservation.ts`) e horas
 * em `HH:MM[:SS]`. A filtragem combina em AND (CA06 de F-16).
 */
import type { Enums } from "@/lib/supabase/database.types";
import { formatTime, toIso, todayUtc, addDays } from "@/lib/calendar";

export type ReservationStatus = Enums<"reservation_status">; // pending|approved|rejected|cancelled
export type ResourceKind = Enums<"resource_kind">; // room|equipment

/** A partir de quantos itens a lista pagina (F-16 CA09). */
export const PAGE_SIZE = 50;

/** Linha de reserva com nomes de recurso resolvidos via join (lista). */
export interface MyReservationRow {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  resource_kind: ResourceKind;
  purpose: string | null;
  recurrence_type: Enums<"recurrence_type">;
  room_id: string | null;
  equipment_id: string | null;
  rooms: { name: string; block: string | null; type: string } | null;
  equipment: { name: string; block: string | null; type: string } | null;
}

/** Nome do recurso (sala ou equipamento) com fallback seguro. */
export function resourceName(row: {
  rooms: { name: string } | null;
  equipment: { name: string } | null;
}): string {
  return row.rooms?.name ?? row.equipment?.name ?? "Recurso indisponível";
}

/** Ícone Material Symbol por tipo de recurso (sala/lab/auditório/equipamento). */
export function resourceIcon(row: {
  resource_kind: ResourceKind;
  rooms: { type: string } | null;
}): string {
  if (row.resource_kind === "equipment") return "videocam";
  switch (row.rooms?.type) {
    case "laboratorio":
      return "computer";
    case "auditorio":
      return "groups";
    default:
      return "meeting_room";
  }
}

// ─────────────────────────── Status (badge cor + texto) ─────────────────────

export interface StatusMeta {
  /** Rótulo exibido no badge (cor + TEXTO — nunca só cor, a11y). */
  label: string;
  /** Classes Tailwind (token M3) do badge. */
  badgeClass: string;
  /** Material Symbol do badge/timeline. */
  icon: string;
}

/**
 * Metadados visuais de cada status (F-16 CA07). Sempre cor + texto (WCAG 1.4.1):
 * o texto carrega a informação, a cor apenas reforça.
 */
export const STATUS_META: Record<ReservationStatus, StatusMeta> = {
  pending: {
    label: "Aguardando aprovação",
    badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    icon: "schedule",
  },
  approved: {
    label: "Aprovada",
    badgeClass: "bg-secondary-container text-on-secondary-container",
    icon: "check_circle",
  },
  rejected: {
    label: "Recusada",
    badgeClass: "bg-error-container text-on-error-container",
    icon: "cancel",
  },
  cancelled: {
    label: "Cancelada",
    badgeClass: "bg-surface-container-high text-on-surface",
    icon: "block",
  },
};

/**
 * Metadados do rótulo DERIVADO "Concluída" (ADR-006, opção 1 — derivar em
 * runtime). Não é um valor do enum: o dado segue `approved`; isto é só
 * apresentação. Verde-secundário com check, distinto de "Aprovada".
 */
export const COMPLETED_META: StatusMeta = {
  label: "Concluída",
  badgeClass: "bg-surface-container-high text-on-surface-variant",
  icon: "task_alt",
};

/**
 * Uma reserva está "Concluída" (derivado) quando está `approved` E seu término
 * (data + `end_time`) já passou em relação a `now` (ADR-006). É só rótulo: o
 * status persistido continua `approved` e os filtros/agrupamentos não mudam.
 */
export function isCompleted(
  row: Pick<MyReservationRow, "status" | "reservation_date" | "end_time">,
  now: Date = new Date(),
): boolean {
  if (row.status !== "approved") return false;
  const time = row.end_time.length === 5 ? `${row.end_time}:00` : row.end_time;
  const end = new Date(`${row.reservation_date}T${time}Z`);
  return end.getTime() <= now.getTime();
}

/**
 * Metadados de exibição do status: igual a `STATUS_META[status]`, mas troca para
 * "Concluída" quando a reserva aprovada já terminou (ADR-006). Use SEMPRE este
 * helper na UI no lugar de `STATUS_META[row.status]` para o badge.
 */
export function displayStatus(
  row: Pick<MyReservationRow, "status" | "reservation_date" | "end_time">,
  now: Date = new Date(),
): StatusMeta {
  return isCompleted(row, now) ? COMPLETED_META : STATUS_META[row.status];
}

/** Os 4 status filtráveis em chips, na ordem do mockup (F-16 CA03). */
export const STATUS_FILTERS: { value: ReservationStatus; label: string }[] = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovadas" },
  { value: "rejected", label: "Recusadas" },
  { value: "cancelled", label: "Canceladas" },
];

// ─────────────────────────── Filtros (URL state) ────────────────────────────

export type PeriodFilter = "all" | "next7" | "month";

export interface ReservationFilters {
  /** Status selecionados (vazio = todos) — seleção múltipla (CA03). */
  statuses: ReservationStatus[];
  /** Tipo de recurso da aba Todas/Salas/Equipamentos. */
  kind: ResourceKind | "all";
  /** Período (CA04). */
  period: PeriodFilter;
  /** Busca textual por nome de sala/recurso (CA05). */
  query: string;
}

export const EMPTY_FILTERS: ReservationFilters = {
  statuses: [],
  kind: "all",
  period: "all",
  query: "",
};

function isStatus(v: string): v is ReservationStatus {
  return (
    v === "pending" || v === "approved" || v === "rejected" || v === "cancelled"
  );
}

/** Lê os filtros a partir dos search params da URL (estado na URL — F-06). */
export function parseFilters(params: {
  status?: string;
  tipo?: string;
  periodo?: string;
  q?: string;
}): ReservationFilters {
  const statuses = (params.status ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isStatus);
  const kind: ResourceKind | "all" =
    params.tipo === "room" || params.tipo === "equipment" ? params.tipo : "all";
  const period: PeriodFilter =
    params.periodo === "next7" || params.periodo === "month"
      ? params.periodo
      : "all";
  return { statuses, kind, period, query: (params.q ?? "").trim() };
}

/** Intervalo [from,to] ISO do período escolhido (ou null para "all"). */
export function periodRange(
  period: PeriodFilter,
  now: Date = new Date(),
): { from: string; to: string } | null {
  const today = todayUtc(now);
  if (period === "next7") {
    return { from: toIso(today), to: toIso(addDays(today, 7)) };
  }
  if (period === "month") {
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const last = new Date(Date.UTC(y, m + 1, 0));
    return { from: toIso(first), to: toIso(last) };
  }
  return null;
}

/**
 * Aplica os filtros COMBINADOS em AND (F-16 CA03/CA04/CA05/CA06) sobre as
 * reservas já carregadas. A busca é case/acento-insensível por nome de recurso.
 */
export function applyFilters(
  rows: MyReservationRow[],
  filters: ReservationFilters,
  now: Date = new Date(),
): MyReservationRow[] {
  const range = periodRange(filters.period, now);
  const needle = normalize(filters.query);

  return rows.filter((r) => {
    if (filters.kind !== "all" && r.resource_kind !== filters.kind)
      return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(r.status))
      return false;
    if (
      range &&
      (r.reservation_date < range.from || r.reservation_date > range.to)
    )
      return false;
    if (needle && !normalize(resourceName(r)).includes(needle)) return false;
    return true;
  });
}

/** Remove acentos e baixa caixa para busca tolerante (CA05). */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// ─────────────────────────── Ordenação + agrupamento ────────────────────────

/**
 * Ordena por data DESC e, em empate, por horário inicial DESC (F-16 CA02 —
 * "mais recentes primeiro").
 */
export function sortByDateDesc(rows: MyReservationRow[]): MyReservationRow[] {
  return [...rows].sort((a, b) => {
    if (a.reservation_date !== b.reservation_date)
      return a.reservation_date < b.reservation_date ? 1 : -1;
    return a.start_time < b.start_time ? 1 : -1;
  });
}

export interface GroupedReservations {
  upcoming: MyReservationRow[];
  past: MyReservationRow[];
}

/**
 * Separa em "Próximas" (data ≥ hoje) e "Anteriores" (data < hoje), como o
 * mockup 06. Reservas canceladas/recusadas com data futura ainda aparecem em
 * Próximas (são histórico de uma data que não chegou); o status as distingue.
 */
export function groupByWhen(
  rows: MyReservationRow[],
  now: Date = new Date(),
): GroupedReservations {
  const today = toIso(todayUtc(now));
  const upcoming: MyReservationRow[] = [];
  const past: MyReservationRow[] = [];
  for (const r of rows) {
    if (r.reservation_date >= today) upcoming.push(r);
    else past.push(r);
  }
  return { upcoming, past };
}

// ─────────────────────────── Datas legíveis (pt-BR) ─────────────────────────

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

/** `Seg, 15/01` a partir de `YYYY-MM-DD` (UTC, sem fuso). */
export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const wd = WEEKDAY_SHORT[d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${wd}, ${dd}/${mm}`;
}

/** `Segunda, 15/01/2025` (cabeçalho do detalhe). */
export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const wd = WEEKDAY_LONG[d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${wd}, ${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** `14:00 – 16:00` a partir de dois `HH:MM:SS`. */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** `12/01/2025 · 16:40` a partir de um timestamp ISO completo. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${mi}`;
}

// ─────────────────────────── Exportação CSV (F-20) ──────────────────────────

/** BOM UTF-8 para o Excel reconhecer a acentuação (F-20 CA03). */
export const CSV_BOM = "﻿";

/** Escapa um campo CSV (aspas duplicadas, e aspas quando há separador/quebra). */
export function escapeCsvField(value: string): string {
  const needsQuote = /[";\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

/**
 * Gera o conteúdo CSV das reservas ATUALMENTE FILTRADAS (F-20 CA01/CA02).
 * Colunas: Data, Início, Fim, Sala/Recurso, Status, Justificativa. Separador
 * `;` (padrão pt-BR do Excel). Prefixa BOM (CA03). NÃO inclui linha de cabeçalho
 * se a lista estiver vazia — o chamador deve checar `rows.length` antes (CA04).
 */
export function buildCsv(rows: MyReservationRow[]): string {
  const header = [
    "Data",
    "Início",
    "Fim",
    "Recurso",
    "Status",
    "Justificativa",
  ];
  const lines = [header.map(escapeCsvField).join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.reservation_date,
        formatTime(r.start_time),
        formatTime(r.end_time),
        resourceName(r),
        STATUS_META[r.status].label,
        r.purpose ?? "",
      ]
        .map((c) => escapeCsvField(String(c)))
        .join(";"),
    );
  }
  return CSV_BOM + lines.join("\r\n");
}

/** Nome do arquivo CSV com a data de hoje (ex.: `minhas-reservas-2026-06-13.csv`). */
export function csvFileName(now: Date = new Date()): string {
  return `minhas-reservas-${toIso(todayUtc(now))}.csv`;
}
