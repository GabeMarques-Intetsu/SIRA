/**
 * Lógica pura da Gestão de Usuários (EP-10 — F-28/F-29/F-30/F-31 ·
 * Solicitações F-32/F-33 · RF-010). Sem dependências de framework nem de
 * Supabase: tipos, rótulos, badges (papel/status), normalização dos parâmetros
 * de URL (aba/perfil/busca), busca textual, validação de campos e o GUARDA do
 * último admin ficam aqui — testáveis com `node:test` e reutilizáveis tanto no
 * Server Component (lista) quanto nos client islands (form/filtros/ações).
 *
 * As validações (`validateUserInput`/`validatePasswordReset`) são a fonte da
 * verdade compartilhada client+server: o client usa para UX imediata, a Server
 * Action reusa a MESMA função antes de gravar (nunca confiar só no client).
 */
import type { Database, Tables } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];

export type Profile = Tables<"profiles">;
export type SignupRequest = Tables<"signup_requests">;

/** Comprimento máximo do motivo de recusa (F-33 CA01). */
export const REJECT_REASON_MAX = 280;
/** Senha inicial / redefinição (F-28 CA02 · F-30 CA03). Mínimo Supabase = 6. */
export const PASSWORD_MIN = 8;
/** Acima deste nº de reservas, recomenda-se inativar em vez de excluir (F-31 CA03). */
export const HEAVY_HISTORY_THRESHOLD = 5;

// ─────────────────────────── Abas (mockup 09) ───────────────────────────────

/** Abas do mockup 09: Ativos · Solicitações · Inativos. */
export type UserTab = "active" | "signups" | "inactive";

export const USER_TABS: UserTab[] = ["active", "signups", "inactive"];

const TAB_LABELS: Record<UserTab, string> = {
  active: "Ativos",
  signups: "Solicitações",
  inactive: "Inativos",
};

export function tabLabel(tab: UserTab): string {
  return TAB_LABELS[tab];
}

/** Normaliza o parâmetro de URL `?tab=` numa aba válida (default Ativos). */
export function parseTab(raw: string | undefined): UserTab {
  return USER_TABS.includes(raw as UserTab) ? (raw as UserTab) : "active";
}

// ─────────────────────────── Filtro por perfil ──────────────────────────────

/** Filtro por perfil do mockup 09 ("all" reúne todos). */
export type RoleFilter = "all" | UserRole;

export const ROLE_FILTERS: RoleFilter[] = ["all", "admin", "professor"];

/** Normaliza o parâmetro de URL `?role=` num filtro válido (default todos). */
export function parseRoleFilter(raw: string | undefined): RoleFilter {
  return ROLE_FILTERS.includes(raw as RoleFilter) ? (raw as RoleFilter) : "all";
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  professor: "Professor",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

interface Badge {
  label: string;
  /** Classes Tailwind (cor + TEXTO — nunca cor isolada, WCAG 1.4.1). */
  className: string;
}

/** Badge de perfil — cor reforçada por rótulo textual (F-29 CA01 · WCAG 1.4.1). */
export function roleBadge(role: UserRole): Badge {
  return role === "admin"
    ? {
        label: "Administrador",
        className: "bg-primary-fixed text-on-primary-fixed-variant",
      }
    : {
        label: "Professor",
        className: "bg-surface-container-high text-on-surface",
      };
}

/** Badge de status — cor + rótulo (nunca só a cor). */
export function statusBadge(status: AccountStatus): Badge {
  return status === "active"
    ? { label: "Ativo", className: "bg-secondary" }
    : { label: "Inativo", className: "bg-outline" };
}

// ─────────────────────────── Busca textual ──────────────────────────────────

/** Normaliza para busca acento/caixa-insensível. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca por nome, e-mail ou matrícula (F-29 CA02). Acento/caixa-insensível.
 * Genérico o bastante para servir tanto a `profiles` quanto a `signup_requests`.
 */
export function matchesQuery(
  user: { full_name: string; email: string; siape_matricula?: string | null },
  query: string,
): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(
    `${user.full_name} ${user.email} ${user.siape_matricula ?? ""}`,
  );
  return haystack.includes(q);
}

export function filterByQuery<
  T extends {
    full_name: string;
    email: string;
    siape_matricula?: string | null;
  },
>(items: T[], query: string): T[] {
  const q = query.trim();
  if (!q) return items;
  return items.filter((u) => matchesQuery(u, q));
}

