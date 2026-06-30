# AGENTS.md — Convenções de desenvolvimento do SIRA

> **Para quem desenvolve o SIRA** (humano ou assistido por IA). Este arquivo é o
> contrato de _como_ escrevemos código aqui — stack, estrutura, padrões
> arquiteturais, armadilhas reais e regras de contribuição. O **que** o sistema
> faz vive em [`docs/requirements/`](docs/requirements/) (RF/RNF) e
> [`docs/backlog/`](docs/backlog/) (Epics/Features/US/CA/BDD); as **decisões** em
> [`docs/planning/adrs/`](docs/planning/adrs/); o **produto** em [`PRD.md`](PRD.md);
> a camada navegável de análise/projeto em [`docs/specs/`](docs/specs/).
>
> **SIRA** — Sistema de Reserva de Salas e Equipamentos do IFPB. Professores
> solicitam reservas de salas/equipamentos; administradores aprovam ou recusam.

---

## 1. Stack e versões

| Camada                      | Tecnologia                                  | Versão                                                | Observação                                                             |
| --------------------------- | ------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| Framework                   | **Next.js** (App Router)                    | 16.2.9                                                | `proxy.ts` (o antigo `middleware`, renomeado no Next 16)               |
| UI runtime                  | **React**                                   | 19.2.4                                                | Server Components (RSC) por padrão                                     |
| Linguagem                   | **TypeScript**                              | ^5                                                    | `strict: true` (ver `tsconfig.json`)                                   |
| Estilo                      | **Tailwind CSS v4** + **Material Design 3** | ^4                                                    | tokens M3 em `src/app/globals.css`; PostCSS via `@tailwindcss/postcss` |
| Backend                     | **Supabase** (Postgres + Auth + RLS + RPCs) | `@supabase/supabase-js` ^2.108, `@supabase/ssr` ^0.12 | RLS por usuário + funções `SECURITY DEFINER`                           |
| Validação                   | **Zod**                                     | ^4.4                                                  | schema único client+servidor (`src/schemas/`)                          |
| Formulários                 | **React Hook Form**                         | ^7.79                                                 | `@hookform/resolvers` ^5.4 (`zodResolver`)                             |
| Estado de servidor (client) | **TanStack Query**                          | ^5.101                                                | `QueryClientProvider` em `src/components/providers.tsx`                |
| Estado de UI global         | **Zustand**                                 | ^5.0                                                  | `src/stores/ui-store.ts` (colapso da sidebar)                          |
| Componentes                 | **shadcn/ui** + **Radix**                   | dialog/label/slot                                     | `src/components/ui/`                                                   |
| Tema                        | **next-themes**                             | ^0.4                                                  | claro/escuro/sistema sem flash (ADR-004)                               |
| Acessibilidade              | **VLibras**                                 | —                                                     | `src/components/vlibras.tsx`                                           |

Node fixado em `.nvmrc`. Use a versão de lá.

---

## 2. Estrutura de pastas

