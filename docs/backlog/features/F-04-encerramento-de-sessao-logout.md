# F-04 — Encerramento de sessão (logout)

> **Tipo**: Feature
> **Epic pai**: [EP-01 Autenticação e Sessão](../epics/EP-01-autenticacao-e-sessao.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md)
> **Origem (OpenProject)**: #27532

---

## Descrição (visão de produto)

Permite ao usuário encerrar a sessão a qualquer momento, retirando da tela os dados da sessão atual e voltando à tela de login — mantendo isolados os dados de outros usuários do mesmo computador. Importante para a privacidade em computadores compartilhados de laboratório.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md) | Acesso institucional e continuidade de sessão | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Encerramento de sessão`

| ID       | Critério                                                                                       | Como verificar | Status |
| -------- | ---------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A ação de sair encerra a sessão atual e leva o usuário à tela de login.                        | —              | 📝     |
| **CA02** | Após sair, os dados pessoais da sessão atual deixam de ficar acessíveis na tela.               | —              | 📝     |
| **CA03** | Sair não remove os dados pessoais do usuário, que continuam disponíveis no próximo login dele. | —              | 📝     |
| **CA04** | Sair de um usuário não afeta os dados de outros usuários no mesmo navegador.                   | —              | 📝     |

## User Stories

### US04.1 — Encerramento da sessão do usuário

> **Como** usuário, **quero** encerrar minha sessão a qualquer momento, **para** proteger minha privacidade em computadores compartilhados de laboratório.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Encerramento de sessão

  Cenário: Sair leva à tela de acesso
    Dado que Ana está conectada na tela inicial
    Quando ela escolhe a opção de sair
    Então o sistema encerra a sessão dela
    E a leva para a tela de acesso

  Cenário: Dados da sessão somem da tela após sair
    Dado que Ana acabou de sair do sistema
    Quando a tela de acesso é exibida
    Então os dados pessoais da sessão de Ana deixam de ficar visíveis na tela

  Cenário: Sair de um usuário não afeta outro
    Dado que Ana e Bruno já usaram o sistema no mesmo computador
    Quando Ana sai da sessão dela
    Então os dados pessoais de Bruno permanecem preservados
    E ficam disponíveis quando ele entrar novamente
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29282
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Encerramento de sessão

  Cenário: Sair leva à tela de acesso
    Dado que Ana está conectada na tela inicial
    Quando ela escolhe a opção de sair
    Então o sistema encerra a sessão dela
    E a leva para a tela de acesso

  Cenário: Dados da sessão somem da tela após sair
    Dado que Ana acabou de sair do sistema
    Quando a tela de acesso é exibida
    Então os dados pessoais da sessão de Ana deixam de ficar visíveis na tela

  Cenário: Sair de um usuário não afeta outro
    Dado que Ana e Bruno já usaram o sistema no mesmo computador
    Quando Ana sai da sessão dela
    Então os dados pessoais de Bruno permanecem preservados
    E ficam disponíveis quando ele entrar novamente
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                               | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T04.1.1 | Confirmar que o botão 'Sair' da userPill em createSidebar() (src/components/sidebar.js) chama logout() do store e em seguida location.reload() para retornar a renderLogin() (CA01).               | ⏳     |
| T04.1.2 | Garantir que logout() em src/data/store.js zere CURRENT_USER e remova apenas a chave de sessão 'sira-auth', sem apagar as coleções particionadas por e-mail (sira_db/<email>/\*.json) (CA03/CA04). | ⏳     |
| T04.1.3 | Após reload pós-logout, validar em bootstrap() que sem 'sira-auth' o shell (sidebar/main) não é montado e nenhum dado pessoal da sessão anterior fica no DOM (CA02).                               | ⏳     |
