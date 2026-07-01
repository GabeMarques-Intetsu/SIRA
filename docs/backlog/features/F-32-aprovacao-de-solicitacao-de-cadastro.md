# F-32 — Aprovação de solicitação de cadastro

> **Tipo**: Feature
> **Epic pai**: [EP-10 Gestão de Usuários (Admin)](../epics/EP-10-gestao-de-usuarios-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)
> **Origem (OpenProject)**: #27546

---

## Descrição (visão de produto)

Ação do administrador que aprova uma solicitação de cadastro pendente, criando o usuário no sistema e avisando o solicitante de que já pode entrar.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md) | Gestão de usuários e solicitações de cadastro | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Aprovação de cadastro`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A ação é acessível apenas ao administrador. | — | 📝 |
| **CA02** | Aprovar uma solicitação cria efetivamente o usuário e o habilita a acessar. | — | 📝 |
| **CA03** | O solicitante é notificado de que já pode entrar. | — | 📝 |
| **CA04** | A solicitação aprovada sai da fila de pendentes. | — | 📝 |

## User Stories

### US32.1 — Aprovação de um pedido de cadastro pendente

> **Como** administrador, **quero** aprovar uma solicitação de cadastro pendente, criando o usuário e avisando o solicitante, **para** liberar o acesso de quem foi autorizado a usar o sistema.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Aprovação de cadastro

  Cenário: Administrador aprova um pedido de cadastro
    Dado que existe uma solicitação pendente de "Ana", com e-mail "ana@ifpb.edu.br"
    Quando aprovo a solicitação
    Então o usuário "Ana" é criado e habilitado a acessar
    E "Ana" é avisada de que já pode entrar
    E a solicitação sai da fila de pendentes

  Cenário: Pessoa sem perfil de administrador tenta aprovar
    Dado que estou autenticada como professora
    Quando tento abrir a fila de solicitações pendentes
    Então a ação de aprovar não fica disponível para mim

  Cenário: Fila de pendentes sem nenhuma solicitação
    Dado que não há solicitações de cadastro pendentes
    Quando abro a fila de pendentes
    Então vejo um aviso de que não há solicitações a aprovar
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29306
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Aprovação de cadastro

  Cenário: Administrador aprova um pedido de cadastro
    Dado que existe uma solicitação pendente de "Ana", com e-mail "ana@ifpb.edu.br"
    Quando aprovo a solicitação
    Então o usuário "Ana" é criado e habilitado a acessar
    E "Ana" é avisada de que já pode entrar
    E a solicitação sai da fila de pendentes

  Cenário: Pessoa sem perfil de administrador tenta aprovar
    Dado que estou autenticada como professora
    Quando tento abrir a fila de solicitações pendentes
    Então a ação de aprovar não fica disponível para mim

  Cenário: Fila de pendentes sem nenhuma solicitação
    Dado que não há solicitações de cadastro pendentes
    Quando abro a fila de pendentes
    Então vejo um aviso de que não há solicitações a aprovar
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T32.1.1 | Restringir o botao 'Solicitacoes de Cadastro' em renderUsers e a chamada renderSignupsModal(tbody) a CURRENT_USER.role === 'admin'. | ⏳ |
| T32.1.2 | No btn('Aprovar') de renderSignupsModal (src/modules/users.js) criar o usuario com saveUsers([...allUsers, { id: genId('u'), name, email, role }]) e marcar s.approved=true persistindo em localStorage 'sira:signups'. | ⏳ |
| T32.1.3 | Emitir notificacao ao solicitante via saveNotification (src/data/store.js) informando que o cadastro foi aprovado e ja pode acessar. | ⏳ |
| T32.1.4 | Apos aprovar, remover o item da fila de pendentes (filter por !approved) e reabrir renderSignupsModal(tbody); quando pending.length === 0 exibir toast('Nenhum cadastro pendente.'). | ⏳ |

