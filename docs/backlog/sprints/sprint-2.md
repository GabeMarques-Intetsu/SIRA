# Sprint 2 — Migração para Next.js + Supabase + Reestilização

> **Meta**: migrar o SIRA de Vanilla JS + Vite + LocalStorage para **Next.js
> (App Router) + TypeScript + React 19 + Supabase (Postgres + RLS + Storage)**,
> com **reestilização** completa (Tailwind v4 + Material Design 3 + shadcn/ui),
> nova validação (Zod + React Hook Form), estado (TanStack Query + Zustand),
> suíte de testes (unit + componente + BDD + E2E) e duas funcionalidades novas
> (**imagem de recurso** F-47/F-48 e **reserva temporária / hold** F-49).
> **Equipe**: 5 desenvolvedores · **Numeração**: backlog atual F-01..F-49 (Next.js).

---

## 🔴 Regra de ouro desta sprint (lição da Sprint 1)

Na Sprint 1 houve **itens com dois donos** (ex.: F-05 "Gabriel + Ian", F-08
"Ian + Gabriel") e **dependência lateral entre pessoas** — resultado: gente
enviou parte do outro, PRs colidiram e gerou confusão. Esta divisão elimina isso
por construção, com **7 regras invioláveis**:

1. **Um arquivo = um dono.** Nenhum arquivo aparece em dois blocos. Se dois
   precisam do mesmo arquivo, ele **sobe para a fundação** (Bloco 1/2), não vira
   propriedade compartilhada.
2. **Fatia vertical fechada.** Cada bloco leva junto **rota + `lib/` + `schema` +
   testes (unit/BDD/E2E) + spec** do mesmo domínio. O teste do dono cobre o
   código do dono — ninguém depende do teste de outro para fechar.
3. **Ordem de merge topológica.** Fundação (1) → Shell (2) → features (3, 4, 5).
   **Ninguém abre PR de feature antes de 1 e 2 estarem em `main`.**
4. **Dependência só aponta para baixo** (feature → fundação), **nunca lateral**
   (feature ↔ feature). Bloco 3 nunca depende de código não-mergeado do Bloco 4.
5. **Arquivos-hub têm dono único e entram pré-preenchidos.** `nav-config.ts` e
   `(app)/layout.tsx` (Ian) já entram com **todas** as entradas de menu e o shell
   completo; `globals.css` e `components/ui/` (Gabriel) já entram com **todos** os
   tokens e primitivos. Donos de feature **nunca editam** esses arquivos — só
   criam arquivos **dentro da própria pasta** de rota.
6. **Reestilização é do dono da tela.** Não há "bloco de reestilização" separado:
   os **tokens/base** (globals.css, `ui/`) são do Gabriel; **cada um reestiliza os
   componentes que possui**. Duas pessoas nunca mexem na mesma tela.
7. **Sem co-autoria e sem renumerar.** Uma branch por bloco
   (`feature/bloco-N-<dono>`); zero itens "Fulano + Beltrano". Migrations: cada um
   cria a próxima livre na ordem de merge; números **nunca** são reaproveitados.

### Ordem de envio ao repositório (ondas de merge)

```
Onda 0 ──► Bloco 1 · Gabriel  (Fundação + Auth + Design System)   ← merge 1º (base de todos)
            │
Onda 1 ──► Bloco 2 · Ian      (Shell + Navegação + Tema + Calendário)  ← merge 2º (depende de 1)
            │
Onda 2 ──► Bloco 3 · José   ┐
           Bloco 4 · Pedro  ├─ paralelos entre si, dependem só de 1 e 2  ← merge em qualquer ordem
           Bloco 5 · Igor   ┘
```

---

## Blocos por membro

### 🧱 Bloco 1 — Gabriel Marques · Fundação + Autenticação + Design System

> **Merge 1º.** É a raiz de dependências: tudo importa daqui. Inclui a base da
> reestilização (tokens M3 + primitivos shadcn).

