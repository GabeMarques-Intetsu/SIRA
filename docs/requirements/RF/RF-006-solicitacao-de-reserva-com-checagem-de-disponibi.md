# RF-006 — Solicitação de reserva com checagem de disponibilidade

> **Tipo**: Requisito Funcional
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema permite que o professor busque salas por data, horário e recursos, exibindo apenas as disponíveis (sem conflito de horário) e oferecendo reserva rápida a partir do resultado.**
>
> **Ao iniciar uma solicitação de reserva de um recurso para uma data e faixa de horário específicas, o sistema torna esse recurso temporariamente indisponível aos demais até a solicitação ser concluída; se a solicitação não for concluída no prazo, a indisponibilidade temporária expira e o recurso volta a ficar livre.**

## Justificativa

Fluxo de criação de uma nova reserva pelo professor. Inclui (a) busca de salas disponíveis filtrando data, horário e recursos com detecção automática de conflito de horário e (b) atalho ‘reserva express com 1 clique’ a partir do detalhe da sala. É o caso de uso principal que justifica a existência do sistema.

A **reserva temporária** evita que dois professores garantam o mesmo recurso/horário ao mesmo tempo: enquanto um monta a solicitação, o recurso aparece indisponível para os outros. Para não travar recursos indefinidamente, o bloqueio expira sozinho quando a solicitação é abandonada ([RNF-reserva-temporaria](../RNF/RNF-reserva-temporaria.md)). A continuidade do bloqueio após o envio (mantido em pendência, mantido até o fim se aprovado, liberado se recusado/cancelado) é compartilhada com [RF-008](./RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md).

## Revisão (registro de mudança — o documento é a fonte da verdade)

| Data       | Mudança                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Origem                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-06-26 | Adicionado o enunciado de **reserva temporária / bloqueio durante a solicitação** com expiração por abandono. Cobre a Feature [F-49](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md). Limites em [RNF-reserva-temporaria](../RNF/RNF-reserva-temporaria.md). Decisão técnica em [ADR-009](../../planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md). Relação com a aprovação em [RF-008](./RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md). | Solicitação do produto |

## Realizado por (rastreabilidade ↓)

| Epic                                               | Feature(s)                                                                                                                                 | Status |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| [EP-06](../../backlog/epics/EP-06-nova-reserva.md) | [F-14 Busca de salas com detecção de conflito de horário](../../backlog/features/F-14-busca-de-salas-com-deteccao-de-conflito-de-horar.md) | 📝     |
| [EP-06](../../backlog/epics/EP-06-nova-reserva.md) | [F-15 Reserva express com 1 clique a partir do detalhe](../../backlog/features/F-15-reserva-express-com-1-clique-a-partir-do-detalhe.md)   | 📝     |
| [EP-06](../../backlog/epics/EP-06-nova-reserva.md) | [F-49 Reserva temporária do recurso durante a solicitação](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md) | 📝     |

## RNFs que limitam

- [RNF-reserva-temporaria](../RNF/RNF-reserva-temporaria.md) — prazo de expiração (10 min) e consistência (sem dupla reserva simultânea).

## Restrições e fora-de-escopo

- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
- O bloqueio temporário não é uma reserva: não consta em "minhas reservas" nem dispara notificação de aprovação.
