/**
 * Domínio de Configurações da Conta (EP-12 · RF-012 · mockup 11).
 *
 * Lógica pura (sem I/O) compartilhada por Server Actions e client islands:
 * validação do perfil (F-37), catálogo da matriz de notificações (F-40),
 * força de senha (F-39) e helpers de tipos das preferências (F-38).
 * Manter aqui o que é testável e reutilizável em ambos os lados.
 */
import type { Tables, Enums } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;
export type UserPreferences = Tables<"user_preferences">;
export type NotificationPreference = Tables<"notification_preferences">;

export type ThemePref = Enums<"theme_pref">; // 'light' | 'dark' | 'system'
export type LanguagePref = Enums<"language_pref">; // 'pt-BR' | 'en' | 'es'
export type DensityPref = Enums<"density_pref">; // 'comfortable' | 'compact'

// ─────────────────────────── Perfil (F-37) ──────────────────────────────────

export interface ProfileInput {
  fullName: string;
  department: string;
  phone: string;
}

/**
 * Telefone BR opcional (F-37 CA04). Aceita vazio; quando preenchido exige um
 * formato plausível de DDD + número (10 ou 11 dígitos), tolerando máscara.
 */
export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (trimmed === "") return true; // opcional (CA04)
  const digits = trimmed.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

/**
 * Valida o input de perfil. Nome obrigatório (F-37 CA03); e-mail é imutável e
 * nem entra aqui (F-37 CA02). Retorna erros por campo p/ feedback acessível.
 */
export function validateProfileInput(input: ProfileInput): {
  ok: boolean;
  errors: Record<string, string>;
  value?: { fullName: string; department: string | null; phone: string | null };
} {
  const errors: Record<string, string> = {};
  const fullName = input.fullName.trim();
  const department = input.department.trim();
  const phone = input.phone.trim();

  if (fullName === "") {
    errors.fullName = "O nome completo é obrigatório."; // CA03
  } else if (fullName.length < 2) {
    errors.fullName = "Informe um nome válido.";
  }

  if (!isValidPhone(phone)) {
    errors.phone = "Telefone inválido. Use o formato (83) 99999-9999."; // CA04
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: {},
    value: {
      fullName,
      department: department === "" ? null : department,
      phone: phone === "" ? null : phone,
    },
  };
}

/** Iniciais p/ avatar de fallback quando não há foto (F-37 CA08). */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ──────────────────────── Preferências (F-38) ───────────────────────────────

export const THEME_OPTIONS: {
  value: ThemePref;
  label: string;
  icon: string;
}[] = [
  { value: "light", label: "Claro", icon: "light_mode" },
  { value: "dark", label: "Escuro", icon: "dark_mode" },
  { value: "system", label: "Sistema", icon: "contrast" },
];

/**
 * Idiomas no seletor. Só Português está disponível: a interface ainda não tem
 * i18n, então English (Canadá) e Español (América Latina) ficam DESABILITADOS,
 * com aviso no hover (`title`) de que a tradução está indisponível no momento.
 */
export const LANGUAGE_OPTIONS: {
  value: LanguagePref;
  label: string;
  disabled?: boolean;
  title?: string;
}[] = [
  { value: "pt-BR", label: "Português (Brasil)" },
  {
    value: "en",
    label: "English (Canadá)",
    disabled: true,
    title: "Tradução indisponível no momento — a interface está disponível apenas em Português.",
  },
  {
    value: "es",
    label: "Español (América Latina)",
    disabled: true,
    title: "Tradução indisponível no momento — a interface está disponível apenas em Português.",
  },
];

export const DENSITY_OPTIONS: { value: DensityPref; label: string }[] = [
  { value: "comfortable", label: "Confortável" },
  { value: "compact", label: "Compacta" },
];

/** Preferências default quando ainda não há linha em user_preferences. */
export const DEFAULT_PREFERENCES: Omit<
  UserPreferences,
  "user_id" | "updated_at"
> = {
  theme: "system",
  language: "pt-BR",
  density: "comfortable",
  reduce_motion: false,
  two_factor_enabled: false,
};

export function isThemePref(v: unknown): v is ThemePref {
  return v === "light" || v === "dark" || v === "system";
}
export function isLanguagePref(v: unknown): v is LanguagePref {
  return v === "pt-BR" || v === "en" || v === "es";
}
export function isDensityPref(v: unknown): v is DensityPref {
  return v === "comfortable" || v === "compact";
}

// ──────────────────── Matriz de notificações (F-40) ─────────────────────────

export interface NotificationEvent {
  /** Chave persistida em notification_preferences.event_type. */
  key: string;
  label: string;
  /** Só aparece p/ quem aprova (admin) — F-40 CA04. */
  approverOnly?: boolean;
}

/**
 * Catálogo mínimo de eventos da matriz (F-40 CA02). As chaves alinham com os
 * tipos emitidos no fluxo de notificações; "new_request" é restrito a admin
 * (F-40 CA04 — só quem aprova).
 */
export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { key: "reservation_approved", label: "Sua reserva foi aprovada" },
  { key: "reservation_rejected", label: "Sua reserva foi recusada" },
  {
    key: "new_request",
    label: "Nova solicitação aguarda aprovação",
    approverOnly: true,
  },
  { key: "reservation_reminder", label: "Lembrete 1h antes da reserva" },
  { key: "resource_maintenance", label: "Recurso em manutenção" },
];

/** Eventos visíveis conforme o papel (F-40 CA04). */
export function visibleEvents(role: string): NotificationEvent[] {
  return NOTIFICATION_EVENTS.filter((e) => !e.approverOnly || role === "admin");
}

/**
 * Monta o estado da matriz a partir das linhas persistidas, preenchendo os
 * eventos ausentes com o default (ambos canais ligados — F-40 CA01).
 */
export function buildMatrix(
  role: string,
  rows: NotificationPreference[],
): { key: string; label: string; app: boolean; email: boolean }[] {
  const byKey = new Map(rows.map((r) => [r.event_type, r]));
  return visibleEvents(role).map((e) => {
    const row = byKey.get(e.key);
    return {
      key: e.key,
      label: e.label,
      app: row ? row.channel_app : true,
      email: row ? row.channel_email : true,
    };
  });
}

// ─────────────────────────── Senha (F-39) ───────────────────────────────────

/**
 * Força mínima de senha (F-39 CA02): ≥8 caracteres com pelo menos uma letra e
 * um número. Mantém a regra única (mesma validação no client e no servidor).
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "A senha deve ter ao menos 8 caracteres.";
  if (!/[A-Za-z]/.test(password)) return "Inclua ao menos uma letra.";
  if (!/[0-9]/.test(password)) return "Inclua ao menos um número.";
  return null;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Valida o formulário de troca de senha (F-39 CA01/CA02/CA03). */
export function validatePasswordChange(input: PasswordChangeInput): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (input.currentPassword.trim() === "") {
    errors.currentPassword = "Informe a senha atual."; // CA01
  }
  const strength = validatePasswordStrength(input.newPassword);
  if (strength) errors.newPassword = strength; // CA02
  if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem."; // CA03
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// ───────────────────── Exportação de dados (F-41) ───────────────────────────

/** Nome legível do arquivo de exportação (F-41 CA04). */
export function exportFileName(profileId: string, date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `sira-meus-dados-${profileId.slice(0, 8)}-${iso}.json`;
}
