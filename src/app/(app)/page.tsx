import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { homeForRole } from "@/components/shell/nav-config";

/** Raiz da área logada: encaminha para a tela inicial do perfil (F-01 CA07). */
export default async function AppIndex() {
  const profile = await requireProfile();
  redirect(homeForRole(profile.role));
}