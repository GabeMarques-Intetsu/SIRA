import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildMatrix,
  DEFAULT_PREFERENCES,
  type UserPreferences,
  type NotificationPreference,
} from "@/lib/preferences";
import { ProfileForm } from "./profile-form";
import { PreferencesPanel } from "./preferences-panel";
import { SecurityPanel } from "./security-panel";
import { NotificationMatrix } from "./notification-matrix";
import { DangerZone } from "./danger-zone";

export const metadata: Metadata = { title: "Configurações · SIRA" };

/**
 * Configurações da Conta (EP-12 · RF-012 · mockup 11). Disponível a TODOS os
 * usuários logados (professor + admin) via `requireProfile()` — NÃO é admin-only.
 *
 * Server Component: resolve a sessão (RBAC) e carrega, em paralelo, as
 * preferências (`user_preferences`, pode não existir → default) e a matriz de
 * notificações (`notification_preferences`) do PRÓPRIO usuário (RLS = só o dono;
 * F-10 · RNF-seguranca-privacidade). A casca (seções + headings) é HTML do
 * servidor (LCP bom, sem CLS); cada formulário/toggle é um client island com
 * useTransition + feedback de salvo.
 *
 * Mapa de seções → features:
 * - Perfil (F-37) · Preferências (F-38) · Segurança (F-39) ·
 *   Notificações (F-40) · Zona de risco: Exportar (F-41) + Excluir (F-42).
 */
export default async function ConfiguracoesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [prefsRes, notifRes] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", profile.id),
  ]);

  // Pode não haver linha ainda (conta nova) → cai no default (UPSERT ao salvar).
  const preferences: UserPreferences =
    (prefsRes.data as UserPreferences | null) ?? {
      user_id: profile.id,
      ...DEFAULT_PREFERENCES,
      updated_at: new Date().toISOString(),
    };

  const notifRows = (notifRes.data ?? []) as NotificationPreference[];
  const matrix = buildMatrix(profile.role, notifRows);

  const SECTIONS = [
    { id: "perfil", label: "Perfil", icon: "account_circle" },
    { id: "preferencias", label: "Preferências", icon: "tune" },
    { id: "seguranca", label: "Segurança", icon: "lock" },
    { id: "notif", label: "Notificações", icon: "notifications" },
  ];

  return (
    <div className="mx-auto w-full max-w-[64rem]">
      <header className="mb-lg">
        <h1 className="text-headline-sm text-on-surface">Configurações</h1>
        <p className="text-body-sm text-on-surface-variant">
          Gerencie seu perfil, preferências e segurança.
        </p>
      </header>

      <div className="gap-lg flex flex-col lg:flex-row">
        {/* Navegação interna por seção (âncoras) */}
        <aside className="flex-shrink-0 lg:w-56">
          <nav
            aria-label="Seções de configuração"
            className="gap-xs flex overflow-x-auto lg:flex-col lg:overflow-visible"
          >
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-md py-sm text-on-surface-variant hover:bg-surface-container text-label-md gap-sm flex items-center rounded-lg whitespace-nowrap"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                  aria-hidden="true"
                >
                  {s.icon}
                </span>
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="gap-lg flex min-w-0 flex-1 flex-col">
          <ProfileForm profile={profile} />
          <PreferencesPanel preferences={preferences} />
          <SecurityPanel twoFactorEnabled={preferences.two_factor_enabled} />
          <NotificationMatrix rows={matrix} />
          <DangerZone profile={profile} />
        </div>
      </div>
    </div>
  );
}
