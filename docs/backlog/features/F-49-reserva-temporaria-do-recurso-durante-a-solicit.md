# F-49 — Reserva temporária do recurso durante a solicitação

> **Tipo**: Feature
> **Epic pai**: [EP-06 Nova Reserva](../epics/EP-06-nova-reserva.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) · [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md) · [RNF-reserva-temporaria](../../requirements/RNF/RNF-reserva-temporaria.md)

---

## Descrição (visão de produto)

Quando alguém inicia uma solicitação de reserva de uma sala ou equipamento para uma data e faixa de horário específicas, aquele recurso fica temporariamente indisponível para os outros, evitando que duas pessoas garantam o mesmo recurso/horário ao mesmo tempo. Se a solicitação não for concluída no prazo, a indisponibilidade expira sozinha e o recurso volta a ficar livre. Se a solicitação for enviada, o recurso continua indisponível enquanto a decisão estiver pendente; se aprovada, segue indisponível até o fim da reserva; se recusada ou cancelada, é liberado. O próprio solicitante enxerga o seu bloqueio em andamento; os demais apenas veem o recurso indisponível.

## Requisitos atendidos (rastreabilidade ↑)

| RF / RNF                                                                                   | Requisito                                              | Relação                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------- |
| [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) | Solicitação de reserva com checagem de disponibilidade | Realiza (inicia o bloqueio)        |
| [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md)    | Aprovação e recusa de solicitações                     | Realiza (mantém/libera na decisão) |
| [RNF-reserva-temporaria](../../requirements/RNF/RNF-reserva-temporaria.md)                 | Expiração e consistência do bloqueio                   | Restringe                          |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Início do bloqueio`

| ID       | Critério                                                                                                                                          | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | Ao iniciar uma solicitação para um recurso em uma data e faixa de horário, o recurso fica indisponível aos demais para essa mesma data e horário. | —              | 📝     |
| **CA02** | Dois solicitantes não conseguem garantir o mesmo recurso na mesma data e faixa de horário ao mesmo tempo.                                         | —              | 📝     |
| **CA03** | O bloqueio temporário vale apenas para a data e a faixa de horário escolhidas; outros horários do mesmo recurso seguem livres.                    | —              | 📝     |

**Grupo:** `CA - Expiração`

| ID       | Critério                                                                                                                         | Como verificar | Status |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA04** | Se a solicitação não for concluída no prazo (10 minutos), a indisponibilidade temporária expira e o recurso volta a ficar livre. | —              | 📝     |
| **CA05** | Bloqueios temporários já expirados não influenciam a busca de disponibilidade.                                                   | —              | 📝     |

**Grupo:** `CA - Continuidade na decisão`

| ID       | Critério                                                                                                      | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA06** | Após o envio, enquanto a solicitação está pendente de decisão, o recurso permanece indisponível e não expira. | —              | 📝     |
| **CA07** | Se a solicitação for aprovada, o recurso segue indisponível até o fim da reserva (data e horário).            | —              | 📝     |
| **CA08** | Se a solicitação for recusada ou cancelada, o recurso é liberado imediatamente.                               | —              | 📝     |

**Grupo:** `CA - Visibilidade`

| ID       | Critério                                                                                     | Como verificar | Status |
| -------- | -------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA09** | O próprio solicitante vê o seu bloqueio em andamento.                                        | —              | 📝     |
| **CA10** | Os demais usuários apenas veem o recurso como indisponível, sem detalhes de quem o bloqueou. | —              | 📝     |

## User Stories

### US49.1 — Bloqueio temporário do recurso durante a solicitação

> **Como** professor, **quero** que o recurso fique reservado temporariamente para mim enquanto monto a solicitação, **para** não correr o risco de outra pessoa pegar o mesmo horário antes de eu concluir.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Reserva temporária do recurso durante a solicitação

  Cenário: Iniciar a solicitação torna o recurso indisponível para outro usuário
    Dado que a professora Ana inicia uma solicitação da sala "Lab 1" para amanhã das 14h às 16h
    Quando o professor Bruno busca salas para amanhã das 14h às 16h
    Então a sala "Lab 1" não aparece como disponível para Bruno

  Cenário: Abandonar a solicitação expira e libera o recurso
    Dado que a professora Ana iniciou uma solicitação da sala "Lab 1" para amanhã das 14h às 16h
    E Ana não concluiu a solicitação dentro de 10 minutos
    Quando o professor Bruno busca salas para amanhã das 14h às 16h
    Então a sala "Lab 1" volta a aparecer como disponível para Bruno

  Cenário: Solicitação pendente mantém o recurso indisponível
    Dado que a professora Ana enviou a solicitação da sala "Lab 1" para amanhã das 14h às 16h
    E a solicitação ainda está pendente de decisão
    Quando o professor Bruno busca salas para amanhã das 14h às 16h
    Então a sala "Lab 1" continua indisponível para Bruno

  Cenário: Aprovação mantém o recurso indisponível até o fim da reserva
    Dado que a solicitação da sala "Lab 1" de Ana para amanhã das 14h às 16h foi aprovada
    Quando o professor Bruno busca salas para amanhã das 14h às 16h
    Então a sala "Lab 1" segue indisponível para Bruno

  Cenário: Recusa libera o recurso
    Dado que a solicitação da sala "Lab 1" de Ana para amanhã das 14h às 16h foi recusada
    Quando o professor Bruno busca salas para amanhã das 14h às 16h
    Então a sala "Lab 1" volta a aparecer como disponível para Bruno

  Cenário: O próprio solicitante enxerga o seu bloqueio
    Dado que a professora Ana iniciou uma solicitação da sala "Lab 1" para amanhã das 14h às 16h
    Quando Ana revisa a sua solicitação em andamento
    Então Ana vê que o recurso está reservado temporariamente para ela
```

