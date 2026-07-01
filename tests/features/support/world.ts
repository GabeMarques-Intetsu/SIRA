/**
 * World + hooks da suíte BDD (Gherkin pt-BR) — SIMULAÇÃO DE DOMÍNIO em memória.
 *
 * ⚠️ NATUREZA DESTE HARNESS
 * Este NÃO é um E2E de browser. É uma simulação determinística do domínio: os
 * passos `Dado` montam o estado aqui no World; os `Quando` chamam a LÓGICA PURA
 * real de `src/lib/*` (mesma que roda em produção, via Server Actions/RPC); os
 * `Então` fazem `assert` sobre o estado resultante.
 *
 * Dois tipos de cenário convivem:
 *  1. DOMÍNIO — testam a regra de verdade chamando `src/lib` (reserva, conflito,
 *     aprovação, notificações, usuários, salas, painel, calendário, validação).
 *  2. UI / SESSÃO / RESPONSIVO / TEMA — não têm função pura equivalente em
 *     `src/lib` (menu por perfil, tela pequena, tema, continuidade de sessão,
 *     endereços das telas). Para estes, modelamos AQUI no World um pequeno
 *     modelo comportamental honesto e determinístico, derivado das specs
 *     (RBAC/menu, navegação, breakpoint, tema persistido). São SPECS
 *     COMPORTAMENTAIS — afirmam a regra de negócio, não o rendering real.
 *
 * Determinismo: nenhuma data "real" aleatória — `NOW` é fixo (igual aos testes
 * unitários: 2026-06-13T12:00:00Z, um sábado). As libs que aceitam `now`
 * recebem este valor.
 */
import { setWorldConstructor, Before, World } from "@cucumber/cucumber";
import type { ReservationStatus } from "@/lib/my-reservations";

/** Relógio fixo de toda a suíte (mesmo dos testes unitários). */
export const NOW = new Date("2026-06-13T12:00:00Z");
/** Hoje em ISO sob `NOW` (2026-06-13). */
export const TODAY_ISO = "2026-06-13";
/** Amanhã em ISO sob `NOW` (2026-06-14). */
export const TOMORROW_ISO = "2026-06-14";

/** Reserva mínima do modelo de domínio do World. */
export interface WorldReservation {
  id: string;
  owner: string; // nome do professor dono
  roomName: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  status: ReservationStatus;
  purpose: string | null;
  /** Histórico de decisão (responsável + data), preenchido ao aprovar/recusar. */
  decisionBy?: string;
  decisionAt?: string;
  decisionReason?: string;
}

/** Sala do modelo de domínio do World. */
export interface WorldRoom {
  id: string;
  name: string;
  capacity: number;
  resources: string[];
  status: "active" | "inactive" | "maintenance";
}

/** Usuário/perfil do modelo do World. */
export interface WorldUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "professor";
  status: "active" | "inactive";
  /** true quando ainda é uma solicitação pendente (não pode logar). */
  pendingSignup?: boolean;
  signupReason?: string;
}

/** Notificação do modelo do World. */
export interface WorldNotification {
  id: string;
  owner: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_reservation_id: string | null;
  created_at: string;
}

/**
 * Hold (reserva temporária) do modelo do World — F-49. Espelha as colunas
 * relevantes de `reservation_holds`: dono, recurso, slot e o instante de
 * expiração (`expiresAt`, calculado por `holdExpiry`). A semântica de bloqueio
 * (vivo + outro usuário + overlap) é aplicada em `_holds.ts`.
 */
export interface WorldHold {
  id: string;
  owner: string; // nome do solicitante
  roomName: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  /** ISO-8601 do `expires_at`. */
  expiresAt: string;
}

let SEQ = 0;
const nextId = (prefix: string) => `${prefix}-${++SEQ}`;

export class SiraWorld extends World {
  // ── Domínio ────────────────────────────────────────────────────────────────
  reservations: WorldReservation[] = [];
  rooms: WorldRoom[] = [];
  users: WorldUser[] = [];
  notifications: WorldNotification[] = [];

  // ── Sessão / contexto atual ─────────────────────────────────────────────────
  currentUser: WorldUser | null = null;
  /** Reserva "em foco" para os cenários de detalhe/quick-reserve/edição. */
  focusReservation: WorldReservation | null = null;
  /** Sala "em foco". */
  focusRoom: WorldRoom | null = null;
  /** Usuário "em foco" (edição/exclusão). */
  focusUser: WorldUser | null = null;

  // ── Resultados de uma ação (lidos pelos `Então`) ─────────────────────────────
  /** Resultado genérico (lista filtrada, payload etc.). */
  results: unknown = null;
  /** Última mensagem exibida (aviso/confirmação/erro). */
  message: string | null = null;
  /** A última ação foi negada por permissão/regra? */
  accessDenied = false;
  /** A última ação foi bem-sucedida? */
  actionOk: boolean | null = null;
  /** Arquivo gerado (CSV) ou null quando nada foi gerado. */
  file: string | null = null;

