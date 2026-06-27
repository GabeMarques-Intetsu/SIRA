import type { Enums } from "@/lib/supabase/database.types";

export type Role = Enums<"user_role">;

export interface NavItem {
  href: string;
  label: string;
  /** Material Symbol name. */
  icon: string;
  /** Perfis que enxergam o item (F-05 CA01/CA02/CA03). */
  roles: Role[];
  /** Chave de contador de pendências (placeholder no Bloco 0 — F-05 CA05). */
  badgeKey?: "approvals" | "notifications";
}