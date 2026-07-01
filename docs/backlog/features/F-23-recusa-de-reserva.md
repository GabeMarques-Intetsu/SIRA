# F-23 — Recusa de reserva

> **Tipo**: Feature
> **Epic pai**: [EP-08 Fluxo de Aprovações](../epics/EP-08-fluxo-de-aprovacoes.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md)
> **Origem (OpenProject)**: #27536

---

## Descrição (visão de produto)

Ação do administrador que recusa uma reserva pendente mediante justificativa obrigatória, muda o status para recusada e notifica o autor com o motivo, permitindo que ele corrija e tente de novo.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md) | Aprovação e recusa de solicitações de reserva | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Recusa de reserva`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A recusa exige uma justificativa textual obrigatória. | — | 📝 |
| **CA02** | Recusar muda o status da reserva para recusada. | — | 📝 |
| **CA03** | A justificativa da recusa é enviada ao autor na notificação. | — | 📝 |
| **CA04** | Após recusada, o autor pode criar uma nova reserva corrigida. | — | 📝 |

## User Stories

### US23.1 — Recusa de reserva com justificativa

> **Como** administrador, **quero** recusar uma reserva pendente informando o motivo, **para** explicar a decisão ao autor e permitir que ele corrija e tente de novo.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Recusa de reserva

  Cenário: Recusar uma reserva informando o motivo
    Dado que existe uma reserva pendente do professor Bruno para o "Lab 1"
    Quando eu recuso a reserva com o motivo "Sala em manutenção no horário solicitado"
    Então a situação da reserva passa para recusada
    E o professor Bruno recebe um aviso com o motivo "Sala em manutenção no horário solicitado"

  Cenário: Tentar recusar sem informar o motivo
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu tento recusar a reserva sem escrever o motivo
    Então sou avisado de que o motivo é obrigatório
    E a situação da reserva permanece pendente

  Cenário: Autor cria uma nova reserva corrigida após a recusa
    Dado que a reserva do professor Bruno para o "Lab 1" foi recusada
    Quando o professor Bruno cria uma nova reserva ajustada para outro horário
    Então a nova reserva é registrada como pendente para análise
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29297
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Recusa de reserva

  Cenário: Recusar uma reserva informando o motivo
    Dado que existe uma reserva pendente do professor Bruno para o "Lab 1"
    Quando eu recuso a reserva com o motivo "Sala em manutenção no horário solicitado"
    Então a situação da reserva passa para recusada
    E o professor Bruno recebe um aviso com o motivo "Sala em manutenção no horário solicitado"

  Cenário: Tentar recusar sem informar o motivo
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu tento recusar a reserva sem escrever o motivo
    Então sou avisado de que o motivo é obrigatório
    E a situação da reserva permanece pendente

  Cenário: Autor cria uma nova reserva corrigida após a recusa
    Dado que a reserva do professor Bruno para o "Lab 1" foi recusada
    Quando o professor Bruno cria uma nova reserva ajustada para outro horário
    Então a nova reserva é registrada como pendente para análise
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T23.1.1 | Em resolveDecision() de approvals.js, na decisão 'recusar', abrir modal via createModal() com textarea obrigatório de justificativa (CA01). | ⏳ |
| T23.1.2 | Validar que a justificativa não esteja vazia antes de confirmar; caso vazia, exibir toast() de motivo obrigatório e manter a reserva pendente (CA01). | ⏳ |
| T23.1.3 | Ao confirmar, mudar o status da reserva para 'recusada' via resolveApproval()/store e persistir (CA02). | ⏳ |
| T23.1.4 | Gerar notificação ao autor via saveNotification() incluindo o texto da justificativa da recusa (CA03). | ⏳ |
| T23.1.5 | Garantir que, após recusada, a reserva não bloqueie a criação de nova reserva pelo autor (fluxo de saveReservation permanece disponível) (CA04). | ⏳ |