  // ── Imagem de recurso (F-47/F-48) ───────────────────────────────────────────
  /** Arquivo de imagem "escolhido" no cenário (type/size). */
  imageFile: { type: string; size: number } | null = null;
  /** Caminho de imagem (`image_path`) do recurso em foco, ou null. */
  imagePath: string | null = null;
  /** Resultado da validação de imagem: null = aceita; string = mensagem de erro. */
  imageValidation: string | null = null;
  /** URL pública resolvida (ou null quando não há imagem). */
  imageUrl: string | null = null;

  // ── Reserva temporária / hold (F-49) ─────────────────────────────────────────
  /** Holds do cenário (modelo da tabela reservation_holds). */
  holds: WorldHold[] = [];
  /** Disponibilidade resolvida pela última verificação (lida pelos `Então`). */
  available: boolean | null = null;

  // ── Modelo comportamental de UI / sessão / tema (specs sem lib equivalente) ──
  /** Largura de viewport simulada (px). <768 = "celular". */
  viewportWidth = 1280;
  /** Tema atual e tema persistido entre acessos. */
  theme: "light" | "dark" = "light";
  persistedTheme: "light" | "dark" | null = null;
  /** O carregamento aplicou o tema antes do primeiro paint (sem flash)? */
  themeAppliedBeforePaint = false;
  /** Estado do menu lateral (relevante em tela pequena). */
  menuOpen = false;
  /** Sessão ativa? + se a restauração automática está habilitada. */
  sessionActive = false;
  autoRestore = true;
  /** Histórico de navegação (endereços das telas) + ponteiro atual. */
  navHistory: string[] = [];
  navIndex = -1;
}

setWorldConstructor(SiraWorld);

// Estado limpo antes de cada cenário (o World já é novo por cenário; reforço).
Before(function (this: SiraWorld) {
  SEQ = 0;
  this.reservations = [];
  this.rooms = [];
  this.users = [];
  this.notifications = [];
  this.currentUser = null;
  this.focusReservation = null;
  this.focusRoom = null;
  this.focusUser = null;
  this.results = null;
  this.message = null;
  this.accessDenied = false;
  this.actionOk = null;
  this.file = null;
  this.imageFile = null;
  this.imagePath = null;
  this.imageValidation = null;
  this.imageUrl = null;
  this.holds = [];
  this.available = null;
  this.viewportWidth = 1280;
  this.theme = "light";
  this.persistedTheme = null;
  this.themeAppliedBeforePaint = false;
  this.menuOpen = false;
  this.sessionActive = false;
  this.autoRestore = true;
  this.navHistory = [];
  this.navIndex = -1;
});

// ── Helpers compartilhados (usados pelos steps) ────────────────────────────────

export { nextId };

/** Cria/recupera um usuário pelo nome (idempotente nos `Dado`). */
export function ensureUser(
  world: SiraWorld,
  name: string,
  over: Partial<WorldUser> = {},
): WorldUser {
  let u = world.users.find((x) => x.name === name);
  if (!u) {
    u = {
      id: nextId("user"),
      name,
      email:
        over.email ?? `${name.toLowerCase().replace(/\s+/g, ".")}@ifpb.edu.br`,
      role: over.role ?? "professor",
      status: over.status ?? "active",
      ...over,
    };
    world.users.push(u);
  } else {
    Object.assign(u, over);
  }
  return u;
}

/** Cria/recupera uma sala pelo nome. */
export function ensureRoom(
  world: SiraWorld,
  name: string,
  over: Partial<WorldRoom> = {},
): WorldRoom {
  let r = world.rooms.find((x) => x.name === name);
  if (!r) {
    r = {
      id: nextId("room"),
      name,
      capacity: over.capacity ?? 20,
      resources: over.resources ?? [],
      status: over.status ?? "active",
      ...over,
    };
    world.rooms.push(r);
  } else {
    Object.assign(r, over);
  }
  return r;
}

/** Adiciona uma reserva ao modelo. */
export function addReservation(
  world: SiraWorld,
  over: Partial<WorldReservation> & { owner: string; roomName: string },
): WorldReservation {
  const r: WorldReservation = {
    id: over.id ?? nextId("res"),
    owner: over.owner,
    roomName: over.roomName,
    date: over.date ?? TOMORROW_ISO,
    start: over.start ?? "14:00",
    end: over.end ?? "16:00",
    status: over.status ?? "pending",
    purpose: over.purpose ?? null,
    decisionBy: over.decisionBy,
    decisionAt: over.decisionAt,
    decisionReason: over.decisionReason,
  };
  world.reservations.push(r);
  return r;
}

/** Adiciona uma notificação ao modelo. */
export function addNotification(
  world: SiraWorld,
  over: Partial<WorldNotification> & { owner: string },
): WorldNotification {
  const n: WorldNotification = {
    id: over.id ?? nextId("notif"),
    owner: over.owner,
    type: over.type ?? "system",
    title: over.title ?? "Aviso",
    message: over.message ?? "",
    is_read: over.is_read ?? false,
    related_reservation_id: over.related_reservation_id ?? null,
    created_at: over.created_at ?? `${TODAY_ISO}T10:00:00Z`,
  };
  world.notifications.push(n);
  return n;
}
