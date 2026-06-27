"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Store global de estado de UI (Zustand) — critério "Gerência de Estado".
 *
 * Hoje guarda apenas a preferência de sidebar recolhida/expandida no desktop
 * (BUG 3), antes presa em `useState` + `localStorage` dentro do AppShell. Como é
 * um estado de UI GLOBAL (consultado pelo `<aside>` e pelo ☰ do header, em
 * componentes irmãos), o store evita prop-drilling e centraliza a fonte da
 * verdade.
 *
 * Persistência: `persist` em `localStorage` com `skipHydration: true`. No SSR o
 * estado nasce SEMPRE no default (`sidebarCollapsed: false`), igual ao HTML do
 * servidor — sem mismatch de hidratação. A reidratação do localStorage é
 * disparada manualmente APÓS a montagem no cliente (ver `app-shell.tsx`).
 */
export interface UiState {
  /** Sidebar fixa do desktop recolhida (≥ md). Mobile usa o drawer próprio. */
  sidebarCollapsed: boolean;
  /** Alterna o colapso (ação do ☰ no desktop). */
  toggleSidebar: () => void;
  /** Define o colapso explicitamente. */
  setSidebarCollapsed: (collapsed: boolean) => void;
}