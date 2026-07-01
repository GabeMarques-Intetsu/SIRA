"use client";

/**
 * Ações por usuário (client island): editar (F-30), ativar/inativar (F-31 CA04)
 * e excluir com confirmação (F-31 CA01/CA02/CA03).
 *
 * Acessibilidade: menu com role="menu", fecha com Esc/clique-fora; o diálogo de
 * confirmação é acessível (role="alertdialog", foco no botão seguro, Esc cancela
 * — F-31 CA01). A trava do último admin e o bloqueio de auto-exclusão são
 * decididos NO SERVIDOR; a mensagem orientadora aparece aqui (segurança).
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HEAVY_HISTORY_THRESHOLD, initials, type Profile } from "@/lib/users";
import {
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { UserForm } from "./user-form";
import { deleteUserAction, setUserStatusAction } from "./actions";

interface Props {
  user: Profile;
  /** Nº de reservas do usuário — orienta inativar vs excluir (F-31 CA03). */
  reservationCount: number;
  /** É o admin logado? (não pode se auto-excluir por aqui). */
  isSelf: boolean;
}

export function UserRowActions({ user, reservationCount, isSelf }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isActive = user.status === "active";

  const toggleStatus = () => {
    setError(null);
    startTransition(async () => {
      const res = await setUserStatusAction(
        user.id,
        isActive ? "inactive" : "active",
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const runDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      setConfirming(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Pode voltar `ok:true` com aviso (inativado por ter histórico).
      if (res.error) setError(res.error);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu
          align="end"
          menuClassName="w-[13rem]"
          triggerLabel={`Ações para ${user.full_name}`}
          menuLabel={`Ações para ${user.full_name}`}
          triggerClassName="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
          trigger={<span className="material-symbols-outlined">more_vert</span>}
        >
          <DropdownItem icon="edit" onSelect={() => setEditing(true)}>
            Editar
          </DropdownItem>
          <DropdownItem
            icon={isActive ? "block" : "check_circle"}
            disabled={isPending}
            onSelect={toggleStatus}
          >
            {isActive ? "Inativar" : "Ativar"}
          </DropdownItem>
          {!isSelf && (
            <>
              <DropdownSeparator />
              <DropdownItem
                icon="delete"
                destructive
                onSelect={() => setConfirming(true)}
              >
                Excluir
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </div>

      {error && (
        <p role="alert" className="text-label-sm text-error mt-xs text-right">
          {error}
        </p>
      )}

      {editing && <UserForm user={user} onClose={() => setEditing(false)} />}

      {confirming && (
        <ConfirmDelete
          name={user.full_name}
          avatar={initials(user.full_name)}
          heavyHistory={reservationCount >= HEAVY_HISTORY_THRESHOLD}
          reservationCount={reservationCount}
          isPending={isPending}
          onCancel={() => setConfirming(false)}
          onInactivate={toggleStatus}
          onConfirm={runDelete}
        />
      )}
    </>
  );
}

/**
 * Diálogo de confirmação de exclusão (F-31 CA01). Quando o usuário tem histórico
 * extenso (≥ limite), recomenda INATIVAR em vez de excluir (F-31 CA03) e oferece
 * a ação de inativar ali mesmo. O servidor ainda assim preserva o histórico:
 * se houver QUALQUER reserva, inativa em vez de apagar (F-31 CA02).
 */
function ConfirmDelete({
  name,
  avatar,
  heavyHistory,
  reservationCount,
  isPending,
  onCancel,
  onInactivate,
  onConfirm,
}: {
  name: string;
  avatar: string;
  heavyHistory: boolean;
  reservationCount: number;
  isPending: boolean;
  onCancel: () => void;
  onInactivate: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-user-title"
        className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex w-full max-w-[30rem] flex-col rounded-t-xl border shadow-lg sm:rounded-xl"
      >
        <h2
          id="confirm-delete-user-title"
          className="text-headline-sm text-on-surface gap-sm flex items-center"
        >
          <span
            className="bg-tertiary text-on-tertiary text-label-md flex h-9 w-9 items-center justify-center rounded-full font-bold"
            aria-hidden="true"
          >
            {avatar}
          </span>
          Excluir usuário?
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Esta ação encerra o acesso de{" "}
          <strong className="text-on-surface">{name}</strong>. As reservas dele
          são preservadas e marcadas — não são apagadas.
        </p>

        {heavyHistory && (
          <div className="gap-sm p-sm bg-tertiary-fixed/40 border-tertiary/30 flex items-start rounded-md border">
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              info
            </span>
            <span className="text-body-sm text-on-surface">
              {name} tem {reservationCount} reservas no histórico. Recomendamos{" "}
              <strong>inativar</strong> em vez de excluir, para preservar o
              histórico sem deixar a conta ativa.
            </span>
          </div>
        )}

        <div className="gap-sm flex flex-wrap justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container-high text-label-md rounded-lg border py-2 disabled:opacity-60"
          >
            Cancelar
          </button>
          {heavyHistory && (
            <button
              type="button"
              onClick={onInactivate}
              disabled={isPending}
              className="px-md bg-secondary text-on-secondary text-label-md gap-xs flex items-center rounded-lg py-2 disabled:opacity-60"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              >
                block
              </span>
              Inativar
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-md bg-error text-on-error text-label-md gap-xs flex items-center rounded-lg py-2 disabled:opacity-60"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              delete
            </span>
            {isPending ? "Processando…" : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
