# F-21 — Fila consolidada de aprovações pendentes

> **Tipo**: Feature
> **Epic pai**: [EP-08 Fluxo de Aprovações](../epics/EP-08-fluxo-de-aprovacoes.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md)
> **Origem (OpenProject)**: #27385

---

## Descrição (visão de produto)

Tela do administrador que reúne todas as solicitações de reserva pendentes, das mais antigas para as mais recentes, mostrando autor, sala, horário e justificativa, com as ações de aprovar e recusar em cada item.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md) | Aprovação e recusa de solicitações de reserva | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Fila de aprovações`

| ID       | Critério                                                              | Como verificar | Status |
| -------- | --------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A fila é acessível apenas ao administrador.                           | —              | 📝     |
| **CA02** | Lista todas as reservas com status pendente.                          | —              | 📝     |
| **CA03** | Ordena por data de criação, das mais antigas para as mais recentes.   | —              | 📝     |
| **CA04** | Cada item mostra autor, sala, horário e justificativa do solicitante. | —              | 📝     |
| **CA05** | Cada item oferece as ações de aprovar e recusar.                      | —              | 📝     |
| **CA06** | A contagem de pendências é atualizada ao aprovar ou recusar.          | —              | 📝     |
| **CA07** | É possível filtrar por sala e buscar pelo nome do autor.              | —              | 📝     |
| **CA08** | Quando não há pendências, exibe "Nenhuma solicitação pendente".       | —              | 📝     |

## User Stories

### US21.1 — Painel Restrito de Gerenciamento Cronológico de Solicitações

> **Como** administrador do SIRA
> **Quero** acessar uma fila unificada e restrita contendo todas as solicitações de reserva pendentes de forma cronológica
> **Para** analisar as justificativas e tomar decisões de forma organizada.

#### Cenários BDD

````gherkin
# language: pt
Funcionalidade: Painel restrito e ordenação cronológica das solicitações

  Cenário: Apenas administrador acessa a fila
    Dado que um professor está logado
    Quando tenta acessar a fila de aprovações
    Então o acesso é negado

  Cenário: Fila lista pendentes das mais antigas primeiro
    Dado que existem três solicitações pendentes criadas em dias diferentes
    Quando o administrador acessa a fila de aprovações
    Então vê as três solicitações
    E elas aparecem da mais antiga para a mais recente

  Cenário: Fila vazia exibe mensagem
    Dado que não há solicitações pendentes
    Quando o administrador acessa a fila
    Então o sistema exibe "Nenhuma solicitação pendente"
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28344
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07, CA08

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Painel restrito e ordenação cronológica das solicitações

  Cenário: Apenas administrador acessa a fila
    Dado que um professor está logado
    Quando tenta acessar a fila de aprovações
    Então o acesso é negado

  Cenário: Fila lista pendentes das mais antigas primeiro
    Dado que existem três solicitações pendentes criadas em dias diferentes
    Quando o administrador acessa a fila de aprovações
    Então vê as três solicitações
    E elas aparecem da mais antiga para a mais recente

  Cenário: Fila vazia exibe mensagem
    Dado que não há solicitações pendentes
    Quando o administrador acessa a fila
    Então o sistema exibe "Nenhuma solicitação pendente"
````

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                    | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T21.1.1 | Em renderApprovals() de approvals.js, validar o papel do usuário (isAdmin/CURRENT_USER do store.js) e bloquear o acesso de não-administradores, exibindo aviso de acesso negado (CA01). | ⏳     |
| T21.1.2 | Em refreshList(), obter os pendentes via getApprovals()/getReservations() filtrando status 'pendente' e ordenar por data de criação ascendente (mais antigas primeiro) (CA02, CA03).    | ⏳     |
| T21.1.3 | Em buildApprovalCard() de approvals.js, renderizar autor, sala, horário e justificativa do solicitante em cada item da fila (CA04).                                                     | ⏳     |
| T21.1.4 | Em refreshList(), quando a lista de pendentes estiver vazia, renderizar a mensagem 'Nenhuma solicitação pendente' (CA08).                                                               | ⏳     |

### US21.2 — Recursos de Filtragem, Pesquisa e Gatilhos de Ação na Fila

> **Como** administrador do SIRA
> **Quero** poder realizar buscas textuais pelo nome do professor solicitante e filtrar por sala específica dentro da fila
> **Para** agilizar a localização de registros de alta urgência.

#### Cenários BDD

````gherkin
# language: pt
Funcionalidade: Filtragem, pesquisa e ações na fila

  Cenário: Filtro por sala
    Dado que há solicitações pendentes para várias salas
    Quando o administrador filtra pela sala "Lab 1"
    Então a fila mostra apenas solicitações da sala "Lab 1"

  Cenário: Aprovar atualiza a contagem de pendências
    Dado que há duas solicitações pendentes
    Quando o administrador aprova uma delas
    Então o contador de pendências passa a indicar uma solicitação
    E a solicitação aprovada sai da fila
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28345
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07, CA08

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Filtragem, pesquisa e ações na fila

  Cenário: Filtro por sala
    Dado que há solicitações pendentes para várias salas
    Quando o administrador filtra pela sala "Lab 1"
    Então a fila mostra apenas solicitações da sala "Lab 1"

  Cenário: Aprovar atualiza a contagem de pendências
    Dado que há duas solicitações pendentes
    Quando o administrador aprova uma delas
    Então o contador de pendências passa a indicar uma solicitação
    E a solicitação aprovada sai da fila
````

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                        | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T21.2.1 | Adicionar à topbar de renderApprovals() um campo de busca textual por nome do autor e um select de filtro por sala (populado via getRooms()) (CA07).        | ⏳     |
| T21.2.2 | Em refreshList(), aplicar os filtros de sala e o termo de busca por autor antes de montar os cards via buildApprovalCard() (CA07).                          | ⏳     |
| T21.2.3 | Em buildApprovalCard(), incluir os botões de aprovar e recusar acionando resolveDecision(a, decision, list) (CA05).                                         | ⏳     |
| T21.2.4 | Após resolveDecision()/resolveApproval(), remover o item resolvido da fila e atualizar o contador de pendências exibido na topbar via refreshList() (CA06). | ⏳     |

---

## Ampliação (mockups) — Indicadores da fila de aprovações

> **Tipo**: Enriquecimento aditivo a partir do mockup `docs/mockups/08-aprovacoes.html`.
> Não altera as CAs/US existentes; adiciona os indicadores (KPIs) da fila, incluindo o tempo médio de aprovação.

### CAs adicionais

**Grupo:** `CA - Indicadores da fila`

| ID       | Critério                                                                                         | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------ | -------------- | ------ |
| **CA09** | A tela exibe indicadores resumindo a fila: total de pendentes, aprovadas e recusadas no período. | —              | 📝     |
| **CA10** | A tela exibe o tempo médio de aprovação (intervalo médio entre criação e decisão).               | —              | 📝     |
| **CA11** | Os indicadores se atualizam ao aprovar ou recusar, sem recarregar a página.                      | —              | 📝     |

### User Story adicional

#### US21.3 — Indicadores da fila de aprovações

> **Como** administrador, **quero** ver indicadores da fila, incluindo o tempo médio de aprovação, **para** dimensionar minha carga de trabalho e a agilidade do atendimento.

```gherkin
# language: pt
Funcionalidade: Indicadores da fila de aprovações

  Cenário: Exibir o tempo médio de aprovação
    Dado que existem reservas já decididas no período
    Quando o administrador abre a fila de aprovações
    Então vê o tempo médio entre a criação da solicitação e a decisão

  Cenário: Indicadores atualizam ao decidir
    Dado que o administrador está com a fila aberta
    Quando aprova uma solicitação pendente
    Então os indicadores de pendentes e aprovadas se atualizam sem recarregar a página
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA09, CA10, CA11

#### Tasks adicionais (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                             | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T21.3.1 | Calcular os indicadores da fila (pendentes/aprovadas/recusadas e tempo médio de aprovação) a partir de getApprovals()/getReservations() do período (CA09, CA10). | ⏳     |
| T21.3.2 | Renderizar os KPIs no topo da tela e recomputá-los em refreshList() após cada decisão, sem reload (CA11).                                                        | ⏳     |
