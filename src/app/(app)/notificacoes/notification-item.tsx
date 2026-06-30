"use client";

/**
 * Item interativo da Central de Notificações (F-34 CA03/CA04 · F-35
 * CA01/CA02/CA03). Client island mínimo: ao clicar, marca como lida via mutation
 * TanStack Query (optimistic update — a leitura aparece na hora, o cache
 * reconcilia depois) e — quando há reserva relacionada — navega para o detalhe
 * (`/minhas-reservas/[id]`); sem reserva, apenas marca e permanece no painel
 * (F-35 CA03). O estado de não-lida é comunicado por MAIS DE UM canal além da
 * cor (WCAG 1.4.1): faixa lateral, peso do título, marcador com `aria-label` e
 * texto "Não lida" para leitores de tela.
 */
import { useRouter } from "next/navigation";
import {
  relativeTime,
  typeMeta,
  type NotificationRow,
} from "@/lib/notifications";
import { useMarkNotificationRead } from "@/hooks/queries/use-notifications";

interface Props {
  notification: NotificationRow;
}

export function NotificationItem({ notification }: Props) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();

  const meta = typeMeta(notification.type);
  const unread = !notification.is_read;
  const href = notification.related_reservation_id
    ? `/minhas-reservas/${notification.related_reservation_id}`
    : null;

  const handleActivate = () => {
    // Optimistic: o cache vira `is_read: true` imediatamente (onMutate). A
    // navegação não espera o round-trip — a leitura já está refletida na UI.
    if (unread) markRead.mutate(notification.id);
    if (href) router.push(href);
  };

  const isPending = markRead.isPending;

  return (
    <article
      className={`bg-surface-container-lowest rounded-lg border-l-4 shadow-sm transition-shadow hover:shadow-md ${
        unread ? meta.accentClass : "border-transparent opacity-80"
      }`}
    >
      <button
        type="button"
        onClick={handleActivate}
        disabled={isPending}
        aria-busy={isPending}
        className="touch-target gap-md p-md flex w-full items-start text-left disabled:opacity-70"
      >
        {/* Ícone por tipo — espaço reservado evita CLS */}
        <span
          className={`gap-md flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined">{meta.icon}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-body-md text-on-surface block">
            <span className={unread ? "font-semibold" : "font-normal"}>
              {notification.title}
            </span>
            {notification.message ? (
              <>
                {" — "}
                {notification.message}
              </>
            ) : null}
          </span>
          <span className="text-body-sm text-on-surface-variant mt-xs gap-xs flex items-center">
            <span className="sr-only">{meta.label}. </span>
            {meta.label} · {relativeTime(notification.created_at)}
            {href && (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden="true"
              >
                chevron_right
              </span>
            )}
          </span>
        </span>

        {/* Marcador de não-lida — cor + aria-label + texto p/ leitor de tela */}
        {unread ? (
          <span className="mt-1 flex flex-shrink-0 items-center">
            <span
              className="bg-primary h-2.5 w-2.5 rounded-full"
              aria-hidden="true"
            />
            <span className="sr-only">Não lida</span>
          </span>
        ) : (
          // Reserva o mesmo espaço quando lida (sem CLS entre estados).
          <span className="mt-1 h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
        )}
      </button>
    </article>
  );
}
