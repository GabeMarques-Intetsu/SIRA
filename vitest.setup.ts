/**
 * Setup global dos testes de componente: registra os matchers de
 * `@testing-library/jest-dom` (toBeInTheDocument, toHaveAttribute, etc.) e
 * limpa o DOM montado após cada teste para garantir isolamento.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// O Vitest não carrega `.env.local` (diferente do Next). Define uma base
// determinística para `resourceImageUrl` resolver a URL pública do Storage
// nos testes de componente (ex.: preview da imagem atual em edição).
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://proj.supabase.co";

afterEach(() => {
  cleanup();
});
