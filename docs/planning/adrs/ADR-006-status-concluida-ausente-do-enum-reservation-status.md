# ADR-006: Tratamento do estado "Concluída" — ausente do enum `reservation_status`

## Status

Accepted (2026-06-15) — **opção 1, derivar em runtime**.

Refina o ADR-001, que fixou `reservation_status` como `pending | approved | rejected | cancelled` — sem um valor terminal para "já aconteceu". O requisito de produto confirmado é **apenas visual** (rotular/agrupar, sem filtro/auditoria sobre concluídas), logo adota-se a derivação em runtime sem mexer no enum nem no schema.

## Context

O enum `reservation_status` (ADR-001) tem quatro valores: `pending`, `approved`, `rejected`, `cancelled`. Não existe `completed`/"Concluída". A tela "Minhas Reservas" (F-16) precisa, porém, distinguir reservas **futuras** de reservas **passadas/realizadas**.

Hoje a distinção é feita **apenas por data**, não por status: `groupByWhen` separa em "Próximas" (`reservation_date ≥ hoje`) e "Anteriores" (`reservation_date < hoje`), preservando o `status` original. Uma reserva aprovada que já passou continua exibindo o badge **"Aprovada"** — não há rótulo "Concluída". Os filtros por status oferecem apenas Pendentes/Aprovadas/Recusadas/Canceladas (`STATUS_FILTERS`). Ou seja: o conceito de "Concluída" não tem representação própria — é inferido visualmente pela seção "Anteriores".

As opções para dar identidade a "Concluída":

1. **Derivar em runtime** — "concluída" = `status='approved'` **E** `reservation_date` (+ `end_time`) no passado. Zero mudança de schema; a UI/consulta calcula o rótulo. Custo: a derivação se espalha por toda consulta/filtro que queira o conceito; sem persistência, não há trilha de "quando concluiu".
2. **Adicionar valor `completed` ao enum** — estado explícito e filtrável, alinhado ao approval timeline. Custo: `ALTER TYPE ADD VALUE` + um **job/trigger** que promova `approved → completed` quando a data passa (não há transição "automática" de graça no Postgres); reescreve histórico.
3. **Adicionar coluna derivada/`completed_at`** — marca o instante de conclusão sem inflar o enum; permite filtrar e auditar. Custo: ainda precisa de quem preencha (job agendado) e de regra clara de quando uma reserva "conclui".

## Decision

**Adotada a opção 1 — derivar em runtime.** Uma reserva exibe o rótulo **"Concluída"** quando está `approved` E seu término (data + `end_time`) já passou em relação a `now`. É **só apresentação**: o status persistido continua `approved`, o enum e o schema não mudam, e os filtros/agrupamentos atuais (`STATUS_FILTERS`, `applyFilters`, `groupByWhen`) seguem inalterados. Implementado por dois helpers puros em `src/lib/my-reservations.ts` — `isCompleted(row, now)` e `displayStatus(row, now)` (este substitui `STATUS_META[row.status]` na UI do badge) — cobertos por testes unitários com `now` fixo.

Persistir um estado/coluna (`completed`/`completed_at`, opções 2/3) fica adiado para quando houver requisito de **filtro/relatório/auditoria** sobre concluídas — não é o caso atual.

> Nota factual: o texto que circulou ("Concluída mapeada para Canceladas na UI") **não corresponde** ao código atual — não há mapeamento de "Concluída" para "Canceladas"; `cancelled` é um status próprio com badge "Cancelada", e reservas passadas aprovadas seguem como "Aprovada" na seção "Anteriores". Este ADR registra o estado real e a decisão pendente.

## Consequences

**Positivas (do estado atual):**

- Zero dívida de schema enquanto o requisito de produto não está claro — nada a migrar/reverter.
- A separação por data já atende ao agrupamento visual do mockup 06 sem novo estado.

**Negativas / trade-offs aceitos:**

- Não há filtro nem rótulo "Concluída": o usuário não consegue isolar "minhas reservas realizadas" diretamente — só inferir pela seção "Anteriores".
- Sem persistência de conclusão, relatórios/KPIs que distingam "concluídas" de "aprovadas futuras" precisariam derivar por data em cada consulta.
- A decisão adiada mantém uma ambiguidade conceitual (aprovada-passada vs concluída) que deve ser resolvida antes de qualquer feature que dependa do conceito.

## Cross-ref

- Implementação atual: `src/lib/my-reservations.ts` (`STATUS_META`, `STATUS_FILTERS`, `groupByWhen`), `src/app/(app)/minhas-reservas/reservations-list.tsx` (seções "Próximas"/"Anteriores").
- Requisitos: RF-007; F-16.
- Refina: [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md) (enum `reservation_status`).
- **Escalar ao dono do produto** antes de aceitar (ver recomendação acima).
