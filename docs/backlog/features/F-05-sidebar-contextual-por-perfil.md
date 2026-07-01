# F-05 — Sidebar contextual por perfil

> **Tipo**: Feature
> **Epic pai**: [EP-02 Shell, Navegação e Roteamento](../epics/EP-02-shell-navegacao-e-roteamento.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md)
> **Origem (OpenProject)**: #27368

---

## Descrição (visão de produto)

Menu lateral cujo conteúdo muda conforme o perfil: o administrador vê as seções de gestão (Salas, Usuários, Aprovações, Painel) e o professor vê apenas Minhas Reservas, Nova Reserva, Calendário e Notificações, com um contador de pendências ao lado dos itens.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                         | Requisito                                                  | Relação |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------- |
| [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md) | Navegação contextual por perfil e adaptação ao dispositivo | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Menu por perfil`

| ID       | Critério                                                                                                | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | O administrador vê as seções de gestão (Salas, Usuários, Aprovações, Painel).                           | —              | 📝     |
| **CA02** | O professor vê apenas Minhas Reservas, Nova Reserva, Calendário e Notificações.                         | —              | 📝     |
| **CA03** | Seções restritas ao administrador não aparecem para o professor.                                        | —              | 📝     |
| **CA04** | O item da seção atual fica destacado no menu.                                                           | —              | 📝     |
| **CA05** | O contador de pendências/notificações aparece junto ao item correspondente e reflete a quantidade real. | —              | 📝     |

## User Stories

### US05.1 — Menu lateral conforme o perfil

> **Como** usuário, **quero** ver no menu lateral apenas as seções correspondentes ao meu perfil, **para** navegar com clareza pelas funções que me dizem respeito.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Menu por perfil

  Cenário: Professor vê apenas suas seções
    Dado que Ana entrou no sistema como professora
    Quando ela observa o menu lateral
    Então ela vê Minhas Reservas, Nova Reserva, Calendário e Notificações
    E não vê as seções de gestão do administrador

  Cenário: Administrador vê as seções de gestão
    Dado que Bruno entrou no sistema como administrador
    Quando ele observa o menu lateral
    Então ele vê as seções Salas, Usuários, Aprovações e Painel

  Cenário: Contador de pendências junto ao item
    Dado que Ana tem 3 notificações ainda não lidas
    Quando ela observa o item Notificações no menu lateral
    Então o número 3 aparece ao lado do item
    E reflete a quantidade real de pendências
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29283
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Menu por perfil

  Cenário: Professor vê apenas suas seções
    Dado que Ana entrou no sistema como professora
    Quando ela observa o menu lateral
    Então ela vê Minhas Reservas, Nova Reserva, Calendário e Notificações
    E não vê as seções de gestão do administrador

  Cenário: Administrador vê as seções de gestão
    Dado que Bruno entrou no sistema como administrador
    Quando ele observa o menu lateral
    Então ele vê as seções Salas, Usuários, Aprovações e Painel

  Cenário: Contador de pendências junto ao item
    Dado que Ana tem 3 notificações ainda não lidas
    Quando ela observa o item Notificações no menu lateral
    Então o número 3 aparece ao lado do item
    E reflete a quantidade real de pendências
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                             | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T05.1.1 | Revisar o filtro RBAC de NAV_ITEMS em createSidebar() (src/components/sidebar.js) para que professor veja apenas reservas, calendario, novaReserva e notificacoes, e admin veja salas, usuarios, aprovacoes e dashboard/painel (CA01/CA02/CA03). | ⏳     |
| T05.1.2 | Corrigir o item 'notificacoes' em NAV_ITEMS removendo roles:['admin'] para que o professor também veja Notificações conforme CA02.                                                                                                               | ⏳     |
| T05.1.3 | Garantir o destaque do item ativo aplicando a classe 'active' no nav-item correspondente à página atual no onClick e na renderização inicial de createSidebar() (CA04).                                                                          | ⏳     |
| T05.1.4 | Validar os badges via getReservations()/getApprovals()/getNotifications() e window.updateSidebarBadges() para refletir a contagem real de pendências ao lado do item (CA05).                                                                     | ⏳     |
