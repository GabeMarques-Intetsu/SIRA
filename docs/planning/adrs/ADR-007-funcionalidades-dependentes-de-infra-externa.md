# ADR-007: Funcionalidades dependentes de infraestrutura externa — fora do MVP, com caminho de habilitação

## Status

Accepted

ADR guarda-chuva que registra, num só lugar, as funcionalidades **persistidas/preparadas** no código mas **não plenamente operantes** por dependerem de configuração ou infraestrutura externa ao escopo do MVP. Cada uma tem o "fio" puxado (flag/estado/TODO) e o caminho de habilitação documentado, para não virar dívida invisível.

## Context

Durante a implementação, vários requisitos foram levados até o limite do que o ambiente atual (apenas anon key + service-role, sem SMTP/storage/MFA configurados) permite. Em vez de fingir que estão completos ou removê-los, optou-se por **persistir o estado e marcar o gap** — o requisito fica rastreável e a habilitação vira uma tarefa de configuração, não de redesenho. As funcionalidades nessa situação:

| #   | Funcionalidade                                     | Estado hoje                                                                                 | Depende de                                                             |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| a   | **Envio de e-mails de senha** (recovery/definição) | `generateLink` gera o `action_link`; retornado server-side p/ repasse manual (`TODO(smtp)`) | SMTP no projeto Supabase                                               |
| b   | **MFA / TOTP** (F-39 CA05–07)                      | flag `two_factor_enabled` persiste; UI avisa "habilitado pela equipe de TI" (`TODO(mfa)`)   | fluxo Supabase Auth MFA (enroll → QR → challenge/verify, AAL)          |
| c   | **Revisão/revogação de sessões** (F-39 CA08–10)    | não implementado                                                                            | Admin API `auth.admin.listUserSessions` / `signOut` (`TODO(sessions)`) |
| d   | **Upload de foto de perfil** (F-37)                | não implementado                                                                            | Supabase Storage (bucket + policy)                                     |
| e   | **i18n** (F-38)                                    | `language` persiste em `user_preferences`; UI sem troca real de textos                      | catálogo de mensagens + framework i18n                                 |
| f   | **Dashboard "tempo real"** (RF-004 / F-12)         | KPIs por re-fetch no Server Component a cada navegação                                      | Supabase Realtime (subscriptions) p/ push verdadeiro                   |

## Decision

**Manter essas funcionalidades fora do escopo "operante" do MVP, persistindo estado e registrando o caminho de habilitação**, em vez de removê-las ou simulá-las. Regras:

- **Persistir o que já dá** (flags, preferências) para que a habilitação futura seja só "ligar o backend", sem migração de dados nem retrabalho de UI.
- **Degradar com honestidade**: a UI/action informa o limite ao usuário (ex.: 2FA "será habilitado pela equipe de TI"; senha "use esqueci a senha" sem SMTP) — nunca um falso "feito".
- **Marcar no código** com `TODO(<area>)` apontando a API/serviço exato que falta, e rastrear aqui.

Caminho de habilitação por item:

- **(a) SMTP** — configurar provedor SMTP no Supabase Auth; com isso `generateLink`/recovery passam a enviar e-mail automaticamente e o retorno do `action_link` deixa de ser repasse manual. Pré-requisito de ADR-002.
- **(b) MFA** — montar `supabase.auth.mfa.enroll({ factorType:'totp' })` → exibir QR/segredo → `mfa.challenge` + `mfa.verify`; elevar AAL no login. A flag já persistida vira o gate da UI.
- **(c) Sessões** — usar a Admin API (service-role já disponível, ADR-002) para listar/revogar sessões de outros dispositivos.
- **(d) Storage** — criar bucket + RLS de storage; gravar `avatar_url` no profile.
- **(e) i18n** — adotar catálogo de mensagens (a preferência `language` já está persistida como gate).
- **(f) Realtime** — substituir o re-fetch por subscriptions Supabase Realtime quando o "tempo real" verdadeiro for requisito (hoje o re-fetch por navegação atende o uso).

## Consequences

**Positivas:**

- Nenhuma dessas funcionalidades vira surpresa: estão listadas, com gap e caminho de ligação explícitos.
- Habilitar cada uma é configuração/integração incremental, sem redesenho — estado e UI já preveem o ponto de plugue.
- Honestidade com o usuário: a interface nunca promete o que o ambiente não entrega.

**Negativas / trade-offs aceitos:**

- Estado persistido sem efeito real (ex.: `two_factor_enabled=true` sem MFA montado) é uma **falsa sensação de segurança** se a UI não for clara — daí a obrigatoriedade da mensagem de degradação.
- O dashboard "tempo real" via re-fetch não é push: atualiza na navegação, não instantaneamente — aceitável para o volume atual.
- Manter TODOs vivos exige disciplina para não apodrecerem; este ADR é o índice de cobrança.

## Cross-ref

- Implementação: `src/app/(app)/usuarios/actions.ts` (`TODO(smtp)` em `resetUserPasswordAction`/`approveSignupAction`), `src/app/(app)/configuracoes/actions.ts` (`TODO(mfa)`/`TODO(sessions)` em `setTwoFactorAction`), `src/app/(app)/layout.tsx` (KPIs por re-fetch).
- Requisitos: RF-004; F-12, F-37, F-38, F-39.
- Relacionado: [ADR-002](./ADR-002-provisionamento-de-contas-via-service-role.md) (service-role habilita (c); SMTP é pré-requisito de (a)).
- Handoff: `cyber-security-architect` (MFA/AAL, revogação de sessões), `backend-architect` (SMTP, Storage, Realtime).
