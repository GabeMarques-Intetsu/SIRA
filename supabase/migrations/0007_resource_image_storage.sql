-- ============================================================================
-- SIRA — Migration 0007: imagem de salas/equipamentos (ADR-008, F-47/F-48).
-- Coluna image_path (caminho do objeto no Storage) + bucket público de leitura.
-- Upload server-side via service-role (bypassa RLS); policies de escrita admin
-- são defesa em profundidade. Leitura pública (bucket público).
-- ============================================================================

alter table public.rooms add column if not exists image_path text;
alter table public.equipment add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('resource-images', 'resource-images', true)
on conflict (id) do nothing;

-- Leitura: bucket público serve objetos via URL pública SEM policy de SELECT
-- (uma policy ampla de SELECT permitiria LISTAR todos os arquivos — advisor 0025).
drop policy if exists "resource_images_read" on storage.objects;

drop policy if exists "resource_images_admin_insert" on storage.objects;
create policy "resource_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resource-images' and public.is_admin());

drop policy if exists "resource_images_admin_update" on storage.objects;
create policy "resource_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'resource-images' and public.is_admin());

drop policy if exists "resource_images_admin_delete" on storage.objects;
create policy "resource_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resource-images' and public.is_admin());
