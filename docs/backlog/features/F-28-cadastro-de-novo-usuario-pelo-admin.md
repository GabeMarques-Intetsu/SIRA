# F-28 — Cadastro de novo usuário pelo admin

> **Tipo**: Feature
> **Epic pai**: [EP-10 Gestão de Usuários (Admin)](../epics/EP-10-gestao-de-usuarios-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)
> **Origem (OpenProject)**: #27388

---

## Descrição (visão de produto)

Permite ao administrador criar diretamente um usuário informando nome, e-mail, perfil e senha inicial, sem passar pelo fluxo de auto-serviço — usado para casos excepcionais.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md) | Gestão de usuários e solicitações de cadastro | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Cadastro de usuário`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | O cadastro é acessível apenas ao administrador. | — | 📝 |
| **CA02** | Exige nome, e-mail, perfil (administrador/professor) e senha inicial. | — | 📝 |
| **CA03** | Não é permitido cadastrar usuário com e-mail já existente. | — | 📝 |
| **CA04** | O usuário criado por esse caminho já fica ativo, sem passar pela aprovação de solicitação. | — | 📝 |

## User Stories

### US28.1 — Cadastro de novo usuário pelo administrador

> **Como** administrador, **quero** criar diretamente um usuário informando seus dados de acesso, **para** atender casos excepcionais sem passar pelo fluxo de auto-serviço.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Cadastro de usuário

  Cenário: Criar um usuário com dados válidos
    Dado que estou na tela de cadastro de usuários
    Quando eu informo o nome "Ana", o e-mail "ana@ifpb.edu.br", o perfil de professor e uma senha inicial
    Então o usuário "Ana" é criado
    E já fica ativo, sem passar pela aprovação de solicitação

  Cenário: Tentar criar usuário com e-mail já existente
    Dado que já existe um usuário com o e-mail "ana@ifpb.edu.br"
    Quando eu tento criar um novo usuário com o e-mail "ana@ifpb.edu.br"
    Então sou avisado de que já existe um usuário com esse e-mail
    E o usuário não é criado

  Cenário: Tentar criar usuário sem informar o perfil
    Dado que estou na tela de cadastro de usuários
    Quando eu informo o nome "Bruno", o e-mail "bruno@ifpb.edu.br" e a senha inicial, mas não escolho o perfil
    Então sou avisado de que o perfil é obrigatório
    E o usuário não é criado
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29302
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Cadastro de usuário

  Cenário: Criar um usuário com dados válidos
    Dado que estou na tela de cadastro de usuários
    Quando eu informo o nome "Ana", o e-mail "ana@ifpb.edu.br", o perfil de professor e uma senha inicial
    Então o usuário "Ana" é criado
    E já fica ativo, sem passar pela aprovação de solicitação

  Cenário: Tentar criar usuário com e-mail já existente
    Dado que já existe um usuário com o e-mail "ana@ifpb.edu.br"
    Quando eu tento criar um novo usuário com o e-mail "ana@ifpb.edu.br"
    Então sou avisado de que já existe um usuário com esse e-mail
    E o usuário não é criado

  Cenário: Tentar criar usuário sem informar o perfil
    Dado que estou na tela de cadastro de usuários
    Quando eu informo o nome "Bruno", o e-mail "bruno@ifpb.edu.br" e a senha inicial, mas não escolho o perfil
    Então sou avisado de que o perfil é obrigatório
    E o usuário não é criado
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T28.1.1 | Adicionar botao '+ Adicionar Usuario' em renderUsers (src/modules/users.js) que chama openUserModal(null, tbody) apenas quando CURRENT_USER.role === 'admin'. | ⏳ |
| T28.1.2 | Estender openUserModal (src/modules/users.js) com um campo de senha inicial via formField, exigindo nome, e-mail, perfil (roleSelect com ROLES ['professor','admin']) e senha; bloquear submit com toast de erro quando perfil ou senha faltarem. | ⏳ |
| T28.1.3 | No onClick de criacao do modal, validar e-mail duplicado contra getUsers() antes do saveUsers, exibindo toast('E-mail ja cadastrado.', 'error') e abortando a criacao. | ⏳ |
| T28.1.4 | Persistir o novo usuario com saveUsers([...all, { id: genId('u'), name, email, role, password, active: true }]) garantindo status ativo imediato sem passar por sira:signups, e chamar refreshTable(tbody). | ⏳ |

