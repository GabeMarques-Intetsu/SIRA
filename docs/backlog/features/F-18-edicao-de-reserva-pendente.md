# F-18 — Edição de reserva pendente

> **Tipo**: Feature
> **Epic pai**: [EP-07 Minhas Reservas (CRUD)](../epics/EP-07-minhas-reservas-crud.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md)
> **Origem (OpenProject)**: #27378

---

## Descrição (visão de produto)

Permite alterar data, horário ou sala de uma reserva enquanto ela está pendente. Reservas já aprovadas ou recusadas ficam apenas para leitura, preservando o histórico da decisão.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md) | Gestão das próprias reservas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Edição de reserva`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A edição só é permitida para reservas com status pendente. | — | 📝 |
| **CA02** | É possível alterar data, horário ou sala da reserva pendente. | — | 📝 |
| **CA03** | Reservas aprovadas ou recusadas ficam somente para leitura. | — | 📝 |
| **CA04** | A alteração respeita as mesmas regras de conflito de horário. | — | 📝 |

## User Stories

### US18.1 — Edição de reserva pendente

> **Como** professor, **quero** alterar data, horário ou sala de uma reserva enquanto ela está pendente, **para** corrigir os dados antes da decisão sem precisar criar uma reserva nova.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Edição de reserva

  Cenário: Alteração de reserva pendente
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela altera o horário para as 16h
    Então a reserva pendente passa a constar para as 16h

  Cenário: Reserva aprovada fica somente para leitura
    Dado que o professor Bruno tem uma reserva do Lab 1 já aprovada
    Quando ele abre essa reserva para alterar o horário
    Então o sistema não permite a edição
    E mantém a reserva apenas para leitura preservando o histórico da decisão

  Cenário: Edição bloqueada por conflito de horário
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela altera o horário para as 16h, que já está ocupado por outra reserva
    Então a alteração não é aplicada
    E o sistema informa que o novo horário está em conflito
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29293
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Edição de reserva

  Cenário: Alteração de reserva pendente
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela altera o horário para as 16h
    Então a reserva pendente passa a constar para as 16h

  Cenário: Reserva aprovada fica somente para leitura
    Dado que o professor Bruno tem uma reserva do Lab 1 já aprovada
    Quando ele abre essa reserva para alterar o horário
    Então o sistema não permite a edição
    E mantém a reserva apenas para leitura preservando o histórico da decisão

  Cenário: Edição bloqueada por conflito de horário
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela altera o horário para as 16h, que já está ocupado por outra reserva
    Então a alteração não é aplicada
    E o sistema informa que o novo horário está em conflito
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T18.1.1 | Em openEditModal() de reservations.js, bloquear a abertura quando r.status !== 'pendente', exibindo modo somente-leitura (campos disabled) para reservas aprovadas/recusadas (CA01, CA03). | ⏳ |
| T18.1.2 | Adicionar ao corpo do modal de edição os campos editáveis de data, horário (timeSelect) e sala via select populado por getRooms() do store.js (CA02). | ⏳ |
| T18.1.3 | Antes de persistir, validar conflito de horário reutilizando a regra de checagem usada em saveReservation()/getReservations(), abortando o salvamento e exibindo toast() quando houver sobreposição (CA04). | ⏳ |
| T18.1.4 | No handler de salvar, atualizar o objeto da reserva e gravar via saveReservations(getReservations() atualizado), depois chamar refreshTable(tbody) e closeModal() (CA02). | ⏳ |
| T18.1.5 | Em buildRow() de reservations.js, renderizar o botão de editar apenas quando r.status === 'pendente', ocultando-o nos demais status (CA01, CA03). | ⏳ |

