# F-03 — Auto-servico de cadastro de professor

> **Tipo**: Feature
> **Epic pai**: [EP-01 Autenticação e Sessão](../epics/EP-01-autenticacao-e-sessao.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md)
> **Origem (OpenProject)**: #27367

---

## Descrição (visão de produto)

Formulário acessível na tela de login onde um novo professor informa nome, e-mail institucional, departamento e senha e envia uma solicitação de cadastro. A solicitação fica pendente de aprovação do administrador antes de liberar o acesso.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md) | Acesso institucional e continuidade de sessão | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Solicitação de cadastro`

| ID       | Critério                                                                                        | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | O formulário de solicitação é acessível a partir da tela de login, sem estar logado.            | —              | 📝     |
| **CA02** | A solicitação exige nome, e-mail institucional, departamento e senha.                           | —              | 📝     |
| **CA03** | O e-mail informado deve ser institucional (@ifpb.edu.br); outro domínio é rejeitado.            | —              | 📝     |
| **CA04** | Não é permitido solicitar cadastro com e-mail já cadastrado ou já solicitado.                   | —              | 📝     |
| **CA05** | Ao enviar, a solicitação fica pendente de aprovação do administrador e o solicitante é avisado. | —              | 📝     |
| **CA06** | Enquanto pendente, o solicitante não consegue acessar o sistema.                                | —              | 📝     |

## User Stories

### US03.1 — Solicitação de cadastro do professor

> **Como** professor, **quero** enviar uma solicitação de cadastro com meus dados a partir da tela de acesso, **para** obter acesso ao sistema após a aprovação do administrador.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Solicitação de cadastro

  Cenário: Envio de solicitação completa
    Dado que Ana está na tela de acesso e abre o formulário de solicitação de cadastro
    Quando ela informa nome, o e-mail "ana@ifpb.edu.br", o departamento e uma senha e envia
    Então o sistema registra a solicitação como pendente de aprovação
    E avisa Ana de que o pedido aguarda análise do administrador

  Cenário: Solicitação com e-mail de outro domínio
    Dado que Bruno abriu o formulário de solicitação de cadastro
    Quando ele informa o e-mail "bruno@hotmail.com" e envia
    Então o sistema recusa a solicitação
    E exibe um aviso de que somente e-mails institucionais são aceitos

  Cenário: Acesso bloqueado enquanto pendente
    Dado que a solicitação de Ana com o e-mail "ana@ifpb.edu.br" está pendente de aprovação
    Quando ela tenta entrar no sistema com esse e-mail e a senha informada
    Então o sistema não permite o acesso
    E informa que o cadastro ainda aguarda aprovação
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29281
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Solicitação de cadastro

  Cenário: Envio de solicitação completa
    Dado que Ana está na tela de acesso e abre o formulário de solicitação de cadastro
    Quando ela informa nome, o e-mail "ana@ifpb.edu.br", o departamento e uma senha e envia
    Então o sistema registra a solicitação como pendente de aprovação
    E avisa Ana de que o pedido aguarda análise do administrador

  Cenário: Solicitação com e-mail de outro domínio
    Dado que Bruno abriu o formulário de solicitação de cadastro
    Quando ele informa o e-mail "bruno@hotmail.com" e envia
    Então o sistema recusa a solicitação
    E exibe um aviso de que somente e-mails institucionais são aceitos

  Cenário: Acesso bloqueado enquanto pendente
    Dado que a solicitação de Ana com o e-mail "ana@ifpb.edu.br" está pendente de aprovação
    Quando ela tenta entrar no sistema com esse e-mail e a senha informada
    Então o sistema não permite o acesso
    E informa que o cadastro ainda aguarda aprovação
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                      | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T03.1.1 | Adicionar validarEmailInstitucional() no onClick de 'Enviar solicitação' em renderSignup() (src/main.js), rejeitando domínio diferente de @ifpb.edu.br com toast antes de gravar.                         | ⏳     |
| T03.1.2 | Adicionar campos obrigatórios departamento (id='signupDept') e senha (id='signupPassword') em renderSignup() e incluí-los no objeto persistido em localStorage['sira:signups'].                           | ⏳     |
| T03.1.3 | Implementar checagem de duplicidade em renderSignup() comparando o e-mail contra getUsersGlobal()/logins.json e contra os pendentes em 'sira:signups', bloqueando cadastro repetido (CA04).               | ⏳     |
| T03.1.4 | Manter approved:false ao gravar a solicitação em 'sira:signups' e ajustar login() em src/data/store.js para negar acesso a e-mail com solicitação pendente, informando que aguarda aprovação (CA05/CA06). | ⏳     |
