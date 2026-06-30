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

      <nav
        aria-label="Navegação principal"
        className="gap-xs flex flex-1 flex-col overflow-y-auto"
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`text-label-md gap-md px-md py-sm flex items-center justify-between rounded-lg transition-all ${
                active
                  ? "bg-secondary-container text-on-secondary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <span className="gap-md flex items-center">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={
                    active ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </span>
              {badge !== undefined && badge > 0 && (
                <span className="bg-error text-on-error text-label-sm rounded-full px-2 py-0.5">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-outline-variant gap-xs pt-md mt-auto flex flex-col border-t">
        <LogoutButton />
      </div>
    </div>
  );
}
