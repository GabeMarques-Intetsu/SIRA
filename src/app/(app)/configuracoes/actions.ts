"use server";

/**
 * Server Actions de Configurações da Conta (EP-12 — F-37 Perfil · F-38
 * Preferências · F-39 Segurança · F-40 Notificações · F-41 Exportação ·
 * F-42 Exclusão · RF-012).
 *
 * Segurança (defesa em profundidade): toda ação reconfirma a SESSÃO no servidor
 * via `requireProfile()` e SEMPRE escreve filtrando por `auth.uid()` — nunca
 * confiamos em id vindo do client. A RLS (`user_preferences`/
 * `notification_preferences` = só o dono; `profiles` = id = auth.uid()) é a 2ª
 * camada: mesmo que o client seja burlado, o banco recusa escrita de terceiros
 * (RNF-seguranca-privacidade · F-10).
 *
 * ⚠️ Limites honestos deste ambiente (só anon key, sem service-role):
 * - 2FA TOTP (F-39 CA05/06/07): IMPLEMENTADO no client (`security-panel.tsx`) via
 *   `supabase.auth.mfa.enroll/challenge/verify/unenroll` (contexto do usuário, sem
 *   service-role). `setTwoFactorAction` apenas SINCRONIZA a flag
 *   `two_factor_enabled` com a verdade (existir fator TOTP verificado).
 * - Sessões ativas (F-39 CA08/09/10): listar/revogar sessões de outros
 *   dispositivos exige a admin API (auth.admin.listUserSessions / signOut). Ver
 *   TODO(sessions).
 * - Exclusão da conta (F-42 CA05): apagar a conta em `auth.users` usa service-role
 *   (`auth.admin.deleteUser`) — só quando NÃO há reservas vinculadas (FK restrict)
 *   e o usuário NÃO é o último admin (trava). Caso contrário, inativamos o profile
 *   (acesso barrado — CA03). Sem service-role, degradamos para inativação.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";
type UserRole = Database["public"]["Enums"]["user_role"];
type AccountStatus = Database["public"]["Enums"]["account_status"];

function isLastActiveAdmin(
  admins: { id: string; role: UserRole; status: AccountStatus }[],
  targetId: string,
): boolean {
  const activeAdmins = admins.filter(
    (a) => a.role === "admin" && a.status === "active",
  );
  return activeAdmins.length === 1 && activeAdmins[0]!.id === targetId;
}

function wouldRemoveLastAdmin(
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

function isProvisioningUnavailable(err: unknown): boolean {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return message.includes("SUPABASE_SERVICE_ROLE_KEY ausente");
}
import {
  isThemePref,
  isLanguagePref,
  isDensityPref,
  NOTIFICATION_EVENTS,
  visibleEvents,
  type ThemePref,
  type LanguagePref,
  type DensityPref,
} from "@/lib/preferences";
import {
  profileSchema,
  passwordChangeSchema,
  type ProfileFormInput,
  type PasswordChangeFormInput,
} from "@/schemas/profile";

export interface ActionResult {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/** Revalida as superfícies que refletem dados da conta. */
function revalidateAccountSurfaces(): void {
  revalidatePath("/configuracoes");
  revalidatePath("/(app)", "layout"); // nome/avatar na sidebar/header
}

// ─────────────────────────── Perfil (F-37) ──────────────────────────────────

/**
 * Atualiza o próprio perfil (F-37 CA01/CA05). E-mail é OMITIDO (imutável —
 * CA02). Validação no servidor (CA03/CA04). RLS garante que só o dono escreve.
 */
export async function updateProfileAction(
  input: ProfileFormInput,
): Promise<ActionResult> {
  const me = await requireProfile();

  // Defesa em profundidade: revalida com o MESMO schema Zod do client (DRY).
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Verifique os campos.", fieldErrors };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      department: v.department ? v.department : null,
      phone: v.phone ? v.phone : null,
      // email intencionalmente OMITIDO (F-37 CA02).
    })
    .eq("id", me.id); // dono apenas (defesa em profundidade + RLS)
  if (error) return { ok: false, error: "Não foi possível salvar o perfil." };

  revalidateAccountSurfaces();
  return { ok: true, error: null };
}

// ──────────────────────── Preferências (F-38) ───────────────────────────────

export interface PreferencesInput {
  theme: ThemePref;
  language: LanguagePref;
  density: DensityPref;
  reduceMotion: boolean;
}