- **Prioridade**: 🟠 Alta · **Estimativa**: _a estimar_ · **CAs cobertos**: CA01–CA10 · **Status**: 📝

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                                                                                                                   | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T49.1.1 | Criar a tabela `reservation_holds` (recurso/kind, `room_id`/`equipment_id`, `reservation_date`, `start_time`, `end_time`, `user_id`, `expires_at`) com RLS e índice por recurso+data+horário — ver [ADR-009](../../planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md) e [TX-12](../epics/EP-atividades-complementares.md). | ⏳     |
| T49.1.2 | Ao entrar no passo de escolha/confirmação do assistente (`nova-reserva/actions.ts`), criar/renovar o hold do usuário com `expires_at = now() + interval '10 minutes'` (CA01, CA03).                                                                                                                                                    | ⏳     |
| T49.1.3 | Estender `check_resource_availability` (`supabase/migrations/0004`) para também considerar holds **não expirados** (`expires_at > now()`) de outros usuários como ocupação, ignorando os do próprio solicitante (CA01, CA02, CA05, CA09).                                                                                              | ⏳     |
| T49.1.4 | Garantir a anti-corrida na confirmação: ao inserir a reserva pendente, validar atomicamente que não há hold de terceiro nem reserva pending/approved no slot, falhando se houver (CA02).                                                                                                                                               | ⏳     |
| T49.1.5 | Ao enviar a solicitação (status pending), converter/transferir o hold para a reserva pendente, mantendo a indisponibilidade sem `expires_at` enquanto pendente/aprovada (CA06, CA07).                                                                                                                                                  | ⏳     |
| T49.1.6 | Ao recusar/cancelar (`aprovacoes/actions.ts`, cancelamento de reserva), liberar o slot — remover o hold associado (CA08).                                                                                                                                                                                                              | ⏳     |
| T49.1.7 | Rotina de limpeza de holds expirados (job agendado `pg_cron` ou filtro `expires_at > now()` em toda leitura) para que vencidos não influenciem a busca (CA04, CA05) — ver [TX-13](../epics/EP-atividades-complementares.md).                                                                                                           | ⏳     |
| T49.1.8 | Na revisão da própria solicitação, sinalizar ao solicitante que o recurso está reservado temporariamente para ele e exibir aos demais apenas "indisponível" (CA09, CA10).                                                                                                                                                              | ⏳     |

## Dependências técnicas (Tasks transversais)

- [TX-12](../epics/EP-atividades-complementares.md) — tabela `reservation_holds` + RLS + índice.
- [TX-13](../epics/EP-atividades-complementares.md) — limpeza agendada de holds expirados (`pg_cron`) ou filtro `expires_at > now()`.
