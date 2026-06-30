# Arquitetura do SIRA

> Visão de arquitetura do SIRA com diagramas. Detalha como Next.js (App Router),
> Supabase (Postgres + RLS + RPCs) e as camadas de validação/estado se compõem.
> Decisões fundantes: [ADR-001](../planning/adrs/ADR-001-schema-inicial-e-rls-supabase.md)
> (schema + RLS), [ADR-002](../planning/adrs/ADR-002-provisionamento-de-contas-via-service-role.md)
> (service-role), [ADR-003](../planning/adrs/ADR-003-padronizacao-notification-type-e-emissao-em-server-action.md)
> (notificações em Server Action).

## 1. Princípios

- **RSC-first**: páginas são Server Components; interatividade isolada em "client islands".
- **Server Actions** para toda mutação; revalidação por `revalidatePath`.
- **Segurança no banco**: RLS por usuário em todas as tabelas; RPCs `SECURITY DEFINER`
  para o que cruza fronteira de dono (conflito de horário, KPIs).
- **Validação única** Zod client+servidor (`src/schemas/`), com a regra de
  domínio em `src/lib/`.
- **service-role isolada** (`server-only`) só para provisionar contas.

## 2. Contexto e componentes (C4-ish)

```mermaid
flowchart TB
    Professor([Professor])
    Admin([Administrador])

    subgraph Browser["Navegador"]
        UI["Telas SIRA<br/>(RSC + client islands)<br/>Tailwind v4 + M3 · VLibras"]
    end

    subgraph Next["Next.js 16 (App Router)"]
        Proxy["proxy.ts<br/>refresh de sessão + proteção de rota"]
        RSC["Server Components<br/>(app)/* · requireProfile/requireAdmin"]
        Actions["Server Actions<br/>actions.ts (validam c/ Zod, revalidam)"]
        Admin1["lib/supabase/admin.ts<br/>service-role (server-only)"]
    end

    subgraph Supabase["Supabase"]
        Auth["Auth<br/>(JWT ES256 · getClaims)"]
        DB[("Postgres<br/>RLS por usuário")]
        RPC["RPCs SECURITY DEFINER<br/>search_available_* · check_resource_availability<br/>reservation_counts_* · is_admin()"]
    end

    Professor --> UI
    Admin --> UI
    UI <--> Proxy
    Proxy --> RSC
    UI -- form submit --> Actions
    RSC --> Auth
    RSC --> DB
    RSC --> RPC
    Actions --> Auth
    Actions --> DB
    Actions --> RPC
    Actions --> Admin1
    Admin1 -- Admin API --> Auth
    RPC --> DB
```

**Leitura**: o `proxy` refresca a sessão e barra acesso não autenticado a cada
request. Os Server Components leem dados já filtrados pela RLS (e por RPCs quando
há conflito/KPI). As mutações passam por Server Actions, que revalidam a entrada
com Zod e só então tocam o banco. O provisionamento de contas é o único caminho
que usa a chave service-role, blindada por `server-only`.

## 3. Fluxo de autenticação e proteção de rota

Código: [`src/lib/supabase/middleware.ts`](../../src/lib/supabase/middleware.ts)
(`updateSession`), [`src/proxy.ts`](../../src/proxy.ts),
[`src/lib/auth.ts`](../../src/lib/auth.ts), [`src/app/(app)/layout.tsx`](../../src/app/%28app%29/layout.tsx).
Decisão de tema/sessão sem flash: [ADR-004](../planning/adrs/ADR-004-tema-densidade-reducao-de-movimento-sem-script.md).

```mermaid
sequenceDiagram
    actor U as Usuário
    participant P as "proxy.ts (updateSession)"
    participant A as Supabase Auth
    participant L as "(app)/layout.tsx"
    participant DB as "Postgres (RLS)"

    U->>P: GET /minhas-reservas
    P->>A: auth.getUser() (revalida o token)
    alt Sem sessão e rota protegida
        P-->>U: redirect /login
    else Autenticado em /login ou /cadastro
        P-->>U: redirect /calendario
    else Sessão válida
        P->>L: segue a navegação (cookies refrescados)
        L->>A: getClaims() (verifica JWT localmente)
        L->>DB: SELECT profile WHERE id = sub
        alt profile.role = admin requerido e professor
            L-->>U: redirect /calendario (requireAdmin)
        else autorizado
            L-->>U: renderiza shell + página por perfil
        end
    end
```