```
src/
├── app/                          # App Router (RSC-first)
│   ├── layout.tsx                # root: fontes, ThemeProvider, Providers (TanStack), VLibras
│   ├── globals.css               # tokens M3 (cores, escala --spacing-*, tipografia)
│   ├── (auth)/                   # route group PÚBLICO (sem shell)
│   │   ├── layout.tsx
│   │   ├── login/                # page.tsx + login-form.tsx + actions.ts
│   │   ├── cadastro/             # auto-serviço de cadastro de professor
│   │   └── redefinir-senha/
│   └── (app)/                    # route group PROTEGIDO (com shell + RBAC)
│       ├── layout.tsx            # requireProfile() + monta navegação por perfil
│       ├── loading.tsx           # skeleton de navegação (Suspense de rota)
│       ├── page.tsx              # raiz logada
│       ├── calendario/           # grade semanal 7d × 12h
│       ├── nova-reserva/         # assistente em 4 passos (wizard)
│       ├── minhas-reservas/      # lista + [id]/ (detalhe) + edição/cancelamento
│       ├── notificacoes/
│       ├── painel/               # KPIs admin
│       ├── aprovacoes/           # fila admin
│       ├── salas/  equipamentos/ # consomem _resources/ (componentes compartilhados)
│       ├── usuarios/
│       ├── configuracoes/
│       └── _resources/           # componentes/actions compartilhados de salas+equipamentos
├── components/
│   ├── shell/                    # app-shell, sidebar, header, nav-config, theme-toggle
│   ├── ui/                       # primitivos shadcn/Radix (button, input, label, form, dropdown-menu)
│   ├── providers.tsx             # QueryClientProvider (TanStack)
│   ├── theme-provider.tsx        # wrapper next-themes
│   └── vlibras.tsx
├── lib/                          # DOMÍNIO PURO (sem framework, testável com node:test)
│   ├── auth.ts                   # getSessionProfile/requireProfile/requireAdmin (RBAC)
│   ├── reservation.ts approvals.ts calendar.ts dashboard.ts ...  # regras puras
│   ├── validation.ts             # regra do domínio institucional (INSTITUTIONAL_DOMAIN)
│   └── supabase/                 # client.ts, server.ts, admin.ts (service-role), middleware.ts, database.types.ts
├── schemas/                      # Zod compartilhado client+servidor (auth, profile, reservation, resource, user)
├── hooks/                        # use-media-query, use-mounted (client hooks reutilizáveis)
├── stores/                       # Zustand (ui-store)
└── proxy.ts                      # proxy (middleware) Next 16 → updateSession (refresh + proteção de rota)

supabase/migrations/              # DDL versionada (0001..0008): schema, RLS, RPCs, triggers, Storage (imagem), holds
```

**Convenções de organização**

- `page.tsx` é Server Component por padrão. Sub-arquivos `*-form.tsx`,
  `*-filters.tsx`, `*-actions.tsx` que precisam de interatividade levam
  `"use client"` e ficam **ao lado** da página que os usa (colocation).
- `actions.ts` por rota concentra as **Server Actions** daquela tela (`"use server"`).
- `_resources/` e `_pasta` com underscore = pasta privada de rota (não vira segmento de URL).
- Regra de negócio **pura** vive em `src/lib/` — sem `import` de React/Next/Supabase
  client — para ser testada com `node:test` e reusada no servidor e nos client islands.

---

## 3. Padrões arquiteturais

### 3.1 RSC-first + Server Actions

- Componentes são **Server Components** salvo necessidade explícita de
  interatividade (estado, efeitos, eventos). Só então `"use client"`, no menor
  componente possível ("client island").
- Mutações passam por **Server Actions** (`"use server"`), não por rotas de API
  manuais. Cada action: reautentica, valida, executa, e **revalida** as
  superfícies afetadas com `revalidatePath(...)`.

### 3.2 Validação Zod única (client + servidor)

Os schemas em `src/schemas/` são a **fonte única** de validação:

- No client: `zodResolver(schema)` no React Hook Form → feedback imediato.
- No servidor: o mesmo `schema.safeParse(...)` dentro da Server Action →
  **defesa em profundidade** (nunca confiar só no client).
- A **regra de domínio** (ex.: `INSTITUTIONAL_DOMAIN`, `validateSlot`,
  `validateRoomInput`) vive em `src/lib/`; o schema Zod apenas a **expressa**,
  sem duplicar a lógica. Ver `src/schemas/auth.ts` e `src/schemas/reservation.ts`.

### 3.3 Segurança: RLS + RPCs + service-role isolada

- **RLS por usuário** em todas as tabelas (`reservations`, `profiles`,
  `notifications`, ...). O professor só enxerga as próprias linhas; o admin é
  liberado via `public.is_admin()`. Ver `supabase/migrations/0001_initial_schema.sql`.
- **RPCs `SECURITY DEFINER`** (`search_available_rooms`,
  `check_resource_availability`, `reservation_counts_by_*`) avaliam dados de
  terceiros (conflito de horário, KPIs) sem expor as linhas — e são _gated_ por
  `is_admin()` quando agregam. `EXECUTE` concedido só a `authenticated`
  (migration `0002`).
