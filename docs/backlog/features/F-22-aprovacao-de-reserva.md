# F-22 — Aprovação de reserva

> **Tipo**: Feature
> **Epic pai**: [EP-08 Fluxo de Aprovações](../epics/EP-08-fluxo-de-aprovacoes.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md)
> **Origem (OpenProject)**: #27386

---

## Descrição (visão de produto)

Ação do administrador que aprova uma reserva pendente: muda o status para aprovada, atualiza os módulos relacionados e notifica automaticamente o autor da reserva.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-008](../../requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md) | Aprovação e recusa de solicitações de reserva | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Aprovação de reserva`

| ID       | Critério                                                                                  | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A aprovação só é possível sobre reservas pendentes e apenas pelo administrador.           | —              | 📝     |
| **CA02** | Aprovar muda o status da reserva para aprovada.                                           | —              | 📝     |
| **CA03** | Aprovar gera notificação automática ao autor informando a aprovação.                      | —              | 📝     |
| **CA04** | Aprovar atualiza imediatamente os demais módulos relacionados (calendário, painel, fila). | —              | 📝     |

## User Stories

### US22.1 — Aprovação de reserva pendente

> **Como** administrador, **quero** aprovar uma reserva pendente, **para** liberar o uso da sala e manter o autor informado da decisão.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Aprovação de reserva

  Cenário: Aprovar uma reserva pendente
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu aprovo essa reserva
    Então a situação da reserva passa para aprovada
    E a professora Ana recebe um aviso automático informando a aprovação

  Cenário: Não aprovar uma reserva que já está aprovada
    Dado que existe uma reserva do professor Bruno para o "Lab 1" que já está aprovada
    Quando eu tento aprovar essa reserva novamente
    Então a ação de aprovar não está disponível
    E a situação da reserva permanece aprovada

  Cenário: Aprovação atualiza os demais painéis
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu aprovo essa reserva
    Então o calendário, o painel e a fila passam a refletir a reserva aprovada imediatamente
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29296
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Aprovação de reserva

  Cenário: Aprovar uma reserva pendente
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu aprovo essa reserva
    Então a situação da reserva passa para aprovada
    E a professora Ana recebe um aviso automático informando a aprovação

  Cenário: Não aprovar uma reserva que já está aprovada
    Dado que existe uma reserva do professor Bruno para o "Lab 1" que já está aprovada
    Quando eu tento aprovar essa reserva novamente
    Então a ação de aprovar não está disponível
    E a situação da reserva permanece aprovada

  Cenário: Aprovação atualiza os demais painéis
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu aprovo essa reserva
    Então o calendário, o painel e a fila passam a refletir a reserva aprovada imediatamente
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T22.1.1 | Em resolveDecision() de approvals.js, na decisão 'aprovar', validar que a reserva está pendente e que o usuário é admin antes de prosseguir (CA01). | ⏳     |
| T22.1.2 | Chamar resolveApproval()/updateReservationStatusForApproval() do store.js para mudar o status da reserva para 'aprovada' e persistir (CA02).        | ⏳     |
| T22.1.3 | Gerar notificação automática ao autor via saveNotification()/upsertApprovalNotification() informando a aprovação (CA03).                            | ⏳     |
| T22.1.4 | Após aprovar, chamar refreshList() e disparar a atualização das demais views (calendário, painel, fila) que leem getReservations() do store (CA04). | ⏳     |
| T22.1.5 | Em buildApprovalCard(), não renderizar a ação de aprovar para reservas já aprovadas, mantendo o status inalterado (CA01).                           | ⏳     |

---

## Ampliação (mockups) — Detecção de conflito na aprovação

> **Tipo**: Enriquecimento aditivo a partir do mockup `docs/mockups/08-aprovacoes.html`.
> Não altera as CAs/US existentes; adiciona o aviso de conflito ao decidir uma reserva pendente.

### CAs adicionais

**Grupo:** `CA - Conflito na aprovação`

| ID       | Critério                                                                                                                       | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------ |
| **CA05** | Ao analisar uma reserva pendente, o sistema sinaliza se ela conflita com outra reserva já aprovada no mesmo recurso e horário. | —              | 📝     |
| **CA06** | A aprovação de uma reserva em conflito exige confirmação explícita do administrador.                                           | —              | 📝     |
| **CA07** | A detecção de conflito reutiliza a mesma regra aplicada na busca de recursos (sobreposição total ou parcial).                  | —              | 📝     |

### User Story adicional

#### US22.2 — Aviso de conflito antes de aprovar

> **Como** administrador, **quero** ser avisado quando uma reserva pendente conflita com outra já aprovada, **para** decidir conscientemente e evitar agendamento em duplicidade.

```gherkin
# language: pt
Funcionalidade: Detecção de conflito na aprovação

  Cenário: Sinalizar conflito ao analisar a solicitação
    Dado que existe uma reserva aprovada para o "Lab 1" das 14h às 15h
    E uma solicitação pendente para o mesmo "Lab 1" das 14h30 às 16h
    Quando o administrador analisa a solicitação pendente
    Então o sistema sinaliza o conflito de horário com a reserva já aprovada

  Cenário: Aprovar em conflito exige confirmação
    Dado que a solicitação pendente está sinalizada como em conflito
    Quando o administrador tenta aprová-la
    Então o sistema pede uma confirmação explícita antes de concluir a aprovação
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA05, CA06, CA07

#### Tasks adicionais (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                         | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T22.2.1 | Em buildApprovalCard(), aplicar o predicado de conflito (mesmo de searchRooms()) entre a reserva pendente e as aprovadas do mesmo recurso/horário e exibir um selo de conflito (CA05, CA07). | ⏳     |
| T22.2.2 | Em resolveDecision('aprovar'), quando houver conflito sinalizado, exigir confirmação explícita (modal) antes de chamar resolveApproval() (CA06).                                             | ⏳     |
