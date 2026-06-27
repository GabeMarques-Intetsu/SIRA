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
  const items = navItemsForRole(profile.role);

  return (
    <AppShell fullName={profile.full_name} items={items}>
      {children}
    </AppShell>
  );
}