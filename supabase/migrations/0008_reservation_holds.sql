-- ============================================================================
-- SIRA — Migration 0008: reserva temporária / hold (ADR-009, F-49, RF-006/008).
-- Ao iniciar a solicitação, cria-se um "hold" que torna o recurso indisponível
-- p/ outros até concluir (vira pending) ou expirar (TTL). A checagem de
-- disponibilidade passa a contar holds NÃO expirados de OUTROS usuários.
-- ============================================================================

create table if not exists public.reservation_holds (
  id uuid primary key default gen_random_uuid(),
  resource_kind public.resource_kind not null,
  room_id uuid references public.rooms(id) on delete cascade,
  equipment_id uuid references public.equipment(id) on delete cascade,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint reservation_holds_resource_chk check (
    (resource_kind = 'room' and room_id is not null and equipment_id is null) or
    (resource_kind = 'equipment' and equipment_id is not null and room_id is null)
  )
);

create index if not exists reservation_holds_lookup
  on public.reservation_holds (reservation_date, room_id, equipment_id, expires_at);

alter table public.reservation_holds enable row level security;

-- O dono gerencia só os próprios holds (a checagem de outros é via RPC SECURITY DEFINER).
drop policy if exists holds_own_all on public.reservation_holds;
create policy holds_own_all on public.reservation_holds
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Disponibilidade: livre se NÃO há reserva pending/approved sobreposta
-- E NÃO há hold vivo (expires_at > now) de OUTRO usuário sobreposto.
create or replace function public.check_resource_availability(
  p_resource_kind public.resource_kind,
  p_room_id uuid,
  p_equipment_id uuid,
  p_date date,
  p_start time,
  p_end time,
  p_exclude_reservation uuid default null
) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.reservations r
    where r.reservation_date = p_date
      and r.status in ('pending','approved')
      and (p_exclude_reservation is null or r.id <> p_exclude_reservation)
      and ((p_resource_kind = 'room'      and r.room_id = p_room_id) or
           (p_resource_kind = 'equipment' and r.equipment_id = p_equipment_id))
      and r.start_time < p_end and p_start < r.end_time
  )
  and not exists (
    select 1 from public.reservation_holds h
    where h.reservation_date = p_date
      and h.expires_at > now()
      and h.user_id <> auth.uid()
      and ((p_resource_kind = 'room'      and h.room_id = p_room_id) or
           (p_resource_kind = 'equipment' and h.equipment_id = p_equipment_id))
      and h.start_time < p_end and p_start < h.end_time
  );
$$;
