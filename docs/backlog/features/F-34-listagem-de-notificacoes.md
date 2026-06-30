# F-34 — Listagem de notificações

> **Tipo**: Feature
> **Epic pai**: [EP-11 Notificações](../epics/EP-11-notificacoes.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-011](../../requirements/RF/RF-011-central-de-notificacoes-do-usuario.md)
> **Origem (OpenProject)**: #27390

---

## Descrição (visão de produto)

Painel acessível pelo ícone de notificações, com contador de não lidas, que lista as notificações do usuário da mais recente para a mais antiga, mostrando título, mensagem e data.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                           | Requisito                          | Relação |
| ---------------------------------------------------------------------------- | ---------------------------------- | ------- |
| [RF-011](../../requirements/RF/RF-011-central-de-notificacoes-do-usuario.md) | Central de notificações do usuário | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Lista de notificações`

| ID       | Critério                                                                            | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | O painel é acessível pelo ícone de notificações no topo, com contador de não lidas. | —              | 📝     |
| **CA02** | Lista as notificações do usuário da mais recente para a mais antiga.                | —              | 📝     |
| **CA03** | Cada notificação mostra título, mensagem e data.                                    | —              | 📝     |
| **CA04** | Notificações lidas e não lidas são visualmente diferenciadas.                       | —              | 📝     |
| **CA05** | Quando não há notificações, exibe aviso de caixa vazia.                             | —              | 📝     |

## User Stories

### US34.1 — Painel de notificações do usuário

> **Como** professor, **quero** abrir um painel com minhas notificações da mais recente para a mais antiga e ver quantas estão por ler, **para** acompanhar os avisos sobre minhas reservas sem perder nada importante.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Lista de notificações

  Cenário: Professor abre o painel e vê suas notificações
    Dado que tenho notificações recebidas
    Quando abro o painel pelo ícone de notificações no topo
    Então vejo minhas notificações da mais recente para a mais antiga
    E cada uma mostra título, mensagem e data
    E as lidas e não lidas aparecem visualmente diferenciadas

  Cenário: Painel sem nenhuma notificação
    Dado que ainda não recebi nenhuma notificação
    Quando abro o painel de notificações
    Então vejo um aviso de caixa vazia

  Cenário: Contador mostra a quantidade de não lidas
    Dado que tenho três notificações por ler
    Quando observo o ícone de notificações no topo
    Então o contador indica três notificações não lidas
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29308
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Lista de notificações

  Cenário: Professor abre o painel e vê suas notificações
    Dado que tenho notificações recebidas
    Quando abro o painel pelo ícone de notificações no topo
    Então vejo minhas notificações da mais recente para a mais antiga
    E cada uma mostra título, mensagem e data
    E as lidas e não lidas aparecem visualmente diferenciadas

  Cenário: Painel sem nenhuma notificação
    Dado que ainda não recebi nenhuma notificação
    Quando abro o painel de notificações
    Então vejo um aviso de caixa vazia

  Cenário: Contador mostra a quantidade de não lidas
    Dado que tenho três notificações por ler
    Quando observo o ícone de notificações no topo
    Então o contador indica três notificações não lidas
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                            | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T34.1.1 | Em renderNotifications (src/modules/notifications.js) carregar getNotifications() e ordenar por createdAt decrescente (new Date(b.createdAt) - new Date(a.createdAt)) antes de mapear os itens. | ⏳     |
| T34.1.2 | Renderizar cada item via createNotificationItem mostrando titulo, message e formatDate(createdAt), com notif-dot diferenciando lidas (classe 'read') de nao lidas.                              | ⏳     |
| T34.1.3 | Tratar caixa vazia em renderNotifications exibindo um aviso de caixa vazia quando getNotifications() retorna lista vazia (CA05).                                                                | ⏳     |
| T34.1.4 | Em src/components/sidebar.js manter o badge do item de notificacoes via getNotifications().filter((n) => !n.read).length e garantir que window.updateSidebarBadges atualize o contador no topo. | ⏳     |
