# F-13 — Grade semanal de reservas (7d x 12h)

> **Tipo**: Feature
> **Epic pai**: [EP-05 Calendário (Home)](../epics/EP-05-calendario-home.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-005](../../requirements/RF/RF-005-visualizacao-semanal-das-reservas.md)
> **Origem (OpenProject)**: #27374

---

## Descrição (visão de produto)

Calendário visual com os sete dias da semana e os horários das 7h às 19h. Cada horário mostra a reserva alocada (sala e autor) ou indica que está livre, com navegação entre semanas e destaque para a semana atual.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-005](../../requirements/RF/RF-005-visualizacao-semanal-das-reservas.md) | Visualização semanal das reservas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Calendário semanal`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A grade mostra os 7 dias da semana e os horários das 7h às 19h. | — | 📝 |
| **CA02** | Cada horário ocupado exibe a sala e o autor da reserva. | — | 📝 |
| **CA03** | Horários livres são visualmente distintos dos ocupados. | — | 📝 |
| **CA04** | É possível navegar para a semana anterior e para a próxima. | — | 📝 |
| **CA05** | A semana atual é destacada visualmente. | — | 📝 |

## User Stories

### US13.1 — Calendário semanal de reservas

> **Como** professor, **quero** ver os sete dias da semana com os horários ocupados e livres e navegar entre as semanas, **para** enxergar rapidamente a disponibilidade das salas antes de fazer uma reserva.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Calendário semanal

  Cenário: Grade mostra dias, horários e reservas alocadas
    Dado que o professor abre o calendário semanal
    Quando a semana atual é exibida
    Então a grade apresenta os sete dias da semana e os horários das 7h às 19h
    E o horário das 14h ocupado mostra a sala Lab 1 e o autor da reserva
    E os horários livres aparecem visualmente distintos dos ocupados

  Cenário: Semana atual é destacada na grade
    Dado que o professor abre o calendário semanal
    Quando a grade é apresentada
    Então a semana atual aparece destacada visualmente em relação às demais

  Cenário: Navegação para a próxima semana
    Dado que o professor está vendo a semana atual no calendário
    Quando ele avança para a próxima semana
    Então a grade passa a mostrar os sete dias e horários da semana seguinte
    E é possível voltar para a semana anterior
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29290
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Calendário semanal

  Cenário: Grade mostra dias, horários e reservas alocadas
    Dado que o professor abre o calendário semanal
    Quando a semana atual é exibida
    Então a grade apresenta os sete dias da semana e os horários das 7h às 19h
    E o horário das 14h ocupado mostra a sala Lab 1 e o autor da reserva
    E os horários livres aparecem visualmente distintos dos ocupados

  Cenário: Semana atual é destacada na grade
    Dado que o professor abre o calendário semanal
    Quando a grade é apresentada
    Então a semana atual aparece destacada visualmente em relação às demais

  Cenário: Navegação para a próxima semana
    Dado que o professor está vendo a semana atual no calendário
    Quando ele avança para a próxima semana
    Então a grade passa a mostrar os sete dias e horários da semana seguinte
    E é possível voltar para a semana anterior
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T13.1.1 | Em renderCalendar(page)/buildFragment(page) (src/modules/calendar.js), montar com el() a grade de 7 colunas (dias) x horários das 7h às 19h usando getWeekDates(offset) para os dias da semana. | ⏳ |
| T13.1.2 | Mapear reservas para a grade via reservationsToEvents(reservations, weekDates), preenchendo cada célula ocupada com sala e autor da reserva e aplicando classe visual distinta para horários livres vs ocupados. | ⏳ |
| T13.1.3 | Implementar navegação entre semanas controlando o offset de getWeekDates() e chamando rebuildCalendar(page) ao avançar/voltar, atualizando a grade para a semana seguinte/anterior. | ⏳ |
| T13.1.4 | Destacar visualmente a semana atual (offset 0) na grade comparando getWeekDates(0) com a semana renderizada e aplicando classe CSS de destaque via el(). | ⏳ |

---

## Ampliação (mockups) — Mini-calendário, filtros e visões dia/semana/mês

> **Tipo**: Enriquecimento aditivo a partir do mockup `docs/mockups/03-calendario.html`.
> Não altera as CAs/US existentes; adiciona o mini-calendário de navegação, os filtros por tipo de recurso e bloco, e as visões dia/semana/mês.

### CAs adicionais

**Grupo:** `CA - Mini-calendário`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA06** | Um mini-calendário lateral permite saltar rapidamente para uma data. | — | 📝 |
| **CA07** | A data selecionada no mini-calendário sincroniza com a grade exibida. | — | 📝 |

**Grupo:** `CA - Filtros de calendário`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA08** | É possível filtrar o calendário por tipo de recurso (sala ou equipamento). | — | 📝 |
| **CA09** | É possível filtrar o calendário por bloco. | — | 📝 |
| **CA10** | Os filtros podem ser combinados e refletem-se imediatamente na grade. | — | 📝 |

**Grupo:** `CA - Visões dia/semana/mês`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA11** | A pessoa pode alternar entre as visões de dia, semana e mês. | — | 📝 |
| **CA12** | A visão escolhida preserva a data e os filtros ativos ao alternar. | — | 📝 |

### User Stories adicionais

#### US13.2 — Navegação por mini-calendário e visões

> **Como** professor, **quero** saltar para uma data pelo mini-calendário e alternar entre dia, semana e mês, **para** encontrar rapidamente a disponibilidade no recorte de tempo que me interessa.

```gherkin
# language: pt
Funcionalidade: Mini-calendário e visões

  Cenário: Saltar para uma data pelo mini-calendário
    Dado que o professor está no calendário
    Quando seleciona o dia 22 no mini-calendário
    Então a grade passa a mostrar o período que inclui o dia 22

  Cenário: Alternar para a visão de mês preservando filtros
    Dado que o professor está na visão de semana com um filtro de bloco ativo
    Quando alterna para a visão de mês
    Então a visão muda para o mês
    E o filtro de bloco continua aplicado
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA06, CA07, CA11, CA12

#### US13.3 — Filtros por tipo de recurso e bloco

> **Como** professor, **quero** filtrar o calendário por tipo de recurso e por bloco, **para** ver apenas a disponibilidade que me interessa.

```gherkin
# language: pt
Funcionalidade: Filtros do calendário

  Cenário: Filtrar por bloco
    Dado que o professor está no calendário
    Quando filtra pelo bloco "B"
    Então a grade mostra apenas reservas de recursos do bloco "B"

  Cenário: Combinar filtro de tipo e bloco
    Dado que o professor está no calendário
    Quando filtra pelo tipo "Equipamento" e pelo bloco "C"
    Então a grade mostra apenas equipamentos do bloco "C"
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA08, CA09, CA10

#### Tasks adicionais (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T13.2.1 | Adicionar mini-calendário lateral que, ao selecionar uma data, ajusta o offset de getWeekDates() e chama rebuildCalendar(page) sincronizando com a grade (CA06, CA07). | ⏳ |
| T13.2.2 | Implementar alternância de visão dia/semana/mês mantendo data e filtros ativos no estado do calendário (CA11, CA12). | ⏳ |
| T13.3.1 | Adicionar filtros por tipo de recurso (sala/equipamento) e por bloco, aplicados em reservationsToEvents() antes de montar a grade, combináveis entre si (CA08, CA09, CA10). | ⏳ |

