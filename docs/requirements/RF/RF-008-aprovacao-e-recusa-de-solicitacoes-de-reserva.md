# RF-008 — Aprovação e recusa de solicitações de reserva

> **Tipo**: Requisito Funcional
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema permite que o administrador veja a fila de solicitações pendentes e aprove ou recuse cada reserva, atualizando o estado e notificando o solicitante.**
>
> **Enquanto a solicitação está pendente de decisão, o recurso permanece indisponível aos demais; a aprovação mantém a indisponibilidade até o fim da reserva (data e horário) e a recusa libera o recurso imediatamente.**

## Justificativa

Caminho de decisão do administrador sobre as reservas solicitadas pelos professores. Inclui fila consolidada de pendências ordenada por data, aprovação (muda status para ‘aprovada’ e notifica autor) e recusa (exige justificativa textual obrigatória). Toda a lógica de notificação automática ao autor depende deste fluxo.

A continuidade da indisponibilidade ao longo da decisão é a contraparte da **reserva temporária** iniciada em [RF-006](./RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md): pendente bloqueia, aprovada mantém bloqueado até o fim, recusada/cancelada libera. Ver [F-49](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md) e [RNF-reserva-temporaria](../RNF/RNF-reserva-temporaria.md).

## Revisão (registro de mudança — o documento é a fonte da verdade)

| Data       | Mudança                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Origem                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-06-26 | Adicionado o enunciado da **continuidade da indisponibilidade na decisão**: pendente mantém o bloqueio, aprovação mantém até o fim, recusa libera. Relação com a reserva temporária de [RF-006](./RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) e a Feature [F-49](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md). Decisão técnica em [ADR-009](../../planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md). | Solicitação do produto |

## Realizado por (rastreabilidade ↓)

| Epic                                                      | Feature(s)                                                                                                               | Status |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| [EP-08](../../backlog/epics/EP-08-fluxo-de-aprovacoes.md) | [F-21 Fila consolidada de aprovações pendentes](../../backlog/features/F-21-fila-consolidada-de-aprovacoes-pendentes.md) | 📝     |
| [EP-08](../../backlog/epics/EP-08-fluxo-de-aprovacoes.md) | [F-22 Aprovação de reserva](../../backlog/features/F-22-aprovacao-de-reserva.md)                                         | 📝     |
| [EP-08](../../backlog/epics/EP-08-fluxo-de-aprovacoes.md) | [F-23 Recusa de reserva](../../backlog/features/F-23-recusa-de-reserva.md)                                               | 📝     |

## Restrições e fora-de-escopo

- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