| Categoria  | O que envia                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configs    | `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `package.json`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `cucumber.cjs`                                                     |
| App raiz   | `src/app/layout.tsx` (root), `src/app/globals.css` (tokens M3 + base da reestilização), `favicon.ico`                                                                                                                           |
| Supabase   | `src/lib/supabase/*` (client, server, admin, middleware, database.types), `src/proxy.ts`                                                                                                                                        |
| Auth/core  | `src/lib/auth.ts`, `src/lib/validation.ts`, `src/lib/utils.ts`, `src/lib/mfa.ts`                                                                                                                                                |
| Rotas      | `src/app/(auth)/*` (login, cadastro, redefinir-senha + actions/forms)                                                                                                                                                           |
| Schema     | `src/schemas/auth.ts`                                                                                                                                                                                                           |
| UI base    | `src/components/ui/*` (shadcn), `providers.tsx`, `theme-provider.tsx`, `vlibras.tsx`                                                                                                                                            |
| Migrations | `0001_initial_schema` (schema + RLS), `0002_harden_security_definer_grants`, `0003_seed_reference_data`                                                                                                                         |
| Testes     | `tests/schemas.test.ts`, `tests/mfa.test.ts`; componente `button`/`input`/`login-form`; BDD US01–US04 + US10.1/US10.2 (isolamento/RLS); E2E infra `_helpers.ts`/`smoke`/`a11y`/`perf`; steps `sessao.ts` + `_shared.ts` (World) |
| Specs      | `docs/specs/arquitetura.md`, `autenticacao.md`, `README.md`, `_feature-template`                                                                                                                                                |

---

### 🧭 Bloco 2 — Ian Lucas · Shell + Navegação + Tema + Calendário

> **Merge 2º.** Dono dos **arquivos-hub** (`nav-config.ts`, `(app)/layout.tsx`),
> que entram já com **todas** as entradas/rotas — assim ninguém mais os toca.

| Categoria     | O que envia                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Shell         | `src/components/shell/*` (app-shell, sidebar, header, **nav-config**, user-menu, theme-toggle, logout-button/action, placeholder) |
| App layout    | `src/app/(app)/layout.tsx`, `(app)/loading.tsx`, `(app)/page.tsx`                                                                 |
| Estado UI     | `src/stores/ui-store.ts` (Zustand), `src/hooks/use-media-query.ts`, `use-mounted.ts`                                              |
| Calendário    | `src/app/(app)/calendario/*` + `src/lib/calendar.ts` + `src/lib/calendar-events.ts`                                               |
| Testes        | `tests/calendar.test.ts`, `tests/calendar-events.test.ts`; BDD US05, US06, US07, US08, US09, US13                                 |
| Specs         | `docs/specs/calendario.md`                                                                                                        |
| Reestilização | shell, sidebar/drawer mobile, header, toggle de tema (dark mode)                                                                  |

---

### 📅 Bloco 3 — José Henrique · Reservas (Nova Reserva + Minhas Reservas + Reserva Temporária)

> **Onda 2** (paralelo a Pedro e Igor). Dono ponta-a-ponta do fluxo de reserva,
> incluindo a feature nova de **hold** (F-49).

| Categoria     | O que envia                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rotas         | `src/app/(app)/nova-reserva/*` (wizard + steps), `src/app/(app)/minhas-reservas/*` (lista, `[id]`, edição, cancelamento, filtros)                                                             |
| Lib           | `src/lib/reservation.ts`, `src/lib/my-reservations.ts`, `src/lib/holds.ts`                                                                                                                    |
| Schema        | `src/schemas/reservation.ts`                                                                                                                                                                  |
| Migrations    | `0004_availability_functions` (checagem de conflito), `0008_reservation_holds` (F-49)                                                                                                         |
| Testes        | `tests/reservation.test.ts`, `tests/my-reservations.test.ts`, `tests/holds.test.ts`; BDD US14–US20 + **F49**; E2E `hold.spec.ts`; steps `reservas.ts`, `reserva-hold.ts` + helper `_holds.ts` |
| Specs         | `docs/specs/nova-reserva.md`, `minhas-reservas.md`                                                                                                                                            |
| Reestilização | cards/wizard de reserva, lista de minhas-reservas, detalhe                                                                                                                                    |

---

### 🗂️ Bloco 4 — Pedro Sales · Administração de Catálogos (Aprovações + Salas/Equipamentos + Usuários + Imagem)

> **Onda 2** (paralelo a José e Igor). É o **maior bloco** (mantém o domínio admin
> dele da Sprint 1). Inclui a feature nova de **imagem de recurso** (F-47/F-48).
> Se o volume apertar, pode quebrar **`usuarios`** num 2º PR próprio — **sem** passar
> para outra pessoa.

| Categoria     | O que envia                                                                                                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aprovações    | `src/app/(app)/aprovacoes/*` + `src/lib/approvals.ts`                                                                                                                                                                                                                        |
| Recursos      | `src/app/(app)/salas/`, `equipamentos/`, `_resources/*` + `src/lib/resources.ts`                                                                                                                                                                                             |
| Usuários      | `src/app/(app)/usuarios/*` + `src/lib/users.ts`                                                                                                                                                                                                                              |
| Imagem        | campo de imagem em `_resources/resource-form.tsx` + `0007_resource_image_storage` (bucket + `image_path`)                                                                                                                                                                    |
| Schemas       | `src/schemas/resource.ts`, `src/schemas/user.ts`                                                                                                                                                                                                                             |
| Testes        | `tests/approvals.test.ts`, `tests/resources.test.ts`, `tests/resource-image.test.ts`, `tests/users.test.ts`; componente `resource-image-field.test.tsx`; BDD US21–US33 + **F47/F48**; E2E `image-upload.spec.ts`; steps `aprovacoes.ts`, `usuarios.ts`, `recursos-imagem.ts` |
| Specs         | `docs/specs/aprovacoes.md`, `recursos.md`, `usuarios.md`                                                                                                                                                                                                                     |
| Reestilização | tabelas/cards de salas, equipamentos, usuários, fila de aprovações                                                                                                                                                                                                           |

> ✅ **Fronteira já resolvida:** o antigo `recursos-imagem-hold.ts` (que misturava
> passos de imagem e de hold) foi **dividido** em `recursos-imagem.ts` (Pedro) e
> `reserva-hold.ts` (José), cumprindo a regra 1 (um arquivo, um dono). Suíte BDD
> revalidada: **131 cenários / 607 steps verdes**.

---

### 📊 Bloco 5 — Igor Gimenez · Painel + Notificações + Configurações + Eventos de Domínio

> **Onda 2** (paralelo a José e Pedro). Continuidade do domínio dele (dados/eventos
>
> - dashboard + notificações da Sprint 1), agora com **Configurações**.

| Categoria     | O que envia                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Painel        | `src/app/(app)/painel/*` + `src/lib/dashboard.ts` + `0006_reservation_count_aggregation_rpcs`                                                                      |
| Notificações  | `src/app/(app)/notificacoes/*` + `src/lib/notifications.ts` + `src/hooks/queries/use-notifications.ts`                                                             |
| Configurações | `src/app/(app)/configuracoes/*` (perfil, preferências, segurança/MFA, matriz de notificações, zona de risco) + `src/lib/preferences.ts` + `src/schemas/profile.ts` |
| Eventos       | `0005_reservation_submitted_event_trigger` (propagação aprovação → reserva → notificação)                                                                          |
| Testes        | `tests/dashboard.test.ts`, `tests/notifications.test.ts`; BDD US11, US12, US34, US35, US36                                                                         |
| Specs         | `docs/specs/painel.md`, `notificacoes.md`, `configuracoes.md`                                                                                                      |
| Reestilização | KPIs do painel, lista/itens de notificação, painéis de configurações                                                                                               |

> Nota de dependência (regra 4): `security-panel.tsx` (Igor) **consome**
> `src/lib/mfa.ts` da fundação (Gabriel). Isso é dependência **para baixo** sobre
> código **já mergeado** — não é dependência lateral. ✅

---

## Mapa rápido (membro → branch → onda)

| Bloco | Membro  | Branch                    | Onda de merge | Depende de |
| ----- | ------- | ------------------------- | ------------- | ---------- |
| 1     | Gabriel | `feature/bloco-1-gabriel` | 0 (1º)        | —          |
| 2     | Ian     | `feature/bloco-2-ian`     | 1 (2º)        | Bloco 1    |
| 3     | José    | `feature/bloco-3-jose`    | 2 (paralelo)  | Blocos 1–2 |
| 4     | Pedro   | `feature/bloco-4-pedro`   | 2 (paralelo)  | Blocos 1–2 |
| 5     | Igor    | `feature/bloco-5-igor`    | 2 (paralelo)  | Blocos 1–2 |

## Checklist de fechamento (por bloco)

- [ ] Todos os arquivos do bloco estão na branch do dono — **e só eles** (nada do bloco alheio).
- [ ] Não editei `globals.css`, `components/ui/*`, `nav-config.ts` nem `(app)/layout.tsx` (arquivos-hub de outro dono).
- [ ] Minhas migrations usam o próximo número livre, sem renumerar.
- [ ] Testes do bloco passam isoladamente (`npm test` verde para o meu domínio).
- [ ] Abri o PR **só depois** das ondas anteriores estarem em `main`.
- [ ] Zero co-autoria: o PR é meu, do meu domínio, ponta a ponta.
