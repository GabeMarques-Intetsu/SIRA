# F-30 — Edição de usuário

> **Tipo**: Feature
> **Epic pai**: [EP-10 Gestão de Usuários (Admin)](../epics/EP-10-gestao-de-usuarios-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)
> **Origem (OpenProject)**: #27544

---

## Descrição (visão de produto)

Permite ao administrador atualizar nome e perfil de um usuário, promover ou rebaixar entre professor e administrador e redefinir a senha. O e-mail não é alterável após a criação.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md) | Gestão de usuários e solicitações de cadastro | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Edição de usuário`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A edição permite alterar nome e perfil do usuário. | — | 📝 |
| **CA02** | É possível promover um professor a administrador e vice-versa. | — | 📝 |
| **CA03** | É possível redefinir a senha do usuário. | — | 📝 |
| **CA04** | O e-mail não pode ser alterado após a criação. | — | 📝 |

## User Stories

### US30.1 — Atualização dos dados de um usuário

> **Como** administrador, **quero** alterar o nome e o perfil de um usuário e redefinir a senha dele, **para** manter os dados corretos e ajustar o nível de acesso conforme a função da pessoa.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Edição de usuário

  Cenário: Administrador altera nome e perfil de um usuário
    Dado que estou editando o usuário "Ana"
    Quando troco o nome para "Ana Paula" e o perfil para administrador
    E confirmo a alteração
    Então os novos dados de "Ana Paula" ficam salvos

  Cenário: Tentativa de alterar o e-mail de um usuário
    Dado que estou editando o usuário "Bruno"
    Quando abro o formulário de edição
    Então o campo de e-mail aparece bloqueado para alteração
    E só posso modificar nome, perfil e senha

  Cenário: Administrador redefine a senha de um usuário
    Dado que estou editando o usuário "Bruno"
    Quando informo uma nova senha e confirmo
    Então a nova senha de "Bruno" passa a valer no próximo acesso dele
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29304
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Edição de usuário

  Cenário: Administrador altera nome e perfil de um usuário
    Dado que estou editando o usuário "Ana"
    Quando troco o nome para "Ana Paula" e o perfil para administrador
    E confirmo a alteração
    Então os novos dados de "Ana Paula" ficam salvos

  Cenário: Tentativa de alterar o e-mail de um usuário
    Dado que estou editando o usuário "Bruno"
    Quando abro o formulário de edição
    Então o campo de e-mail aparece bloqueado para alteração
    E só posso modificar nome, perfil e senha

  Cenário: Administrador redefine a senha de um usuário
    Dado que estou editando o usuário "Bruno"
    Quando informo uma nova senha e confirmo
    Então a nova senha de "Bruno" passa a valer no próximo acesso dele
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T30.1.1 | Em openUserModal (src/modules/users.js) no modo isEdit pre-popular nameInput, emailInput e roleSelect com os dados do user e marcar emailInput como readOnly/disabled. | ⏳ |
| T30.1.2 | Permitir alterar role no roleSelect entre 'professor' e 'admin' e persistir a promocao/rebaixamento no saveUsers via all.map preservando id e email. | ⏳ |
| T30.1.3 | Adicionar campo opcional de redefinicao de senha no modal de edicao; quando preenchido, mesclar { ...u, password } no objeto salvo por saveUsers. | ⏳ |
| T30.1.4 | No onClick de salvar, montar o patch { ...u, name, email: u.email, role } ignorando qualquer mudanca de email e exibir toast('Usuario atualizado.', 'success') seguido de refreshTable(tbody). | ⏳ |

