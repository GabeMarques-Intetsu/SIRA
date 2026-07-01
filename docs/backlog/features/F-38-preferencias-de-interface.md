# F-38 — Preferências de interface

> **Tipo**: Feature
> **Epic pai**: [EP-12 Configurações da Conta](../epics/EP-12-configuracoes-da-conta.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)

---

## Descrição (visão de produto)

Na seção Preferências, a pessoa ajusta como a interface se comporta: o tema (claro, escuro ou o do sistema), o idioma (português do Brasil, inglês ou espanhol), a densidade da interface (confortável ou compacta) e a opção de reduzir animações. Cada escolha é aplicada de imediato e persiste atrelada à conta da pessoa.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) | Configurações da conta e preferências | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Tema`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A pessoa escolhe entre tema claro, escuro ou o do sistema. | — | 📝 |
| **CA02** | A opção "Sistema" acompanha a preferência de cor do sistema operacional em tempo real. | — | 📝 |
| **CA03** | O tema escolhido é aplicado imediatamente, sem recarregar a página. | — | 📝 |
| **CA04** | O tema escolhido persiste entre recargas e é mantido por usuário. | — | 📝 |

**Grupo:** `CA - Idioma e formato`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA05** | A pessoa escolhe o idioma entre português (Brasil), inglês e espanhol. | — | 📝 |
| **CA06** | O idioma escolhido reflete-se em toda a interface sem recarregar a página manualmente. | — | 📝 |
| **CA07** | Datas, horas e números seguem o formato do idioma ativo. | — | 📝 |

**Grupo:** `CA - Densidade e movimento`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA08** | A pessoa escolhe a densidade entre confortável e compacta, alterando o espaçamento da interface. | — | 📝 |
| **CA09** | Ao ativar "reduzir animações", o movimento da interface é minimizado. | — | 📝 |
| **CA10** | Quando o sistema operacional pede movimento reduzido, a interface respeita essa preferência. | — | 📝 |

## User Stories

### US38.1 — Escolha de tema da interface

> **Como** pessoa usuária do sistema, **quero** escolher entre tema claro, escuro ou o do sistema, **para** usar a interface com conforto visual em qualquer ambiente.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Escolha de tema

  Cenário: Selecionar o tema escuro
    Dado que estou na seção Preferências
    Quando seleciono o tema "Escuro"
    Então a interface passa imediatamente para o tema escuro
    E o tema permanece escuro após recarregar a página

  Cenário: Tema "Sistema" acompanha o sistema operacional
    Dado que selecionei o tema "Sistema"
    Quando o sistema operacional muda para o modo escuro
    Então a interface passa para o tema escuro automaticamente
```

- **Prioridade**: 🟠 Alta · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04

### US38.2 — Escolha de idioma da interface

> **Como** pessoa usuária do sistema, **quero** escolher o idioma da interface, **para** usar o sistema na língua que entendo melhor.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Escolha de idioma

  Cenário: Trocar o idioma para espanhol
    Dado que estou na seção Preferências
    Quando seleciono o idioma "Español"
    Então os textos da interface passam a ser exibidos em espanhol
    E as datas e horas passam a seguir o formato espanhol

  Cenário: Idioma persiste para o usuário
    Dado que escolhi o idioma "English (US)"
    Quando recarrego a página
    Então a interface continua em inglês
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA05, CA06, CA07

### US38.3 — Densidade e redução de animações

> **Como** pessoa usuária do sistema, **quero** ajustar a densidade da interface e reduzir as animações, **para** adaptar o conforto visual às minhas necessidades.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Densidade e movimento

  Cenário: Ativar densidade compacta
    Dado que estou na seção Preferências
    Quando seleciono a densidade "Compacta"
    Então o espaçamento entre os elementos da interface diminui

  Cenário: Reduzir animações
    Dado que estou na seção Preferências
    Quando ativo "Reduzir animações"
    Então as transições e animações da interface são minimizadas

  Cenário: Respeitar preferência do sistema por movimento reduzido
    Dado que o sistema operacional pede movimento reduzido
    Quando navego pela interface
    Então as animações já aparecem minimizadas
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA08, CA09, CA10

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T38.1.1 | Implementar seletor de tema (claro/escuro/sistema) reaproveitando o aplicador de tema de theme-toggle.js e aplicando o atributo de tema antes do primeiro paint (CA01, CA03). | ⏳ |
| T38.1.2 | Tratar o modo "Sistema" ouvindo `prefers-color-scheme` via matchMedia e persistir a escolha por usuário no store (CA02, CA04). | ⏳ |
| T38.2.1 | Externalizar os textos de UI em dicionários pt-BR/en/es e aplicar o idioma ativo sem recarregar, atualizando o atributo `lang` do documento (CA05, CA06). | ⏳ |
| T38.2.2 | Aplicar formatação regional de data/hora/número conforme o idioma ativo (Intl) (CA07). | ⏳ |
| T38.3.1 | Aplicar a densidade selecionada via classe/atributo de densidade nos containers principais (CA08). | ⏳ |
| T38.3.2 | Implementar o toggle "reduzir animações" e respeitar `prefers-reduced-motion` desativando transições (CA09, CA10). | ⏳ |
