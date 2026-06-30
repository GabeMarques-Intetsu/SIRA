# F-17 — Visualização de detalhes de uma reserva

> **Tipo**: Feature
> **Epic pai**: [EP-07 Minhas Reservas (CRUD)](../epics/EP-07-minhas-reservas-crud.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md)
> **Origem (OpenProject)**: #27552

---

## Descrição (visão de produto)

Tela que mostra todos os dados de uma reserva — sala, horário, status, justificativa, recursos solicitados e histórico de aprovação com responsável e data — acionada ao clicar em um item da listagem ou em uma notificação.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                     | Requisito                    | Relação |
| ---------------------------------------------------------------------- | ---------------------------- | ------- |
| [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md) | Gestão das próprias reservas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Detalhe da reserva`

| ID       | Critério                                                                         | Como verificar | Status |
| -------- | -------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | O detalhe mostra sala, horário, status, justificativa e recursos solicitados.    | —              | 📝     |
| **CA02** | O detalhe mostra o histórico de aprovação com responsável e data, quando houver. | —              | 📝     |
| **CA03** | O detalhe é acessível ao clicar em um item da listagem ou em uma notificação.    | —              | 📝     |
| **CA04** | Um usuário só acessa o detalhe das próprias reservas (exceto o administrador).   | —              | 📝     |

## User Stories

### US17.1 — Detalhe da própria reserva

> **Como** professor, **quero** abrir uma reserva e ver todos os seus dados e o histórico de aprovação, **para** acompanhar a situação completa da minha reserva e quem decidiu sobre ela.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Detalhe da reserva

  Cenário: Detalhe mostra os dados e o histórico de aprovação
    Dado que a professora Ana tem uma reserva do Lab 1 às 14h já aprovada
    Quando ela abre o detalhe dessa reserva a partir da listagem
    Então o detalhe mostra a sala, o horário, o status, a justificativa e os recursos solicitados
    E mostra o histórico de aprovação com o responsável e a data

  Cenário: Professor não acessa o detalhe de reserva de outra pessoa
    Dado que a professora Ana está conectada ao sistema
    Quando ela tenta abrir o detalhe de uma reserva do professor Bruno
    Então o sistema não exibe o detalhe
    E informa que ela só pode acessar as próprias reservas

  Cenário: Detalhe acessível a partir de uma notificação
    Dado que a professora Ana recebeu uma notificação sobre a sua reserva do Lab 1
    Quando ela abre essa notificação
    Então o detalhe da reserva correspondente é apresentado
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29292
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Detalhe da reserva

  Cenário: Detalhe mostra os dados e o histórico de aprovação
    Dado que a professora Ana tem uma reserva do Lab 1 às 14h já aprovada
    Quando ela abre o detalhe dessa reserva a partir da listagem
    Então o detalhe mostra a sala, o horário, o status, a justificativa e os recursos solicitados
    E mostra o histórico de aprovação com o responsável e a data

  Cenário: Professor não acessa o detalhe de reserva de outra pessoa
    Dado que a professora Ana está conectada ao sistema
    Quando ela tenta abrir o detalhe de uma reserva do professor Bruno
    Então o sistema não exibe o detalhe
    E informa que ela só pode acessar as próprias reservas

  Cenário: Detalhe acessível a partir de uma notificação
    Dado que a professora Ana recebeu uma notificação sobre a sua reserva do Lab 1
    Quando ela abre essa notificação
    Então o detalhe da reserva correspondente é apresentado
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                         | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T17.1.1 | Em openViewModal(r) (src/modules/reservations.js), montar com createModal()/infoRow() (src/components/modal.js) a exibição de sala, horário, status, justificativa e recursos solicitados da reserva.                        | ⏳     |
| T17.1.2 | Exibir no detalhe o histórico de aprovação (responsável e data) lendo a approval vinculada via getApprovals()/reservationId quando houver, renderizando-o com infoRow().                                                     | ⏳     |
| T17.1.3 | Permitir abrir o detalhe tanto ao clicar num item da listagem (buildRow -> openViewModal) quanto ao abrir uma notificação, resolvendo a reserva por reservationId e chamando openViewModal(r).                               | ⏳     |
| T17.1.4 | Restringir o acesso ao detalhe às próprias reservas (isMine(r) em src/modules/reservations.js), liberando apenas para o admin; caso contrário, não exibir o modal e informar que só é possível acessar as próprias reservas. | ⏳     |
