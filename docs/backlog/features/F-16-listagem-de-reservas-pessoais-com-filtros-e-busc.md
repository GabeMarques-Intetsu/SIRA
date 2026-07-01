# F-16 — Listagem de reservas pessoais com filtros e busca

> **Tipo**: Feature
> **Epic pai**: [EP-07 Minhas Reservas (CRUD)](../epics/EP-07-minhas-reservas-crud.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md)
> **Origem (OpenProject)**: #27377

---

## Descrição (visão de produto)

Tela ‘Minhas Reservas’ que lista todas as reservas do usuário logado, ordenadas por data (mais recentes primeiro), com filtros por status (pendente/aprovada/recusada/cancelada), por período (próximos 7d, mês, customizado) e busca textual por nome de sala.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                     | Requisito                    | Relação |
| ---------------------------------------------------------------------- | ---------------------------- | ------- |
| [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md) | Gestão das próprias reservas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Listagem e filtros das reservas`

| ID       | Critério                                                                                       | Como verificar | Status |
| -------- | ---------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | Lista todas as reservas do usuário logado.                                                     | —              | 📝     |
| **CA02** | A ordenação padrão é por data, das mais recentes para as mais antigas.                         | —              | 📝     |
| **CA03** | É possível filtrar por status (pendente, aprovada, recusada, cancelada), com seleção múltipla. | —              | 📝     |
| **CA04** | É possível filtrar por período (próximos 7 dias, mês corrente ou intervalo personalizado).     | —              | 📝     |
| **CA05** | A busca por texto filtra pelo nome da sala.                                                    | —              | 📝     |
| **CA06** | Os filtros e a busca combinam entre si.                                                        | —              | 📝     |
| **CA07** | Cada reserva exibe um indicador visual do seu status.                                          | —              | 📝     |
| **CA08** | Quando não há resultados, exibe "Nenhuma reserva encontrada".                                  | —              | 📝     |
| **CA09** | A partir de 50 itens, a lista é paginada ou usa rolagem para manter o desempenho.              | —              | 📝     |
| **CA10** | Cada item leva ao detalhe da reserva.                                                          | —              | 📝     |

## User Stories

### US16.1 — Visualização Base e Ordenação da Lista de Reservas Pessoais

> **Como** professor autenticado no SIRA
> **Quero** acessar a tela &quot;Minhas Reservas&quot;
> **Para** visualizar todos os meus agendamentos ordenados de forma decrescente com indicativos de status , para acompanhar a situação de cada solicitação de forma organizada.

#### Cenários BDD

````gherkin
# language: pt
Funcionalidade: Visualização base e ordenação das reservas pessoais

  Cenário: Lista mostra só as reservas do usuário, mais recentes primeiro
    Dado que a professora "Ana" possui várias reservas em datas diferentes
    Quando acessa "Minhas Reservas"
    Então vê apenas as suas reservas
    E elas aparecem ordenadas da mais recente para a mais antiga

  Cenário: Lista vazia exibe mensagem
    Dado que o professor não possui nenhuma reserva
    Quando acessa "Minhas Reservas"
    Então o sistema exibe "Nenhuma reserva encontrada"
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28346
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07, CA08, CA09, CA10

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Visualização base e ordenação das reservas pessoais

  Cenário: Lista mostra só as reservas do usuário, mais recentes primeiro
    Dado que a professora "Ana" possui várias reservas em datas diferentes
    Quando acessa "Minhas Reservas"
    Então vê apenas as suas reservas
    E elas aparecem ordenadas da mais recente para a mais antiga

  Cenário: Lista vazia exibe mensagem
    Dado que o professor não possui nenhuma reserva
    Quando acessa "Minhas Reservas"
    Então o sistema exibe "Nenhuma reserva encontrada"
````

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                    | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T16.1.1 | Em renderReservations(page) (src/modules/reservations.js), carregar getReservations() (que para não-admin já retorna só as do usuário logado via isMine) e renderizar a tabela com buildRow() via el(). | ⏳     |
| T16.1.2 | Ordenar as reservas por data de forma decrescente (mais recentes primeiro) antes de montar a tabela em refreshTable(tbody), usando formatDate() para exibição.                                          | ⏳     |
| T16.1.3 | Renderizar para cada reserva um indicador visual de status via statusBadge() (src/utils/fp.js), aplicando a classe de badge correspondente (badge-pending/approved/rejected).                           | ⏳     |
| T16.1.4 | Quando getReservations() retornar lista vazia, exibir a mensagem 'Nenhuma reserva encontrada' no corpo da tabela via el().                                                                              | ⏳     |

### US16.2 — Recursos de Filtragem Combinada, Busca por Texto e Otimização

> **Como** professor autenticado no SIRA
> **Quero** aplicar filtros avançados por período ou status e fazer buscas textuais por sala combinadas com recursos de paginação
> **Para** localizar registros específicos com rapidez sem comprometer a performance do navegador.

#### Cenários BDD

````gherkin
# language: pt
Funcionalidade: Filtragem combinada, busca por texto e otimização

  Cenário: Filtros por status e período combinam
    Dado que "Ana" tem reservas aprovadas e pendentes em vários períodos
    Quando filtra por status "aprovada" e período "mês corrente"
    Então a lista mostra apenas reservas aprovadas do mês corrente

  Cenário: Busca por nome de sala
    Dado que "Ana" tem reservas em diferentes salas
    Quando digita "Lab 1" na busca
    Então a lista mostra apenas reservas da sala "Lab 1"
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28347
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07, CA08, CA09, CA10

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Filtragem combinada, busca por texto e otimização

  Cenário: Filtros por status e período combinam
    Dado que "Ana" tem reservas aprovadas e pendentes em vários períodos
    Quando filtra por status "aprovada" e período "mês corrente"
    Então a lista mostra apenas reservas aprovadas do mês corrente

  Cenário: Busca por nome de sala
    Dado que "Ana" tem reservas em diferentes salas
    Quando digita "Lab 1" na busca
    Então a lista mostra apenas reservas da sala "Lab 1"
````

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                 | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T16.2.1 | Adicionar em renderReservations(page) controles de filtro por status com seleção múltipla e por período (próximos 7 dias, mês corrente, intervalo personalizado), aplicando-os sobre a lista em refreshTable(tbody). | ⏳     |
| T16.2.2 | Filtrar por status combinando filterByStatus() (src/utils/fp.js) com a seleção múltipla e por período comparando datas das reservas com o intervalo escolhido, encadeando os predicados via Array.filter.            | ⏳     |
| T16.2.3 | Implementar busca textual por nome de sala usando filterByText(list, query, ['roomName']) (src/utils/fp.js), combinando o resultado com os filtros de status e período ativos.                                       | ⏳     |
| T16.2.4 | Aplicar paginação ou rolagem em refreshTable(tbody) a partir de 50 itens para preservar o desempenho do navegador, e ligar cada buildRow() ao detalhe via openViewModal(r).                                          | ⏳     |
