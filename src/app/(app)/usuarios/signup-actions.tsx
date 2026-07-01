"use client";

/**
 * Ações de decisão sobre solicitações de cadastro (client island — F-32/F-33).
 * - Aprovar: confirmação inline simples (F-32 CA02/CA04).
 * - Recusar: diálogo acessível (role="dialog", aria-modal) com textarea de motivo
 *   OBRIGATÓRIO + contador; foco preso, fecha com Esc; erro associado ao campo
 *   via aria-describedby + aria-invalid (F-33 CA01 · WCAG 2.2 AA).
 *
 * Pending via `useTransition`; ao concluir, `router.refresh()` re-renderiza o
 * Server Component (a solicitação sai da fila — F-32 CA04 · F-33 CA03). Ações que
 * voltam `ok:true` com aviso (provisionamento pendente) exibem o aviso.
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { REJECT_REASON_MAX } from "@/lib/users";
import { approveSignupAction, rejectSignupAction } from "./actions";

interface Props {
  signupId: string;
}

export function SignupActions({ signupId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  const runApprove = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await approveSignupAction(signupId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.error) setNotice(res.error);
      router.refresh();
    });
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
        <button
          type="button"
          onClick={runApprove}
          disabled={isPending}
          className="px-md bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant text-label-md gap-xs flex items-center rounded-lg py-2 disabled:opacity-60"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            how_to_reg
          </span>
          {isPending && !rejectOpen ? "Aprovando…" : "Aprovar"}
        </button>
      </div>

      {notice && (
        <span
          role="status"
          className="text-label-sm text-on-surface-variant text-right"
        >
          {notice}
        </span>
      )}
      {error && (
        <span role="alert" className="text-label-sm text-error text-right">
          {error}
        </span>
      )}

      {rejectOpen && (
        <RejectDialog
          signupId={signupId}
          isPending={isPending}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => {
            setError(null);
            startTransition(async () => {
              const res = await rejectSignupAction(signupId, reason);
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
  signupId: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Diálogo modal de recusa de cadastro (F-33). Acessível: foco inicial no
 * textarea, Esc fecha, foco preso, motivo obrigatório com `aria-invalid` + erro
 * associado por `aria-describedby` (WCAG 2.2 AA).
 */
function RejectDialog({
  signupId,
  isPending,
  onClose,
  onConfirm,
}: DialogProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = `reject-signup-title-${signupId}`;
  const errorId = `reject-signup-error-${signupId}`;
  const counterId = `reject-signup-counter-${signupId}`;

  const empty = reason.trim().length === 0;
  const showError = touched && empty;

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
            Explique o motivo. O solicitante poderá consultá-lo ao reabrir o
            cadastro.
          </p>
        </div>

        <div className="gap-xs flex flex-col">
          <label
            htmlFor={`reject-signup-reason-${signupId}`}
            className="text-label-md text-on-surface"
          >
            Motivo da recusa
          </label>
          <textarea
            id={`reject-signup-reason-${signupId}`}
            ref={textareaRef}
            value={reason}
            maxLength={REJECT_REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-required="true"
            aria-invalid={showError}
            aria-describedby={`${counterId}${showError ? ` ${errorId}` : ""}`}
            rows={4}
            placeholder="Ex.: E-mail não pertence à instituição."
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
              className="text-label-sm text-on-surface-variant"
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
