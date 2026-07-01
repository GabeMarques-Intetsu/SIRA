# F-36 — Marcar todas as notificações como lidas

> **Tipo**: Feature
> **Epic pai**: [EP-11 Notificações](../epics/EP-11-notificacoes.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-011](../../requirements/RF/RF-011-central-de-notificacoes-do-usuario.md)
> **Origem (OpenProject)**: #27549

---

## Descrição (visão de produto)

Permite marcar todas as notificações como lidas em uma única ação, zerando o contador de não lidas — útil para limpar a caixa após uma ausência.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                           | Requisito                          | Relação |
| ---------------------------------------------------------------------------- | ---------------------------------- | ------- |
| [RF-011](../../requirements/RF/RF-011-central-de-notificacoes-do-usuario.md) | Central de notificações do usuário | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Todas as notificações lidas`

| ID       | Critério                                                | Como verificar | Status |
| -------- | ------------------------------------------------------- | -------------- | ------ |
| **CA01** | Há uma ação de marcar todas as notificações como lidas. | —              | 📝     |
| **CA02** | Após a ação, o contador de não lidas fica zerado.       | —              | 📝     |
| **CA03** | A ação afeta apenas as notificações do usuário logado.  | —              | 📝     |

## User Stories

### US36.1 — Limpeza geral das notificações por ler

> **Como** professor, **quero** marcar todas as minhas notificações como lidas em uma única ação, **para** limpar a caixa de uma vez após um período de ausência.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Todas as notificações lidas

  Cenário: Professor marca todas as notificações como lidas
    Dado que tenho várias notificações por ler
    Quando uso a ação de marcar todas como lidas
    Então todas passam a constar como lidas
    E o contador de não lidas fica zerado

  Cenário: Ação não atinge notificações de outro usuário
    Dado que "Ana" e "Bruno" possuem notificações por ler
    Quando "Ana" marca todas as suas notificações como lidas
    Então as notificações de "Bruno" continuam por ler

  Cenário: Ação acionada sem notificações por ler
    Dado que não tenho nenhuma notificação por ler
    Quando uso a ação de marcar todas como lidas
    Então o contador de não lidas permanece zerado
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29310
- **CAs cobertos**: CA01, CA02, CA03

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Todas as notificações lidas

  Cenário: Professor marca todas as notificações como lidas
    Dado que tenho várias notificações por ler
    Quando uso a ação de marcar todas como lidas
    Então todas passam a constar como lidas
    E o contador de não lidas fica zerado

  Cenário: Ação não atinge notificações de outro usuário
    Dado que "Ana" e "Bruno" possuem notificações por ler
    Quando "Ana" marca todas as suas notificações como lidas
    Então as notificações de "Bruno" continuam por ler

  Cenário: Ação acionada sem notificações por ler
    Dado que não tenho nenhuma notificação por ler
    Quando uso a ação de marcar todas como lidas
    Então o contador de não lidas permanece zerado
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                             | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T36.1.1 | Adicionar em renderNotifications (src/modules/notifications.js) um botao 'Marcar todas como lidas' no cabecalho do painel.                                                                                       | ⏳     |
| T36.1.2 | Implementar handler que mapeia getNotifications() para { ...n, read: true } e persiste via saveCollection('notifications', ...), afetando apenas as notificacoes do CURRENT_USER (escopo por email do store.js). | ⏳     |
| T36.1.3 | Apos a acao, re-renderizar o painel e chamar window.updateSidebarBadges() para zerar o contador de nao lidas, mantendo idempotencia quando nao ha itens por ler.                                                 | ⏳     |
