# F-45 — Edição de equipamento

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Recursos (Salas e Equipamentos)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md)

---

## Descrição (visão de produto)

Permite ao administrador editar um equipamento existente, alterando nome, tipo, estado de disponibilidade e vínculo a bloco/sala. Mudar o estado para "em manutenção" ou "inativo" o remove da disponibilidade para novas reservas.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) | Gestão do catálogo de equipamentos | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Edição de equipamento`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A edição é acessível apenas ao administrador. | — | 📝 |
| **CA02** | É possível alterar nome, tipo, estado e vínculo a bloco/sala. | — | 📝 |
| **CA03** | Não é permitido renomear para um nome já usado por outro equipamento. | — | 📝 |
| **CA04** | Alterar o estado para inativo ou em manutenção remove o equipamento da disponibilidade para novas reservas. | — | 📝 |
| **CA05** | As reservas já aprovadas não são apagadas ao mudar o estado; apenas novas reservas ficam bloqueadas. | — | 📝 |

## User Stories

### US45.1 — Edição de equipamento

> **Como** administrador, **quero** editar os dados e o estado de um equipamento, **para** mantê-lo atualizado e controlar sua disponibilidade.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Edição de equipamento

  Cenário: Colocar equipamento em manutenção
    Dado que edito o equipamento "Projetor 04"
    Quando altero o estado para "Em manutenção"
    Então o equipamento deixa de aparecer como disponível para novas reservas

  Cenário: Renomear para nome já existente é barrado
    Dado que existe o equipamento "Microfone 01"
    Quando edito outro equipamento e tento renomeá-lo para "Microfone 01"
    Então sou avisado de que já existe um equipamento com esse nome
    E a alteração não é salva

  Cenário: Reservas aprovadas são preservadas
    Dado que o equipamento "Projetor 04" tem reservas aprovadas futuras
    Quando altero seu estado para "Inativo"
    Então as reservas aprovadas continuam existindo
    E apenas novas reservas ficam bloqueadas
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T45.1.1 | Restringir a edição a administradores e pré-popular o formulário com os dados do equipamento selecionado (CA01, CA02). | ⏳ |
| T45.1.2 | Validar unicidade de nome (excluindo o próprio registro) antes de salvar (CA03). | ⏳ |
| T45.1.3 | Persistir as alterações via saveEquipment() garantindo que estado inativo/manutenção exclua o equipamento das buscas de disponibilidade, sem remover reservas aprovadas existentes (CA04, CA05). | ⏳ |
