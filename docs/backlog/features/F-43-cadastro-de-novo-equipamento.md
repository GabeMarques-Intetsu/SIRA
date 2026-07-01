# F-43 — Cadastro de novo equipamento

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Recursos (Salas e Equipamentos)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md)

---

## Descrição (visão de produto)

Permite ao administrador cadastrar um novo equipamento informando nome, tipo, estado de disponibilidade (ativo, inativo ou em manutenção) e o vínculo a um bloco ou sala. O equipamento ativo fica imediatamente disponível para reserva.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                           | Requisito                          | Relação |
| ---------------------------------------------------------------------------- | ---------------------------------- | ------- |
| [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) | Gestão do catálogo de equipamentos | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Cadastro de equipamento`

| ID       | Critério                                                                                       | Como verificar | Status |
| -------- | ---------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | O cadastro é acessível apenas ao administrador.                                                | —              | 📝     |
| **CA02** | Exige nome, tipo, estado de disponibilidade e o vínculo a um bloco ou sala.                    | —              | 📝     |
| **CA03** | O estado deve ser um entre: ativo, inativo ou em manutenção.                                   | —              | 📝     |
| **CA04** | Não é permitido cadastrar equipamento com nome já existente.                                   | —              | 📝     |
| **CA05** | Equipamento cadastrado como ativo fica imediatamente disponível para reserva.                  | —              | 📝     |
| **CA06** | Equipamento cadastrado como inativo ou em manutenção não aparece como disponível para reserva. | —              | 📝     |

## User Stories

### US43.1 — Cadastro de novo equipamento

> **Como** administrador, **quero** cadastrar um novo equipamento com seu tipo, estado e vínculo, **para** disponibilizá-lo (quando ativo) para reserva pelos professores.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Cadastro de equipamento

  Cenário: Cadastrar um novo equipamento ativo
    Dado que estou na aba Equipamentos da gestão de recursos
    Quando informo o nome "Projetor 04", o tipo "Projetor", o estado "Ativo" e o vínculo ao "Bloco B"
    Então o equipamento "Projetor 04" é cadastrado
    E fica imediatamente disponível para reserva

  Cenário: Cadastrar equipamento em manutenção
    Dado que estou na aba Equipamentos da gestão de recursos
    Quando informo o nome "Câmera 02", o tipo "Câmera" e o estado "Em manutenção"
    Então o equipamento é cadastrado
    E não aparece como disponível para reserva

  Cenário: Tentar cadastrar equipamento com nome já existente
    Dado que já existe um equipamento chamado "Microfone 01"
    Quando tento cadastrar um novo equipamento com o nome "Microfone 01"
    Então sou avisado de que já existe um equipamento com esse nome
    E o equipamento não é cadastrado
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                           | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T43.1.1 | Restringir a abertura do cadastro de equipamento a administradores (isAdmin/CURRENT_USER do store) (CA01).                                                                     | ⏳     |
| T43.1.2 | Montar o formulário com campos obrigatórios nome, tipo, estado (ativo/inativo/manutenção) e vínculo a bloco/sala, bloqueando o salvamento se algum estiver vazio (CA02, CA03). | ⏳     |
| T43.1.3 | Verificar contra getEquipments() se já existe equipamento com o mesmo nome (case-insensitive) e impedir cadastro duplicado com aviso (CA04).                                   | ⏳     |
| T43.1.4 | Persistir o novo equipamento via saveEquipment() com genId() e refletir na grade; garantir que apenas estado "ativo" o torne reservável (CA05, CA06).                          | ⏳     |
