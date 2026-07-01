# F-06 — Roteamento por URLs limpas com histórico do navegador

> **Tipo**: Feature
> **Epic pai**: [EP-02 Shell, Navegação e Roteamento](../epics/EP-02-shell-navegacao-e-roteamento.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md)
> **Origem (OpenProject)**: #27369

---

## Descrição (visão de produto)

Cada tela do sistema passa a ter um endereço próprio e legível, com suporte aos comandos de voltar e avançar do navegador, acesso direto por link e uma tela de página não encontrada para endereços inválidos.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                         | Requisito                                                  | Relação |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------- |
| [RF-002](../../requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md) | Navegação contextual por perfil e adaptação ao dispositivo | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Navegação e endereços`

| ID       | Critério                                                                            | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | Cada tela principal tem um endereço próprio e legível.                              | —              | 📝     |
| **CA02** | Os comandos de voltar e avançar do navegador funcionam entre as telas já visitadas. | —              | 📝     |
| **CA03** | Acessar diretamente o endereço de uma tela abre aquela tela.                        | —              | 📝     |
| **CA04** | Acessar um endereço inexistente leva a uma tela de página não encontrada.           | —              | 📝     |
| **CA05** | Recarregar a página em qualquer endereço mantém o usuário na mesma tela.            | —              | 📝     |

## User Stories

### US06.1 — Endereços próprios para cada tela

> **Como** usuário, **quero** ter um endereço próprio e legível para cada tela, com voltar e avançar do navegador, **para** acessar telas diretamente e retomar onde estava sem perder o contexto.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Endereços das telas

  Cenário: Voltar e avançar entre telas visitadas
    Dado que Ana visitou a tela de Calendário e depois a tela de Nova Reserva
    Quando ela usa o comando de voltar do navegador
    Então o sistema a leva de volta à tela de Calendário
    E o comando de avançar a traz novamente à tela de Nova Reserva

  Cenário: Endereço inexistente leva a página não encontrada
    Dado que Bruno está conectado no sistema
    Quando ele tenta abrir um endereço que não corresponde a nenhuma tela
    Então o sistema apresenta a tela de página não encontrada

  Cenário: Recarregar mantém a mesma tela
    Dado que Ana está na tela de Minhas Reservas
    Quando ela recarrega a página
    Então o sistema a mantém na tela de Minhas Reservas
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29284
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Endereços das telas

  Cenário: Voltar e avançar entre telas visitadas
    Dado que Ana visitou a tela de Calendário e depois a tela de Nova Reserva
    Quando ela usa o comando de voltar do navegador
    Então o sistema a leva de volta à tela de Calendário
    E o comando de avançar a traz novamente à tela de Nova Reserva

  Cenário: Endereço inexistente leva a página não encontrada
    Dado que Bruno está conectado no sistema
    Quando ele tenta abrir um endereço que não corresponde a nenhuma tela
    Então o sistema apresenta a tela de página não encontrada

  Cenário: Recarregar mantém a mesma tela
    Dado que Ana está na tela de Minhas Reservas
    Quando ela recarrega a página
    Então o sistema a mantém na tela de Minhas Reservas
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                          | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T06.1.1 | Garantir em navigate() (src/main.js) que cada página do PAGE_RENDERERS atualize a URL via history.pushState com path legível (BASE+pageName), cobrindo todas as telas principais (CA01).                      | ⏳     |
| T06.1.2 | Confirmar o handler de 'popstate' em bootstrap() que lê pathToPage(location.pathname) e re-renderiza a tela correspondente para suportar voltar/avançar do navegador (CA02).                                  | ⏳     |
| T06.1.3 | Resolver a página inicial em bootstrap() a partir de pathToPage(location.pathname) para que acesso direto por link e recarregamento mantenham a mesma tela (CA03/CA05).                                       | ⏳     |
| T06.1.4 | Implementar uma tela de 'página não encontrada' (renderNotFound) e fazer navigate()/popstate roteá-la quando pathToPage não casar com PAGE_RENDERERS, em vez do fallback silencioso para 'calendario' (CA04). | ⏳     |
