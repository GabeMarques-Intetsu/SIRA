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
    <header className="bg-surface/95 border-outline-variant gap-md px-md py-md md:px-margin-desktop sticky top-0 z-20 flex items-center border-b backdrop-blur">
      {/* O conteúdo do header será adicionado nos próximos commits */}
    </header>
  );
}