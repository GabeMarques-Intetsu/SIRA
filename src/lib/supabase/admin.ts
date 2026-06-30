import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente Supabase de **service-role** — provisionamento de contas (EP-10).
 *
 * ⚠️ SEGURANÇA (LEIA): a `service_role` key **bypassa toda a RLS**. Quem a possui
 * pode ler/escrever qualquer linha de qualquer tabela e operar a Admin API
 * (`auth.admin.*`). Por isso este módulo é blindado em três camadas:
 *
 * 1. `import "server-only"` (1ª linha): se QUALQUER Client Component importar este
 *    arquivo, o **build quebra de propósito** — a chave nunca pode ir ao bundle do
 *    browser. Só Server Actions / Route Handlers podem usá-lo.
 * 2. A chave vem de `process.env.SUPABASE_SERVICE_ROLE_KEY` — **sem** prefixo
 *    `NEXT_PUBLIC_`, logo o Next nunca a expõe ao client.
 * 3. NUNCA logar a chave nem o client. Não há `console.log(client)` aqui.
 *
 * Confiança no papel: a criação de usuário NÃO confia em `user_metadata.role`. O
 * trigger `handle_new_user` força `role='professor'` ao inserir em `profiles`; a
 * promoção a admin (F-28) é um UPDATE explícito e auditável feito DEPOIS.
 *
 * Build sem a chave: `getAdminClient()` valida a env em **runtime** e lança um erro
 * claro se ela faltar — NUNCA no import nem no build. Assim `next build` passa sem
 * a chave configurada e as actions degradam com mensagem amigável.
 */

/** Mensagem canônica do erro de ausência da chave (reusada nas actions/testes). */
export const SERVICE_ROLE_MISSING_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY ausente: provisionamento indisponível";

/**
 * Retorna um client de service-role pronto para a Admin API.
 *
 * Lança `Error(SERVICE_ROLE_MISSING_MESSAGE)` em runtime quando a chave não está
 * configurada — as Server Actions capturam esse erro e devolvem um `ActionResult`
 * amigável (ver `isProvisioningUnavailable` em `@/lib/users`), sem derrubar a app.
 *
 * Use SOMENTE em código server (Server Actions / Route Handlers). O
 * `import "server-only"` no topo garante isso em tempo de build.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente.");
  }
  if (!serviceRoleKey) {
    throw new Error(SERVICE_ROLE_MISSING_MESSAGE);
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // Service-role não tem sessão de usuário: nada de refresh/persistência.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
