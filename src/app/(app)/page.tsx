import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { homeForRole } from "@/components/shell/nav-config";

export default async function AppIndex() {
  const profile = await requireProfile();
  redirect(homeForRole(profile.role));
}