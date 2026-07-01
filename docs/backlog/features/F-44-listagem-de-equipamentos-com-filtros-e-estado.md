# F-44 — Listagem de equipamentos com filtros e estado

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Recursos (Salas e Equipamentos)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md)

---

## Descrição (visão de produto)

Na aba Equipamentos da tela de Recursos, o administrador vê os equipamentos em cards com nome, tipo, vínculo e estado (ativo, inativo, em manutenção). Pode filtrar por estado (Todas/Ativas/Inativas/Manutenção) e buscar pelo nome, com paginação quando a lista é grande.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                           | Requisito                          | Relação |
| ---------------------------------------------------------------------------- | ---------------------------------- | ------- |
| [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) | Gestão do catálogo de equipamentos | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Listagem e filtros`

| ID       | Critério                                                                                   | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------ | -------------- | ------ |
| **CA01** | Cada equipamento é exibido com nome, tipo, vínculo (bloco/sala) e estado.                  | —              | 📝     |
| **CA02** | É possível filtrar por estado: todos, ativos, inativos ou em manutenção.                   | —              | 📝     |
| **CA03** | A busca por nome reduz a lista aos equipamentos correspondentes.                           | —              | 📝     |
| **CA04** | O estado "em manutenção" é destacado visualmente (ex.: selo de manutenção).                | —              | 📝     |
| **CA05** | Listas grandes são paginadas, mostrando o total e a faixa exibida.                         | —              | 📝     |
| **CA06** | A alternância entre as abas Salas e Equipamentos preserva os filtros próprios de cada aba. | —              | 📝     |

## User Stories

### US44.1 — Listagem e filtros de equipamentos

> **Como** administrador, **quero** listar, filtrar por estado e buscar equipamentos, **para** localizar e acompanhar rapidamente o parque de equipamentos.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Listagem de equipamentos

  Cenário: Filtrar por equipamentos em manutenção
    Dado que estou na aba Equipamentos da gestão de recursos
    Quando seleciono o filtro "Manutenção"
    Então a lista mostra apenas equipamentos em manutenção
    E cada um exibe o selo de manutenção

  Cenário: Buscar equipamento pelo nome
    Dado que estou na aba Equipamentos
    Quando digito "projetor" na busca
    Então a lista mostra apenas equipamentos cujo nome corresponde a "projetor"

  Cenário: Lista grande é paginada
    Dado que existem mais equipamentos do que cabem em uma página
    Quando abro a aba Equipamentos
    Então vejo a paginação com o total e a faixa exibida
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                              | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T44.1.1 | Renderizar os cards de equipamento a partir de getEquipments(), exibindo nome, tipo, vínculo e estado com selo visual de manutenção (CA01, CA04). | ⏳     |
| T44.1.2 | Implementar os filtros por estado (todos/ativo/inativo/manutenção) e a busca textual por nome sobre a coleção (CA02, CA03).                       | ⏳     |
| T44.1.3 | Aplicar paginação com indicador de total/faixa quando a lista exceder o limite por página (CA05).                                                 | ⏳     |
| T44.1.4 | Manter o estado de filtro independente por aba (Salas/Equipamentos) ao alternar as tabs (CA06).                                                   | ⏳     |
