"use client";

/**
 * Botão de cancelamento com confirmação explícita (F-19 CA02). Sem confirmar,
 * nada acontece (a reserva segue pendente). Ao confirmar, chama a Server Action
 * que valida dono+status e muda para `cancelled` (CA01/CA03). Variante `compact`
 * para a lista; variante completa para o detalhe.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelReservationAction } from "./actions";

interface Props {
  reservationId: string;
  /** Estilo compacto (ícone+texto curto) usado nos itens da lista. */
  compact?: boolean;
}

export function CancelButton({ reservationId, compact = false }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await cancelReservationAction(reservationId);
      if (!res.ok) {
        setError(res.error);
        setConfirming(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  };

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-label="Confirmar cancelamento"
        className="gap-xs flex flex-wrap items-center"
      >
        <span className="text-label-sm text-on-surface-variant">
          Cancelar mesmo?
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="px-sm bg-error text-on-error text-label-sm rounded-lg py-1 disabled:opacity-60"
        >
          {isPending ? "Cancelando…" : "Sim, cancelar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-sm border-outline-variant text-on-surface text-label-sm rounded-lg border py-1"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <div className="gap-xs flex flex-col items-end">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className={
          compact
            ? "px-sm text-error hover:bg-error-container text-label-md gap-xs flex items-center rounded-lg py-1"
            : "px-md border-error text-error hover:bg-error-container text-label-md gap-xs flex items-center rounded-lg border py-2"
        }
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          close
        </span>
        <span className={compact ? "hidden sm:inline" : ""}>
          {compact ? "Cancelar" : "Cancelar reserva"}
        </span>
      </button>
      {error && (
        <span role="alert" className="text-label-sm text-error">
          {error}
        </span>
      )}
    </div>
  );
}
