/**
 * Lógica pura da Gestão de Recursos (EP-09 — Salas F-24/F-25/F-26/F-27 ·
 * Equipamentos F-43/F-44/F-45/F-46 · RF-009/RF-013). Sem dependências de
 * framework nem de Supabase: tipos, rótulos, validação de campos, busca/filtro
 * por estado e paginação ficam aqui — testáveis com `node:test` e reutilizáveis
 * tanto no Server Component (lista) quanto nos client islands (formulário/filtros).
 *
 * As validações (`validateRoomInput`/`validateEquipmentInput`) são a fonte da
 * verdade compartilhada client+server: o client usa para UX imediata, a Server
 * Action reusa a MESMA função antes de gravar (nunca confiar só no client).
 */
import type { Database, Tables } from "@/lib/supabase/database.types";

export type EntityStatus = Database["public"]["Enums"]["entity_status"];
export type RoomType = Database["public"]["Enums"]["room_type"];

export type Room = Tables<"rooms">;
export type Equipment = Tables<"equipment">;

/** Tipo de recurso que parametriza a página/aba (Salas vs Equipamentos). */
export type ResourceKind = "room" | "equipment";

// ─────────────────────────── Estados (status) ───────────────────────────────

/** Abas de filtro por estado do mockup 05 ("all" reúne todos). */
export type StatusFilter = "all" | EntityStatus;

export const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "active",
  "inactive",
  "maintenance",
];

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
  maintenance: "Manutenção",
};

export function statusFilterLabel(filter: StatusFilter): string {
  return STATUS_FILTER_LABELS[filter];
}

/** Normaliza o parâmetro de URL `?status=` num filtro válido (default todos). */
export function parseStatusFilter(raw: string | undefined): StatusFilter {
  return STATUS_FILTERS.includes(raw as StatusFilter)
    ? (raw as StatusFilter)
    : "all";
}

interface StatusBadge {
  label: string;
  /** Classes Tailwind (cor + texto — nunca cor isolada, WCAG 1.4.1). */
  className: string;
}

const STATUS_BADGES: Record<EntityStatus, StatusBadge> = {
  active: {
    label: "Ativo",
    className: "bg-secondary-container text-on-secondary-container",
  },
  inactive: {
    label: "Inativo",
    className: "bg-surface-container-high text-on-surface",
  },
  maintenance: {
    label: "Manutenção",
    className: "bg-error-container text-on-error-container",
  },
};

export function statusBadge(status: EntityStatus): StatusBadge {
  return STATUS_BADGES[status];
}

// ─────────────────────────── Tipos de sala ──────────────────────────────────

export const ROOM_TYPES: RoomType[] = ["sala", "laboratorio", "auditorio"];

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  sala: "Sala",
  laboratorio: "Laboratório",
  auditorio: "Auditório",
};

export function roomTypeLabel(type: RoomType): string {
  return ROOM_TYPE_LABELS[type];
}

export function isRoomType(value: string): value is RoomType {
  return (ROOM_TYPES as string[]).includes(value);
}

export function isEntityStatus(value: string): value is EntityStatus {
  return value === "active" || value === "inactive" || value === "maintenance";
}

// ─────────────────────────── Imagem do recurso (F-47/F-48) ──────────────────

/** Nome do bucket público de imagens de recurso (ADR-008). */
export const RESOURCE_IMAGES_BUCKET = "resource-images";

/**
 * URL pública da imagem do recurso a partir do `image_path` guardado na linha
 * (F-47/F-48 CA08). O bucket `resource-images` é público (leitura por URL); a
 * escrita é só admin via service-role. Retorna `null` quando não há imagem —
 * o card/detalhe cai no ícone padrão (IMG08/CA09).
 */
