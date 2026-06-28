-- ============================================================================
-- SIRA — Migration 0005: evento 'submitted' na timeline ao criar reserva.
-- O RLS de approval_events só permite INSERT por admin; este trigger
-- SECURITY DEFINER cria o evento inicial do autor (timeline da F-17 começa correta).
-- ============================================================================

create or replace function public.log_reservation_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.approval_events (reservation_id, actor_id, action)
  values (new.id, new.user_id, 'submitted');
  return new;
end;
$$;

revoke all on function public.log_reservation_submitted() from public, anon, authenticated;

drop trigger if exists trg_reservation_submitted on public.reservations;
create trigger trg_reservation_submitted
  after insert on public.reservations
  for each row execute function public.log_reservation_submitted();