/** Filtra perfis por papel (F-29 CA03). */
export function filterByRole<T extends { role: UserRole }>(
  items: T[],
  role: RoleFilter,
): T[] {
  if (role === "all") return items;
  return items.filter((u) => u.role === role);
}

// ─────────────────────────── Avatar / iniciais ──────────────────────────────

/** Iniciais p/ o avatar (1ª+última palavra). "Ana Silva" → "AS". */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// ─────────────────────────── Validação (criar/editar) ───────────────────────

export interface UserInput {
  fullName: string;
  /** Só usado na CRIAÇÃO; ignorado na edição (F-30 CA04 — e-mail imutável). */
  email?: string;
  role: string;
  department?: string | null;
  siapeMatricula?: string | null;
  phone?: string | null;
  /** Senha inicial (criar) ou redefinição (editar). Opcional na edição. */
  password?: string | null;
}

export interface ValidUserInput {
  fullName: string;
  email: string;
  role: UserRole;
  department: string | null;
  siapeMatricula: string | null;
  phone: string | null;
  password: string | null;
}

export interface ValidationResult {
  ok: boolean;
  value?: ValidUserInput;
  errors: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: UserRole[] = ["admin", "professor"];

function isRole(v: string): v is UserRole {
  return ROLES.includes(v as UserRole);
}

/**
 * Valida e saneia os campos de um usuário (F-28 CA02 · F-30 CA01).
 * - `requireEmail` true na criação (F-28 CA02); false na edição (e-mail imutável,
 *   F-30 CA04 — então `email` validado só se vier, mas a Action o ignora).
 * - `requirePassword` true na criação (F-28 CA02); false na edição (F-30 CA03 —
 *   senha só muda quando preenchida).
 */
export function validateUserInput(
  input: UserInput,
  opts: { requireEmail: boolean; requirePassword: boolean },
): ValidationResult {
  const errors: Record<string, string> = {};

  const fullName = (input.fullName ?? "").trim();
  if (fullName.length < 2) {
    errors.fullName = "Informe o nome completo.";
  }

  const email = (input.email ?? "").trim().toLowerCase();
  if (opts.requireEmail) {
    if (!email) errors.email = "Informe o e-mail.";
    else if (!EMAIL_RE.test(email)) errors.email = "E-mail inválido.";
  }

  const role = (input.role ?? "").trim();
  if (!role) errors.role = "Selecione o perfil.";
  else if (!isRole(role)) errors.role = "Perfil inválido.";

  // Senha: obrigatória na criação; opcional na edição, mas se vier deve ser
  // forte o bastante (F-28 CA02 · F-30 CA03).
  const rawPassword = (input.password ?? "").trim();
  let password: string | null = null;
  if (opts.requirePassword) {
    if (!rawPassword) errors.password = "Informe a senha inicial.";
    else if (rawPassword.length < PASSWORD_MIN)
      errors.password = `Mínimo de ${PASSWORD_MIN} caracteres.`;
    else password = rawPassword;
  } else if (rawPassword) {
    if (rawPassword.length < PASSWORD_MIN)
      errors.password = `Mínimo de ${PASSWORD_MIN} caracteres.`;
    else password = rawPassword;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: {},
    value: {
      fullName,
      email,
      role: role as UserRole,
      department: (input.department ?? "").trim() || null,
      siapeMatricula: (input.siapeMatricula ?? "").trim() || null,
      phone: (input.phone ?? "").trim() || null,
      password,
    },
  };
}

/** E-mail já cadastrado? (F-28 CA03) — acento/caixa-insensível. */
export function hasDuplicateEmail(
  existing: { id: string; email: string }[],
  email: string,
  ignoreId: string | null,
): boolean {
  const target = normalize(email);
  return existing.some(
    (u) => normalize(u.email) === target && u.id !== ignoreId,
  );
}

// ─────────────────────────── Guarda do último admin ─────────────────────────

/**
 * O alvo é o ÚLTIMO administrador ativo? Bloqueia rebaixar/inativar/excluir o
 * derradeiro admin para nunca deixar o sistema sem quem administre (segurança —
 * trava do último admin). `admins` = lista de perfis admin ATIVOS.
 */
export function isLastActiveAdmin(
  admins: { id: string; role: UserRole; status: AccountStatus }[],
  targetId: string,
): boolean {
  const activeAdmins = admins.filter(
    (a) => a.role === "admin" && a.status === "active",
  );
  return activeAdmins.length === 1 && activeAdmins[0]!.id === targetId;
}

/**
 * A mudança proposta tira o sistema do último admin?
 * Verdadeiro quando o alvo é o último admin ativo E a operação o remove do
 * conjunto de admins ativos (rebaixar p/ professor, inativar, ou excluir).
 */
export function wouldRemoveLastAdmin(
  admins: { id: string; role: UserRole; status: AccountStatus }[],
  targetId: string,
  next: { role?: UserRole; status?: AccountStatus; deleting?: boolean },
): boolean {
  if (!isLastActiveAdmin(admins, targetId)) return false;
  if (next.deleting) return true;
  const stillAdmin = (next.role ?? "admin") === "admin";
  const stillActive = (next.status ?? "active") === "active";
  return !(stillAdmin && stillActive);
}

// ─────────────────────────── Provisionamento (service-role) ─────────────────

/**
 * Mensagem amigável exibida quando o provisionamento (service-role) não está
 * configurado neste ambiente. A app NÃO cai: a action devolve `ok:false` com isto.
 */
export const PROVISIONING_UNAVAILABLE_MESSAGE =
  "Provisionamento de contas indisponível: a chave service-role do Supabase não está configurada neste ambiente. Defina SUPABASE_SERVICE_ROLE_KEY no .env.local para habilitar.";

/**
 * Reconhece o erro de ausência da chave service-role lançado por `getAdminClient()`
 * (string canônica "SUPABASE_SERVICE_ROLE_KEY ausente"). Mantida pura/sem imports
 * de framework para ser testável e reusável por todas as actions de provisionamento.
 */
export function isProvisioningUnavailable(err: unknown): boolean {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return message.includes("SUPABASE_SERVICE_ROLE_KEY ausente");
}

/**
 * Normaliza o erro da Admin API de e-mail já existente (F-28 CA03 · F-32). O
 * Supabase usa diferentes textos/códigos ("already been registered",
 * "email_exists", "User already registered") conforme a versão.
 */
export function isEmailAlreadyExistsError(err: unknown): boolean {
  const message = (
    err instanceof Error ? err.message : typeof err === "string" ? err : ""
  ).toLowerCase();
  return (
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("email_exists") ||
    message.includes("email address already")
  );
}

// ─────────────────────── Provisionamento por e-mail (F-28/F-30/F-32) ────────

/**
 * Caminho da rota que recebe o usuário ao clicar no link de convite/recuperação
 * (define a senha). É o `redirectTo` passado às APIs de e-mail do Supabase.
 */
export const PASSWORD_SETUP_PATH = "/redefinir-senha";

/**
 * Monta a URL absoluta de `redirectTo` para o e-mail de convite/recuperação
 * (a tela onde o usuário define a senha — F-30 CA03 · F-32). Prioriza
 * `NEXT_PUBLIC_SITE_URL` (deploy); cai no `localhost` informado em dev. Sem
 * barra dupla. Mantida pura (recebe o base) p/ ser testável.
 */
export function passwordSetupRedirectTo(
  baseUrl: string | null | undefined,
): string {
  const base = (baseUrl ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${PASSWORD_SETUP_PATH}`;
}

/**
 * Reconhece falhas de ENVIO de e-mail da Admin API (SMTP ausente / mailer não
 * configurado no Supabase). Nesses casos a conta É criada, mas o e-mail não
 * sai — caímos no fallback honesto (expor o `action_link` ao admin). O Supabase
 * varia o texto ("Error sending", "SMTP", "email rate limit", etc.).
 */
export function isEmailDeliveryError(err: unknown): boolean {
  const message = (
    err instanceof Error ? err.message : typeof err === "string" ? err : ""
  ).toLowerCase();
  if (!message) return false;
  return (
    message.includes("sending") || // "Error sending invite/confirmation email"
    message.includes("smtp") ||
    message.includes("mailer") ||
    message.includes("email rate limit") ||
    message.includes("not configured")
  );
}

// ─────────────────────────── Recusa de cadastro ─────────────────────────────

/** Valida o motivo da recusa de cadastro (F-33 CA01) — obrigatório no servidor. */
export function validateRejectReason(raw: string | null | undefined): {
  ok: boolean;
  value?: string;
  error?: string;
} {
  const reason = (raw ?? "").trim();
  if (!reason) return { ok: false, error: "Informe o motivo da recusa." };
  if (reason.length > REJECT_REASON_MAX) {
    return {
      ok: false,
      error: `O motivo deve ter no máximo ${REJECT_REASON_MAX} caracteres.`,
    };
  }
  return { ok: true, value: reason };
}
