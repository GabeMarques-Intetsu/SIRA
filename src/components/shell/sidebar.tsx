"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav-config";
import { LogoutButton } from "./logout-button";

interface SidebarProps {
  items: NavItem[];
  /** Contadores de pendências por chave (F-05 CA05 — placeholder no Bloco 0). */
  badges?: Partial<Record<NonNullable<NavItem["badgeKey"]>, number>>;
  /** Fecha o drawer ao navegar (mobile, F-07). */
  onNavigate?: () => void;
}

/** Conteúdo da sidebar: branding + navegação por perfil + rodapé com logout. */
export function Sidebar({ items, badges = {}, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="bg-surface-container-low gap-md px-md py-lg flex h-full w-[264px] flex-col">
      {/* O conteúdo da sidebar (branding, nav, footer) entrará nos próximos commits */}
    </div>
  );
}