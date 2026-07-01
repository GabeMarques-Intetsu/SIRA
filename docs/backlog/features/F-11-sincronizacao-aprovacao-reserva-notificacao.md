# F-11 — Sincronização aprovação -> reserva -> notificacão

> **Tipo**: Feature
> **Epic pai**: [EP-03 Camada de Persistência](../epics/EP-03-camada-de-persistencia.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-003](../../requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md)
> **Origem (OpenProject)**: #27372

---

## Descrição (visão de produto)

Ao aprovar ou recusar uma reserva, o sistema atualiza de uma só vez o status da reserva, gera a notificação ao autor e ajusta os contadores em todos os locais relacionados (menu, painel e fila de aprovações), evitando informação inconsistente entre telas.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-003](../../requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md) | Isolamento e continuidade dos dados pessoais de reserva | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Propagação da decisão de reserva`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | Ao aprovar ou recusar uma reserva, o novo status aparece imediatamente em todas as telas relacionadas. | — | 📝 |
| **CA02** | Aprovar ou recusar gera automaticamente a notificação correspondente ao autor da reserva. | — | 📝 |
| **CA03** | Os contadores de pendências (menu, painel, fila de aprovações) são atualizados na mesma ação. | — | 📝 |
| **CA04** | Não fica estado inconsistente: a decisão é aplicada em todos os lugares ou em nenhum. | — | 📝 |

## User Stories

### US11.1 — Propagação da decisão de reserva

> **Como** administrador, **quero** que ao aprovar ou recusar uma reserva o status, a notificação ao autor e os contadores sejam atualizados de uma só vez, **para** nenhuma tela mostre informação desatualizada ou inconsistente sobre a reserva.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Propagação da decisão de reserva

  Cenário: Aprovação atualiza status, notificação e contadores juntos
    Dado que o administrador tem uma reserva pendente da professora Ana para o Lab 1 às 14h
    Quando ele aprova essa reserva
    Então o novo status aprovado aparece imediatamente em todas as telas relacionadas
    E Ana recebe a notificação da aprovação
    E os contadores de pendências do menu, do painel e da fila de aprovações são reduzidos na mesma ação

  Cenário: Falha ao registrar a decisão não deixa estado pela metade
    Dado que o administrador está recusando a reserva do professor Bruno para o Lab 1 às 14h
    Quando ocorre uma falha durante o registro da decisão
    Então a decisão não é aplicada em nenhum lugar
    E o status, a notificação e os contadores permanecem como estavam antes da tentativa

  Cenário: Recusa gera notificação correspondente ao autor
    Dado que o administrador tem uma reserva pendente da professora Ana
    Quando ele recusa essa reserva
    Então o status passa a recusado em todas as telas relacionadas
    E Ana recebe a notificação informando a recusa da sua reserva
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29288
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Propagação da decisão de reserva

  Cenário: Aprovação atualiza status, notificação e contadores juntos
    Dado que o administrador tem uma reserva pendente da professora Ana para o Lab 1 às 14h
    Quando ele aprova essa reserva
    Então o novo status aprovado aparece imediatamente em todas as telas relacionadas
    E Ana recebe a notificação da aprovação
    E os contadores de pendências do menu, do painel e da fila de aprovações são reduzidos na mesma ação

  Cenário: Falha ao registrar a decisão não deixa estado pela metade
    Dado que o administrador está recusando a reserva do professor Bruno para o Lab 1 às 14h
    Quando ocorre uma falha durante o registro da decisão
    Então a decisão não é aplicada em nenhum lugar
    E o status, a notificação e os contadores permanecem como estavam antes da tentativa

  Cenário: Recusa gera notificação correspondente ao autor
    Dado que o administrador tem uma reserva pendente da professora Ana
    Quando ele recusa essa reserva
    Então o status passa a recusado em todas as telas relacionadas
    E Ana recebe a notificação informando a recusa da sua reserva
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T11.1.1 | Em saveApproval()/resolveApproval() (src/data/store.js), encadear updateReservationStatusForApproval() e upsertApprovalNotification() na mesma ação, propagando o novo status à reserva do autor (loadCollection('reservations', approval.userEmail)) e gerando a notificação correspondente (approved/rejected). | ⏳ |
| T11.1.2 | Recalcular e re-renderizar os contadores de pendências (menu, painel via renderDashboard e fila de aprovações) na mesma operação de aprovar/recusar, lendo getReservations()/getApprovals() atualizados para evitar telas desatualizadas. | ⏳ |
| T11.1.3 | Tornar a decisão atômica em saveApproval(): validar approval.userEmail e approval.reservationId antes de gravar e, em caso de falha em qualquer etapa (reserva, notificação ou contador), não persistir nenhuma alteração, mantendo o estado anterior. | ⏳ |
| T11.1.4 | Diferenciar a mensagem da notificação em upsertApprovalNotification() conforme approval.status ('Sua reserva foi aprovada...' vs '...recusada...'), gravando-a na coleção notifications do autor da reserva. | ⏳ |

