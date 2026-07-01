# F-12 — Painel administrativo de KPIs em tempo real

> **Tipo**: Feature
> **Epic pai**: [EP-04 Dashboard (Admin)](../epics/EP-04-dashboard-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟢 Baixa
> **Origem (requisitos)**: [RF-004](../../requirements/RF/RF-004-painel-administrativo-de-indicadores-em-tempo-re.md)
> **Origem (OpenProject)**: #27373

---

## Descrição (visão de produto)

Painel do administrador com indicadores do período — total de reservas, taxa de aprovação, salas mais ocupadas e professores ativos — atualizados conforme os dados mudam, sem precisar recarregar a página.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-004](../../requirements/RF/RF-004-painel-administrativo-de-indicadores-em-tempo-re.md) | Painel administrativo de indicadores em tempo real | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Indicadores do painel`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | O painel é acessível apenas ao administrador. | — | 📝 |
| **CA02** | Exibe total de reservas do período, taxa de aprovação, salas mais ocupadas e professores ativos. | — | 📝 |
| **CA03** | Os indicadores refletem os dados atuais e mudam quando as reservas mudam, sem recarregar a página. | — | 📝 |
| **CA04** | Quando não há dados no período, o painel mostra indicadores zerados com aviso de ausência de dados. | — | 📝 |

## User Stories

### US12.1 — Painel de indicadores em tempo real

> **Como** administrador, **quero** ver os indicadores do período atualizados conforme os dados mudam, sem recarregar a tela, **para** acompanhar a ocupação das salas e a atividade dos professores com informação sempre atual.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Indicadores do painel

  Cenário: Painel exibe os indicadores do período
    Dado que o administrador acessa o painel de indicadores
    Quando o período possui reservas registradas
    Então o painel mostra o total de reservas, a taxa de aprovação, as salas mais ocupadas e os professores ativos

  Cenário: Período sem dados mostra indicadores zerados com aviso
    Dado que o administrador acessa o painel de indicadores
    Quando não há nenhuma reserva no período selecionado
    Então o painel mostra os indicadores zerados
    E exibe um aviso de ausência de dados no período

  Cenário: Indicadores se atualizam quando uma reserva muda
    Dado que o administrador está com o painel aberto
    Quando uma reserva da professora Ana para o Lab 1 é aprovada
    Então os indicadores do painel passam a refletir a mudança sem recarregar a tela
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29289
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Indicadores do painel

  Cenário: Painel exibe os indicadores do período
    Dado que o administrador acessa o painel de indicadores
    Quando o período possui reservas registradas
    Então o painel mostra o total de reservas, a taxa de aprovação, as salas mais ocupadas e os professores ativos

  Cenário: Período sem dados mostra indicadores zerados com aviso
    Dado que o administrador acessa o painel de indicadores
    Quando não há nenhuma reserva no período selecionado
    Então o painel mostra os indicadores zerados
    E exibe um aviso de ausência de dados no período

  Cenário: Indicadores se atualizam quando uma reserva muda
    Dado que o administrador está com o painel aberto
    Quando uma reserva da professora Ana para o Lab 1 é aprovada
    Então os indicadores do painel passam a refletir a mudança sem recarregar a tela
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T12.1.1 | Restringir renderDashboard(page) (src/modules/dashboard.js) ao admin, verificando CURRENT_USER.email === 'admin@ifpb.edu.br' antes de montar o painel de KPIs. | ⏳ |
| T12.1.2 | Calcular os indicadores do período (total de reservas, taxa de aprovação, salas mais ocupadas, professores ativos) com computeStats() de src/utils/fp.js sobre getReservations()/getRooms()/getApprovals() consolidados do admin. | ⏳ |
| T12.1.3 | Re-renderizar o painel quando os dados mudam sem reload: após cada saveApproval()/saveReservation(), reexecutar renderDashboard(page) recomputando computeStats() para refletir a mudança imediatamente. | ⏳ |
| T12.1.4 | Tratar período sem dados em renderDashboard(): quando getReservations() do período retornar vazio, exibir KPIs zerados e um aviso de ausência de dados via el() (src/utils/dom.js). | ⏳ |

---

## Ampliação (mockups) — Gráfico de ocupação, filtro de período e tabela de atividade

> **Tipo**: Enriquecimento aditivo a partir do mockup `docs/mockups/02-dashboard.html`.
> Não altera as CAs/US existentes; adiciona a visualização gráfica, o filtro de período e a tabela de atividade recente.

### CAs adicionais

**Grupo:** `CA - Gráfico de ocupação`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA05** | O painel exibe um gráfico de ocupação ao longo do período selecionado. | — | 📝 |
| **CA06** | O gráfico tem alternativa textual/acessível com os mesmos números (acessibilidade). | — | 📝 |

**Grupo:** `CA - Filtro de período`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA07** | É possível escolher o período (ex.: hoje, esta semana, este mês ou intervalo personalizado). | — | 📝 |
| **CA08** | Todos os indicadores, o gráfico e a tabela respeitam o período selecionado. | — | 📝 |

**Grupo:** `CA - Tabela de atividade recente`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA09** | O painel mostra uma tabela com a atividade recente (reservas criadas, aprovadas, recusadas) do período. | — | 📝 |
| **CA10** | A tabela é reapresentada como cards no celular, conforme a responsividade do sistema. | — | 📝 |

### User Stories adicionais

#### US12.2 — Gráfico de ocupação por período

> **Como** administrador, **quero** ver a ocupação em um gráfico e escolher o período, **para** entender visualmente a tendência de uso das salas e equipamentos.

```gherkin
# language: pt
Funcionalidade: Gráfico de ocupação e filtro de período

  Cenário: Trocar o período atualiza o gráfico e os indicadores
    Dado que o administrador está no painel
    Quando seleciona o período "Este mês"
    Então o gráfico de ocupação e os indicadores passam a refletir esse período

  Cenário: Alternativa acessível do gráfico
    Dado que o administrador usa leitor de tela
    Quando consulta o gráfico de ocupação
    Então tem acesso aos mesmos números em forma textual
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA05, CA06, CA07, CA08

#### US12.3 — Tabela de atividade recente

> **Como** administrador, **quero** ver a atividade recente em uma tabela, **para** acompanhar o que aconteceu no período sem abrir cada reserva.

```gherkin
# language: pt
Funcionalidade: Tabela de atividade recente

  Cenário: Listar a atividade do período
    Dado que o administrador seleciona "Esta semana"
    Quando abre o painel
    Então vê uma tabela com as reservas criadas, aprovadas e recusadas na semana

  Cenário: Tabela vira cards no celular
    Dado que o administrador acessa o painel pelo celular
    Quando a tabela de atividade é exibida
    Então ela é reapresentada como cards
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA09, CA10

#### Tasks adicionais (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T12.2.1 | Adicionar seletor de período (hoje/semana/mês/personalizado) e fazer computeStats() recalcular indicadores, gráfico e tabela pelo período escolhido (CA07, CA08). | ⏳ |
| T12.2.2 | Renderizar o gráfico de ocupação do período com alternativa textual acessível dos mesmos valores (CA05, CA06). | ⏳ |
| T12.3.1 | Montar a tabela de atividade recente (criadas/aprovadas/recusadas) do período, com fallback para cards no mobile conforme RNF-responsividade-mobile (CA09, CA10). | ⏳ |

