# ADR-003: Padronizar `notification.type` e emitir notificações na Server Action (não em trigger)

## Status

Accepted

Refina o ADR-001, que definiu `notifications` com `type text` (vocabulário aberto) mas não fixou *quais* valores o sistema emite nem *onde* a emissão acontece.

## Context

A coluna `notifications.type` é `text` livre (decisão do ADR-001, para não engessar com enum). Mas a Central de Notificações (F-34) precisa de ícone, cor (M3) e rótulo por tipo, e os fluxos de aprovação/recusa de reserva e de cadastro precisam **emitir** essas notificações de forma consistente. Duas questões em aberto:

1. **Vocabulário** — sem um conjunto canônico de valores, cada fluxo inventaria seu `type`, e o mapa visual (`typeMeta`) divergiria do que é gravado, gerando ícones/cores ausentes (CLS, WCAG 1.4.1 quebrada).
2. **Onde emitir** — duas opções:
   - **Trigger no banco** (`AFTER UPDATE` em `reservations`/`signup_requests`) — emissão garantida, atômica com a mudança de status, à prova de esquecimento na aplicação. Custo: lógica de produto escondida no SQL, mais difícil de testar/versionar com o resto, e o texto/idioma da mensagem vive longe da camada que conhece o contexto do usuário.
   - **Server Action** — a mesma action que aprova/recusa também insere a notificação. Custo: se alguém criar outro caminho de mudança de status sem inserir a notificação, ela não sai (acoplamento por convenção, não por garantia do banco).

## Decision

**Vocabulário canônico de `type` mapeado em `src/lib/notifications.ts`, com emissão feita na Server Action de aprovação/recusa (action-level), e trigger de DB registrado como evolução futura.**

- **Vocabulário.** `NOTIFICATION_TYPE_META` define as famílias semânticas que o sistema emite — incluindo `reservation_approved`, `reservation_rejected`, `account_approved`, `account_rejected` (mais `reservation_pending`, `reservation_cancelled`, `reservation_reminder`, `signup_pending`, `system`). Cada uma carrega `icon` + `iconClass` + `accentClass` + `label` (M3). `typeMeta()` resolve com **fallback seguro** (`NOTIFICATION_TYPE_DEFAULT`) para qualquer `type` desconhecido — nunca ícone/cor ausentes. A informação nunca depende só da cor (WCAG 1.4.1): ícone + título carregam o significado.
- **Emissão action-level agora.** A `approveSignupAction` insere `account_approved` no mesmo fluxo em que cria a conta e marca a solicitação aprovada. As actions de aprovação/recusa de reserva (F-22/F-23) emitem `reservation_approved`/`reservation_rejected` analogamente. Mantém a lógica de produto (texto, idioma, contexto) na camada de aplicação, testável com `node:test`.
- **Trigger como evolução.** Mover a emissão para um trigger `AFTER UPDATE` fica registrado como caminho de hardening quando houver mais de um produtor de mudança de status.

> Nota de implementação: na **recusa de cadastro** (F-33) o solicitante ainda **não tem** `profiles`/`auth.users` (a conta só nasce na aprovação), logo `account_rejected` não pode ser gravado em `notifications` (não há `user_id` alvo). O motivo da recusa fica salvo em `signup_requests.reason` e é exibido quando a pessoa reabre o auto-serviço. O tipo `account_rejected` permanece no vocabulário para o caso simétrico de recusa de conta já existente.

## Consequences

**Positivas:**

- Um único lugar (`notifications.ts`) define o vocabulário e o visual — a UI e os emissores não divergem.
- Fallback seguro elimina ícone/cor ausentes para tipos não mapeados (sem CLS, a11y preservada).
- Lógica de mensagem testável fora do banco, versionada junto do código que a produz.

**Negativas / trade-offs aceitos:**

- Emissão por convenção, não por garantia do banco: um novo caminho de mudança de status que esqueça de inserir a notificação não dispara o aviso. Mitigação atual: caminhos de status concentrados nas Server Actions; mitigação futura: trigger.
- `type` segue `text` livre: nada no banco impede gravar um valor fora do vocabulário (cairia no default). Aceitável dado o fallback; um enum endureceria isso ao custo de evolução (ver ADR-001, Eixo 1).
- Assimetria documentada: `account_rejected` existe no mapa mas não é emitido na recusa de cadastro pré-login.

## Cross-ref

- Implementação: `src/lib/notifications.ts` (`NOTIFICATION_TYPE_META`, `typeMeta`, `NOTIFICATION_TYPE_DEFAULT`), `src/app/(app)/usuarios/actions.ts` (`approveSignupAction`).
- Requisitos: RF-011; F-11, F-21, F-22, F-23, F-34, F-35, F-36.
- Refina: [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md).
