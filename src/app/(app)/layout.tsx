import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { navItemsForRole } from "@/components/shell/nav-config";
import { AppShell } from "@/components/shell/app-shell";

/**
 * Shell protegido (RF-002). Server Component: resolve o profile (RBAC),
 * monta a navegação por perfil e os contadores de pendências, e delega o
 * comportamento responsivo (drawer/header) ao AppShell (client).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const items = navItemsForRole(profile.role);
  const isAdmin = profile.role === "admin";

  // Contadores de pendências (F-05 CA05) + preferências de interface (F-38).
  // As 3 queries são INDEPENDENTES — rodam em paralelo (Promise.all) p/ evitar
  // o waterfall de round-trips ao Supabase a cada navegação (perf).
  const [unread, approvals, prefsRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false),
    // Valor síncrono direto (`null`), não `Promise.resolve`: o Promise.all
    // resolve não-thenables para si mesmos — promessa só para I/O real.
    isAdmin
      ? supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
      : null,
    supabase
      .from("user_preferences")
      .select("density, reduce_motion")
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);

  const notifications = unread.count ?? 0;
  const approvalsCount = approvals?.count ?? 0;

  // Preferências aplicadas num wrapper `display:contents` renderizado no
  // servidor — os tokens `--spacing-*` de [data-density="compact"] cascateiam
  // por herança e `.reduce-motion *` alcança os descendentes. Sem flash e sem
  // <script> no client (que o React 19 não executa em navegação e dispara erro).
  const density = prefsRes.data?.density ?? "comfortable";
  const reduceMotion = prefsRes.data?.reduce_motion ?? false;

  return (
    <div
      data-density={density}
      className={reduceMotion ? "reduce-motion contents" : "contents"}
    >
      <AppShell
        fullName={profile.full_name}
        items={items}
        notificationCount={notifications}
        badges={{ notifications, approvals: approvalsCount }}
      >
        {children}
      </AppShell>
    </div>
  );
}
