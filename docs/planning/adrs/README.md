<!-- GENERIC TEMPLATE — adapt to your project. See references/10-estrutura-projeto.md §5 (two-tier ADRs). -->

# ADRs — Architecture Decision Records (nível de PROJETO)

> Decisões arquiteturais **transversais** ao sistema, formato MADR (Markdown ADR).
> Decisões locais a uma feature vivem em `../../specs/<feature>/adrs/` (TIER 2), compartilhando a MESMA numeração global.

## Convenção

- Numeração **global sequencial** (`ADR-NNN-slug.md`) — contínua entre tier 1 (aqui) e tier 2 (specs).
- Status: `Accepted` | `Superseded by ADR-NNN` | `Deprecated` | `Proposed`.
- Mudança de decisão → cria-se **nova** ADR que supersede a antiga (NUNCA edita a anterior).
- Renumerar é **proibido** (ADR-005 sempre será ADR-005, mesmo se deprecada).
- Tag de variante (`-DB`, `-FE`, `-UI`) quando o mesmo número resolve decisões paralelas em camadas distintas.

## Catálogo

| ID                                                                            | Título                                                                                    | Status      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| [001](./ADR-001-schema-inicial-e-rls-supabase.md)                             | Schema relacional Postgres/Supabase com RLS por usuário                                   | Accepted    |
| [002](./ADR-002-provisionamento-de-contas-via-service-role.md)                | Provisionar contas via Supabase service-role isolada server-only                          | Accepted    |
| [003](./ADR-003-padronizacao-notification-type-e-emissao-em-server-action.md) | Padronizar `notification.type` + emitir notificações na Server Action                     | Accepted    |
| [004](./ADR-004-tema-densidade-reducao-de-movimento-sem-script.md)            | Tema/densidade/redução de movimento sem `<script>` (next-themes + atributos server-side)  | Accepted    |
| [005](./ADR-005-largura-arbitraria-no-tailwind-v4.md)                         | Largura arbitrária `max-w-[NNrem]` no Tailwind v4 (colisão spacing × sizing)              | Accepted    |
| [006](./ADR-006-status-concluida-ausente-do-enum-reservation-status.md)       | Tratamento do estado "Concluída" — ausente do enum `reservation_status`                   | 🟡 Proposed |
| [007](./ADR-007-funcionalidades-dependentes-de-infra-externa.md)              | Funcionalidades dependentes de infraestrutura externa — fora do MVP                       | Accepted    |
| [008](./ADR-008-armazenamento-de-imagens-de-recursos.md)                      | Imagens de salas/equipamentos no Supabase Storage + `image_path` em coluna                | Accepted    |
| [009](./ADR-009-mecanismo-de-reserva-temporaria-hold.md)                      | Reserva temporária via tabela de holds com expiração (TTL) na checagem de disponibilidade | Accepted    |

## Cross-ref

- `../../specs/<feature>/adrs/INDEX.md` — ADRs locais por feature (tier 2).
