# ADR-010: Enforcement de 2FA no acesso via AAL2 (gate no middleware + tela de verificação)

## Status

Accepted

ADR de tier 1 (transversal). Fundamenta a Feature [F-39 Segurança da conta](../../backlog/features/F-39-seguranca-da-conta.md) (US39.4 · CA11–CA13) e estende [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) (regra "2FA exigido no acesso"). Depende do fluxo de sessão de [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md).

## Context

O 2FA de hoje (F-39 CA05–CA07) apenas **cadastra** o fator TOTP (`mfa.enroll` → QR → `mfa.verify`). O Supabase **não força** o segundo fator no login: após `signInWithPassword`, a sessão fica em **AAL1** (só senha); se existe um fator TOTP verificado, o Supabase marca `currentLevel: "aal1"`, `nextLevel: "aal2"` — mas **cabe ao aplicativo exigir** a elevação. O SIRA não checa isso em lugar nenhum (nenhuma referência a `getAuthenticatorAssuranceLevel` no código), então o 2FA fica **cadastrável mas não protege o acesso**: quem sabe a senha entra sem o código. É uma feature meio-implementada — falha de segurança.

Forças em jogo:

- `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` é a **fonte da verdade** do nível (`currentLevel`/`nextLevel`), derivada dos fatores verificados.
- O gate precisa cobrir **todas** as entradas nas áreas internas — não só a Server Action de login, mas navegação direta por URL, refresh e deep-link. O **middleware** (`proxy.ts`/`updateSession`) é o único ponto que roda em toda requisição.
- Não pode travar quem **não** tem 2FA (`nextLevel !== "aal2"` → segue direto).
- A tela de desafio precisa ser **alcançável em AAL1** (senão vira loop de redirect), e o **logout** também.
- A checagem de AAL adiciona custo por request — deve seguir o mesmo padrão barato de sessão já usado (`getClaims`/cache por request), não um round-trip pesado.

Opções consideradas:

### Eixo 1 — Onde exigir o 2FA

1. **Só na Server Action de login** — fura: navegação direta / refresh reentra em AAL1 sem passar pela action.
2. **No middleware (proxy)** — ponto único, cobre toda rota do grupo `(app)`. ✓
3. **Em cada page/layout** — repetitivo e fácil esquecer uma rota (falha por omissão).

### Eixo 2 — Como apresentar o desafio

1. **Modal dentro do app** — o app já estaria montado em AAL1 → vaza conteúdo interno antes da verificação.
2. **Rota dedicada `/verificar-2fa`** (fora do gate) — não monta o app; sem vazamento. ✓

## Decision

- **Gate no middleware** (`updateSession`): após resolver a sessão, checar o AAL. Se `currentLevel === "aal1" && nextLevel === "aal2"` e a rota pedida é do grupo protegido `(app)`, **redirecionar para `/verificar-2fa`**. Exceções liberadas em AAL1: a própria `/verificar-2fa` e a ação de logout (evita loop e permite sair).
- **Tela `/verificar-2fa`** (exige sessão, mas acessível em AAL1): lista o fator TOTP verificado, faz `mfa.challenge` + `mfa.verify` com o código de 6 dígitos → eleva a sessão a **AAL2** → redireciona para a home do perfil. Código inválido: erro + nova tentativa (CA13).
- **Server Action de login**: após `signInWithPassword`, se `nextLevel === "aal2"`, redirecionar já para `/verificar-2fa` (UX imediata). O middleware é a **rede de segurança** que garante o gate mesmo sem passar pela action.
- **Sem 2FA** (`nextLevel !== "aal2"`): nada muda — acesso direto após a senha.

## Consequences

- ✅ O 2FA passa a **proteger de fato** o acesso (AAL2 real, não só cadastro).
- ✅ **Ponto único** de enforcement (middleware) — sem risco de esquecer uma rota.
- ✅ Sem vazamento de conteúdo interno (o app não monta em AAL1 pendente).
- ⚠️ +1 checagem de AAL por navegação nas áreas internas — mitigada pelo mesmo padrão de sessão barata (`getClaims`) já adotado; a decisão de AAL usa dados locais do JWT sempre que possível.
- ⚠️ Introduz um estado intermediário ("logado em AAL1 com 2FA pendente") que exige a tela própria e as exceções de rota.
- 🔭 **Complementar (fora do escopo agora)**: enforcement por RLS exigindo `aal2` para dados sensíveis — protege o dado no banco, mas não a navegação/UX; é reforço adicional, não substituto do gate de aplicação.
