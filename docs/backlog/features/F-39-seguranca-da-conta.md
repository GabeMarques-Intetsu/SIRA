# F-39 — Segurança da conta

> **Tipo**: Feature
> **Epic pai**: [EP-12 Configurações da Conta](../epics/EP-12-configuracoes-da-conta.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)

---

## Descrição (visão de produto)

Na seção Segurança, a pessoa protege sua conta: altera a senha, ativa a verificação em duas etapas por aplicativo autenticador (TOTP) e revisa as sessões ativas, podendo encerrar sessões em outros dispositivos.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) | Configurações da conta e preferências | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Alteração de senha`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | Para alterar a senha, a pessoa informa a senha atual e a nova senha. | — | 📝 |
| **CA02** | A nova senha precisa atender aos critérios mínimos de força definidos. | — | 📝 |
| **CA03** | A confirmação da nova senha deve coincidir com a nova senha; caso contrário, é exibido aviso. | — | 📝 |
| **CA04** | Senha atual incorreta impede a alteração e exibe aviso. | — | 📝 |

**Grupo:** `CA - Verificação em duas etapas`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA05** | A pessoa pode ativar a verificação em duas etapas via aplicativo autenticador (TOTP). | — | 📝 |
| **CA06** | A ativação exige confirmar um código gerado pelo aplicativo antes de ficar válida. | — | 📝 |
| **CA07** | A pessoa pode desativar a verificação em duas etapas. | — | 📝 |

**Grupo:** `CA - Sessões ativas`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA08** | A pessoa visualiza a lista de sessões ativas com dispositivo e data de acesso. | — | 📝 |
| **CA09** | A pessoa pode encerrar uma sessão de outro dispositivo. | — | 📝 |
| **CA10** | A sessão atual fica identificada e não pode ser encerrada por engano sem aviso. | — | 📝 |

## User Stories

### US39.1 — Alteração de senha

> **Como** pessoa usuária do sistema, **quero** alterar minha senha, **para** manter minha conta protegida.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Alteração de senha

  Cenário: Alterar a senha com dados válidos
    Dado que estou na seção Segurança
    Quando informo a senha atual correta e uma nova senha forte confirmada
    Então minha senha é alterada
    E sou avisada do sucesso

  Cenário: Senha atual incorreta
    Dado que estou na seção Segurança
    Quando informo uma senha atual incorreta
    Então sou avisada de que a senha atual está incorreta
    E a senha não é alterada

  Cenário: Confirmação não coincide
    Dado que estou na seção Segurança
    Quando a confirmação da nova senha é diferente da nova senha
    Então sou avisada de que as senhas não coincidem
    E a senha não é alterada
```

- **Prioridade**: 🟠 Alta · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04

### US39.2 — Verificação em duas etapas (2FA)

> **Como** pessoa usuária do sistema, **quero** ativar a verificação em duas etapas por aplicativo, **para** adicionar uma camada extra de proteção ao meu acesso.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Verificação em duas etapas

  Cenário: Ativar 2FA confirmando o código
    Dado que estou na seção Segurança
    Quando ativo a verificação em duas etapas e informo o código gerado pelo aplicativo autenticador
    Então a verificação em duas etapas fica ativa para a minha conta

  Cenário: Código incorreto não ativa o 2FA
    Dado que estou ativando a verificação em duas etapas
    Quando informo um código incorreto
    Então sou avisada de que o código é inválido
    E a verificação em duas etapas não é ativada

  Cenário: Desativar 2FA
    Dado que tenho a verificação em duas etapas ativa
    Quando a desativo
    Então a verificação em duas etapas deixa de ser exigida no próximo acesso
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA05, CA06, CA07

### US39.3 — Revisão de sessões ativas

> **Como** pessoa usuária do sistema, **quero** ver e encerrar minhas sessões ativas, **para** controlar onde minha conta está conectada.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Sessões ativas

  Cenário: Visualizar sessões ativas
    Dado que estou na seção Segurança
    Quando aciono "Ver sessões"
    Então vejo a lista de dispositivos conectados com data de acesso
    E a sessão atual aparece identificada

  Cenário: Encerrar a sessão de outro dispositivo
    Dado que vejo uma sessão de outro dispositivo
    Quando encerro essa sessão
    Então aquele dispositivo deixa de estar conectado à minha conta
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA08, CA09, CA10

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T39.1.1 | Implementar formulário de troca de senha (senha atual, nova, confirmação) com validação de força e coincidência (CA01, CA02, CA03). | ⏳ |
| T39.1.2 | Validar a senha atual contra o provedor de autenticação antes de gravar a nova, exibindo aviso em caso de falha (CA04). | ⏳ |
| T39.2.1 | Implementar fluxo de ativação de 2FA TOTP (geração de segredo/QR, confirmação de código) e persistência do estado de 2FA (CA05, CA06). | ⏳ |
| T39.2.2 | Implementar desativação de 2FA com confirmação (CA07). | ⏳ |
| T39.3.1 | Listar sessões ativas com dispositivo e data, identificando a sessão atual (CA08, CA10). | ⏳ |
| T39.3.2 | Implementar encerramento de sessão remota via revogação de sessão no provedor de autenticação (CA09). | ⏳ |
