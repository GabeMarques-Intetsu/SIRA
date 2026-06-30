"use client";

import { useEffect, useState } from "react";

/**
 * `useMounted` — `true` somente após a montagem no cliente. Padrão para evitar
 * mismatch de hidratação ao ler estado que só existe no browser (tema do
 * next-themes, `matchMedia`, `localStorage`). Centraliza o "mount-gate" antes
 * espalhado em componentes client.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-gate intencional: roda uma vez, no cliente, para liberar leituras browser-only (tema/matchMedia) sem mismatch de hidratação.
    setMounted(true);
  }, []);
  return mounted;
}
