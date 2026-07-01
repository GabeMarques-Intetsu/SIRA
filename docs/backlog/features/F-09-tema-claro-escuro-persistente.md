# F-09 — Tema claro/escuro persistente

> **Tipo**: Feature
> **Epic pai**: [EP-02 Shell, Navegação e Roteamento](../epics/EP-02-shell-navegacao-e-roteamento.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟢 Baixa
> **Origem (requisitos)**: [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md)
> **Origem (OpenProject)**: #27534

---

## Descrição (visão de produto)

Permite ao usuário alternar entre tema claro e escuro. A escolha é lembrada nos acessos seguintes e aplicada já no carregamento, sem piscar a cor errada.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md) | Navegação contextual por perfil e adaptação ao dispositivo | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Tema da interface`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | Há um controle para alternar entre tema claro e escuro. | — | 📝 |
| **CA02** | A escolha de tema é mantida no próximo acesso do usuário. | — | 📝 |
| **CA03** | O tema escolhido é aplicado já no carregamento, sem piscar a cor errada. | — | 📝 |
| **CA04** | A troca de tema afeta todas as telas de forma consistente. | — | 📝 |

## User Stories

### US09.1 — Preferência de tema da interface

> **Como** usuário, **quero** alternar entre tema claro e escuro e ter minha escolha lembrada, **para** usar o sistema com o visual mais confortável aos meus olhos em todos os acessos.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Tema da interface

  Cenário: Usuário ativa o tema escuro e a escolha é lembrada
    Dado que Ana está usando o sistema no tema claro
    Quando ela aciona o controle de troca de tema para escuro
    Então toda a interface passa a ser exibida no tema escuro
    E ao entrar novamente no sistema o tema escuro continua aplicado

  Cenário: Tema aplicado já no carregamento sem piscar a cor errada
    Dado que Bruno deixou o tema escuro definido no acesso anterior
    Quando ele abre o sistema novamente
    Então a tela aparece diretamente no tema escuro
    E não há nenhum instante em que a cor clara errada é mostrada

  Cenário: Troca de tema afeta todas as telas de forma consistente
    Dado que Ana ativou o tema escuro na tela inicial
    Quando ela navega para a tela de minhas reservas e para o calendário
    Então todas essas telas são exibidas no tema escuro de forma consistente
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29287
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Tema da interface

  Cenário: Usuário ativa o tema escuro e a escolha é lembrada
    Dado que Ana está usando o sistema no tema claro
    Quando ela aciona o controle de troca de tema para escuro
    Então toda a interface passa a ser exibida no tema escuro
    E ao entrar novamente no sistema o tema escuro continua aplicado

  Cenário: Tema aplicado já no carregamento sem piscar a cor errada
    Dado que Bruno deixou o tema escuro definido no acesso anterior
    Quando ele abre o sistema novamente
    Então a tela aparece diretamente no tema escuro
    E não há nenhum instante em que a cor clara errada é mostrada

  Cenário: Troca de tema afeta todas as telas de forma consistente
    Dado que Ana ativou o tema escuro na tela inicial
    Quando ela navega para a tela de minhas reservas e para o calendário
    Então todas essas telas são exibidas no tema escuro de forma consistente
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T09.1.1 | Validar o callback onToggleDark em bootstrap() (src/main.js) que faz document.documentElement.classList.toggle('dark') e persiste em localStorage['sira-theme'] ('dark'/'light') (CA01/CA02). | ⏳ |
| T09.1.2 | Aplicar o tema persistido já no carregamento lendo localStorage['sira-theme'] e adicionando a classe 'dark' ao <html> em um script inline no index.html (antes do bundle) para evitar flash de cor errada (CA03). | ⏳ |
| T09.1.3 | Garantir no src/style.css que todas as variáveis de cor (--text-*, --border-color, fundos) tenham contraparte sob .dark no <html> para troca consistente em todas as telas (CA04). | ⏳ |

