# F-19 — Cancelamento de reserva pendente

> **Tipo**: Feature
> **Epic pai**: [EP-07 Minhas Reservas (CRUD)](../epics/EP-07-minhas-reservas-crud.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟢 Baixa
> **Origem (requisitos)**: [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md)
> **Origem (OpenProject)**: #27379

---

## Descrição (visão de produto)

Permite ao usuário cancelar uma reserva própria ainda pendente, com confirmação explícita. A reserva passa a constar como cancelada, libera o horário da sala e permanece visível apenas como histórico.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md) | Gestão das próprias reservas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Cancelamento de reserva`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | O cancelamento só é permitido para reservas próprias ainda pendentes. | — | 📝 |
| **CA02** | O cancelamento exige confirmação explícita do usuário. | — | 📝 |
| **CA03** | A reserva cancelada muda para o status cancelada e libera o horário da sala. | — | 📝 |
| **CA04** | A reserva cancelada permanece visível apenas como histórico. | — | 📝 |

## User Stories

### US19.1 — Cancelamento de reserva pendente

> **Como** professor, **quero** cancelar uma reserva própria ainda pendente com confirmação, **para** liberar o horário da sala quando não precisar mais dela.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Cancelamento de reserva

  Cenário: Cancelamento de reserva pendente libera o horário
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela cancela a reserva e confirma a ação
    Então a reserva passa para o status cancelada
    E o horário das 14h do Lab 1 fica liberado
    E a reserva permanece visível apenas como histórico

  Cenário: Cancelamento não permitido para reserva já aprovada
    Dado que o professor Bruno tem uma reserva do Lab 1 já aprovada
    Quando ele tenta cancelar essa reserva
    Então o sistema não permite o cancelamento
    E informa que só é possível cancelar reservas ainda pendentes

  Cenário: Cancelamento exige confirmação explícita
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela aciona o cancelamento mas não confirma a ação
    Então a reserva continua pendente
    E o horário das 14h do Lab 1 permanece reservado
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29294
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Cancelamento de reserva

  Cenário: Cancelamento de reserva pendente libera o horário
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela cancela a reserva e confirma a ação
    Então a reserva passa para o status cancelada
    E o horário das 14h do Lab 1 fica liberado
    E a reserva permanece visível apenas como histórico

  Cenário: Cancelamento não permitido para reserva já aprovada
    Dado que o professor Bruno tem uma reserva do Lab 1 já aprovada
    Quando ele tenta cancelar essa reserva
    Então o sistema não permite o cancelamento
    E informa que só é possível cancelar reservas ainda pendentes

  Cenário: Cancelamento exige confirmação explícita
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela aciona o cancelamento mas não confirma a ação
    Então a reserva continua pendente
    E o horário das 14h do Lab 1 permanece reservado
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T19.1.1 | Em buildRow()/actionsCell de reservations.js, exibir o botão de cancelar somente quando r.status === 'pendente' (CA01). | ⏳ |
| T19.1.2 | No clique de cancelar, disparar confirm() de utils/dom.js exigindo confirmação explícita antes de prosseguir; sem confirmação, manter a reserva pendente (CA02). | ⏳ |
| T19.1.3 | Em deleteReservation()/handler de cancelamento, ao confirmar, alterar status para 'cancelada' e persistir via saveReservations(), liberando o horário da sala (CA03). | ⏳ |
| T19.1.4 | Garantir que a reserva cancelada continue na coleção (não removida) e seja exibida como histórico em refreshTable(), com badge de status cancelada (CA04). | ⏳ |

