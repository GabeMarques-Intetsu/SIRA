# ADR-009: Reserva temporária via tabela de holds com expiração (TTL) considerada na checagem de disponibilidade

## Status

Accepted

ADR de tier 1 (transversal). Fundamenta a Feature [F-49 Reserva temporária do recurso durante a solicitação](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md), estendendo [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) (início do bloqueio) e [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md) (continuidade na decisão). Limites quantitativos em [RNF-reserva-temporaria](../../requirements/RNF/RNF-reserva-temporaria.md).

## Context

Hoje a detecção de conflito ([ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md), migração `0004_availability_functions.sql`) só considera reservas com status `pending` ou `approved`: o recurso só fica indisponível **depois** que a solicitação é enviada. Há uma janela de corrida — dois professores podem montar a mesma reserva (mesmo recurso, data e faixa de horário) ao mesmo tempo, e o conflito só aparece no envio, frustrando um deles após o trabalho.

O requisito novo: ao **iniciar** a solicitação, o recurso já fica temporariamente indisponível aos demais; o bloqueio expira sozinho se a solicitação for abandonada; permanece enquanto pendente; segue até o fim se aprovada; libera se recusada/cancelada. Limites: expiração em **10 minutos**, e **nenhuma dupla reserva simultânea** do mesmo recurso/horário ([RNF-reserva-temporaria](../../requirements/RNF/RNF-reserva-temporaria.md)).

Forças em jogo:

- A checagem de conflito é centralizada em `public.check_resource_availability` (SECURITY DEFINER) e reusada por `search_available_rooms`/`search_available_equipment` — qualquer mecanismo novo deve ser **considerado por essa mesma função**, senão a busca o ignora.
- O bloqueio temporário **não é uma reserva**: não pode aparecer em "minhas reservas" nem disparar notificação de aprovação (RF-007/RF-008/RF-011).
- Sem expiração automática, recursos ficariam travados por solicitações abandonadas.
- ADR-001 já registrou que a _ausência de conflito_ não é imposta por constraint de exclusão (validação na aplicação por ora); o anti-corrida fica a cargo da camada de checagem.

Opções consideradas:

### Eixo 1 — Como representar o bloqueio temporário

1. **Sem hold (otimista)** — não bloqueia nada; conflito só é detectado no envio (`check_resource_availability` na confirmação). Simples, zero estado novo. Não atende o requisito: o recurso _não_ fica indisponível durante a montagem; a corrida persiste.
2. **Reserva `pending` antecipada** — cria a reserva já no início, com expiração. Reusa a tabela e a checagem existentes (pending já bloqueia). Mas: polui "minhas reservas" com rascunhos, dispara/risca a trilha de aprovação, exige distinguir "rascunho" de "enviada", e expirar uma reserva é semanticamente confuso.
3. **Tabela dedicada `reservation_holds` com `expires_at` (TTL)** — bloqueio é um conceito próprio, separado da reserva. A checagem passa a considerar holds não expirados de **outros** usuários como ocupação. Limpo, não contamina reservas/notificações, expira naturalmente.

### Eixo 2 — Como expirar e limpar

1. **`expires_at` filtrado na leitura** (`expires_at > now()`) — todo lugar que checa disponibilidade ignora holds vencidos; limpeza física vira higiene, não correção.
2. **Apenas job de limpeza** — depende do job rodar para a expiração valer; janela de inconsistência entre o vencimento e a varredura.

## Decision

