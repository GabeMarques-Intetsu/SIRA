"use client";

/**
 * Ações de decisão (client island) para cada solicitação da fila (F-22/F-23).
 * - Aprovar: confirmação inline; se houver conflito sinalizado (mockup 08),
 *   exige confirmação explícita antes de prosseguir (F-22 CA06).
 * - Recusar: diálogo acessível (role="dialog", aria-modal) com textarea de
 *   motivo OBRIGATÓRIO + contador; foco preso, fecha com Esc; erro associado ao
 *   campo via aria-describedby + aria-invalid (F-23 CA01 · WCAG 2.2 AA).
 *
 * Estados de loading via `useTransition`; ao concluir, `router.refresh()`
 * re-renderiza o Server Component (a solicitação sai da fila — F-21 CA06).
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReservationAction, rejectReservationAction } from "./actions";
import { REJECT_REASON_MAX } from "@/lib/approvals";

interface Props {
  reservationId: string;
  /** Há conflito potencial sinalizado nesta solicitação (F-22 CA05). */
  hasConflict?: boolean;
}

export function ApprovalActions({ reservationId, hasConflict = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Aprovação: pede confirmação explícita SOMENTE quando há conflito (CA06).
  const [confirmingApprove, setConfirmingApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const runApprove = (confirmConflict = false) => {
    setError(null);
    startTransition(async () => {
      const res = await approveReservationAction(reservationId, {
        confirmConflict,
      });
      setConfirmingApprove(false);
      if (!res.ok) {
        if (res.needsConfirmation) setConfirmingApprove(true);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const handleApproveClick = () => {
    if (hasConflict) {
      setConfirmingApprove(true);
      return;
    }
    runApprove();
  };

  return (
    <div className="gap-sm flex w-full flex-col items-end">
      <div className="gap-sm flex flex-wrap items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRejectOpen(true);
          }}
          disabled={isPending}
          className="px-md border-error text-error hover:bg-error-container text-label-md gap-xs flex items-center rounded-lg border py-2 disabled:opacity-60"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            close
          </span>
          Recusar
        </button>

        {confirmingApprove ? (
          <span
            role="alertdialog"
            aria-label="Confirmar aprovação em conflito"
            className="gap-xs flex flex-wrap items-center"
          >
            <span className="text-label-sm text-on-surface-variant">
              Aprovar mesmo com conflito?
            </span>
            <button
              type="button"
              onClick={() => runApprove(true)}
              disabled={isPending}
              className="px-sm bg-secondary text-on-secondary text-label-sm rounded-lg py-1.5 disabled:opacity-60"
            >
              {isPending ? "Aprovando…" : "Sim, aprovar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingApprove(false)}
              disabled={isPending}
              className="px-sm border-outline-variant text-on-surface text-label-sm rounded-lg border py-1.5"
            >
              Não
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleApproveClick}
            disabled={isPending}
            className="px-md bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant text-label-md gap-xs flex items-center rounded-lg py-2 disabled:opacity-60"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              check
            </span>
            {isPending && !rejectOpen ? "Aprovando…" : "Aprovar"}
          </button>
        )}
      </div>

      {error && (
        <span role="alert" className="text-label-sm text-error">
          {error}
        </span>
      )}

      {rejectOpen && (
        <RejectDialog
          reservationId={reservationId}
          isPending={isPending}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => {
            setError(null);
            startTransition(async () => {
              const res = await rejectReservationAction(reservationId, reason);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setRejectOpen(false);
              router.refresh();
            });
          }}
        />
      )}
    </div>
  );
}

interface DialogProps {
  reservationId: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Diálogo modal de recusa (F-23). Acessível: foco inicial no textarea, Esc
 * fecha, foco preso entre os elementos focáveis, motivo obrigatório com
 * `aria-invalid` + erro associado por `aria-describedby` (WCAG 2.2 AA).
 */
function RejectDialog({
  reservationId,
  isPending,
  onClose,
  onConfirm,
}: DialogProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = `reject-title-${reservationId}`;
  const errorId = `reject-error-${reservationId}`;
  const counterId = `reject-counter-${reservationId}`;

  const empty = reason.trim().length === 0;
  const showError = touched && empty;
  const remaining = REJECT_REASON_MAX - reason.length;

  // Foco inicial + Esc + armadilha de foco (WCAG 2.1.2 / 2.4.3).
  useEffect(() => {
    textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, textarea, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    setTouched(true);
    if (empty) {
      textareaRef.current?.focus();
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex w-full max-w-[32rem] flex-col rounded-t-xl border shadow-lg sm:rounded-xl"
      >
        <div className="gap-xs flex flex-col">
          <h2 id={titleId} className="text-headline-sm text-on-surface">
            Recusar solicitação
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Explique o motivo. O solicitante receberá esta justificativa.
          </p>
        </div>

        <div className="gap-xs flex flex-col">
          <label
            htmlFor={`reject-reason-${reservationId}`}
            className="text-label-md text-on-surface"
          >
            Motivo da recusa
          </label>
          <textarea
            id={`reject-reason-${reservationId}`}
            ref={textareaRef}
            value={reason}
            maxLength={REJECT_REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-required="true"
            aria-invalid={showError}
            aria-describedby={`${counterId}${showError ? ` ${errorId}` : ""}`}
            rows={4}
            placeholder="Ex.: Sala em manutenção no horário solicitado."
            className={`border-outline-variant bg-surface text-on-surface text-body-sm p-sm focus:ring-primary w-full resize-none rounded-lg border outline-none focus:ring-2 ${
              showError ? "border-error ring-error ring-1" : ""
            }`}
          />
          <div className="flex items-center justify-between">
            {showError ? (
              <span
                id={errorId}
                role="alert"
                className="text-label-sm text-error"
              >
                O motivo é obrigatório.
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
            <span
              id={counterId}
              className={`text-label-sm ${remaining < 0 ? "text-error" : "text-on-surface-variant"}`}
            >
              {reason.length}/{REJECT_REASON_MAX}
            </span>
          </div>
        </div>

        <div className="gap-sm flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container-high text-label-md rounded-lg border py-2 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="px-md bg-error text-on-error text-label-md gap-xs flex items-center rounded-lg py-2 disabled:opacity-60"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              close
            </span>
            {isPending ? "Recusando…" : "Confirmar recusa"}
          </button>
        </div>
      </div>
    </div>
  );
}
