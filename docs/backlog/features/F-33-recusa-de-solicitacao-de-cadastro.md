# F-33 — Recusa de solicitação de cadastro

> **Tipo**: Feature
> **Epic pai**: [EP-10 Gestão de Usuários (Admin)](../epics/EP-10-gestao-de-usuarios-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)
> **Origem (OpenProject)**: #27547

---

## Descrição (visão de produto)

Ação do administrador que recusa uma solicitação de cadastro mediante justificativa, avisa o solicitante do motivo e remove o pedido da fila de pendentes.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                      | Requisito                                     | Relação |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| [RF-010](../../requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md) | Gestão de usuários e solicitações de cadastro | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Recusa de cadastro`

| ID       | Critério                                                                  | Como verificar | Status |
| -------- | ------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A recusa exige justificativa textual.                                     | —              | 📝     |
| **CA02** | O solicitante é notificado do motivo da recusa.                           | —              | 📝     |
| **CA03** | A solicitação recusada sai da fila de pendentes e o usuário não é criado. | —              | 📝     |

## User Stories

### US33.1 — Recusa de um pedido de cadastro com justificativa

> **Como** administrador, **quero** recusar uma solicitação de cadastro informando o motivo e avisando o solicitante, **para** barrar acessos indevidos deixando claro à pessoa o porquê da recusa.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Recusa de cadastro

  Cenário: Administrador recusa um pedido com justificativa
    Dado que existe uma solicitação pendente de "Bruno"
    Quando recuso a solicitação informando o motivo "E-mail não pertence à instituição"
    Então "Bruno" é avisado do motivo da recusa
    E o usuário "Bruno" não é criado
    E a solicitação sai da fila de pendentes

  Cenário: Tentativa de recusar sem informar o motivo
    Dado que estou recusando a solicitação de "Bruno"
    Quando confirmo a recusa sem escrever uma justificativa
    Então o sistema não conclui a recusa
    E me pede para informar o motivo

  Cenário: Solicitante consulta o motivo da recusa
    Dado que a solicitação de "Bruno" foi recusada com o motivo "E-mail não pertence à instituição"
    Quando "Bruno" verifica o aviso recebido
    Então ele lê o motivo informado pelo administrador
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29307
- **CAs cobertos**: CA01, CA02, CA03

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Recusa de cadastro

  Cenário: Administrador recusa um pedido com justificativa
    Dado que existe uma solicitação pendente de "Bruno"
    Quando recuso a solicitação informando o motivo "E-mail não pertence à instituição"
    Então "Bruno" é avisado do motivo da recusa
    E o usuário "Bruno" não é criado
    E a solicitação sai da fila de pendentes

  Cenário: Tentativa de recusar sem informar o motivo
    Dado que estou recusando a solicitação de "Bruno"
    Quando confirmo a recusa sem escrever uma justificativa
    Então o sistema não conclui a recusa
    E me pede para informar o motivo

  Cenário: Solicitante consulta o motivo da recusa
    Dado que a solicitação de "Bruno" foi recusada com o motivo "E-mail não pertence à instituição"
    Quando "Bruno" verifica o aviso recebido
    Então ele lê o motivo informado pelo administrador
```

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                 | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T33.1.1 | Adicionar no btn('Recusar') de renderSignupsModal (src/modules/users.js) um modal/prompt com textarea de justificativa, bloqueando a recusa com toast quando o motivo estiver vazio. | ⏳     |
| T33.1.2 | Ao confirmar a recusa, remover o signup da fila com signups.filter((x) => x.id !== s.id) e persistir em localStorage 'sira:signups' sem chamar saveUsers (usuario nao e criado).     | ⏳     |
| T33.1.3 | Disparar saveNotification (src/data/store.js) para o solicitante contendo o motivo da recusa informado pelo admin.                                                                   | ⏳     |
| T33.1.4 | Atualizar a UI chamando refreshTable(tbody) e reabrindo renderSignupsModal(tbody) para refletir a fila sem o pedido recusado.                                                        | ⏳     |
