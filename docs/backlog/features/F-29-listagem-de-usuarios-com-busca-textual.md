# F-29 — Listagem de usuários com busca textual

> **Tipo**: Feature
> **Epic pai**: [EP-10 Gestão de Usuários (Admin)](../epics/EP-10-gestao-de-usuarios-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)
> **Origem (OpenProject)**: #27389

---

## Descrição (visão de produto)

Apresenta ao administrador todos os usuários cadastrados, com busca por nome ou e-mail, filtro por perfil e as ações de editar e excluir em cada um.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md) | Gestão de usuários e solicitações de cadastro | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Listagem de usuários`

| ID       | Critério                                                       | Como verificar | Status |
| -------- | -------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A listagem mostra todos os usuários com nome, e-mail e perfil. | —              | 📝     |
| **CA02** | É possível buscar por nome ou e-mail.                          | —              | 📝     |
| **CA03** | É possível filtrar por perfil (administrador/professor).       | —              | 📝     |
| **CA04** | Cada usuário oferece as ações de editar e excluir.             | —              | 📝     |

## User Stories

### US29.1 — Lista de usuários cadastrados

> **Como** administrador, **quero** ver todos os usuários cadastrados e localizá-los por nome, e-mail ou perfil, **para** gerir as contas e chegar rapidamente a quem eu preciso editar ou excluir.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Lista de usuários

  Cenário: Administrador vê a lista completa de usuários
    Dado que estou autenticado como administrador
    Quando abro a tela de usuários cadastrados
    Então vejo todos os usuários com nome, e-mail e perfil
    E cada usuário oferece as ações de editar e excluir

  Cenário: Busca sem nenhum usuário correspondente
    Dado que estou na tela de usuários cadastrados
    Quando busco por "Zuleica"
    Então a lista fica vazia
    E vejo um aviso de que nenhum usuário foi encontrado

  Cenário: Filtro por perfil de professor
    Dado que estou na tela de usuários cadastrados
    Quando filtro pelo perfil de professor
    Então vejo apenas os usuários com perfil de professor
    E o usuário "Ana", de perfil professor, aparece na lista
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29303
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Lista de usuários

  Cenário: Administrador vê a lista completa de usuários
    Dado que estou autenticado como administrador
    Quando abro a tela de usuários cadastrados
    Então vejo todos os usuários com nome, e-mail e perfil
    E cada usuário oferece as ações de editar e excluir

  Cenário: Busca sem nenhum usuário correspondente
    Dado que estou na tela de usuários cadastrados
    Quando busco por "Zuleica"
    Então a lista fica vazia
    E vejo um aviso de que nenhum usuário foi encontrado

  Cenário: Filtro por perfil de professor
    Dado que estou na tela de usuários cadastrados
    Quando filtro pelo perfil de professor
    Então vejo apenas os usuários com perfil de professor
    E o usuário "Ana", de perfil professor, aparece na lista
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                           | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T29.1.1 | Em refreshTable (src/modules/users.js) renderizar todos os getUsers() via buildRow exibindo nome, e-mail e roleLabel(role) em cada tableRow.                   | ⏳     |
| T29.1.2 | Ligar o searchInput addEventListener('input') de renderUsers a um filtro por nome ou e-mail (case-insensitive) que repopula a tabela via refreshTable.         | ⏳     |
| T29.1.3 | Adicionar select de filtro por perfil (ROLES) no header de renderUsers e combina-lo ao filtro textual em refreshTable para exibir apenas o perfil selecionado. | ⏳     |
| T29.1.4 | Tratar lista vazia em refreshTable inserindo uma linha de aviso 'Nenhum usuario encontrado' quando filtered.length === 0.                                      | ⏳     |
| T29.1.5 | Garantir em buildRow os botoes btn('Editar', ...) -> openUserModal(u, tbody) e btn('Remover', ...) -> deleteUser(u.id, tbody) por linha.                       | ⏳     |
