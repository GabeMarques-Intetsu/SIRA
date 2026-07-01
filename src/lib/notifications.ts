/**
 * Lógica pura da Central de Notificações (EP-11 — F-34/F-35/F-36 · RF-011).
 * Sem dependências de framework nem de Supabase, para ser testável com
 * `node:test` e reutilizável tanto no Server Component quanto nos client islands.
 *
 * Datas/horários chegam como timestamp ISO completo (`created_at`). O
 * agrupamento (Hoje / Esta semana / Anteriores) e a ordenação reversa (mais
 * recentes primeiro — F-34 CA02) acontecem aqui.
 */

/** Linha de notificação tal como vem de `notifications` (RLS já filtra o dono). */
export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_reservation_id: string | null;
  created_at: string;
}

// ─────────────────────────── Tipo → ícone + cor (M3) ────────────────────────

export interface NotificationTypeMeta {
  /** Material Symbol (sem emoji — RNF design system M3). */
  icon: string;
  /** Classe do avatar circular do ícone (token M3). */
  iconClass: string;
  /** Cor da borda lateral de destaque (faixa esquerda do card). */
  accentClass: string;
  /** Rótulo curto do tipo (chips de filtro / leitor de tela). */
  label: string;
}

/**
 * Metadados visuais por tipo de notificação (F-34 CA03/CA04). O `type` da tabela
 * é texto livre; mapeamos as famílias semânticas que o sistema emite e caímos
 * num default seguro para tipos desconhecidos. A informação NUNCA depende só da
 * cor — o ícone + o título carregam o significado (WCAG 1.4.1).
 */
export const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  reservation_approved: {
    icon: "check_circle",
    iconClass: "bg-primary-fixed text-on-primary-fixed-variant",
    accentClass: "border-primary",
    label: "Aprovação",
  },
  reservation_rejected: {
    icon: "cancel",
    iconClass: "bg-error-container text-on-error-container",
    accentClass: "border-error",
    label: "Recusa",
  },
  reservation_cancelled: {
    icon: "event_busy",
    iconClass: "bg-surface-container-high text-on-surface-variant",
    accentClass: "border-outline",
    label: "Cancelamento",
  },
  reservation_pending: {
    icon: "pending_actions",
    iconClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    accentClass: "border-tertiary",
    label: "Aprovação",
  },
  reservation_reminder: {
    icon: "schedule",
    iconClass: "bg-secondary-container text-on-secondary-container",
    accentClass: "border-secondary",
    label: "Lembrete",
  },
  signup_pending: {
    icon: "person_add",
    iconClass: "bg-secondary-container text-on-secondary-container",
    accentClass: "border-secondary",
    label: "Sistema",
  },
  account_approved: {
    icon: "how_to_reg",
    iconClass: "bg-primary-fixed text-on-primary-fixed-variant",
    accentClass: "border-primary",
    label: "Cadastro",
  },
  account_rejected: {
    icon: "person_off",
    iconClass: "bg-error-container text-on-error-container",
    accentClass: "border-error",
    label: "Cadastro",
  },
  system: {
    icon: "info",
    iconClass: "bg-surface-container-high text-on-surface-variant",
    accentClass: "border-outline",
    label: "Sistema",
  },
};

/** Default seguro para `type` desconhecido — evita ícone/cor ausentes (CLS). */
export const NOTIFICATION_TYPE_DEFAULT: NotificationTypeMeta = {
  icon: "notifications",
  iconClass: "bg-surface-container-high text-on-surface-variant",
  accentClass: "border-outline",
  label: "Sistema",
};

/** Resolve os metadados visuais de um tipo, com fallback (F-34 CA03). */
export function typeMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_DEFAULT;
}

// ─────────────────────────── Filtro por categoria (chips) ───────────────────

/**
 * Famílias filtráveis no topo (mockup 10). "unread" cruza com `is_read`; as
 * demais agrupam tipos por prefixo/semântica. "all" não filtra.
 */
export type NotificationFilter =
  | "all"
  | "unread"
  | "reservations"
  | "approvals"
  | "system";

export const NOTIFICATION_FILTERS: NotificationFilter[] = [
  "all",
  "unread",
  "reservations",
  "approvals",
  "system",
];

const FILTER_LABELS: Record<NotificationFilter, string> = {
  all: "Todas",
  unread: "Não lidas",
  reservations: "Reservas",
  approvals: "Aprovações",
  system: "Sistema",
};

export function filterLabel(f: NotificationFilter): string {
  return FILTER_LABELS[f];
}

