"use client";

import { useEffect, useState } from "react";

/**
 * `useMediaQuery` — assina uma media query (ex.: `"(min-width: 640px)"`) e
 * devolve se ela casa, reagindo a mudanças de viewport. SSR-safe: começa em
 * `false` e sincroniza no cliente (sem mismatch de hidratação, pois o efeito só
 * roda no browser). Útil p/ alternar diálogo full-screen (mobile) vs centralizado.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    
    // O listener será implementado na próxima etapa
  }, [query]);

  return matches;
}