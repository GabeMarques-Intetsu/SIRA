# F-01 — Login institucional por e-mail

> **Tipo**: Feature
> **Epic pai**: [EP-01 Autenticação e Sessão](../epics/EP-01-autenticacao-e-sessao.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🔴 Imediato
> **Origem (requisitos)**: [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md)
> **Origem (OpenProject)**: #27365

---

## Descrição (visão de produto)

Tela de acesso onde o professor entra com seu e-mail institucional e senha. O sistema confere as credenciais, trata os erros possíveis (usuário inexistente, senha incorreta, conta inativa) e, ao validar, leva o usuário à tela inicial do seu perfil.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-001](../../requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md) | Acesso institucional e continuidade de sessão | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Acesso e validação de credenciais`

| ID       | Critério                                                                                     | Como verificar | Status |
| -------- | -------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | O acesso só é permitido com e-mail institucional (domínio @ifpb.edu.br) e senha.             | —              | 📝     |
| **CA02** | Tentativa de acesso com e-mail de outro domínio é rejeitada com aviso.                       | —              | 📝     |
| **CA03** | E-mail não cadastrado é rejeitado com mensagem de credenciais inválidas.                     | —              | 📝     |
| **CA04** | Senha incorreta para e-mail válido é rejeitada com mensagem de credenciais inválidas.        | —              | 📝     |
| **CA05** | Conta inativa não consegue acessar mesmo com senha correta, e recebe aviso de conta inativa. | —              | 📝     |
| **CA06** | Os campos de e-mail e senha são obrigatórios; envio vazio é bloqueado com aviso.             | —              | 📝     |
| **CA07** | Acesso bem-sucedido leva o usuário à tela inicial correspondente ao seu perfil.              | —              | 📝     |

## User Stories

### US01.1 — Acesso institucional do professor

> **Como** professor, **quero** entrar no sistema com meu e-mail institucional e minha senha, **para** chegar à tela inicial do meu perfil de forma segura.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Login institucional

  Cenário: Acesso com credenciais válidas
    Dado que Ana tem uma conta ativa com o e-mail "ana@ifpb.edu.br"
    Quando ela informa o e-mail "ana@ifpb.edu.br" e a senha correta e confirma o acesso
    Então o sistema a leva para a tela inicial do perfil dela

  Cenário: Acesso com e-mail de outro domínio
    Dado que Bruno está na tela de acesso
    Quando ele informa o e-mail "bruno@gmail.com" e uma senha e confirma o acesso
    Então o sistema recusa a entrada
    E exibe um aviso de que somente e-mails institucionais são aceitos

  Cenário: Acesso de conta inativa
    Dado que Ana tem uma conta inativa com o e-mail "ana@ifpb.edu.br"
    Quando ela informa o e-mail "ana@ifpb.edu.br" e a senha correta e confirma o acesso
    Então o sistema recusa a entrada
    E exibe um aviso de que a conta está inativa
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29279
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Login institucional

  Cenário: Acesso com credenciais válidas
    Dado que Ana tem uma conta ativa com o e-mail "ana@ifpb.edu.br"
    Quando ela informa o e-mail "ana@ifpb.edu.br" e a senha correta e confirma o acesso
    Então o sistema a leva para a tela inicial do perfil dela

  Cenário: Acesso com e-mail de outro domínio
    Dado que Bruno está na tela de acesso
    Quando ele informa o e-mail "bruno@gmail.com" e uma senha e confirma o acesso
    Então o sistema recusa a entrada
    E exibe um aviso de que somente e-mails institucionais são aceitos

  Cenário: Acesso de conta inativa
    Dado que Ana tem uma conta inativa com o e-mail "ana@ifpb.edu.br"
    Quando ela informa o e-mail "ana@ifpb.edu.br" e a senha correta e confirma o acesso
    Então o sistema recusa a entrada
    E exibe um aviso de que a conta está inativa
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                       | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T01.1.1 | Implementar validarEmailInstitucional(email) em src/utils/fp.js validando o regex de domínio @ifpb.edu.br e usar no onClick de loginBtn em renderLogin() (src/main.js) antes de chamar login().                                            | ⏳     |
| T01.1.2 | Estender login(email, senha) em src/data/store.js para conferir a senha do registro em src/data/logins.json e checar o campo active/status, retornando códigos de erro distintos (DOMINIO_INVALIDO, CREDENCIAIS_INVALIDAS, CONTA_INATIVA). | ⏳     |
| T01.1.3 | Adicionar input de senha (id='senhaInput', type='password') em renderLogin() (src/main.js) e tornar e-mail+senha obrigatórios, bloqueando o submit vazio com toast() de src/utils/dom.js.                                                  | ⏳     |
| T01.1.4 | Mapear cada código de erro de login() para mensagens via toast()/alert em renderLogin() (CA02 domínio, CA03/CA04 credenciais inválidas, CA05 conta inativa) substituindo o 'Usuário não encontrado.' genérico.                             | ⏳     |
| T01.1.5 | Após login() bem-sucedido, redirecionar para a página inicial conforme CURRENT_USER.role (admin→dashboard, professor→calendario) em vez de location.reload() fixo em renderLogin().                                                        | ⏳     |
