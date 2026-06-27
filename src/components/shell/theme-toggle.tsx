"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS = [
  { value: "light", label: "Claro", icon: "light_mode" },
  { value: "dark", label: "Escuro", icon: "dark_mode" },
  { value: "system", label: "Sistema", icon: "computer" },
] as const;

/**
 * Alternador de tema (claro/escuro/sistema) via next-themes (F-09).
 * Persistência fica a cargo do next-themes (localStorage). Renderiza um grupo
 * de botões acessível; evita mismatch de hidratação adiando até montar.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Padrão next-themes: o tema só é conhecido no cliente; adiar a leitura até
  // montar evita mismatch de hidratação no aria-checked (hook `useMounted`).
  const mounted = useMounted();

  const current = mounted ? (theme ?? "system") : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="bg-surface-container gap-xs p-xs flex items-center rounded-full"
    >
      {/* Os botões serão adicionados no próximo commit */}
    </div>
  );
}