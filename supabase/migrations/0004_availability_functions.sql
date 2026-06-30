-- ============================================================================
-- SIRA — Migration 0004: funções de disponibilidade (detecção de conflito) + busca.
-- SECURITY DEFINER: avaliam conflito contra TODAS as reservas (pending/approved)
-- sem expor autor/finalidade de terceiros. EXECUTE só p/ authenticated (advisor 0028/0029).
-- Usadas pela tela Nova Reserva (F-14/F-15/F-18).
-- ============================================================================

-- Disponibilidade de um recurso num intervalo (true = livre). Sobreposição parcial conta.
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
      and r.status in ('pending','approved')           -- canceladas/recusadas não bloqueiam
      and (p_exclude_reservation is null or r.id <> p_exclude_reservation)
      and (
        (p_resource_kind = 'room'      and r.room_id = p_room_id) or
        (p_resource_kind = 'equipment' and r.equipment_id = p_equipment_id)
      )
      and r.start_time < p_end and p_start < r.end_time -- sobreposição (inclui parcial)
  );
$$;

-- Salas disponíveis que atendem tipo + TODOS os recursos pedidos (AND), ordenadas por capacidade.
create or replace function public.search_available_rooms(
  p_date date,
  p_start time,
  p_end time,
  p_type public.room_type default null,
  p_resources text[] default '{}'
) returns setof public.rooms
language sql stable security definer set search_path = public as $$
  select r.* from public.rooms r
  where r.status = 'active'
    and (p_type is null or r.type = p_type)
    and (
      coalesce(array_length(p_resources, 1), 0) = 0
      or (select bool_and(r.resources ? res) from unnest(p_resources) as res)
    )
    and public.check_resource_availability('room', r.id, null, p_date, p_start, p_end)
  order by r.capacity asc;
$$;

-- Equipamentos disponíveis (ativos) que atendem o tipo, ordenados por nome.
create or replace function public.search_available_equipment(
  p_date date,
  p_start time,
  p_end time,
  p_type text default null
) returns setof public.equipment
language sql stable security definer set search_path = public as $$
  select e.* from public.equipment e
  where e.status = 'active'
    and (p_type is null or e.type = p_type)
    and public.check_resource_availability('equipment', null, e.id, p_date, p_start, p_end)
  order by e.name asc;
$$;

revoke all on function public.check_resource_availability(public.resource_kind, uuid, uuid, date, time, time, uuid) from public, anon;
revoke all on function public.search_available_rooms(date, time, time, public.room_type, text[]) from public, anon;
revoke all on function public.search_available_equipment(date, time, time, text) from public, anon;
grant execute on function public.check_resource_availability(public.resource_kind, uuid, uuid, date, time, time, uuid) to authenticated;
grant execute on function public.search_available_rooms(date, time, time, public.room_type, text[]) to authenticated;
grant execute on function public.search_available_equipment(date, time, time, text) to authenticated;
