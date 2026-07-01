# F-08 — Tabelas adaptadas como cards no mobile

> **Tipo**: Feature
> **Epic pai**: [EP-02 Shell, Navegação e Roteamento](../epics/EP-02-shell-navegacao-e-roteamento.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟢 Baixa
> **Origem (requisitos)**: [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md)
> **Origem (OpenProject)**: #27533

---

## Descrição (visão de produto)

Em telas pequenas, as listagens (Minhas Reservas, Aprovações, Salas, Usuários) deixam de ser tabelas e passam a ser cards empilhados, com cada campo rotulado, evitando rolagem lateral.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                         | Requisito                                                  | Relação |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------- |
| [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md) | Navegação contextual por perfil e adaptação ao dispositivo | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Listas em tela pequena`

| ID       | Critério                                                                       | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------ | -------------- | ------ |
| **CA01** | Em telas pequenas, cada linha das listas é apresentada como um card empilhado. | —              | 📝     |
| **CA02** | Cada card mostra os mesmos campos da linha, com rótulo para cada valor.        | —              | 📝     |
| **CA03** | Não há rolagem horizontal nas listas em telas pequenas.                        | —              | 📝     |
| **CA04** | Em telas grandes, as listas voltam ao formato de tabela.                       | —              | 📝     |

## User Stories

### US08.1 — Listas em formato de cartões no celular

> **Como** usuário, **quero** ver as listagens como cartões empilhados quando estou em uma tela pequena, **para** consultar as informações sem precisar rolar a tela para o lado.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Listas em tela pequena

  Cenário: Listagem vira cartões no celular
    Dado que Ana acessa Minhas Reservas pelo celular
    Quando a lista é exibida
    Então cada reserva aparece como um cartão empilhado
    E cada valor exibe o rótulo do campo correspondente

  Cenário: Sem rolagem para o lado
    Dado que Bruno consulta a lista de Aprovações pelo celular
    Quando a lista é exibida em cartões
    Então não é necessário rolar a tela para o lado para ver as informações

  Cenário: Tabela completa em tela grande
    Dado que Ana acessa a lista de Salas em um computador de tela grande
    Quando a lista é exibida
    Então as informações voltam a aparecer no formato de tabela
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29286
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Listas em tela pequena

  Cenário: Listagem vira cartões no celular
    Dado que Ana acessa Minhas Reservas pelo celular
    Quando a lista é exibida
    Então cada reserva aparece como um cartão empilhado
    E cada valor exibe o rótulo do campo correspondente

  Cenário: Sem rolagem para o lado
    Dado que Bruno consulta a lista de Aprovações pelo celular
    Quando a lista é exibida em cartões
    Então não é necessário rolar a tela para o lado para ver as informações

  Cenário: Tabela completa em tela grande
    Dado que Ana acessa a lista de Salas em um computador de tela grande
    Quando a lista é exibida
    Então as informações voltam a aparecer no formato de tabela
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                    | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T08.1.1 | Garantir que addTableLabels(container) em src/main.js seja chamado após cada renderer em navigate() para preencher data-label em todos os <td> das listagens Minhas Reservas, Aprovações, Salas e Usuários (CA01/CA02). | ⏳     |
| T08.1.2 | Adicionar em src/style.css media query mobile que converte table/thead/tbody/tr/td em cards empilhados usando o atributo data-label como rótulo via ::before e ocultando o thead (CA01/CA02).                           | ⏳     |
| T08.1.3 | Garantir no CSS mobile que os cards eliminem rolagem horizontal (overflow-x evitado, largura 100%) e que em telas grandes as listas voltem ao display de tabela padrão (CA03/CA04).                                     | ⏳     |
