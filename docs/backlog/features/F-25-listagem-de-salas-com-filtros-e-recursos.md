# F-25 — Listagem de salas com filtros e recursos

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Salas (Admin)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)
> **Origem (OpenProject)**: #27537

---

## Descrição (visão de produto)

Apresenta ao administrador as salas existentes com seus recursos e capacidade, permitindo filtrar por situação e recursos e enxergar a ocupação atual e próxima de cada uma.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md) | Gestão do catálogo de salas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Listagem de salas`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A listagem mostra todas as salas com capacidade e recursos. | — | 📝 |
| **CA02** | É possível filtrar por status (ativa/inativa) e por recursos. | — | 📝 |
| **CA03** | Cada sala indica a quantidade de reservas atuais/próximas. | — | 📝 |
| **CA04** | Salas inativas são visualmente diferenciadas das ativas. | — | 📝 |

## User Stories

### US25.1 — Listagem de salas com filtros e recursos

> **Como** administrador, **quero** ver as salas existentes com seus recursos e poder filtrá-las, **para** acompanhar a ocupação e a situação de cada sala.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Listagem de salas

  Cenário: Visualizar as salas com capacidade e recursos
    Dado que existem as salas "Lab 1" e "Lab 2" cadastradas
    Quando eu abro a listagem de salas
    Então vejo cada sala com sua capacidade e seus recursos
    E vejo a quantidade de reservas atuais e próximas de cada sala

  Cenário: Filtrar salas por situação e recurso sem resultados
    Dado que nenhuma sala ativa possui o recurso "projetor"
    Quando eu filtro por salas ativas com o recurso "projetor"
    Então a listagem aparece vazia
    E sou informado de que nenhuma sala atende ao filtro

  Cenário: Diferenciar salas inativas das ativas
    Dado que a sala "Lab 1" está ativa e a sala "Lab 2" está inativa
    Quando eu abro a listagem de salas
    Então a sala "Lab 2" aparece visualmente diferenciada como inativa
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29299
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Listagem de salas

  Cenário: Visualizar as salas com capacidade e recursos
    Dado que existem as salas "Lab 1" e "Lab 2" cadastradas
    Quando eu abro a listagem de salas
    Então vejo cada sala com sua capacidade e seus recursos
    E vejo a quantidade de reservas atuais e próximas de cada sala

  Cenário: Filtrar salas por situação e recurso sem resultados
    Dado que nenhuma sala ativa possui o recurso "projetor"
    Quando eu filtro por salas ativas com o recurso "projetor"
    Então a listagem aparece vazia
    E sou informado de que nenhuma sala atende ao filtro

  Cenário: Diferenciar salas inativas das ativas
    Dado que a sala "Lab 1" está ativa e a sala "Lab 2" está inativa
    Quando eu abro a listagem de salas
    Então a sala "Lab 2" aparece visualmente diferenciada como inativa
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T25.1.1 | Em buildRoomCard() de rooms.js, exibir capacidade e lista de recursos de cada sala obtida via getRooms() (CA01). | ⏳ |
| T25.1.2 | Adicionar à filterRow controles de filtro por status (ativa/inativa) e por recursos, reaplicados em refreshGrid() (CA02). | ⏳ |
| T25.1.3 | Em refreshGrid(), quando o filtro não retornar salas, renderizar estado vazio informando que nenhuma sala atende ao filtro (CA02). | ⏳ |
| T25.1.4 | Em buildRoomCard(), calcular e exibir a quantidade de reservas atuais/próximas da sala cruzando getReservations() pela sala (CA03). | ⏳ |
| T25.1.5 | Aplicar diferenciação visual (status-dot/classe de inativa) em buildRoomCard() para salas inativas (CA04). | ⏳ |