export function resourceImageUrl(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${RESOURCE_IMAGES_BUCKET}/${imagePath}`;
}

// ─────────────────────────── Ícone por tipo (mockup) ────────────────────────

/** Material Symbol ilustrativo do equipamento conforme o tipo (mockup 05). */
export function equipmentIcon(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("projetor")) return "videocam";
  if (t.includes("notebook") || t.includes("laptop")) return "laptop_mac";
  if (t.includes("microfone") || t.includes("mic")) return "mic";
  if (t.includes("câmera") || t.includes("camera")) return "photo_camera";
  if (t.includes("som") || t.includes("caixa") || t.includes("speaker"))
    return "speaker";
  return "deployed_code";
}

// ─────────────────────────── Recursos (chips) ───────────────────────────────

/**
 * Normaliza a coluna `resources` (jsonb) numa lista de strings limpa.
 * Defensivo: a coluna é `Json`, então filtramos o que não for string não-vazia.
 */
export function parseResources(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

// ─────────────────────────── Busca + filtro ─────────────────────────────────

interface WithStatusName {
  name: string;
  status: EntityStatus;
}

/** Filtra por estado (aba) — "all" não filtra (F-25 CA02 · F-44 CA02). */
export function filterByStatus<T extends WithStatusName>(
  rows: T[],
  filter: StatusFilter,
): T[] {
  if (filter === "all") return rows;
  return rows.filter((r) => r.status === filter);
}

/** Busca textual por nome, case/acento-insensível (F-44 CA03). */
export function filterByName<T extends { name: string }>(
  rows: T[],
  query: string,
): T[] {
  const q = normalize(query);
  if (!q) return rows;
  return rows.filter((r) => normalize(r.name).includes(q));
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// ─────────────────────────── Paginação (F-44 CA05) ──────────────────────────

export const PAGE_SIZE = 12;

export interface Pagination<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  /** Faixa exibida 1-based, ex.: "1–12". `from`/`to` são 0 quando vazio. */
  from: number;
  to: number;
}

/** Recorta a página solicitada (clamp em faixa válida) — F-44 CA05. */
export function paginate<T>(rows: T[], page: number): Pagination<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const items = rows.slice(start, start + PAGE_SIZE);
  return {
    items,
    page: current,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + items.length,
  };
}

export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

// ─────────────────────────── Validação de input ─────────────────────────────

export interface RoomInput {
  name: string;
  type: string;
  capacity: number;
  block: string;
  resources: string[];
  status: string;
}

export interface EquipmentInput {
  name: string;
  type: string;
  block: string;
  roomId: string | null;
  status: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  /** Campo → mensagem. Vazio quando válido. */
  errors: Record<string, string>;
  /** Valores saneados (trim etc.) quando `ok`. */
  value: T | null;
}

/**
 * Validação de Sala (F-24 CA02/CA03 · F-26 CA01/CA04). Regras:
 * - nome obrigatório (CA02);
 * - tipo deve ser um RoomType válido (CA02);
 * - capacidade inteiro > 0 (CA03/CA04);
 * - estado deve ser um EntityStatus válido.
 * `block`/`resources` são opcionais (o mockup trata bloco como texto livre).
 */
export function validateRoomInput(raw: RoomInput): ValidationResult<RoomInput> {
  const errors: Record<string, string> = {};
  const name = raw.name.trim();
  if (!name) errors.name = "Informe o nome da sala.";

  if (!isRoomType(raw.type)) errors.type = "Selecione um tipo válido.";

  if (!Number.isInteger(raw.capacity) || raw.capacity <= 0) {
    errors.capacity = "A capacidade deve ser um número maior que zero.";
  }

  if (!isEntityStatus(raw.status)) errors.status = "Estado inválido.";

  const resources = raw.resources
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  if (Object.keys(errors).length > 0) return { ok: false, errors, value: null };
  return {
    ok: true,
    errors,
    value: {
      name,
      type: raw.type,
      capacity: raw.capacity,
      block: raw.block.trim(),
      resources,
      status: raw.status,
    },
  };
}

/**
 * Validação de Equipamento (F-43 CA02/CA03). Regras:
 * - nome obrigatório (CA02);
 * - tipo obrigatório — vocabulário aberto, texto livre (CA02);
 * - estado ∈ {active, inactive, maintenance} (CA03);
 * - vínculo a bloco OU sala obrigatório (CA02): aceita `block` preenchido
 *   e/ou `roomId`. `roomId` vazio vira null.
 */
export function validateEquipmentInput(
  raw: EquipmentInput,
): ValidationResult<EquipmentInput> {
  const errors: Record<string, string> = {};
  const name = raw.name.trim();
  if (!name) errors.name = "Informe o nome do equipamento.";

  const type = raw.type.trim();
  if (!type) errors.type = "Informe o tipo do equipamento.";

  if (!isEntityStatus(raw.status)) errors.status = "Estado inválido.";

  const block = raw.block.trim();
  const roomId = raw.roomId && raw.roomId.trim() ? raw.roomId.trim() : null;
  if (!block && !roomId) {
    errors.block = "Vincule o equipamento a um bloco ou sala.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, value: null };
  return {
    ok: true,
    errors,
    value: { name, type, block, roomId, status: raw.status },
  };
}

/**
 * Detecta nome duplicado case/acento-insensível, ignorando o próprio registro
 * (F-24 CA04 · F-43 CA04 · F-45 CA03). `existing` é a lista atual da coleção.
 */
export function hasDuplicateName(
  existing: { id: string; name: string }[],
  name: string,
  selfId: string | null,
): boolean {
  const target = normalize(name);
  return existing.some((r) => r.id !== selfId && normalize(r.name) === target);
}
