"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import type { NavItem } from "./nav-config";
import { useUiStore } from "@/stores/ui-store";

interface AppShellProps {
  fullName: string;
  items: NavItem[];
  badges?: Partial<Record<NonNullable<NavItem["badgeKey"]>, number>>;
  notificationCount?: number;
  children: React.ReactNode;
}

const SIDEBAR_ID = "app-sidebar";

/**
 * Shell responsivo: sidebar fixa ≥ md; vira drawer < md (F-07).
 */
export function AppShell({
  fullName,
  items,
  badges,
  notificationCount,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  // Reidrata a preferência do localStorage uma vez, no cliente.
  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  // Fecha o drawer com Esc.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen w-full">
      {/* O layout estrutural vem no próximo commit */}
    </div>
  );
}