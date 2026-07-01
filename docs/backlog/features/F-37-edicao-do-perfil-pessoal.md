# F-37 — Edição do perfil pessoal

> **Tipo**: Feature
> **Epic pai**: [EP-12 Configurações da Conta](../epics/EP-12-configuracoes-da-conta.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)

---

## Descrição (visão de produto)

Na seção Perfil das configurações, a pessoa edita seus dados pessoais: nome completo, foto, telefone (opcional) e departamento. O e-mail institucional é exibido somente para leitura e não pode ser alterado. As mudanças só são gravadas quando a pessoa confirma "Salvar alterações"; "Cancelar" descarta o que foi digitado.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                              | Requisito                             | Relação |
| ------------------------------------------------------------------------------- | ------------------------------------- | ------- |
| [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) | Configurações da conta e preferências | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Dados do perfil`

| ID       | Critério                                                                       | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------ | -------------- | ------ |
| **CA01** | A pessoa pode editar nome completo, telefone e departamento.                   | —              | 📝     |
| **CA02** | O e-mail institucional aparece apenas para leitura e não pode ser alterado.    | —              | 📝     |
| **CA03** | O nome completo é obrigatório; não é possível salvar com nome vazio.           | —              | 📝     |
| **CA04** | O telefone é opcional e, quando informado, segue um formato válido.            | —              | 📝     |
| **CA05** | As alterações só são gravadas ao confirmar "Salvar alterações".                | —              | 📝     |
| **CA06** | "Cancelar" descarta as alterações não salvas e restaura os valores anteriores. | —              | 📝     |

**Grupo:** `CA - Foto de perfil`

| ID       | Critério                                                                                            | Como verificar | Status |
| -------- | --------------------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA07** | A pessoa pode alterar sua foto de perfil.                                                           | —              | 📝     |
| **CA08** | Quando não há foto, são exibidas as iniciais do nome como avatar.                                   | —              | 📝     |
| **CA09** | Apenas arquivos de imagem dentro do limite de tamanho são aceitos; caso contrário, é exibido aviso. | —              | 📝     |

## User Stories

### US37.1 — Edição dos dados pessoais

> **Como** pessoa usuária do sistema, **quero** atualizar meu nome, telefone e departamento, **para** manter meu cadastro correto.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Edição dos dados pessoais

  Cenário: Salvar alterações válidas do perfil
    Dado que estou na seção Perfil das configurações
    Quando altero meu nome para "Ana Maria Silva" e informo o telefone "(83) 99999-9999"
    E confirmo "Salvar alterações"
    Então meus dados de perfil são atualizados

  Cenário: Tentar salvar com nome vazio
    Dado que estou na seção Perfil das configurações
    Quando apago o conteúdo do campo nome completo
    E confirmo "Salvar alterações"
    Então sou avisada de que o nome é obrigatório
    E os dados não são alterados

  Cenário: E-mail institucional não pode ser alterado
    Dado que estou na seção Perfil das configurações
    Quando tento editar o campo de e-mail
    Então o campo permanece bloqueado para edição
    E vejo o aviso de que o e-mail institucional não pode ser alterado

  Cenário: Cancelar descarta alterações
    Dado que alterei meu departamento sem salvar
    Quando aciono "Cancelar"
    Então o departamento volta ao valor anterior
```

- **Prioridade**: 🟠 Alta · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06

### US37.2 — Atualização da foto de perfil

> **Como** pessoa usuária do sistema, **quero** definir uma foto de perfil, **para** ser reconhecida visualmente na plataforma.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Atualização da foto de perfil

  Cenário: Definir uma nova foto válida
    Dado que estou na seção Perfil das configurações
    Quando aciono "Alterar foto" e seleciono uma imagem dentro do limite de tamanho
    Então a nova foto passa a ser exibida no avatar

  Cenário: Avatar com iniciais quando não há foto
    Dado que não tenho foto de perfil
    Quando abro a seção Perfil
    Então vejo minhas iniciais como avatar

  Cenário: Arquivo inválido é rejeitado
    Dado que estou na seção Perfil das configurações
    Quando seleciono um arquivo que não é imagem ou excede o limite de tamanho
    Então sou avisada do formato/tamanho inválido
    E a foto não é alterada
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA07, CA08, CA09

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                           | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T37.1.1 | Renderizar o formulário de perfil com campos nome, telefone, departamento e e-mail desabilitado, populados a partir do usuário atual do store. | ⏳     |
| T37.1.2 | Validar nome obrigatório e formato de telefone antes de salvar, exibindo toast de erro caso inválido (CA03, CA04).                             | ⏳     |
| T37.1.3 | Persistir as alterações apenas no clique de "Salvar alterações" e implementar "Cancelar" restaurando os valores originais (CA05, CA06).        | ⏳     |
| T37.2.1 | Implementar seleção de imagem com validação de tipo/tamanho e geração de avatar por iniciais como fallback (CA07, CA08, CA09).                 | ⏳     |
