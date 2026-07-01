# F-02 — Persistência de sessão entre recargas

> **Tipo**: Feature
> **Epic pai**: [EP-01 Autenticação e Sessão](../epics/EP-01-autenticacao-e-sessao.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md)
> **Origem (OpenProject)**: #27366

---

## Descrição (visão de produto)

Mantém o usuário conectado entre recargas da página e entre fechamentos do navegador, restaurando a sessão automaticamente para que ele não precise digitar as credenciais a cada visita.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md) | Acesso institucional e continuidade de sessão | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Continuidade da sessão`

| ID       | Critério                                                                              | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | Após acessar, recarregar a página mantém o usuário conectado sem novo login.          | —              | 📝     |
| **CA02** | Fechar e reabrir o navegador mantém o usuário conectado enquanto a sessão for válida. | —              | 📝     |
| **CA03** | Encerrar a sessão impede a restauração automática no acesso seguinte.                 | —              | 📝     |
| **CA04** | A sessão restaurada preserva o perfil e as permissões do usuário.                     | —              | 📝     |

## User Stories

### US02.1 — Continuidade da sessão entre visitas

> **Como** usuário, **quero** permanecer conectado entre recargas da página e aberturas do navegador, **para** não precisar digitar minhas credenciais a cada visita.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Continuidade de sessão

  Cenário: Recarregar a página mantém a conexão
    Dado que Ana entrou no sistema e está na tela inicial
    Quando ela recarrega a página
    Então ela continua conectada sem precisar informar e-mail e senha novamente

  Cenário: Encerramento impede restauração automática
    Dado que Ana encerrou a sessão dela
    Quando ela abre o sistema de novo
    Então o sistema não a reconecta automaticamente
    E apresenta a tela de acesso

  Cenário: Reabrir o navegador preserva perfil e permissões
    Dado que Bruno é professor e entrou no sistema
    Quando ele fecha e reabre o navegador enquanto a sessão ainda é válida
    Então ele continua conectado
    E mantém o perfil de professor e as mesmas permissões de antes
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29280
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Continuidade de sessão

  Cenário: Recarregar a página mantém a conexão
    Dado que Ana entrou no sistema e está na tela inicial
    Quando ela recarrega a página
    Então ela continua conectada sem precisar informar e-mail e senha novamente

  Cenário: Encerramento impede restauração automática
    Dado que Ana encerrou a sessão dela
    Quando ela abre o sistema de novo
    Então o sistema não a reconecta automaticamente
    E apresenta a tela de acesso

  Cenário: Reabrir o navegador preserva perfil e permissões
    Dado que Bruno é professor e entrou no sistema
    Quando ele fecha e reabre o navegador enquanto a sessão ainda é válida
    Então ele continua conectado
    E mantém o perfil de professor e as mesmas permissões de antes
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                    | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T02.1.1 | Garantir que tryRestoreSession() em src/data/store.js seja chamado no bootstrap() (src/main.js) antes de checar CURRENT_USER e revalide a conta ativa via logins.json ao restaurar a chave 'sira-auth'. | ⏳     |
| T02.1.2 | Confirmar que a marcação de sessão use localStorage (não sessionStorage) na chave 'sira-auth' em login()/logout() de src/data/store.js para sobreviver ao fechamento do navegador (CA02).               | ⏳     |
| T02.1.3 | Repopular CURRENT_USER com role e permissões completas em tryRestoreSession()/login() ao restaurar, preservando o perfil usado pela sidebar e pelo RBAC de navigate() (CA04).                           | ⏳     |
| T02.1.4 | Validar que logout() removendo 'sira-auth' impede a reconexão automática no próximo bootstrap(), caindo em renderLogin() (CA03).                                                                        | ⏳     |
