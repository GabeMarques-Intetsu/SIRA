"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { sortByDateDesc, type NotificationRow } from "@/lib/notifications";

/**
 * Estado de SERVIDOR (TanStack Query) da Central de Notificações (RF-011 ·
 * EP-11). Demonstra o padrão completo: query (cache + sincronização) + mutations
 * com optimistic update (rollback em erro, invalidate em settle).
 *
 * As leituras/escritas usam o cliente Supabase de BROWSER (anon). A RLS de
 * `notifications` garante que cada usuário só lê/atualiza as próprias linhas
 * (F-36 CA03) — nada de service-role no client. Os componentes consomem apenas
 * `useNotifications()` / `useMarkNotificationRead()` / `useMarkAllRead()`; toda
 * a mecânica de cache fica encapsulada aqui.
 */

// ─────────────────────────── Factory de query keys ──────────────────────────

/**
 * Factory de chaves em array — estável e hierárquica, permite invalidar tudo
 * (`notificationKeys.all`) ou apenas a lista (`notificationKeys.lists()`).
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
} as const;

/** Colunas lidas — espelham `NotificationRow` (sem `user_id`, já filtrado por RLS). */
const SELECT_COLUMNS =
  "id, type, title, message, is_read, related_reservation_id, created_at";

async function fetchNotifications(): Promise<NotificationRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationRow[];
}

// ─────────────────────────── useQuery ───────────────────────────────────────

/**
 * Lê as notificações do usuário (ordenadas desc — F-34 CA02). Recebe
 * `initialData` do Server Component (padrão de hidratação App Router): a 1ª
 * pintura usa o fetch do servidor (LCP/SEO), e o cache assume a partir daí
 * (refetch só após `staleTime`, definido global em providers.tsx).
 */
export function useNotifications(
  initialData?: NotificationRow[],
): UseQueryResult<NotificationRow[], Error> {
  return useQuery({
    queryKey: notificationKeys.lists(),
    queryFn: fetchNotifications,
    initialData,
  });
}

// ─────────────────────────── Mutations (optimistic) ─────────────────────────

interface MutationContext {
  previous: NotificationRow[] | undefined;
}

/**
 * Marca UMA notificação como lida (F-35 CA01/CA02) com optimistic update:
 * cancela refetches em voo, fotografa o cache, aplica `is_read: true`
 * imediatamente; em erro faz rollback; em settle invalida para reconciliar com
 * o servidor. RLS-safe: o UPDATE só atinge a própria linha.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MutationContext>({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      const previous = queryClient.getQueryData<NotificationRow[]>(
        notificationKeys.lists(),
      );
      queryClient.setQueryData<NotificationRow[]>(
        notificationKeys.lists(),
        (rows) => rows?.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
    },
  });
}

/**
 * Marca TODAS as não lidas como lidas (F-36 CA01/CA02/CA03), também otimista.
 * Idempotente quando não há nada por ler. Mesmo ciclo cancel→snapshot→rollback
 * →invalidate.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void, MutationContext>({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw new Error(error.message);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      const previous = queryClient.getQueryData<NotificationRow[]>(
        notificationKeys.lists(),
      );
      queryClient.setQueryData<NotificationRow[]>(
        notificationKeys.lists(),
        (rows) => rows?.map((n) => ({ ...n, is_read: true })),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
    },
  });
}

/** Reexporta o ordenador puro p/ os consumidores manterem a ordem desc no cache. */
export { sortByDateDesc };
