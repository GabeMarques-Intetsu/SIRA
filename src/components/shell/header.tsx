"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  fullName: string;
  /** Abre o drawer no mobile (< md). */
  onOpenMenu: () => void;
  /** Alterna a sidebar recolhida/expandida no desktop (≥ md) — BUG 3. */
  onToggleSidebar: () => void;
  /** Estado atual da sidebar no desktop (para `aria-expanded`). */
  sidebarCollapsed: boolean;
  /** `id` da sidebar fixa, alvo do `aria-controls` do ☰ (desktop). */
  sidebarId: string;
  /** Contagem de notificações não lidas (placeholder no Bloco 0). */
  notificationCount?: number;
}

/**
 * Header sticky: controle de menu + título + notificações + tema + usuário.
 *
 * O botão ☰ é um controle REAL em todas as larguras (BUG 3): no mobile abre o
 * drawer; no desktop (≥ md) recolhe/expande a sidebar fixa. Por isso há dois
 * botões — um `md:hidden` (drawer) e um `hidden md:inline-flex` (collapse) —
 * cada um com o `aria-*` adequado ao seu alvo, evitando rótulos ambíguos.
 */
export function Header({
  fullName,
  onOpenMenu,
  onToggleSidebar,
  sidebarCollapsed,
  sidebarId,
  notificationCount = 0,
}: HeaderProps) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="bg-surface/95 border-outline-variant gap-sm px-md py-md md:gap-md md:px-margin-desktop sticky top-0 z-20 flex items-center border-b backdrop-blur">
      {/* Mobile: abre o drawer */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full lg:hidden"
        aria-label="Abrir menu de navegação"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Desktop: recolhe/expande a sidebar fixa (BUG 3) */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-expanded={!sidebarCollapsed}
        aria-controls={sidebarId}
        className="touch-target text-on-surface-variant hover:bg-surface-container hidden rounded-full lg:inline-flex"
        aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="flex-1">
        <h1 className="text-headline-sm text-on-surface">SIRA</h1>
      </div>

      <Link
        href="/notificacoes"
        className="touch-target text-on-surface-variant hover:bg-surface-container relative flex items-center justify-center rounded-full"
        aria-label={
          notificationCount > 0
            ? `Notificações (${notificationCount} não lidas)`
            : "Notificações"
        }
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          notifications
        </span>
        {notificationCount > 0 && (
          <span
            className="bg-error text-on-error absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
            aria-hidden="true"
          >
            {notificationCount}
          </span>
        )}
        {/* Anúncio do contador para leitores de tela (aria-live) sem poluir o ícone. */}
        <span className="sr-only" aria-live="polite">
          {notificationCount > 0
            ? `${notificationCount} notificações não lidas`
            : "Sem notificações não lidas"}
        </span>
      </Link>

      <ThemeToggle />

      <UserMenu fullName={fullName} initials={initials} />
    </header>
  );
}
