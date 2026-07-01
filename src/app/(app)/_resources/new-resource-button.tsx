"use client";

/**
 * Botão "Novo" (client island) que abre o diálogo de formulário em modo criar
 * (F-24 · F-43). Dois estilos via `variant`: "header" (botão do topo) e "card"
 * (card tracejado "Adicionar" do mockup 05). Admin-only é garantido pela página
 * (`requireAdmin()`) e pela RLS de escrita — este botão é só a porta de entrada.
 */
import { useState } from "react";
import type { ResourceKind } from "@/lib/resources";
import { ResourceForm } from "./resource-form";

interface RoomOption {
  id: string;
  name: string;
  block: string | null;
}

interface Props {
  kind: ResourceKind;
  rooms?: RoomOption[];
  variant?: "header" | "card";
}

export function NewResourceButton({
  kind,
  rooms = [],
  variant = "header",
}: Props) {
  const [open, setOpen] = useState(false);
  const isRoom = kind === "room";
  const label = isRoom ? "Nova sala" : "Novo equipamento";

  return (
    <>
      {variant === "header" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-md bg-primary text-on-primary hover:bg-surface-tint text-label-md gap-xs flex items-center rounded-lg py-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            add
          </span>
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">Novo</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-surface-container-low/50 border-outline-variant hover:bg-surface-container hover:border-primary text-on-surface-variant hover:text-primary gap-sm p-lg flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40 }}
            aria-hidden="true"
          >
            add_circle
          </span>
          <span className="text-label-md">
            Adicionar {isRoom ? "sala" : "equipamento"}
          </span>
        </button>
      )}

      {open && (
        <ResourceForm
          kind={kind}
          rooms={rooms}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