/**
 * Persiste as preferências de interface (F-38 CA04/CA09). UPSERT por user_id:
 * a linha pode ainda não existir (default no schema cobre, mas o trigger já
 * cria) → `upsert` é idempotente. O tema também é mantido pelo next-themes no
 * client (aplicação imediata sem reload — CA03); aqui só persistimos por conta.
 */
export async function savePreferencesAction(
  input: PreferencesInput,
): Promise<ActionResult> {
  const me = await requireProfile();

  // Validação no servidor (entradas vêm do client, nunca confiar).
  if (
    !isThemePref(input.theme) ||
    !isLanguagePref(input.language) ||
    !isDensityPref(input.density) ||
    typeof input.reduceMotion !== "boolean"
  ) {
    return { ok: false, error: "Preferências inválidas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: me.id,
      theme: input.theme,
      language: input.language,
      density: input.density,
      reduce_motion: input.reduceMotion,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error)
    return { ok: false, error: "Não foi possível salvar as preferências." };

  revalidateAccountSurfaces();
  return { ok: true, error: null };
}

// ──────────────────── Matriz de notificações (F-40) ─────────────────────────

export interface NotificationMatrixInput {
  /** event_type → { app, email } */
  prefs: Record<string, { app: boolean; email: boolean }>;
}

/**
 * Persiste a matriz canal × evento (F-40 CA01/CA03/CA05). Filtra os eventos
 * pelo papel (CA04 — não grava eventos restritos p/ quem não é admin) e faz
 * UPSERT por (user_id, event_type). Desmarcar = grava false (suprime o canal).
 */
export async function saveNotificationPrefsAction(
  input: NotificationMatrixInput,
): Promise<ActionResult> {
  const me = await requireProfile();

  const allowed = new Set(visibleEvents(me.role).map((e) => e.key));
  const known = new Set(NOTIFICATION_EVENTS.map((e) => e.key));

  const rows = Object.entries(input.prefs)
    .filter(([key]) => known.has(key) && allowed.has(key)) // CA04
    .map(([key, ch]) => ({
      user_id: me.id,
      event_type: key,
      channel_app: Boolean(ch.app),
      channel_email: Boolean(ch.email),
    }));

  if (rows.length === 0) {
    return { ok: false, error: "Nenhuma preferência para salvar." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,event_type" });
  if (error)
    return {
      ok: false,
      error: "Não foi possível salvar as preferências de notificação.",
    };

  revalidateAccountSurfaces();
  return { ok: true, error: null };
}

// ─────────────────────────── Segurança (F-39) ───────────────────────────────

/**
 * Troca a própria senha (F-39 CA01/CA02/CA03/CA04). Reautentica a senha ATUAL
 * via `signInWithPassword` (CA04 — senha atual incorreta impede a troca) e só
 * então grava a nova via `supabase.auth.updateUser`, que É suportado no client
 * autenticado (não precisa de service-role).
 */
export async function changePasswordAction(
  input: PasswordChangeFormInput,
): Promise<ActionResult> {
  const me = await requireProfile();

  // Defesa em profundidade: revalida com o MESMO schema Zod do client (DRY).
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Verifique os campos.", fieldErrors };
  }

  const supabase = await createClient();

  // CA04 — confirma a senha atual reautenticando com o e-mail do profile.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: me.email,
    password: input.currentPassword,
  });
  if (signInError) {
    return {
      ok: false,
      error: "Senha atual incorreta.",
      fieldErrors: { currentPassword: "Senha atual incorreta." },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (error) {
    return { ok: false, error: "Não foi possível alterar a senha." };
  }

  return { ok: true, error: null };
}

/**
 * Sincroniza a flag `user_preferences.two_factor_enabled` com a VERDADE do MFA
 * (F-39 CA05/CA07). O enroll/verify/unenroll TOTP REAL roda no CLIENT, no
 * contexto do usuário autenticado (`supabase.auth.mfa.*`, NÃO precisa de
 * service-role). Após verificar/desativar um fator, o painel chama esta action
 * com o estado real (`enabled = existe fator TOTP verificado`) para persistir a
 * flag — sem dar falsa sensação de segurança (a flag NUNCA fica `true` sem fator).
 */
export async function setTwoFactorAction(
  enabled: boolean,
): Promise<ActionResult> {
  const me = await requireProfile();

  const supabase = await createClient();
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: me.id,
      two_factor_enabled: Boolean(enabled),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: "Não foi possível atualizar o 2FA." };

  revalidateAccountSurfaces();
  return { ok: true, error: null };
}

// ───────────────────── Exportação de dados (F-41) ───────────────────────────

/**
 * Reúne os dados do próprio usuário (perfil + reservas) p/ exportação LGPD
 * (F-41 CA01/CA02). O isolamento é garantido pela RLS + filtro `user_id` (CA03):
 * nunca retornamos registros de terceiros. A serialização/download acontece no
 * client a partir deste payload.
 */
export async function exportMyDataAction(): Promise<
  | { ok: true; data: Record<string, unknown>; error: null }
  | { ok: false; data: null; error: string }
> {
  const me = await requireProfile();
  const supabase = await createClient();

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", me.id) // CA03 — só as próprias
    .order("reservation_date", { ascending: false });
  if (error) {
    return { ok: false, data: null, error: "Não foi possível exportar." };
  }

  return {
    ok: true,
    error: null,
    data: {
      exported_at: new Date().toISOString(),
      profile: {
        id: me.id,
        full_name: me.full_name,
        email: me.email,
        role: me.role,
        department: me.department,
        siape_matricula: me.siape_matricula,
        phone: me.phone,
        created_at: me.created_at,
      },
      reservations: reservations ?? [],
    },
  };
}

// ───────────────────── Exclusão da conta (F-42) ─────────────────────────────

/**
 * Auto-exclusão da própria conta com confirmação (F-42 CA01/CA03/CA05).
 *
 * Trava do último admin: se o próprio usuário for o derradeiro admin ativo, a
 * exclusão é BLOQUEADA (o sistema nunca pode ficar sem quem administre).
 *
 * Reservas (FK `restrict`, histórico preservado): se houver QUALQUER reserva, ou
 * se a service-role não estiver configurada, fazemos o caminho seguro — INATIVAR
 * o profile (perde acesso — CA03) + encerrar a sessão. Sem reservas e com
 * service-role, fazemos a exclusão DEFINITIVA (`auth.admin.deleteUser` — CA05).
 */
export async function deleteMyAccountAction(): Promise<ActionResult> {
  const me = await requireProfile();
  const supabase = await createClient();

  // Trava do último admin (auto-rebaixamento/auto-exclusão inclusos).
  if (me.role === "admin") {
    const { data: adminsRaw } = await supabase
      .from("profiles")
      .select("id, role, status")
      .eq("role", "admin");
    const admins = (adminsRaw ?? []) as {
      id: string;
      role: UserRole;
      status: AccountStatus;
    }[];
    if (wouldRemoveLastAdmin(admins, me.id, { deleting: true })) {
      return {
        ok: false,
        error:
          "Você é o último administrador ativo e não pode excluir a própria conta. Promova outro usuário a administrador antes.",
      };
    }
  }

  // Há reservas? FK restrict preserva histórico → inativar (não apagar).
  const { count } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me.id);

  const inactivateAndSignOut = async (
    note: string | null,
  ): Promise<ActionResult> => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "inactive" })
      .eq("id", me.id);
    if (error) return { ok: false, error: "Não foi possível excluir a conta." };
    // CA03 — encerra a sessão; o client redireciona p/ /login após isto.
    await supabase.auth.signOut();
    return { ok: true, error: note };
  };

  if ((count ?? 0) > 0) {
    return inactivateAndSignOut(
      "Sua conta tem reservas no histórico, então foi INATIVADA (sem acesso) em vez de apagada, preservando o histórico.",
    );
  }

  // Sem reservas: exclusão definitiva via service-role; sem ela, inativa.
  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch (err) {
    if (isProvisioningUnavailable(err)) {
      return inactivateAndSignOut(
        "Sua conta foi INATIVADA (sem acesso). A exclusão definitiva exige a chave service-role, ainda não configurada.",
      );
    }
    return { ok: false, error: "Não foi possível excluir a conta." };
  }

  // CA03 — encerra a sessão ANTES de apagar (o usuário não existirá mais).
  await supabase.auth.signOut();

  // F-42 CA05 — exclusão definitiva da conta de acesso (cascade no profile).
  const { error } = await admin.auth.admin.deleteUser(me.id);
  if (error) {
    return { ok: false, error: "Não foi possível excluir a conta." };
  }

  return { ok: true, error: null };
}
