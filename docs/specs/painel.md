# Spec — Painel administrativo (KPIs)

> **Rastreabilidade**
> - **RF**: [RF-004 — Painel administrativo de indicadores em tempo real](../requirements/RF/RF-004-painel-administrativo-de-indicadores-em-tempo-re.md)
> - **Feature**: [F-12 — Painel administrativo de KPIs em tempo real](../backlog/features/F-12-painel-administrativo-de-kpis-em-tempo-real.md)
> - **Código**: `src/app/(app)/painel/page.tsx` · `period-filter.tsx` · `src/lib/dashboard.ts`
> - **RPCs**: `reservation_counts_by_user`, `reservation_counts_by_resource` (`supabase/migrations/0006_reservation_count_aggregation_rpcs.sql`)
> - **Testes**: `tests/features/US12.1-indicadores-do-painel.feature`
> - **Mockup**: `docs/mockups/02-dashboard.html`

## User Stories

- **US12.1** — Como **administrador**, quero ver indicadores (total de reservas, taxa de aprovação, ocupação por dia, salas mais usadas, atividade recente) por período, para acompanhar o uso do sistema.

## Critérios de Aceitação

| ID | Critério |
| --- | --- |
| CA01 | Acesso restrito a administradores (`requireAdmin`). |
| CA02 | Mostra total de reservas no período. |
| CA03 | Mostra taxa de aprovação. |
| CA04 | Mostra ocupação por dia da semana. |
| CA05 | Mostra ranking de salas mais usadas. |
| CA06 | Mostra atividade recente. |
| CA07 | Filtro de período: hoje / semana / mês. |
| CA08 | A agregação ocorre sobre conjuntos já limitados pelo período (sem trazer linhas desnecessárias). |

> A página é Server Component com `requireAdmin()`. As agregações são puras em
> `src/lib/dashboard.ts` (`totalReservations`, `approvalRate`, `occupancyByDay`,
> `topRooms`, `toActivity`, `resolvePeriod`) e operam sobre o conjunto do período
> (CA08). As contagens por usuário/recurso usam RPCs `SECURITY DEFINER`
> _gated_ por `is_admin()` (migration 0006) — admin agrega sem expor linhas.

## Cenário BDD

```gherkin
# language: pt
Funcionalidade: Indicadores do painel

  Cenário: Visualizar indicadores da semana
    Dado que sou administrador e abro o painel
    Quando seleciono o período "semana"
    Então vejo o total de reservas, a taxa de aprovação e a ocupação por dia da semana

  Cenário: Professor não acessa o painel
    Dado que sou professor
    Quando tento abrir o painel
    Então sou redirecionado para o calendário
```

## Fluxo

```mermaid
flowchart TD
    A[/painel] --> B[requireAdmin]
    B -- professor --> R[redirect /calendario]
    B -- admin --> C[period-filter: hoje/semana/mês]
    C --> D[resolvePeriod → intervalo]
    D --> E[SELECT reservations no período<br/>+ RPC reservation_counts_*]
    E --> F[agregações puras<br/>total · approvalRate · occupancyByDay · topRooms]
    F --> G[cards de KPI + gráfico de ocupação + atividade]
```
