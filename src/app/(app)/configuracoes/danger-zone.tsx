"use client";

/**
 * Zona de risco — Exportar meus dados (F-41) e Excluir minha conta (F-42).
 *
 * F-41: a Server Action devolve o payload (só dados do próprio usuário, CA02/03);
 * aqui serializamos em JSON e disparamos o download com nome legível (CA04).
 * F-42: confirmação explícita e irreversível em diálogo (CA01/02/04); ao
 * confirmar, inativa a conta + encerra sessão e redireciona p/ /login (CA03).
 *
 * A11y: diálogo de confirmação com role="alertdialog"/aria-modal, foco inicial
 * no botão seguro (Cancelar), Esc fecha.
 */
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { exportFileName, type Profile } from "@/lib/preferences";
import { exportMyDataAction, deleteMyAccountAction } from "./actions";

interface Props {
  profile: Profile;
}

export function DangerZone({ profile }: Props) {
  const router = useRouter();
  const [isExporting, startExport] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = () => {
    setExportError(null);
    startExport(async () => {
      const res = await exportMyDataAction();
      if (!res.ok) {
        setExportError(res.error);
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFileName(profile.id);
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <section
      aria-labelledby="risco-h"
      className="bg-error-container/30 border-error/40 p-md md:p-lg rounded-xl border"
    >
      <h2 id="risco-h" className="text-headline-sm text-error mb-sm">
        Zona de risco
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-md">
        Ações irreversíveis. Os procedimentos abaixo afetam permanentemente sua
        conta.
      </p>

      {exportError && (
        <p role="alert" className="text-body-sm text-error mb-md">
          {exportError}
        </p>
      )}

      <div className="gap-sm flex flex-wrap">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="px-md border-error text-error hover:bg-error-container text-label-md rounded-lg border py-2 disabled:opacity-60"
        >
          {isExporting ? "Exportando…" : "Exportar meus dados"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="px-md bg-error text-on-error text-label-md rounded-lg py-2 hover:opacity-90"
        >
          Excluir minha conta
        </button>
      </div>

      {confirmOpen && (
        <DeleteConfirmDialog
          onCancel={() => setConfirmOpen(false)}
          onDeleted={() => router.replace("/login")}
        />
      )}
    </section>
  );
}

function DeleteConfirmDialog({
  onCancel,
  onDeleted,
}: {
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    cancelRef.current?.focus(); // foco no botão seguro (CA04)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
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
  }, [onCancel]);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteMyAccountAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDeleted(); // CA03 — sessão encerrada; redireciona p/ login
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cancelar"
        tabIndex={-1}
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex w-full max-w-[28rem] flex-col rounded-t-xl border shadow-lg sm:rounded-xl"
      >
        <h3 id={titleId} className="text-headline-sm text-error">
          Excluir minha conta
        </h3>
        <p id={descId} className="text-body-md text-on-surface">
          Esta ação é <strong>irreversível</strong>. Sua conta será desativada,
          sua sessão encerrada e você não conseguirá mais acessar o SIRA com
          ela.
        </p>

        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}

        <div className="gap-sm mt-sm flex justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container-high text-label-md rounded-lg border py-2 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="px-md bg-error text-on-error text-label-md rounded-lg py-2 hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Excluindo…" : "Sim, excluir conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
