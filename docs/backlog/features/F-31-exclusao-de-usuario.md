# F-31 — Exclusão de usuário

> **Tipo**: Feature
> **Epic pai**: [EP-10 Gestão de Usuários (Admin)](../epics/EP-10-gestao-de-usuarios-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)
> **Origem (OpenProject)**: #27545

---

## Descrição (visão de produto)

Permite ao administrador excluir um usuário, com confirmação. As reservas associadas são preservadas e marcadas para manter o histórico; recomenda-se desativar quando o histórico é extenso.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md) | Gestão de usuários e solicitações de cadastro | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Exclusão de usuário`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A exclusão exige confirmação explícita. | — | 📝 |
| **CA02** | As reservas do usuário excluído são preservadas e marcadas, não apagadas. | — | 📝 |
| **CA03** | O sistema recomenda desativar em vez de excluir quando há histórico extenso. | — | 📝 |
| **CA04** | Um usuário excluído não consegue mais acessar o sistema. | — | 📝 |

## User Stories

### US31.1 — Remoção de um usuário com preservação do histórico

> **Como** administrador, **quero** excluir um usuário com confirmação, mantendo as reservas dele preservadas, **para** encerrar contas que não devem mais acessar o sistema sem perder o histórico de reservas.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Exclusão de usuário

  Cenário: Administrador exclui um usuário após confirmar
    Dado que estou prestes a excluir o usuário "Bruno"
    Quando confirmo a exclusão
    Então "Bruno" deixa de constar na lista de usuários
    E "Bruno" não consegue mais acessar o sistema
    E as reservas de "Bruno" continuam preservadas e marcadas

  Cenário: Exclusão cancelada na confirmação
    Dado que iniciei a exclusão do usuário "Ana"
    Quando desisto na tela de confirmação
    Então "Ana" continua cadastrada e com acesso normal

  Cenário: Recomendação de desativar quando há histórico extenso
    Dado que o usuário "Ana" possui um histórico extenso de reservas
    Quando inicio a exclusão de "Ana"
    Então o sistema recomenda desativar a conta em vez de excluí-la
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29305
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Exclusão de usuário

  Cenário: Administrador exclui um usuário após confirmar
    Dado que estou prestes a excluir o usuário "Bruno"
    Quando confirmo a exclusão
    Então "Bruno" deixa de constar na lista de usuários
    E "Bruno" não consegue mais acessar o sistema
    E as reservas de "Bruno" continuam preservadas e marcadas

  Cenário: Exclusão cancelada na confirmação
    Dado que iniciei a exclusão do usuário "Ana"
    Quando desisto na tela de confirmação
    Então "Ana" continua cadastrada e com acesso normal

  Cenário: Recomendação de desativar quando há histórico extenso
    Dado que o usuário "Ana" possui um histórico extenso de reservas
    Quando inicio a exclusão de "Ana"
    Então o sistema recomenda desativar a conta em vez de excluí-la
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T31.1.1 | Em deleteUser (src/modules/users.js) manter o confirm() de src/utils/dom.js exigindo confirmacao explicita antes de qualquer remocao. | ⏳ |
| T31.1.2 | Ao confirmar, remover o usuario com saveUsers(getUsers().filter((u) => u.id !== id)) e marcar suas reservas via getReservations()/saveReservations adicionando flag { ownerDeleted: true } em vez de apaga-las. | ⏳ |
| T31.1.3 | Antes de abrir o confirm, contar as reservas do usuario em getReservations() e, se exceder um limite, exibir mensagem recomendando desativar em vez de excluir. | ⏳ |
| T31.1.4 | Atualizar a UI apos a exclusao chamando refreshTable(tbody) para que o usuario removido deixe de constar na listagem. | ⏳ |

