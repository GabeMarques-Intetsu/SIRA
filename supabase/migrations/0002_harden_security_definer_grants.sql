-- ============================================================================
-- SIRA — Migration 0002: endurece EXECUTE de funções SECURITY DEFINER
-- Resolve os advisors 0028/0029 (anon/authenticated podiam chamar via RPC):
--   - handle_new_user() é APENAS gatilho (trigger) → ninguém precisa de EXECUTE.
--   - is_admin() é usada nas policies RLS → mantém EXECUTE só p/ authenticated.
-- ============================================================================

revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
