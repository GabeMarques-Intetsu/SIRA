# F-27 — Exclusão de sala

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Salas (Admin)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)
> **Origem (OpenProject)**: #27541

---

## Descrição (visão de produto)

Permite ao administrador excluir uma sala, com confirmação. A exclusão é bloqueada quando há reservas futuras associadas, evitando perda de dados de reservas vinculadas.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                    | Requisito                   | Relação |
| --------------------------------------------------------------------- | --------------------------- | ------- |
| [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md) | Gestão do catálogo de salas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Exclusão de sala`

| ID       | Critério                                                                              | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A exclusão exige confirmação explícita.                                               | —              | 📝     |
| **CA02** | A exclusão é bloqueada quando há reservas futuras associadas à sala.                  | —              | 📝     |
| **CA03** | O bloqueio orienta o administrador a migrar ou cancelar as reservas antes de excluir. | —              | 📝     |
| **CA04** | Uma sala excluída deixa de aparecer nas listagens e na busca.                         | —              | 📝     |

## User Stories

### US27.1 — Exclusão de sala

> **Como** administrador, **quero** excluir uma sala que não será mais usada, **para** manter o catálogo limpo sem perder dados de reservas vinculadas.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Exclusão de sala

  Cenário: Excluir uma sala sem reservas futuras
    Dado que a sala "Lab 1" não possui reservas futuras
    Quando eu solicito a exclusão e confirmo a operação
    Então a sala "Lab 1" é excluída
    E deixa de aparecer nas listagens e na busca

  Cenário: Tentar excluir uma sala com reservas futuras
    Dado que a sala "Lab 1" possui uma reserva futura da professora Ana
    Quando eu solicito a exclusão da sala "Lab 1"
    Então a exclusão é bloqueada
    E sou orientado a migrar ou cancelar as reservas antes de excluir

  Cenário: Desistir da exclusão na confirmação
    Dado que a sala "Lab 2" não possui reservas futuras
    Quando eu solicito a exclusão e não confirmo a operação
    Então a sala "Lab 2" continua disponível nas listagens e na busca
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29301
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Exclusão de sala

  Cenário: Excluir uma sala sem reservas futuras
    Dado que a sala "Lab 1" não possui reservas futuras
    Quando eu solicito a exclusão e confirmo a operação
    Então a sala "Lab 1" é excluída
    E deixa de aparecer nas listagens e na busca

  Cenário: Tentar excluir uma sala com reservas futuras
    Dado que a sala "Lab 1" possui uma reserva futura da professora Ana
    Quando eu solicito a exclusão da sala "Lab 1"
    Então a exclusão é bloqueada
    E sou orientado a migrar ou cancelar as reservas antes de excluir

  Cenário: Desistir da exclusão na confirmação
    Dado que a sala "Lab 2" não possui reservas futuras
    Quando eu solicito a exclusão e não confirmo a operação
    Então a sala "Lab 2" continua disponível nas listagens e na busca
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                         | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T27.1.1 | Em buildRoomCard() de rooms.js, adicionar a ação de excluir sala que dispara confirm() de utils/dom.js exigindo confirmação explícita (CA01).                                | ⏳     |
| T27.1.2 | Antes de excluir, verificar em getReservations() se há reservas futuras associadas à sala e bloquear a exclusão caso existam (CA02).                                         | ⏳     |
| T27.1.3 | Quando bloqueada, exibir mensagem orientando o admin a migrar ou cancelar as reservas antes de excluir (CA03).                                                               | ⏳     |
| T27.1.4 | Ao confirmar e sem reservas futuras, remover a sala da coleção via saveRooms(getRooms() filtrado) e chamar refreshGrid(grid) para retirá-la das listagens e da busca (CA04). | ⏳     |