- **service-role** (`src/lib/supabase/admin.ts`) bypassa toda a RLS — usado só
  para provisionar contas (Admin API). Blindado em 3 camadas: `import "server-only"`
  (quebra o build se um Client Component importar), chave **sem** prefixo
  `NEXT_PUBLIC_`, e validação em runtime (nunca no build). Ver ADR-002.

### 3.4 Sessão e RBAC

- `proxy.ts` → `updateSession()` (`src/lib/supabase/middleware.ts`) refresca a
  sessão e protege rotas a cada request, usando `auth.getUser()` (revalida o
  token no servidor de auth — decisão de proteção **não** usa `getSession()`).
- Em Server Components, `getSessionProfile()` usa `auth.getClaims()` para
  **verificar o JWT localmente** (chaves ES256, JWKS cacheado) — sem round-trip
  por navegação — e é envolto em `cache()` do React (uma vez por request).
- Guards: `requireProfile()` (sessão) e `requireAdmin()` (papel). Ver `src/lib/auth.ts`.

### 3.5 Estado no client

- **TanStack Query** para estado de **servidor** no client (cache, dedupe,
  sincronização) — `QueryClient` criado uma vez por montagem em
  `providers.tsx` (`staleTime: 60s`, `refetchOnWindowFocus: false`).
- **Zustand** para estado de **UI global** que precisa ser compartilhado entre
  componentes irmãos sem prop-drilling — hoje o colapso da sidebar
  (`src/stores/ui-store.ts`, `persist` em localStorage com `skipHydration: true`
  para evitar mismatch de hidratação).
- `loading.tsx` por rota dá feedback imediato de navegação (Suspense de rota).

> **Diretriz**: prefira RSC + Server Actions. Só recorra a TanStack Query/Zustand
> quando o estado **for** de client (interatividade, sincronização incremental).
> Não busque no client o que o Server Component já pode buscar.

---

## 4. Convenções de código

- **TypeScript estrito, sem `any`.** Tipos de banco vêm de
  `src/lib/supabase/database.types.ts` (`Tables<>`, `Enums<>`); reuse-os em vez
  de redeclarar formatos.
- **Tokens M3 sempre.** Cores/espaçamentos/tipografia pelos tokens de
  `globals.css` (`bg-background`, `text-on-background`, `border-outline-variant`,
  `p-md`, ...). Não cravar hex nem px soltos. Ícones: **Material Symbols** (sem emoji).
- **Imports por alias `@/`** (mapeado em `tsconfig.json` → `src/*`).
- **Prettier** com `prettier-plugin-tailwindcss` ordena as classes — não brigue
  com a ordenação manualmente.

### ⚠️ GOTCHA REAL — largura no Tailwind v4 (ADR-005)

No Tailwind v4 o namespace `--spacing-*` alimenta **tanto** os utilitários de
espaçamento (`p-*`, `gap-*`, `m-*`) **quanto** os de tamanho (`max-w-*`,
`min-w-*`, `w-*`, `h-*`). Como o SIRA define a escala M3 com nomes semânticos
(`--spacing-md: 16px`, `--spacing-lg: 24px`, ...), o utilitário `max-w-lg`
**NÃO** resolve para os ~32rem do Tailwind padrão — resolve para
`--spacing-lg` = **24px**, quebrando o layout **silenciosamente** (sem erro de build).

```
❌ max-w-lg          → 24px (vira --spacing-lg!)
✅ max-w-[32rem]     → 512px (largura arbitrária explícita)
```

**Regra dura: para largura/altura use SEMPRE valor arbitrário `max-w-[NNrem]`
(idem `w-`/`min-w-`/`h-`). É proibido `max-w-{sm,md,lg,xl}` e correlatos
nomeados.** O aviso está em `src/app/globals.css`, junto à definição da escala.
Ver [ADR-005](docs/planning/adrs/ADR-005-largura-arbitraria-no-tailwind-v4.md).

---

## 5. Testes

