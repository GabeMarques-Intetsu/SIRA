/**
 * Resolver ESM mínimo (zero-dependência) para os testes unitários:
 * mapeia o alias `@/...` (igual ao tsconfig paths) para `src/...`,
 * para que o `node:test` consiga carregar os módulos do app sem bundler.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function resolve_(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let path = resolve(root, "src", specifier.slice(2));
    // O app importa sem extensão (resolução de bundler); tenta `.ts`.
    if (!existsSync(path) && existsSync(`${path}.ts`)) path = `${path}.ts`;
    return nextResolve(pathToFileURL(path).href, context);
  }
  return nextResolve(specifier, context);
}

export { resolve_ as resolve };
