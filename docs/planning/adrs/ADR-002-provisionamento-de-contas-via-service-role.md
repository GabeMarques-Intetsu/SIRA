# ADR-002: Provisionar contas de acesso via Supabase service-role isolada server-only

## Status

Accepted

Refina o ADR-001 (schema + RLS): aquele garante o isolamento em runtime; este resolve as operações que **precisam contornar a RLS de propósito** (criar/apagar `auth.users`, redefinir senha) sem nunca expor a chave privilegiada.

## Context

Quatro operações do SIRA exigem privilégio acima do usuário autenticado, porque mexem em `auth.users` (não acessível pela anon key) ou agem sobre a conta de terceiros:

- **Criar conta ao aprovar cadastro** (F-32 CA02) e **cadastro direto pelo admin** (F-28 CA01/CA02) → `auth.admin.createUser`.
- **Redefinir senha** (F-30 CA03) → `auth.admin.updateUserById` (senha direta) ou `generateLink type:'recovery'` (link).
- **Exclusão definitiva** (F-31 CA02 / F-42 CA05) → `auth.admin.deleteUser`.

A `service_role` key **bypassa toda a RLS** — quem a possui lê/escreve qualquer linha e opera a Admin API. Expô-la ao browser seria um vazamento catastrófico (qualquer usuário viraria admin global). As forças em jogo:

1. **Onde guardar a chave** — (a) variável `NEXT_PUBLIC_*` acessível ao client; (b) variável server-only sem prefixo público, mais um guard de import.
2. **Quando validar a presença da chave** — (a) no import/build (quebra o `next build` se faltar); (b) em runtime, degradando a action com aviso.
3. **Confiança no papel ao criar** — (a) confiar em `user_metadata.role` vindo da chamada; (b) forçar `professor` no trigger e promover por UPDATE explícito depois.

## Decision

**Cliente de service-role isolado em `src/lib/supabase/admin.ts` com `import "server-only"` na 1ª linha**, lido de `process.env.SUPABASE_SERVICE_ROLE_KEY` (sem `NEXT_PUBLIC_`), validado em **runtime** via `getAdminClient()`, e **nunca** confiando em metadata para papel.

- **Eixo 1 → server-only + env sem prefixo público.** Três camadas: `import "server-only"` faz o build quebrar de propósito se um Client Component importar o módulo; a ausência de prefixo `NEXT_PUBLIC_` impede o Next de embutir a chave no bundle; o módulo nunca loga a chave nem o client.
- **Eixo 2 → validação em runtime, degradação amigável.** `getAdminClient()` lança `Error(SERVICE_ROLE_MISSING_MESSAGE)` só quando chamado sem a chave; as Server Actions capturam via `isProvisioningUnavailable()` e devolvem `ActionResult { ok:false }` legível. Assim `next build` passa sem a chave e a app não cai — apenas o provisionamento fica indisponível com aviso.
- **Eixo 3 → papel não vem do metadata.** `createUser` não passa `role`; o trigger `handle_new_user` força `role='professor'`. A promoção a admin (F-28) é um UPDATE explícito e auditável feito **depois** da criação.

Degradação por operação quando a chave falta: aprovar cadastro marca a solicitação como `approved` e avisa que a conta não foi criada; redefinir senha avisa para usar "esqueci a senha"; excluir definitivamente **inativa** o profile (acesso barrado, histórico preservado) em vez de apagar.

## Consequences

**Positivas:**

- A chave privilegiada não pode chegar ao browser por construção (o build falha antes) — superfície de vazamento fechada.
- O sistema funciona em ambientes sem a chave (dev, preview, CI): degrada com mensagem honesta em vez de derrubar build ou app.
- Papel não é forjável pela borda: mesmo uma chamada maliciosa não vira admin via metadata.

**Negativas / trade-offs aceitos:**

- O envio dos **links de senha** (recovery) depende de **SMTP configurado no projeto Supabase**. Sem SMTP, as actions retornam o `action_link` server-side para repasse manual pelo admin (`TODO(smtp)`) — funcional, porém operacionalmente manual. Ver ADR-007.
- A exclusão definitiva só ocorre quando **não há reservas vinculadas** (FK `restrict`) e o alvo **não é o último admin**; caso contrário inativa-se. Há, portanto, dois caminhos de "exclusão" a documentar para o operador.
- Centralizar o privilégio num único módulo concentra risco: qualquer regressão que afrouxe o `server-only` é crítica — coberto por teste e revisão.

## Cross-ref

- Implementação: `src/lib/supabase/admin.ts`, `src/app/(app)/usuarios/actions.ts` (`createUserAction`, `approveSignupAction`, `updateUserAction`, `resetUserPasswordAction`, `deleteUserAction`), `src/app/(app)/configuracoes/actions.ts` (`deleteMyAccountAction`).
- Requisitos: RF-001, RF-010; F-28, F-30 (CA03), F-31, F-32, F-33, F-42 (CA05).
- Refina: [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md).
- Relacionado: [ADR-007](./ADR-007-funcionalidades-dependentes-de-infra-externa.md) (dependência de SMTP).
- Handoff: `cyber-security-architect` (rotação/cofre da service-role, auditoria das chamadas Admin API).