| Camada                             | Ferramenta                          | Qtd.             | Script                   |
| ---------------------------------- | ----------------------------------- | ---------------- | ------------------------ |
| Unitário (domínio puro `src/lib/`) | `node:test`                         | 145              | `npm run test:unit`      |
| Componente (React)                 | Vitest + Testing Library            | 17               | `npm run test:component` |
| BDD (Gherkin pt-BR)                | Cucumber                            | 131 cenários     | `npm run test:bdd`       |
| E2E                                | Playwright                          | 5 specs          | `npm run test:e2e`       |
| Acessibilidade                     | Playwright + `@axe-core/playwright` | (em `a11y.spec`) | `npm run test:a11y`      |

- `npm test` roda unit + componente + BDD em sequência.
- Os `.feature` ficam em `tests/features/` (um por User Story, ex.:
  `US01.1-login-institucional.feature`), em **português** (`# language: pt`).
  Espelham os cenários BDD do `docs/backlog/features/`.
- Teste a regra **pura** em `src/lib/` com `node:test`; reserve E2E para fluxos
  de tela. Config: `cucumber.cjs`, `playwright.config.ts`, `tests/loader.mjs`.

---

## 6. Qualidade e tooling

| Comando                             | Faz                                                        |
| ----------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                       | dev server (Next)                                          |
| `npm run build`                     | build de produção                                          |
| `npm run lint` / `npm run lint:fix` | ESLint (`eslint-config-next` core-web-vitals + typescript) |
| `npm run format`                    | Prettier em todo o repo                                    |

- **husky + lint-staged**: no `pre-commit`, arquivos staged passam por
  `eslint --fix` + `prettier --write` (e Prettier em `json/css/md`). Não burle o hook.
- `legacy/` (app Vite anterior à migração Next) está **fora** do lint e do
  `tsconfig`. Não desenvolva lá — é referência histórica.
- Identificadores intencionalmente não usados levam prefixo `_` (config no ESLint).

---

## 7. Regras para contribuição (incl. assistida por IA)

1. **Nunca commitar segredos.** `.env*` está no `.gitignore`. Use
   `.env.example` como referência. A `SUPABASE_SERVICE_ROLE_KEY` **jamais** leva
   prefixo `NEXT_PUBLIC_` nem aparece em logs.
2. **Backlog não sobe para o OpenProject.** O `docs/backlog/` é a fonte local; a
   sincronização com o OpenProject é manual e fora do escopo de commits de código.
3. **Mudança de schema = migration.** Toda alteração de banco entra em
   `supabase/migrations/` (sequência `NNNN_descricao.sql`). Quando o PostgREST
   não cobre (agregação, conflito, privilégio elevado), crie uma **RPC**
   `SECURITY DEFINER` com `search_path = public` e `EXECUTE` mínimo. Não edite
   migrations já aplicadas — crie a próxima.
4. **Confira os advisors após DDL.** Depois de qualquer DDL, rode os _security_ e
   _performance advisors_ do Supabase e trate o que apontarem (RLS faltante,
   função sem `search_path`, índice ausente).
5. **Respeite a rastreabilidade.** Código novo referencia o RF/Feature de origem
   (ver `docs/requirements/` ↔ `docs/backlog/` ↔ `docs/specs/`). Decisão arquitetural
   nova = **novo ADR** em `docs/planning/adrs/` (não edite um ADR aceito;
   _supersede_).
6. **Validação em dois lados.** Toda Server Action de mutação revalida a entrada
   com `schema.safeParse` antes de tocar o banco — mesmo que o client já valide.
7. **Não mexa em `PRD.md` nem nos artefatos de `docs/`** sem que a tarefa peça.

---

## 8. Mapa rápido de rastreabilidade

```
RF/RNF (docs/requirements)  →  Epic (docs/backlog/epics)  →  Feature (docs/backlog/features)
        │                                                         │  CA + US + BDD + Task
        └────────────── docs/specs/<tela>.md (camada navegável) ───────┤
                                                                  ▼
                          código (src/app, src/lib, supabase/migrations) + ADR (docs/planning/adrs)
                                                                  ▼
                                  testes (tests/features *.feature, node:test, Playwright)
```

Entre primeiro por [`docs/specs/README.md`](docs/specs/README.md) para navegar por tela.
