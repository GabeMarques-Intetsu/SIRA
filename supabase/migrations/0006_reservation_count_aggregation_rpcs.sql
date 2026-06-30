-- ============================================================================
-- SIRA — Migration 0006: RPCs de contagem agregada (GROUP BY no Postgres).
-- Evita trazer linhas de `reservations` só para contar no app (o PostgREST do
-- projeto tem agregação desabilitada). SECURITY DEFINER + gated por is_admin()
-- (as telas que usam — Usuários e Recursos — são admin-only).
-- ============================================================================

-- Total de reservas por usuário (hint inativar-vs-excluir, F-31 CA03).
create or replace function public.reservation_counts_by_user()
returns table (user_id uuid, total bigint)
language sql stable security definer set search_path = public as $$
  select r.user_id, count(*)::bigint
  from public.reservations r
  where public.is_admin()
  group by r.user_id;
$$;

revoke all on function public.reservation_counts_by_user() from public, anon;
grant execute on function public.reservation_counts_by_user() to authenticated;

-- Reservas FUTURAS pendentes/aprovadas por recurso (sala OU equipamento).
create or replace function public.reservation_counts_by_resource(p_kind public.resource_kind)
returns table (resource_id uuid, total bigint)
language sql stable security definer set search_path = public as $$
  select s.rid, count(*)::bigint
  from (
    select case when p_kind = 'room' then r.room_id else r.equipment_id end as rid
    from public.reservations r
    where public.is_admin()
      and r.status in ('pending','approved')
      and r.reservation_date >= current_date
  ) s
  where s.rid is not null
  group by s.rid;
$$;

revoke all on function public.reservation_counts_by_resource(public.resource_kind) from public, anon;
grant execute on function public.reservation_counts_by_resource(public.resource_kind) to authenticated;
