/**
 * Configuração do Vitest para a camada de TESTES DE COMPONENTE (React + jsdom).
 *
 * Coexiste com o runner `node:test` (que cobre os 136 testes de lógica pura em
 * `tests/**\/*.test.ts`): o `include` abaixo restringe o Vitest a
 * `tests/components/**\/*.test.tsx`, então os dois nunca colidem — node:test só
 * vê `.test.ts`, Vitest só vê `.test.tsx` em `tests/components`.
 *
 * O alias `@/` é resolvido por `vite-tsconfig-paths` (lê o `tsconfig.json` raiz),
 * mantendo a mesma resolução do app/build sem duplicar o mapeamento aqui.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Apenas os testes de componente. NÃO toca nos `.test.ts` do node:test.
    include: ["tests/components/**/*.test.tsx"],
  },
});
