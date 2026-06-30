-- ============================================================================
-- SIRA — Migration 0001: schema inicial + RLS
-- Projeto: reserva de salas/equipamentos (IFPB) sobre Next.js + Supabase.
-- Fonte de verdade: docs/requirements/RF/*, RNF-seguranca-privacidade,
--                   legacy/vite-app/src/data/store.js, docs/mockups/*.
-- ADR: docs/planning/adrs/ADR-001-schema-inicial-e-rls-supabase.md
--
-- NÃO aplicar via psql aqui — aplicação via MCP/CLI feita pelo mantenedor.
-- Idempotente onde possível (IF NOT EXISTS / DO-blocks para enums e policies).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensões
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";          -- gen_random_uuid()
create extension if not exists "moddatetime"         -- trigger updated_at
  schema extensions;

-- ----------------------------------------------------------------------------
-- 1. Enums (domínios fechados — ver ADR-001, Eixo 1)
--    Envolvidos em DO-block para idempotência (CREATE TYPE não tem IF NOT EXISTS).
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'professor');
  end if;

  if not exists (select 1 from pg_type where typname = 'entity_status') then
    -- usado por rooms/equipment (active/inactive/maintenance)
    create type public.entity_status as enum ('active', 'inactive', 'maintenance');
  end if;

  if not exists (select 1 from pg_type where typname = 'account_status') then
    -- pessoas só têm active/inactive (nunca 'maintenance')
    create type public.account_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'room_type') then
    create type public.room_type as enum ('sala', 'laboratorio', 'auditorio');
  end if;

  if not exists (select 1 from pg_type where typname = 'resource_kind') then
    create type public.resource_kind as enum ('room', 'equipment');
  end if;

  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('pending', 'approved', 'rejected', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'recurrence_type') then
    create type public.recurrence_type as enum ('none', 'daily', 'weekly', 'custom');
  end if;

  if not exists (select 1 from pg_type where typname = 'approval_action') then
    create type public.approval_action as enum ('submitted', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'signup_status') then
    create type public.signup_status as enum ('pending', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'theme_pref') then
    create type public.theme_pref as enum ('light', 'dark', 'system');
  end if;

  if not exists (select 1 from pg_type where typname = 'language_pref') then
    create type public.language_pref as enum ('pt-BR', 'en', 'es');
  end if;

  if not exists (select 1 from pg_type where typname = 'density_pref') then
    create type public.density_pref as enum ('comfortable', 'compact');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- 2. is_admin() é criada na seção 3.10 (APÓS as tabelas) — Postgres valida o
--    corpo de uma função SQL na criação, então profiles precisa já existir.
-- ----------------------------------------------------------------------------

-- ============================================================================
-- 3. Tabelas
-- ============================================================================

-- ---- 3.1 profiles (1-1 com auth.users) ------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text        not null,
  email           text        not null unique,
  role            public.user_role     not null default 'professor',
  department      text,
  siape_matricula text,
  phone           text,
  status          public.account_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.profiles is 'Espelho 1-1 de auth.users (RF-010). Criado por trigger handle_new_user.';

-- ---- 3.2 rooms ------------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null unique,
  type        public.room_type     not null,
  capacity    integer     not null check (capacity > 0),
  block       text,                                   -- "Bloco A", "Bloco C" (texto livre, mockup 05)
  resources   jsonb       not null default '[]'::jsonb,
  status      public.entity_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.rooms is 'Catálogo de salas (RF-009). Recurso compartilhado: todos leem, só admin escreve.';

-- ---- 3.3 equipment --------------------------------------------------------
create table if not exists public.equipment (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null unique,
  type        text        not null,                   -- vocabulário aberto: Projetor, Notebook... (ADR-001)
  status      public.entity_status not null default 'active',
  block       text,
  room_id     uuid        references public.rooms (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.equipment is 'Catálogo de equipamentos (RF-013). room_id opcional (equipamento alocado a uma sala).';
create index if not exists idx_equipment_room_id on public.equipment (room_id) where room_id is not null;

-- ---- 3.4 reservations -----------------------------------------------------
create table if not exists public.reservations (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete restrict,  -- F-31/F-35: preserva reservas; excluir usuário exige desativar/migrar antes
  resource_kind        public.resource_kind not null,
  room_id              uuid references public.rooms (id) on delete restrict,
  equipment_id         uuid references public.equipment (id) on delete restrict,
  reservation_date     date not null,
  start_time           time not null,
  end_time             time not null,
  purpose              text,
  status               public.reservation_status not null default 'pending',
  recurrence_group_id  uuid,                           -- agrupa reservas geradas em série
  recurrence_type      public.recurrence_type not null default 'none',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint reservations_time_order check (start_time < end_time),
  -- XOR: exatamente um recurso, coerente com resource_kind (ADR-001, Eixo 2)
  constraint reservations_resource_xor check (
    (resource_kind = 'room'      and room_id is not null and equipment_id is null) or
    (resource_kind = 'equipment' and equipment_id is not null and room_id is null)
  )
);
comment on table public.reservations is 'Reservas de sala OU equipamento numa tabela só (RF-006/007). XOR garante coerência.';

-- Índice para detecção de conflito de horário por sala (RF-006, F-14)
create index if not exists idx_reservations_room_conflict
  on public.reservations (room_id, reservation_date, start_time, end_time)
  where room_id is not null;
-- Índice análogo para equipamento
create index if not exists idx_reservations_equipment_conflict
  on public.reservations (equipment_id, reservation_date, start_time, end_time)
  where equipment_id is not null;
-- Listagem "minhas reservas" por usuário, ordenadas por data
create index if not exists idx_reservations_user
  on public.reservations (user_id, reservation_date desc);
-- Fila do admin: reservas pendentes (RF-008)
create index if not exists idx_reservations_status_pending
  on public.reservations (status, reservation_date)
  where status = 'pending';
-- Agrupamento de séries recorrentes
create index if not exists idx_reservations_recurrence_group
  on public.reservations (recurrence_group_id)
  where recurrence_group_id is not null;

-- ---- 3.5 approval_events (timeline append-only) ---------------------------
create table if not exists public.approval_events (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations (id) on delete cascade,
  actor_id        uuid references public.profiles (id) on delete set null,
  action          public.approval_action not null,
  reason          text,
  created_at      timestamptz not null default now()
);
comment on table public.approval_events is 'Trilha imutável de aprovação (RF-008, F-21/22/23, mockup 12).';
create index if not exists idx_approval_events_reservation
  on public.approval_events (reservation_id, created_at);

-- ---- 3.6 notifications ----------------------------------------------------
create table if not exists public.notifications (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles (id) on delete cascade,
  type                   text not null,
  title                  text not null,
  message                text not null,
  is_read                boolean not null default false,
  related_reservation_id uuid references public.reservations (id) on delete set null,
  created_at             timestamptz not null default now()
);
comment on table public.notifications is 'Central de notificações pessoais (RF-011).';
create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, is_read, created_at desc);

-- ---- 3.7 signup_requests (cadastro pré-login) -----------------------------
create table if not exists public.signup_requests (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text not null,
  department  text,
  role        public.user_role not null default 'professor',
  motivo      text,
  status      public.signup_status not null default 'pending',
  reason      text,                                    -- justificativa do admin (decisão)
  created_at  timestamptz not null default now()
);
comment on table public.signup_requests is 'Solicitações de cadastro auto-serviço pré-login (RF-010, F-03/F-32/F-33).';
-- e-mail único somente enquanto pendente (permite re-submissão após recusa)
create unique index if not exists uniq_signup_requests_email_pending
  on public.signup_requests (email)
  where status = 'pending';

-- ---- 3.8 user_preferences -------------------------------------------------
create table if not exists public.user_preferences (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  theme              public.theme_pref    not null default 'system',
  language           public.language_pref not null default 'pt-BR',
  density            public.density_pref  not null default 'comfortable',
  reduce_motion      boolean not null default false,
  two_factor_enabled boolean not null default false,
  updated_at         timestamptz not null default now()
);
comment on table public.user_preferences is 'Preferências da conta (RF-012, mockup 11).';

-- ---- 3.9 notification_preferences (matriz por tipo de evento) -------------
create table if not exists public.notification_preferences (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  event_type    text not null,
  channel_app   boolean not null default true,
  channel_email boolean not null default true,
  primary key (user_id, event_type)
);
comment on table public.notification_preferences is 'Matriz canal x tipo de evento (RF-012, mockup 11).';

-- ---- 3.10 Função helper is_admin() (após profiles existir) -----------------
--    SECURITY DEFINER: lê profiles com privilégio do owner, evitando recursão
--    de RLS quando chamada dentro das policies da própria tabela profiles.
--    EXECUTE só para authenticated (ver migration 0002 — advisor 0028/0029).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ============================================================================
-- 4. Triggers
-- ============================================================================

-- ---- 4.1 updated_at via moddatetime ---------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','rooms','equipment','reservations','user_preferences'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_moddatetime on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_moddatetime before update on public.%1$s '
      'for each row execute function extensions.moddatetime(updated_at);', t);
  end loop;
end$$;

-- ---- 4.2 profile-on-signup: cria profile ao surgir auth.users -------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, department, siape_matricula, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'professor',  -- segurança: papel NUNCA vem do metadata do signup; admin promove via UPDATE
    new.raw_user_meta_data ->> 'department',
    new.raw_user_meta_data ->> 'siape_matricula',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;

  -- defaults de preferências para o novo usuário
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. Row-Level Security
-- ============================================================================
alter table public.profiles                 enable row level security;
alter table public.rooms                     enable row level security;
alter table public.equipment                 enable row level security;
alter table public.reservations              enable row level security;
alter table public.approval_events           enable row level security;
alter table public.notifications             enable row level security;
alter table public.signup_requests           enable row level security;
alter table public.user_preferences          enable row level security;
alter table public.notification_preferences  enable row level security;

-- Helper para recriar policies de forma idempotente
-- (Postgres não tem CREATE POLICY IF NOT EXISTS; usamos DROP IF EXISTS antes).

-- ---- 5.1 profiles ---------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());
-- INSERT em profiles fica a cargo do trigger (SECURITY DEFINER); clientes não inserem.

-- ---- 5.2 rooms (leitura geral, escrita admin) -----------------------------
drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select to authenticated
  using (true);

drop policy if exists rooms_write on public.rooms;
create policy rooms_write on public.rooms
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- 5.3 equipment --------------------------------------------------------
drop policy if exists equipment_select on public.equipment;
create policy equipment_select on public.equipment
  for select to authenticated
  using (true);

drop policy if exists equipment_write on public.equipment;
create policy equipment_write on public.equipment
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- 5.4 reservations -----------------------------------------------------
drop policy if exists reservations_select on public.reservations;
create policy reservations_select on public.reservations
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists reservations_insert on public.reservations;
create policy reservations_insert on public.reservations
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists reservations_update on public.reservations;
create policy reservations_update on public.reservations
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists reservations_delete on public.reservations;
create policy reservations_delete on public.reservations
  for delete to authenticated
  using (user_id = auth.uid());

-- ---- 5.5 approval_events (admin escreve; dono da reserva e admin leem) -----
drop policy if exists approval_events_select on public.approval_events;
create policy approval_events_select on public.approval_events
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.reservations r
      where r.id = approval_events.reservation_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists approval_events_insert on public.approval_events;
create policy approval_events_insert on public.approval_events
  for insert to authenticated
  with check (public.is_admin());
-- sem UPDATE/DELETE: tabela append-only.

-- ---- 5.6 notifications ----------------------------------------------------
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert to authenticated
  -- dono cria a própria; admin pode criar para o alvo (ex.: aviso de aprovação)
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

-- ---- 5.7 signup_requests (INSERT pré-login por anon, leitura/decisão admin)
drop policy if exists signup_requests_insert on public.signup_requests;
create policy signup_requests_insert on public.signup_requests
  for insert to anon
  with check (
    status = 'pending'                 -- não pode auto-aprovar
    and reason is null                 -- não escreve justificativa de decisão
    and email ilike '%@ifpb.edu.br'    -- somente e-mail institucional (RF-001/RF-003)
  );

drop policy if exists signup_requests_select on public.signup_requests;
create policy signup_requests_select on public.signup_requests
  for select to authenticated
  using (public.is_admin());

drop policy if exists signup_requests_update on public.signup_requests;
create policy signup_requests_update on public.signup_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists signup_requests_delete on public.signup_requests;
create policy signup_requests_delete on public.signup_requests
  for delete to authenticated
  using (public.is_admin());

-- ---- 5.8 user_preferences (somente o dono) --------------------------------
drop policy if exists user_preferences_all on public.user_preferences;
create policy user_preferences_all on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- 5.9 notification_preferences (somente o dono) ------------------------
drop policy if exists notification_preferences_all on public.notification_preferences;
create policy notification_preferences_all on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- Fim da migration 0001.
-- ============================================================================
