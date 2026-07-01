import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

/**
 * Lê o usuário autenticado e seu profile (RBAC) no servidor.
 * Retorna null quando não há sessão válida ou profile correspondente.
 *
 * Envolto em React `cache()` (server-cache-react): no mesmo request o layout e a
 * página chamam `requireProfile`/`requireAdmin`; sem o cache, cada chamada refaz
 * `auth.getUser()` + a query de profile (2 round-trips à Supabase). Com o cache,
 * roda UMA vez por request e é reusado — corta latência em cada navegação.
 */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // getClaims() verifica o JWT LOCALMENTE (o projeto usa chaves ES256
  // assimétricas; o JWKS é buscado uma vez e cacheado) — elimina o round-trip
  // de `auth.getUser()` ao servidor de Auth a cada navegação. É seguro: a
  // assinatura do token é verificada criptograficamente, não apenas lida.
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile ?? null;
});

/**
 * Garante que há um profile (sessão válida). Caso contrário redireciona p/ login.
 * Uso em Server Components do grupo (app).
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * Garante que o usuário é admin. Professor (ou sem sessão) é barrado:
 * sem sessão → /login; com sessão não-admin → /calendario (RF-002 / F-05 CA03).
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/calendario");
  return profile;
}
