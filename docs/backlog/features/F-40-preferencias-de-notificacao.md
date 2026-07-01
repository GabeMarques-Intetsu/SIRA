# F-40 — Preferências de notificação

> **Tipo**: Feature
> **Epic pai**: [EP-12 Configurações da Conta](../epics/EP-12-configuracoes-da-conta.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)

---

## Descrição (visão de produto)

Na seção Notificações, a pessoa define como quer ser avisada sobre cada tipo de evento, marcando, para cada evento, se deseja aviso no aplicativo e/ou por e-mail. A matriz cobre eventos como reserva aprovada, reserva recusada, nova solicitação aguardando aprovação, lembrete antes da reserva e recurso em manutenção.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                              | Requisito                             | Relação |
| ------------------------------------------------------------------------------- | ------------------------------------- | ------- |
| [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) | Configurações da conta e preferências | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Matriz de notificações`

| ID       | Critério                                                                                                                                                           | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------ |
| **CA01** | Para cada tipo de evento, a pessoa escolhe receber aviso no app e/ou por e-mail, de forma independente.                                                            | —              | 📝     |
| **CA02** | A matriz lista no mínimo os eventos: reserva aprovada, reserva recusada, nova solicitação aguardando aprovação, lembrete antes da reserva e recurso em manutenção. | —              | 📝     |
| **CA03** | As escolhas são salvas e respeitadas no envio das notificações.                                                                                                    | —              | 📝     |
| **CA04** | Eventos restritos a perfis (ex.: "nova solicitação aguarda aprovação") só aparecem para quem tem o papel correspondente.                                           | —              | 📝     |
| **CA05** | Desmarcar um canal para um evento impede o envio daquele aviso por aquele canal.                                                                                   | —              | 📝     |

## User Stories

### US40.1 — Configuração da matriz de notificações

> **Como** pessoa usuária do sistema, **quero** escolher, por evento, se sou avisada no app e/ou por e-mail, **para** receber apenas os avisos que me interessam, no canal que prefiro.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Matriz de notificações

  Cenário: Desativar e-mail para um evento
    Dado que estou na seção Notificações
    Quando desmarco "Por e-mail" para o evento "Lembrete 1h antes da reserva"
    E salvo as preferências
    Então deixo de receber esse lembrete por e-mail
    E continuo recebendo o aviso no app, pois "No app" segue marcado

  Cenário: Evento de aprovação só aparece para quem aprova
    Dado que sou um professor sem papel de aprovador
    Quando abro a seção Notificações
    Então o evento "Nova solicitação aguarda aprovação" não aparece na minha matriz

  Cenário: Preferências respeitadas no envio
    Dado que marquei apenas "No app" para "Sua reserva foi aprovada"
    Quando uma reserva minha é aprovada
    Então recebo o aviso no app
    E não recebo o aviso por e-mail
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                   | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T40.1.1 | Renderizar a matriz evento × canal (app/e-mail) com checkboxes por célula, populada a partir das preferências do usuário (CA01, CA02). | ⏳     |
| T40.1.2 | Filtrar os eventos exibidos conforme o papel do usuário, escondendo eventos restritos a aprovadores quando não aplicável (CA04).       | ⏳     |
| T40.1.3 | Persistir as preferências e consultá-las no ponto de envio de notificações, suprimindo o canal desmarcado (CA03, CA05).                | ⏳     |
