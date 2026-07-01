# RNF-reserva-temporaria — Expiração e consistência do bloqueio temporário

> **Tipo**: Requisito Não-Funcional (consistência + limite quantitativo)
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado

Enquanto um solicitante está montando uma solicitação de reserva, o recurso fica temporariamente indisponível aos demais para a mesma data e faixa de horário, de forma consistente — dois solicitantes nunca conseguem garantir o mesmo recurso/horário ao mesmo tempo — e a indisponibilidade temporária expira sozinha quando a solicitação não é concluída no prazo.

### Métricas obrigatórias (quantitativas)

| Métrica | Alvo | Quando/como medir |
| --- | --- | --- |
| Prazo de expiração do bloqueio temporário | 10 minutos sem conclusão → libera | Teste do mecanismo de bloqueio com relógio controlado |
| Concorrência sobre o mesmo recurso/horário | no máximo 1 bloqueio temporário ativo por recurso + data + faixa de horário | Teste de dois solicitantes simultâneos |
| Liberação ao recusar/cancelar | imediata (≤ 1 navegação) | Teste do fluxo recusa/cancelamento |
| Manutenção do bloqueio em pendência | permanece enquanto a solicitação está pendente, sem expirar | Teste de solicitação enviada e ainda não decidida |
| Limpeza de bloqueios expirados | nenhum bloqueio vencido influencia a busca de disponibilidade | Teste da busca após o prazo vencer |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende |
| --- | --- |
| EP-06 → [F-49 Reserva temporária do recurso durante a solicitação](../../backlog/features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md) | CAs de bloqueio, expiração, persistência em pendência e liberação |

## Restrições e fora-de-escopo

- O bloqueio temporário **não** é uma reserva: não aparece em "minhas reservas" nem gera notificação de aprovação.
- Decisão técnica do mecanismo (tabela de bloqueios com expiração) registrada em [ADR-009](../../planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md).
