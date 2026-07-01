# F-24 — Cadastro de nova sala

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Salas (Admin)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)
> **Origem (OpenProject)**: #27387

---

## Descrição (visão de produto)

Permite ao administrador cadastrar uma nova sala informando nome, capacidade, recursos disponíveis e localização. A sala fica imediatamente disponível para reserva.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md) | Gestão do catálogo de salas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Cadastro de sala`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | O cadastro é acessível apenas ao administrador. | — | 📝 |
| **CA02** | Exige nome, capacidade, recursos disponíveis e localização. | — | 📝 |
| **CA03** | A capacidade deve ser um número maior que zero. | — | 📝 |
| **CA04** | Não é permitido cadastrar sala com nome já existente. | — | 📝 |
| **CA05** | A sala recém-cadastrada fica imediatamente disponível para reserva. | — | 📝 |

## User Stories

### US24.1 — Cadastro de nova sala

> **Como** administrador, **quero** cadastrar uma nova sala com seus dados e recursos, **para** deixá-la disponível para reserva pelos professores.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Cadastro de sala

  Cenário: Cadastrar uma nova sala com dados válidos
    Dado que estou na tela de cadastro de salas
    Quando eu informo o nome "Lab 2", a capacidade "30", os recursos disponíveis e a localização
    Então a sala "Lab 2" é cadastrada
    E fica imediatamente disponível para reserva

  Cenário: Tentar cadastrar sala com capacidade inválida
    Dado que estou na tela de cadastro de salas
    Quando eu informo o nome "Lab 2" e a capacidade "0"
    Então sou avisado de que a capacidade deve ser um número maior que zero
    E a sala não é cadastrada

  Cenário: Tentar cadastrar sala com nome já existente
    Dado que já existe uma sala chamada "Lab 1"
    Quando eu tento cadastrar uma nova sala com o nome "Lab 1"
    Então sou avisado de que já existe uma sala com esse nome
    E a sala não é cadastrada
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29298
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Cadastro de sala

  Cenário: Cadastrar uma nova sala com dados válidos
    Dado que estou na tela de cadastro de salas
    Quando eu informo o nome "Lab 2", a capacidade "30", os recursos disponíveis e a localização
    Então a sala "Lab 2" é cadastrada
    E fica imediatamente disponível para reserva

  Cenário: Tentar cadastrar sala com capacidade inválida
    Dado que estou na tela de cadastro de salas
    Quando eu informo o nome "Lab 2" e a capacidade "0"
    Então sou avisado de que a capacidade deve ser um número maior que zero
    E a sala não é cadastrada

  Cenário: Tentar cadastrar sala com nome já existente
    Dado que já existe uma sala chamada "Lab 1"
    Quando eu tento cadastrar uma nova sala com o nome "Lab 1"
    Então sou avisado de que já existe uma sala com esse nome
    E a sala não é cadastrada
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T24.1.1 | Em openRoomModal() de rooms.js, restringir a abertura do cadastro a administradores (isAdmin/CURRENT_USER do store.js) (CA01). | ⏳ |
| T24.1.2 | Montar o formulário com campos obrigatórios nome (nameInput), capacidade, recursos disponíveis e localização, bloqueando o salvamento se algum estiver vazio (CA02). | ⏳ |
| T24.1.3 | Validar que a capacidade seja número inteiro maior que zero antes de salvar, exibindo toast() de erro caso contrário (CA03). | ⏳ |
| T24.1.4 | Verificar contra getRooms() se já existe sala com o mesmo nome (case-insensitive) e impedir o cadastro duplicado com aviso (CA04). | ⏳ |
| T24.1.5 | Ao validar, persistir a nova sala via saveRoom() com genId() e chamar refreshGrid(grid) para deixá-la imediatamente disponível para reserva (CA05). | ⏳ |

