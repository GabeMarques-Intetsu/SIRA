# F-07 — Drawer responsivo no mobile

> **Tipo**: Feature
> **Epic pai**: [EP-02 Shell, Navegação e Roteamento](../epics/EP-02-shell-navegacao-e-roteamento.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟢 Baixa
> **Origem (requisitos)**: [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md)
> **Origem (OpenProject)**: #27370

---

## Descrição (visão de produto)

Em telas pequenas, o menu lateral recolhe e passa a abrir e fechar por um botão, liberando espaço para o conteúdo principal; em telas grandes ele volta a ficar fixo.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                         | Requisito                                                  | Relação |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------- |
| [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md) | Navegação contextual por perfil e adaptação ao dispositivo | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Menu em tela pequena`

| ID       | Critério                                                          | Como verificar | Status |
| -------- | ----------------------------------------------------------------- | -------------- | ------ |
| **CA01** | Em telas pequenas, o menu lateral recolhe e dá lugar ao conteúdo. | —              | 📝     |
| **CA02** | Um botão de menu abre e fecha o menu lateral em tela pequena.     | —              | 📝     |
| **CA03** | Com o menu aberto em tela pequena, tocar fora dele o fecha.       | —              | 📝     |
| **CA04** | Em telas grandes, o menu volta a ficar fixo e visível.            | —              | 📝     |

## User Stories

### US07.1 — Menu lateral em telas pequenas

> **Como** usuário, **quero** abrir e fechar o menu lateral por um botão quando estou em uma tela pequena, **para** aproveitar melhor o espaço para o conteúdo principal no celular.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Menu em tela pequena

  Cenário: Menu recolhido em tela pequena
    Dado que Ana acessa o sistema pelo celular
    Quando a tela inicial é exibida
    Então o menu lateral aparece recolhido
    E o conteúdo principal ocupa o espaço disponível

  Cenário: Abrir o menu pelo botão
    Dado que Ana está no celular com o menu recolhido
    Quando ela toca no botão de menu
    Então o menu lateral se abre sobre o conteúdo

  Cenário: Tocar fora fecha o menu
    Dado que Ana está no celular com o menu lateral aberto
    Quando ela toca em uma área fora do menu
    Então o menu lateral se fecha
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29285
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Menu em tela pequena

  Cenário: Menu recolhido em tela pequena
    Dado que Ana acessa o sistema pelo celular
    Quando a tela inicial é exibida
    Então o menu lateral aparece recolhido
    E o conteúdo principal ocupa o espaço disponível

  Cenário: Abrir o menu pelo botão
    Dado que Ana está no celular com o menu recolhido
    Quando ela toca no botão de menu
    Então o menu lateral se abre sobre o conteúdo

  Cenário: Tocar fora fecha o menu
    Dado que Ana está no celular com o menu lateral aberto
    Quando ela toca em uma área fora do menu
    Então o menu lateral se fecha
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                              | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T07.1.1 | Adicionar em src/style.css media queries para recolher .sidebar em telas pequenas (toggle via classe .open) e mantê-la fixa em telas grandes (CA01/CA04).         | ⏳     |
| T07.1.2 | Validar o botão hambúrguer injetado pelo MutationObserver em bootstrap() (src/main.js) que adiciona .open à .sidebar e ao .sidebar-overlay ao ser clicado (CA02). | ⏳     |
| T07.1.3 | Confirmar o listener de click no .sidebar-overlay em bootstrap() que remove .open da sidebar e do overlay para fechar o drawer ao tocar fora (CA03).              | ⏳     |
