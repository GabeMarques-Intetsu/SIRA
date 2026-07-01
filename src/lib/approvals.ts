/**
 * Lógica pura da Fila de Aprovações (EP-08 — F-21/F-22/F-23 · RF-008).
 * Sem dependências de framework nem de Supabase: tipos, formatação, filtros e
 * cálculo dos indicadores (KPIs) ficam aqui, testáveis com `node:test` e
 * reutilizáveis tanto no Server Component quanto nos client islands.
 */
import { formatDateShort, formatTimeRange } from "@/lib/my-reservations";
import type { Database } from "@/lib/supabase/database.types";

type ReservationStatus = Database["public"]["Enums"]["reservation_status"];
type RecurrenceType = Database["public"]["Enums"]["recurrence_type"];

/** Linha da fila: reserva + solicitante (profiles) + recurso (rooms/equipment). */
export interface ApprovalRow {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  resource_kind: Database["public"]["Enums"]["resource_kind"];
  purpose: string | null;
  recurrence_type: RecurrenceType;
  created_at: string;
  user_id: string;
  room_id: string | null;
  equipment_id: string | null;
  /** Join 1:1 — solicitante. */
  profiles: { full_name: string; department: string | null } | null;
  /** Join 1:1 — sala (quando resource_kind === "room"). */
  rooms: { name: string; block: string | null } | null;
  /** Join 1:1 — equipamento (quando resource_kind === "equipment"). */
  equipment: { name: string; block: string | null } | null;
}

// ─────────────────────────── Abas por status ────────────────────────────────

/** Abas do mockup 08 (status). "all" reúne tudo. */
export type ApprovalTab = "pending" | "approved" | "rejected" | "all";

export const APPROVAL_TABS: ApprovalTab[] = [
  "pending",
  "approved",
  "rejected",
  "all",
];

const TAB_LABELS: Record<ApprovalTab, string> = {
  pending: "Pendentes",
  approved: "Aprovadas",
  rejected: "Recusadas",
  all: "Todas",
};

export function tabLabel(tab: ApprovalTab): string {
  return TAB_LABELS[tab];
}

/** Normaliza o parâmetro de URL `?status=` numa aba válida (default pendentes). */
export function parseTab(raw: string | undefined): ApprovalTab {
  return APPROVAL_TABS.includes(raw as ApprovalTab)
    ? (raw as ApprovalTab)
    : "pending";
}

// ─────────────────────────── Badge de status (cor + texto) ──────────────────

export interface StatusBadge {
  label: string;
  /** Token M3 — nunca depende só da cor (WCAG 1.4.1): o texto carrega o sentido. */
  className: string;
}

const STATUS_BADGES: Record<ReservationStatus, StatusBadge> = {
  pending: {
    label: "Pendente",
    className: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  },
  approved: {
    label: "Aprovada",
    className: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  rejected: {
    label: "Recusada",
    className: "bg-error-container text-on-error-container",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-surface-container-high text-on-surface-variant",
  },
};

export function statusBadge(status: ReservationStatus): StatusBadge {
  return STATUS_BADGES[status];
}

// ─────────────────────────── Helpers de apresentação ────────────────────────

/** Nome do recurso (sala ou equipamento), com bloco quando houver. */
export function resourceName(row: ApprovalRow): string {
  const r = row.resource_kind === "room" ? row.rooms : row.equipment;
  if (!r) return "Recurso";
  return r.block ? `${r.name} · ${r.block}` : r.name;
}

/** Data + horário no formato do mockup: "Seg, 15/01" / "14:00 – 16:00". */
export function dateShort(row: ApprovalRow): string {
  return formatDateShort(row.reservation_date);
}
export function timeRange(row: ApprovalRow): string {
  return formatTimeRange(row.start_time, row.end_time);
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Evento único",
  daily: "Diária",
  weekly: "Semanal",
  custom: "Personalizada",
};

export function recurrenceLabel(type: RecurrenceType): string {
  return RECURRENCE_LABELS[type];
}

/** Limite de caracteres do motivo de recusa (servidor e UI usam o mesmo). */
export const REJECT_REASON_MAX = 280;

// ─────────────────────────── Bloqueio de auto-aprovação ─────────────────────

/**
 * Regra (segregação de funções): "outro administrador tem que aceitar; o
 * próprio não pode aceitar a própria solicitação". Como o admin agora também
 * cria reservas (status `pending`, caem na fila), ele NÃO pode aprovar/recusar
 * uma reserva cujo `user_id` seja o dele.
 *
 * Helper PURO, reusado em duas frentes:
 *  - Server Component (`isOwn`): esconde os botões da própria solicitação;
 *  - Server Actions: defesa no servidor (nunca confiar no client) — relê a
 *    reserva e bloqueia se `actorId` for o autor.
 *
 * Defensivo: `actorId` ausente (sem sessão) nunca pode agir.
 */
export function canActOn(
  reservation: { user_id: string },
  actorId: string | null | undefined,
): boolean {
  if (!actorId) return false;
  return reservation.user_id !== actorId;
}

/**
 * Tempo relativo "há 2 min / há 1 h / há 3 d" (mockup 08). Determinístico a
 * partir de `now` para ser testável. Apenas para baixa granularidade — datas
 * antigas caem em "há N d".
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

// ─────────────────────────── Filtro (busca por solicitante/recurso) ─────────

/**
 * Filtro textual (F-21 CA07): casa pelo nome do solicitante OU pelo recurso.
 * Case/acentos: comparação simples lowercased (suficiente para o escopo).
 */
export function applySearch(rows: ApprovalRow[], term: string): ApprovalRow[] {
  const q = term.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const author = r.profiles?.full_name.toLowerCase() ?? "";
    const resource = resourceName(r).toLowerCase();
    return author.includes(q) || resource.includes(q);
  });
}

// ─────────────────────────── Indicadores / KPIs (F-21 CA09/CA10) ────────────

export interface ApprovalKpis {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  /** Tempo médio entre criação e decisão, legível ("2 h 15 min" / "—"). */
  avgDecisionLabel: string;
}

interface DecisionSample {
  created_at: string;
  decided_at: string;
}

/** "2 h 15 min" / "45 min" / "—" a partir de minutos médios. */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return "—";
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} min`;
  return `${h} h ${rest} min`;
}

/**
 * Calcula os KPIs da fila a partir de:
 * - `pendingCount`: total de pendentes (via count head, barato);
 * - `decisionsToday`: eventos de decisão de HOJE (approval_events) p/ os contadores;
 * - `samples`: pares criação→decisão p/ o tempo médio (CA10).
 */
export function computeKpis(input: {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  samples: DecisionSample[];
}): ApprovalKpis {
  const diffs = input.samples
    .map(
      (s) =>
        (new Date(s.decided_at).getTime() - new Date(s.created_at).getTime()) /
        60000,
    )
    .filter((n) => Number.isFinite(n) && n >= 0);

  const avg =
    diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;

  return {
    pending: input.pendingCount,
    approvedToday: input.approvedToday,
    rejectedToday: input.rejectedToday,
    avgDecisionLabel: formatDuration(avg),
  };
}
