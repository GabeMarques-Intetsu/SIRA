# F-26 — Edição de sala

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Salas (Admin)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)
> **Origem (OpenProject)**: #27539

---

## Descrição (visão de produto)

Permite ao administrador atualizar nome, capacidade e recursos de uma sala, ou desativá-la. A desativação impede novas reservas sem alterar as reservas já existentes.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                    | Requisito                   | Relação |
| --------------------------------------------------------------------- | --------------------------- | ------- |
| [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md) | Gestão do catálogo de salas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Edição de sala`

| ID       | Critério                                                                         | Como verificar | Status |
| -------- | -------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A edição permite alterar nome, capacidade e recursos da sala.                    | —              | 📝     |
| **CA02** | É possível desativar uma sala existente.                                         | —              | 📝     |
| **CA03** | Desativar uma sala impede novas reservas, mas não altera reservas já existentes. | —              | 📝     |
| **CA04** | A capacidade alterada deve continuar sendo um número maior que zero.             | —              | 📝     |

## User Stories

### US26.1 — Edição de sala

> **Como** administrador, **quero** atualizar os dados de uma sala ou desativá-la, **para** manter o catálogo de salas correto sem afetar reservas já feitas.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Edição de sala

  Cenário: Atualizar os dados de uma sala
    Dado que existe a sala "Lab 1" com capacidade "20"
    Quando eu altero a capacidade para "30" e atualizo os recursos
    Então a sala "Lab 1" passa a constar com capacidade "30" e os novos recursos

  Cenário: Tentar alterar a capacidade para um valor inválido
    Dado que existe a sala "Lab 1" com capacidade "30"
    Quando eu tento alterar a capacidade para "0"
    Então sou avisado de que a capacidade deve ser um número maior que zero
    E a capacidade da sala permanece "30"

  Cenário: Desativar uma sala preservando as reservas existentes
    Dado que a sala "Lab 1" possui uma reserva já confirmada da professora Ana
    Quando eu desativo a sala "Lab 1"
    Então a sala deixa de aceitar novas reservas
    E a reserva já confirmada da professora Ana permanece inalterada
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29300
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Edição de sala

  Cenário: Atualizar os dados de uma sala
    Dado que existe a sala "Lab 1" com capacidade "20"
    Quando eu altero a capacidade para "30" e atualizo os recursos
    Então a sala "Lab 1" passa a constar com capacidade "30" e os novos recursos

  Cenário: Tentar alterar a capacidade para um valor inválido
    Dado que existe a sala "Lab 1" com capacidade "30"
    Quando eu tento alterar a capacidade para "0"
    Então sou avisado de que a capacidade deve ser um número maior que zero
    E a capacidade da sala permanece "30"

  Cenário: Desativar uma sala preservando as reservas existentes
    Dado que a sala "Lab 1" possui uma reserva já confirmada da professora Ana
    Quando eu desativo a sala "Lab 1"
    Então a sala deixa de aceitar novas reservas
    E a reserva já confirmada da professora Ana permanece inalterada
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                        | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T26.1.1 | Reutilizar openRoomModal() de rooms.js em modo de edição, pré-preenchendo nameInput, capacidade e recursos a partir da sala recebida (CA01).                                | ⏳     |
| T26.1.2 | Validar na edição que a capacidade permaneça número inteiro maior que zero, abortando com toast() se inválida (CA04).                                                       | ⏳     |
| T26.1.3 | Adicionar ao modal a ação de desativar a sala, setando uma flag de status (ex.: active=false) persistida via saveRoom() (CA02).                                             | ⏳     |
| T26.1.4 | Garantir que a desativação apenas impeça novas reservas (checagem no fluxo de saveReservation/seleção de sala) sem alterar reservas existentes em getReservations() (CA03). | ⏳     |
| T26.1.5 | Após salvar, persistir via saveRoom()/saveRooms() e chamar refreshGrid(grid) para refletir os novos dados (CA01).                                                           | ⏳     |
