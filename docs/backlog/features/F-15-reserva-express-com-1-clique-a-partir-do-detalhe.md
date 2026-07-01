# F-15 — Reserva express com 1 clique a partir do detalhe

> **Tipo**: Feature
> **Epic pai**: [EP-06 Nova Reserva](../epics/EP-06-nova-reserva.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md)
> **Origem (OpenProject)**: #27376

---

## Descrição (visão de produto)

A partir do detalhe de uma sala, permite reservar o horário escolhido em um único passo, sem preencher um novo formulário, com confirmação imediata. A reserva entra como pendente no fluxo de aprovação.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                         | Requisito                                              | Relação |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------- |
| [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) | Solicitação de reserva com checagem de disponibilidade | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Reserva rápida`

| ID       | Critério                                                                                 | Como verificar | Status |
| -------- | ---------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A partir do detalhe de uma sala, é possível reservar o horário selecionado em um clique. | —              | 📝     |
| **CA02** | A reserva criada por esse caminho entra como pendente no fluxo de aprovação.             | —              | 📝     |
| **CA03** | Após reservar, o usuário recebe confirmação visível da ação.                             | —              | 📝     |
| **CA04** | A reserva rápida respeita as mesmas regras de conflito de horário da busca.              | —              | 📝     |

## User Stories

### US15.1 — Reserva rápida a partir do detalhe da sala

> **Como** professor, **quero** reservar o horário escolhido em um único passo a partir do detalhe da sala, **para** garantir o horário sem ter de preencher um novo formulário.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Reserva rápida

  Cenário: Reserva em um clique entra como pendente com confirmação
    Dado que a professora Ana está no detalhe do Lab 1 com o horário das 14h livre
    Quando ela reserva esse horário em um único passo
    Então a reserva é criada como pendente no fluxo de aprovação
    E Ana recebe uma confirmação visível da ação

  Cenário: Reserva rápida bloqueada por conflito de horário
    Dado que a professora Ana está no detalhe do Lab 1 com o horário das 14h já ocupado
    Quando ela tenta reservar esse horário em um único passo
    Então a reserva não é criada
    E o sistema informa que o horário está em conflito com outra reserva

  Cenário: Reserva rápida respeita as mesmas regras de conflito da busca
    Dado que o professor Bruno está no detalhe do Lab 1 com o horário das 16h livre
    Quando ele reserva esse horário em um único passo
    Então a reserva entra como pendente seguindo as mesmas regras de conflito aplicadas na busca
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29291
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Reserva rápida

  Cenário: Reserva em um clique entra como pendente com confirmação
    Dado que a professora Ana está no detalhe do Lab 1 com o horário das 14h livre
    Quando ela reserva esse horário em um único passo
    Então a reserva é criada como pendente no fluxo de aprovação
    E Ana recebe uma confirmação visível da ação

  Cenário: Reserva rápida bloqueada por conflito de horário
    Dado que a professora Ana está no detalhe do Lab 1 com o horário das 14h já ocupado
    Quando ela tenta reservar esse horário em um único passo
    Então a reserva não é criada
    E o sistema informa que o horário está em conflito com outra reserva

  Cenário: Reserva rápida respeita as mesmas regras de conflito da busca
    Dado que o professor Bruno está no detalhe do Lab 1 com o horário das 16h livre
    Quando ele reserva esse horário em um único passo
    Então a reserva entra como pendente seguindo as mesmas regras de conflito aplicadas na busca
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                           | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T15.1.1 | Em showRoomDetailsModal(room, formData) (src/modules/novaReserva.js), adicionar botão de reserva em 1 clique que chama performReservation(room, formData) sem reabrir formulário, usando createModal()/openModal() de src/components/modal.js. | ⏳     |
| T15.1.2 | Em performReservation(), criar a reserva com status 'pending' e id via generateId(), persistindo-a com saveReservation() (src/data/store.js) na coleção do usuário logado.                                                                     | ⏳     |
| T15.1.3 | Reaproveitar o predicado de detecção de conflito de searchRooms() dentro de performReservation() para bloquear a reserva express quando houver sobreposição com reserva approved/pending, informando o conflito ao usuário.                    | ⏳     |
| T15.1.4 | Exibir confirmação visível da ação (toast/modal via src/components/modal.js) após gravar a reserva pendente com sucesso.                                                                                                                       | ⏳     |
