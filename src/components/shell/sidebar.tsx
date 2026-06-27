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
      {/* Branding */}
      <div className="gap-sm px-sm flex items-center">
        <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <span
            className="material-symbols-outlined text-on-primary"
            aria-hidden="true"
          >
            domain
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-headline-sm text-on-surface leading-none">
            SIRA
          </span>
          <span className="text-label-sm text-on-surface-variant">IFPB</span>
        </div>
      </div>
      {/* Navegação e rodapé serão adicionados nos próximos commits */}
    </div>
  );
}