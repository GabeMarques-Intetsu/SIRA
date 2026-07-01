# F-35 — Marcar notificação individual como lida

> **Tipo**: Feature
> **Epic pai**: [EP-11 Notificações](../epics/EP-11-notificacoes.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-011](../../requirements/RF/RF-011-central-de-notificacoes-do-usuario.md)
> **Origem (OpenProject)**: #27548

---

## Descrição (visão de produto)

Permite marcar uma notificação como lida ao clicar nela, reduzindo o contador de não lidas e, quando aplicável, levando ao item relacionado (por exemplo, o detalhe da reserva).

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-011](../../requirements/RF/RF-011-central-de-notificacoes-do-usuario.md) | Central de notificações do usuário | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Notificação lida`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | Clicar em uma notificação a marca como lida. | — | 📝 |
| **CA02** | O contador de não lidas diminui ao marcar uma como lida. | — | 📝 |
| **CA03** | Ao clicar, quando aplicável, o usuário é levado ao item relacionado (ex.: detalhe da reserva). | — | 📝 |

## User Stories

### US35.1 — Leitura de uma notificação

> **Como** professor, **quero** clicar em uma notificação para marcá-la como lida e ir ao item relacionado, **para** organizar minha caixa e chegar direto ao detalhe que o aviso menciona.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Notificação lida

  Cenário: Professor marca uma notificação como lida
    Dado que tenho uma notificação por ler no painel
    Quando clico nessa notificação
    Então ela passa a constar como lida
    E o contador de não lidas diminui em uma unidade

  Cenário: Notificação ligada a uma reserva leva ao detalhe
    Dado que recebi uma notificação sobre minha reserva
    Quando clico nessa notificação
    Então sou levado ao detalhe da reserva relacionada

  Cenário: Notificação sem item relacionado apenas é lida
    Dado que recebi um aviso geral sem reserva associada
    Quando clico nesse aviso
    Então ele é marcado como lido
    E permaneço no painel de notificações
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29309
- **CAs cobertos**: CA01, CA02, CA03

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Notificação lida

  Cenário: Professor marca uma notificação como lida
    Dado que tenho uma notificação por ler no painel
    Quando clico nessa notificação
    Então ela passa a constar como lida
    E o contador de não lidas diminui em uma unidade

  Cenário: Notificação ligada a uma reserva leva ao detalhe
    Dado que recebi uma notificação sobre minha reserva
    Quando clico nessa notificação
    Então sou levado ao detalhe da reserva relacionada

  Cenário: Notificação sem item relacionado apenas é lida
    Dado que recebi um aviso geral sem reserva associada
    Quando clico nesse aviso
    Então ele é marcado como lido
    E permaneço no painel de notificações
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T35.1.1 | Manter em createNotificationItem (src/modules/notifications.js) o addEventListener('click') que chama handleMarkAsRead(notification.id). | ⏳ |
| T35.1.2 | Em handleMarkAsRead aplicar map imutavel ({ ...notif, read: true }) e persistir com saveCollection('notifications', updatedNotifications). | ⏳ |
| T35.1.3 | Apos marcar como lida, re-renderizar o painel e chamar window.updateSidebarBadges() para decrementar o contador de nao lidas na sidebar. | ⏳ |
| T35.1.4 | Quando a notificacao possuir reservationId, redirecionar ao detalhe da reserva relacionada no clique; caso contrario, apenas marcar como lida e permanecer no painel. | ⏳ |

