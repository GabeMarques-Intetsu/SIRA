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

/**
 * Itens de navegação do shell. A sidebar filtra por `roles`:
 * - professor → Calendário, Nova Reserva, Minhas Reservas, Notificações
 * - admin → Calendário, Nova Reserva, Minhas Reservas (o admin também reserva),
 * Notificações, Painel, Salas, Equipamentos, Usuários, Aprovações
 * (RF-002 / F-05)
 */
export const NAV_ITEMS: NavItem[] = [
  // Professor
  {
    href: "/calendario",
    label: "Calendário",
    icon: "calendar_month",
    roles: ["professor", "admin"],
  },
  {
    href: "/nova-reserva",
    label: "Nova Reserva",
    icon: "add_circle",
    roles: ["professor", "admin"],
  },
  {
    href: "/minhas-reservas",
    label: "Minhas Reservas",
    icon: "event_available",
    roles: ["professor", "admin"],
  },
  {
    href: "/notificacoes",
    label: "Notificações",
    icon: "notifications",
    roles: ["professor", "admin"],
    badgeKey: "notifications",
  },
  // Admin
  { href: "/painel", label: "Painel", icon: "dashboard", roles: ["admin"] },
  { href: "/salas", label: "Salas", icon: "meeting_room", roles: ["admin"] },
  {
    href: "/equipamentos",
    label: "Equipamentos",
    icon: "videocam",
    roles: ["admin"],
  },
  { href: "/usuarios", label: "Usuários", icon: "group", roles: ["admin"] },
  {
    href: "/aprovacoes",
    label: "Aprovações",
    icon: "fact_check",
    roles: ["admin"],
    badgeKey: "approvals",
  },
];

/** Itens visíveis para um dado perfil, na ordem de `NAV_ITEMS`. */
export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/** Tela inicial por perfil (F-01 CA07). */
export function homeForRole(role: Role): string {
  return role === "admin" ? "/painel" : "/calendario";
}