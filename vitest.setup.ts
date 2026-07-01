/**
 * Setup global dos testes de componente: registra os matchers de
 * `@testing-library/jest-dom` (toBeInTheDocument, toHaveAttribute, etc.) e
 * limpa o DOM montado após cada teste para garantir isolamento.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
