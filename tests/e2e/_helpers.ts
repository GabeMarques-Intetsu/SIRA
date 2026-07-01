/**
 * Helpers compartilhados dos E2E de F-47/F-48 (imagem) e F-49 (hold).
 *
 * - `login()` reusa o formulário real (mesmo padrão do smoke).
 * - `adminClient()` cria um client de service-role a partir das envs (nunca
 *   credenciais hardcoded) — usado p/ setup/cleanup (criar professor de teste,
 *   apagar holds, reverter image_path). Espelha `getAdminClient()` do app.
 */
import type { Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Há credenciais de admin para o E2E? */
export function hasAdminCreds(): boolean {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
}

/** Há chave de service-role para setup/cleanup? */
export function hasServiceRole(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

/** Client de service-role (bypassa RLS) — SÓ para setup/cleanup de teste. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Client anônimo que faz login como um usuário (testa a RPC sob a sua sessão). */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Login pelo formulário real; espera sair de /login. */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  // Campos por rótulo acessível (RHF gera ids dinâmicos — não usar #email).
  await page.getByLabel(/e-mail institucional/i).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 20_000,
    }),
    page.getByRole("button", { name: /Entrar/i }).click(),
  ]);
}

/**
 * PNG 1×1 válido (assinatura PNG real), ~70 bytes — bem abaixo de 2 MB.
 * Gerado a partir de um base64 fixo p/ determinismo (nada aleatório).
 */
export const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function tinyPngBuffer(): Buffer {
  return Buffer.from(TINY_PNG_BASE64, "base64");
}