/** Lê o filtro do search param `?filtro=` (estado na URL — F-06). */
export function parseFilter(raw: string | undefined): NotificationFilter {
  return (NOTIFICATION_FILTERS as string[]).includes(raw ?? "")
    ? (raw as NotificationFilter)
    : "all";
}

/** Predicado de pertença de uma notificação a uma categoria de filtro. */
function matchesFilter(
  n: NotificationRow,
  filter: NotificationFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unread":
      return !n.is_read;
    case "reservations":
      return (
        n.type.startsWith("reservation_") || n.related_reservation_id !== null
      );
    case "approvals":
      return n.type === "reservation_pending" || n.type === "signup_pending";
    case "system":
      return n.type === "system" || n.type === "reservation_reminder";
  }
}

/** Aplica o filtro de categoria sobre as notificações (F-34). */
export function applyFilter(
  rows: NotificationRow[],
  filter: NotificationFilter,
): NotificationRow[] {
  return rows.filter((n) => matchesFilter(n, filter));
}

/** Contagem por chip de filtro, para os badges do mockup. */
export function filterCounts(
  rows: NotificationRow[],
): Record<NotificationFilter, number> {
  return {
    all: rows.length,
    unread: rows.filter((n) => !n.is_read).length,
    reservations: applyFilter(rows, "reservations").length,
    approvals: applyFilter(rows, "approvals").length,
    system: applyFilter(rows, "system").length,
  };
}

/** Total de não lidas (badge do header / contador "N novas" — F-34 CA01). */
export function unreadCount(rows: NotificationRow[]): number {
  return rows.filter((n) => !n.is_read).length;
}

// ─────────────────────────── Ordenação + agrupamento ────────────────────────

/** Ordena por `created_at` DESC — mais recentes primeiro (F-34 CA02). */
export function sortByDateDesc(rows: NotificationRow[]): NotificationRow[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export type NotificationGroupKey = "today" | "week" | "earlier";

export interface NotificationGroup {
  key: NotificationGroupKey;
  label: string;
  items: NotificationRow[];
}

const GROUP_LABELS: Record<NotificationGroupKey, string> = {
  today: "Hoje",
  week: "Esta semana",
  earlier: "Anteriores",
};

/** Início do dia local (00:00) de uma data. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Agrupa as notificações em Hoje / Esta semana / Anteriores (mockup 10),
 * preservando a ordenação descendente dentro de cada grupo. "Esta semana"
 * abrange os 7 dias anteriores a hoje (exclusive hoje). Grupos vazios são
 * omitidos pelo chamador.
 */
export function groupByRecency(
  rows: NotificationRow[],
  now: Date = new Date(),
): NotificationGroup[] {
  const todayStart = startOfDay(now).getTime();
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000; // 7 dias incl. hoje

  const today: NotificationRow[] = [];
  const week: NotificationRow[] = [];
  const earlier: NotificationRow[] = [];

  for (const n of sortByDateDesc(rows)) {
    const t = new Date(n.created_at).getTime();
    if (t >= todayStart) today.push(n);
    else if (t >= weekStart) week.push(n);
    else earlier.push(n);
  }

  return (
    [
      { key: "today", label: GROUP_LABELS.today, items: today },
      { key: "week", label: GROUP_LABELS.week, items: week },
      { key: "earlier", label: GROUP_LABELS.earlier, items: earlier },
    ] as NotificationGroup[]
  ).filter((g) => g.items.length > 0);
}

// ─────────────────────────── Tempo relativo (pt-BR) ─────────────────────────

/**
 * Tempo relativo legível em pt-BR ("há 15 min", "há 2 h", "ontem", "13/01").
 * Usado no rodapé de cada item (mockup 10). Para datas antigas (> 6 dias)
 * cai num `dd/mm` absoluto.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const min = Math.floor(diffMs / 60000);

  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;

  const hours = Math.floor(min / 60);
  if (hours < 24 && startOfDay(now).getTime() <= then.getTime()) {
    return `há ${hours} h`;
  }

  const todayStart = startOfDay(now).getTime();
  const dayDiff = Math.floor(
    (todayStart - startOfDay(then).getTime()) / 86400000,
  );
  if (dayDiff === 1) return "ontem";
  if (dayDiff < 7) {
    const WD = [
      "domingo",
      "segunda",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sábado",
    ];
    return WD[then.getDay()];
  }

  const dd = String(then.getDate()).padStart(2, "0");
  const mm = String(then.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
