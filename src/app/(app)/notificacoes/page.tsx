import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseFilter, type NotificationRow } from "@/lib/notifications";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = { title: "Notificações · SIRA" };

interface SearchParams {
  filtro?: string;
}

/**
 * Central de Notificações (F-34/F-35/F-36 · RF-011). Server Component fino:
 * - garante a sessão (RBAC) e busca as notificações do usuário — o RLS de
 *   `notifications` devolve só as próprias (F-36 CA03), então nunca vazamos
 *   notificações de terceiros;
 * - ordena por `created_at` desc (F-34 CA02);
 * - passa o resultado como `initialData` para o client island
 *   (`NotificationsList`), que assume o estado de servidor via TanStack Query
 *   (cache, sincronização, mutations otimistas de "marcar lida/todas").
 *
 * Padrão de hidratação App Router: o fetch do servidor garante LCP/SEO e a 1ª
 * pintura sem flash; o cache do client toma conta a partir daí.
 */
export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, title, message, is_read, related_reservation_id, created_at",
    )
    .order("created_at", { ascending: false });

  const initialData = error ? [] : ((data ?? []) as NotificationRow[]);
  const filter = parseFilter(params.filtro);

  return <NotificationsList initialData={initialData} filter={filter} />;
}
