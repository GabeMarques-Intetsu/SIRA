import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { navItemsForRole } from "@/components/shell/nav-config";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const items = navItemsForRole(profile.role);
  const isAdmin = profile.role === "admin";

  const [unread, approvals] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false),
    isAdmin
      ? supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
      : null,
  ]);

  const notifications = unread.count ?? 0;
  const approvalsCount = approvals?.count ?? 0;

  return (
    <AppShell 
      fullName={profile.full_name} 
      items={items}
      notificationCount={notifications}
      badges={{ notifications, approvals: approvalsCount }}
    >
      {children}
    </AppShell>
  );
}