- **Eixo 1 → tabela dedicada `reservation_holds`** (migração **TX-12**): `id`, `resource_kind`, `room_id`/`equipment_id` (XOR como em `reservations`), `reservation_date`, `start_time`, `end_time`, `user_id`, `expires_at`, `created_at`. RLS: o dono lê o próprio hold; a _existência_ de ocupação para os demais é resolvida pela função SECURITY DEFINER (não expõe autor — CA10).
- **Estender `check_resource_availability`** para também tratar como ocupação os holds **não expirados** (`expires_at > now()`) de **outros** usuários (ignorando os do próprio solicitante — CA09), além de `pending`/`approved`. Como a função é reusada pelas buscas, o bloqueio aparece em toda a tela de Nova Reserva sem mudança nos call-sites.
- **Eixo 2 → expiração por filtro `expires_at > now()` na checagem** (autoritativo), **mais** limpeza agendada via `pg_cron` (**TX-13**) apenas como higiene de linhas mortas. TTL = **10 min** ([RNF-reserva-temporaria](../../requirements/RNF/RNF-reserva-temporaria.md)).
- **Ciclo de vida** (CA01–CA08):
  - _Iniciar/avançar a solicitação_ → cria/renova o hold do usuário com `expires_at = now() + interval '10 minutes'`.
  - _Abandonar_ → o hold vence; deixa de contar na checagem.
  - _Enviar_ → na confirmação, validar atomicamente ausência de hold de terceiro e de reserva `pending`/`approved` no slot; ao inserir a reserva `pending`, **remover o hold próprio** (a partir daí quem bloqueia é a reserva pendente — sem `expires_at`).
  - _Aprovar_ → permanece bloqueado pela reserva `approved` até o fim (regra atual já cobre).
  - _Recusar/cancelar_ → a reserva sai de `pending`/`approved` e libera (regra atual já cobre); qualquer hold residual é removido.
- **Anti-corrida**: a re-checagem na confirmação roda dentro da mesma operação do INSERT; se dois confirmam ao mesmo tempo, só um vence (o outro recebe conflito e volta ao passo de escolha). Constraint de exclusão `EXCLUDE USING gist` (já apontada como evolução em ADR-001) fica como reforço futuro.

## Consequences

**Positivas:**

- Fecha a janela de corrida: o recurso fica indisponível desde o início da montagem, não só no envio.
- O hold é um conceito separado: não polui "minhas reservas", não dispara aprovação/notificação, não distorce a trilha `approval_events`.
- Expiração é autoritativa por filtro (`expires_at > now()`), então um atraso do job de limpeza nunca trava um recurso; o `pg_cron` é só higiene.
- A regra de bloqueio fica num só ponto (`check_resource_availability`), reusada por todas as buscas — sem duplicar lógica de conflito.

**Negativas / trade-offs aceitos:**

- Estado novo a manter (tabela, RLS, índice, job) — custo de uma migração e de uma rotina de limpeza.
- Transferência hold → reserva no envio precisa ser atômica para não deixar janela; tratada na Server Action de confirmação.
- TTL fixo de 10 min é um palpite de produto: curto demais frustra quem demora a preencher; longo demais trava o recurso. Ajustável por configuração sem mudar o schema.
- Continua sem constraint de exclusão no banco (herdado de ADR-001): o anti-corrida final depende da re-checagem na confirmação; `EXCLUDE USING gist` fica proposto como blindagem.

## Cross-ref

- Requisitos: [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md), [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md); [RNF-reserva-temporaria](../../requirements/RNF/RNF-reserva-temporaria.md).
- Backlog: [F-49](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md); TX-12 (tabela+RLS+índice), TX-13 (limpeza `pg_cron`) em [EP-atividades-complementares](../../backlog/epics/EP-atividades-complementares.md).
- Relacionado: [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md) (schema, conflito na aplicação, exclusão como evolução), [ADR-006](./ADR-006-status-concluida-ausente-do-enum-reservation-status.md) (estados de reserva).
- Implementação prevista: `supabase/migrations/0008_*` (tabela `reservation_holds` + extensão de `check_resource_availability`), `src/app/(app)/nova-reserva/actions.ts`, `src/app/(app)/aprovacoes/actions.ts`, `src/lib/reservation.ts`.
- Handoff: `backend-architect` (tabela, função, `pg_cron`, atomicidade da confirmação), `cyber-security-architect` (RLS do hold, não-vazamento de autor para terceiros).