> `proxy` usa `getUser()` (revalida no servidor de auth) para **decisões de
> proteção**; os Server Components usam `getClaims()` (verificação **local** do
> JWT, sem round-trip) para ler o usuário a cada navegação, com `cache()` por request.

## 4. Fluxo de aprovação de reserva

Código: [`src/app/(app)/nova-reserva/actions.ts`](../../src/app/%28app%29/nova-reserva/actions.ts),
[`src/app/(app)/aprovacoes/actions.ts`](../../src/app/%28app%29/aprovacoes/actions.ts),
[`src/lib/approvals.ts`](../../src/lib/approvals.ts).
Notificações: [ADR-003](../planning/adrs/ADR-003-padronizacao-notification-type-e-emissao-em-server-action.md).
Sincronização: F-11 (reserva → aprovação → notificação).

```mermaid
sequenceDiagram
    actor Prof as Professor
    actor Adm as Administrador
    participant NR as nova-reserva/actions
    participant AP as aprovacoes/actions
    participant DB as "Postgres (RLS + RPC)"

    Prof->>NR: confirma reserva
    NR->>DB: check_resource_availability() (anti-corrida)
    alt conflito detectado
        NR-->>Prof: erro "horário indisponível"
    else livre
        NR->>DB: INSERT reservations (status = pending)
        DB-->>DB: trigger log_reservation_submitted (timeline)
        NR-->>Prof: reserva criada (pendente)
    end

    Adm->>AP: aprovar / recusar
    AP->>AP: requireAdmin() + canActOn (não pode avaliar a própria)
    AP->>DB: SELECT reserva (exige status = pending)
    alt já decidida por outra pessoa
        AP-->>Adm: erro "já decidida"
    else pendente
        AP->>DB: UPDATE status (.eq status pending — guarda anti-corrida)
        AP->>DB: INSERT approval_events + INSERT notifications (ao solicitante)
        AP->>AP: revalidatePath(/aprovacoes, /, /calendario, /minhas-reservas, layout)
        AP-->>Adm: decisão registrada
        Note over DB,Prof: solicitante vê a notificação e o novo status
    end
```

**Garantias** (ver `aprovacoes/actions.ts`): reautenticação do papel no servidor;
**segregação de funções** (o admin autor não avalia a própria solicitação);
idempotência por re-leitura `status = pending` + guarda `.eq("status","pending")`
no UPDATE (duplo-clique/duas abas — só a 1ª decisão vence); RLS permite o INSERT
em `approval_events`/`notifications`.

## 5. Modelo de dados (resumo)

Esquema canônico em [`supabase/migrations/0001_initial_schema.sql`](../../supabase/migrations/0001_initial_schema.sql).

```mermaid
erDiagram
    profiles ||--o{ reservations : "faz"
    profiles ||--o{ notifications : "recebe"
    rooms ||--o{ reservations : "reservada em"
    equipment ||--o{ reservations : "reservado em"
    reservations ||--o{ approval_events : "tem histórico"
    reservations ||--o{ notifications : "origina"
    profiles ||--|| user_preferences : "configura"

    profiles {
        uuid id PK
        text full_name
        user_role role
        entity_status status
    }
    reservations {
        uuid id PK
        uuid user_id FK
        date reservation_date
        time start_time
        time end_time
        reservation_status status
    }
    rooms {
        uuid id PK
        text name
        int capacity
        entity_status status
    }
```

> O estado "Concluída" **não** existe no enum `reservation_status` — é derivado
> (reserva aprovada cujo horário já passou). Ver
> [ADR-006](../planning/adrs/ADR-006-status-concluida-ausente-do-enum-reservation-status.md).
