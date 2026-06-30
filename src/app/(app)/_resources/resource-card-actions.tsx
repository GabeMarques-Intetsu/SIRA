"use client";

/**
 * Ações por recurso (client island) — botão Editar + menu "Mais ações" com
 * mudança de estado (ativar/inativar/manutenção) e exclusão com confirmação.
 * Salas: F-26 (editar/estado) · F-27 (excluir com confirmação + bloqueio).
 * Equipamentos: F-45 (editar/estado) · F-46 (excluir com confirmação + bloqueio).
 *
 * Acessibilidade: menu com role="menu", fecha com Esc/clique-fora; o diálogo de
 * confirmação é acessível (role="alertdialog", foco no botão seguro, Esc cancela
 * — F-27 CA01 · F-46 CA02/CA05). O bloqueio por reservas futuras é decidido NO
 * SERVIDOR e a mensagem orientadora aparece aqui (F-27 CA03 · F-46 CA03).
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Equipment, ResourceKind, Room } from "@/lib/resources";
import {
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { ResourceForm, ResourceModalPortal } from "./resource-form";
import {
  deleteEquipmentAction,
  deleteRoomAction,
  setEquipmentStatusAction,
  setRoomStatusAction,
} from "./resource-actions";

interface RoomOption {
  id: string;
  name: string;
  block: string | null;
}

interface Props {
  kind: ResourceKind;
  room?: Room;
  equipment?: Equipment;
  rooms?: RoomOption[];
}

const STATUS_ACTIONS: {
  value: "active" | "inactive" | "maintenance";
  label: string;
  icon: string;
}[] = [
  { value: "active", label: "Ativar", icon: "check_circle" },
  { value: "maintenance", label: "Em manutenção", icon: "build" },
  { value: "inactive", label: "Inativar", icon: "block" },
];

export function ResourceCardActions({
  kind,
  room,
  equipment,
  rooms = [],
}: Props) {
  const router = useRouter();
  const isRoom = kind === "room";
  const id = isRoom ? room!.id : equipment!.id;
  const name = isRoom ? room!.name : equipment!.name;
  const currentStatus = isRoom ? room!.status : equipment!.status;

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const changeStatus = (status: "active" | "inactive" | "maintenance") => {
    setError(null);
    startTransition(async () => {
      const res = isRoom
        ? await setRoomStatusAction(id, status)
        : await setEquipmentStatusAction(id, status);
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
      const res = isRoom
        ? await deleteRoomAction(id)
        : await deleteEquipmentAction(id);
      if (!res.ok) {
        setConfirming(false);
        setError(res.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="gap-xs flex items-center">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
          aria-label={`Editar ${name}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            edit
          </span>
        </button>

        <DropdownMenu
          align="end"
          menuClassName="w-[12rem]"
          triggerLabel={`Mais ações para ${name}`}
          menuLabel={`Ações para ${name}`}
          triggerClassName="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
          trigger={
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
            >
              more_vert
            </span>
          }
        >
          {STATUS_ACTIONS.filter((a) => a.value !== currentStatus).map((a) => (
            <DropdownItem
              key={a.value}
              icon={a.icon}
              disabled={isPending}
              onSelect={() => changeStatus(a.value)}
            >
              {a.label}
            </DropdownItem>
          ))}
          <DropdownSeparator />
          <DropdownItem
            icon="delete"
            destructive
            onSelect={() => setConfirming(true)}
          >
            Excluir
          </DropdownItem>
        </DropdownMenu>
      </div>

      {error && (
        <p role="alert" className="text-label-sm text-error mt-xs w-full">
          {error}
        </p>
      )}

      {editing && (
        <ResourceForm
          kind={kind}
          room={isRoom ? room : null}
          equipment={!isRoom ? equipment : null}
          rooms={rooms}
          onClose={() => setEditing(false)}
        />
      )}

      {confirming && (
        <ConfirmDelete
          name={name}
          isRoom={isRoom}
          isPending={isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={runDelete}
        />
      )}
    </>
  );
}

/** Diálogo de confirmação de exclusão (F-27 CA01 · F-46 CA02/CA05). */
function ConfirmDelete({
  name,
  isRoom,
  isPending,
  onCancel,
  onConfirm,
}: {
  name: string;
  isRoom: boolean;
  isPending: boolean;
  onCancel: () => void;
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
    <ResourceModalPortal>
      <div className="fixed inset-0 isolate z-[100] flex items-end justify-center sm:items-center">
        <button
          type="button"
          aria-label="Cancelar"
          tabIndex={-1}
          className="absolute inset-0 z-0 bg-black/50"
          onClick={onCancel}
        />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative z-10 flex w-full max-w-[28rem] flex-col rounded-t-xl border shadow-lg sm:rounded-xl"
        >
          <h2
            id="confirm-delete-title"
            className="text-headline-sm text-on-surface"
          >
            Excluir {isRoom ? "sala" : "equipamento"}?
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Esta ação remove <strong className="text-on-surface">{name}</strong>{" "}
            do catálogo. {isRoom ? "A sala" : "O equipamento"} com reservas
            futuras não pode ser excluíd{isRoom ? "a" : "o"} — nesse caso,
            inative em vez de excluir.
          </p>
          <div className="gap-sm flex justify-end">
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
              {isPending ? "Excluindo…" : "Confirmar exclusão"}
            </button>
          </div>
        </div>
      </div>
    </ResourceModalPortal>
  );
}
