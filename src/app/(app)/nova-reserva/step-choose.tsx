"use client";

/**
 * Passo 3 — Escolher o recurso (CA04..CA11, CA16). Dispara a busca no servidor
 * (RPC RLS-safe) ao entrar no passo e quando os filtros mudam; só lista
 * recursos disponíveis. Estado vazio ⇒ mensagem "Nenhuma sala disponível para
 * os critérios" (CA11). Radiogroup acessível para selecionar um recurso.
 */
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  searchResourcesAction,
  type RoomResult,
  type EquipmentResult,
} from "./actions";
import type { WizardState } from "./types";

interface StepChooseProps {
  state: WizardState;
  patch: (partial: Partial<WizardState>) => void;
}

/** Recursos de infraestrutura filtráveis em AND (CA07 — somente salas). */
const ROOM_RESOURCES = ["datashow", "ar-condicionado", "computadores", "som"];

export function StepChoose({ state, patch }: StepChooseProps) {
  const [pending, startTransition] = useTransition();
  const [rooms, setRooms] = useState<RoomResult[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [block, setBlock] = useState("");
  const [capacity, setCapacity] = useState("");
  const [resources, setResources] = useState<string[]>([]);

  const kind = state.kind ?? "room";

  // Refaz a busca quando entra no passo ou quando os filtros AND mudam (CA16).
  useEffect(() => {
    if (!state.date || !state.start || !state.end) return;
    startTransition(async () => {
      const res = await searchResourcesAction({
        kind,
        date: state.date,
        start: state.start,
        end: state.end,
        resources: kind === "room" ? resources : undefined,
      });
      setRooms(res.rooms);
      setEquipment(res.equipment);
      setError(res.error);
    });
  }, [kind, state.date, state.start, state.end, resources]);

  const toggleResource = (r: string) => {
    setResources((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

  const blocks = useMemo(() => {
    const src =
      kind === "room"
        ? rooms.map((r) => r.block)
        : equipment.map((e) => e.block);
    return Array.from(
      new Set(src.filter((b): b is string => Boolean(b))),
    ).sort();
  }, [kind, rooms, equipment]);

  // Filtros client-side adicionais (texto/bloco/capacidade) sobre os
  // disponíveis — a regra de conflito/ativo já foi aplicada no servidor.
  const visibleRooms = rooms.filter((r) => {
    if (query && !r.name.toLowerCase().includes(query.toLowerCase()))
      return false;
    if (block && r.block !== block) return false;
    if (capacity === "20" && r.capacity > 20) return false;
    if (capacity === "50" && (r.capacity < 21 || r.capacity > 50)) return false;
    if (capacity === "51" && r.capacity <= 50) return false;
    return true;
  });
  const visibleEquipment = equipment.filter((e) => {
    if (query && !e.name.toLowerCase().includes(query.toLowerCase()))
      return false;
    if (block && e.block !== block) return false;
    return true;
  });

  const isEmpty =
    !pending &&
    !error &&
    (kind === "room"
      ? visibleRooms.length === 0
      : visibleEquipment.length === 0);

  return (
    <div className="gap-md flex flex-col">
      <div className="gap-sm flex flex-wrap items-center">
        <div className="relative min-w-[200px] flex-1">
          <span
            className="left-md material-symbols-outlined text-on-surface-variant absolute top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              kind === "room" ? "Buscar sala…" : "Buscar equipamento…"
            }
            aria-label="Buscar recurso"
            className="pr-md border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary text-body-sm w-full rounded-lg border py-2 pl-[44px] outline-none focus:ring-2"
          />
        </div>
        <select
          aria-label="Bloco"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
          className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-sm rounded-lg border py-2 outline-none focus:ring-2"
        >
          <option value="">Todos os blocos</option>
          {blocks.map((b) => (
            <option key={b} value={b}>
              Bloco {b}
            </option>
          ))}
        </select>
        {kind === "room" && (
          <select
            aria-label="Capacidade"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-sm rounded-lg border py-2 outline-none focus:ring-2"
          >
            <option value="">Qualquer capacidade</option>
            <option value="20">Até 20 pessoas</option>
            <option value="50">21 – 50</option>
            <option value="51">50+</option>
          </select>
        )}
      </div>

      {/* Recursos exigidos em AND — CA07 (só salas) */}
      {kind === "room" && (
        <fieldset className="gap-xs flex flex-col">
          <legend className="text-label-sm text-on-surface-variant">
            Recursos necessários
          </legend>
          <div className="gap-xs flex flex-wrap">
            {ROOM_RESOURCES.map((r) => {
              const on = resources.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleResource(r)}
                  className={`px-md text-label-md rounded-full py-1.5 transition-colors ${
                    on
                      ? "bg-secondary text-on-secondary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {pending && (
        <p className="text-body-sm text-on-surface-variant py-md text-center">
          Buscando recursos disponíveis…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-body-sm text-on-error-container bg-error-container px-md rounded-lg py-2"
        >
          {error}
        </p>
      )}

      {isEmpty && (
        <div className="p-xl gap-sm flex flex-col items-center text-center">
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: 40 }}
            aria-hidden="true"
          >
            search_off
          </span>
          <p className="text-body-md text-on-surface-variant">
            Nenhuma sala disponível para os critérios
          </p>
        </div>
      )}

      {!isEmpty && !pending && (
        <ul
          role="radiogroup"
          aria-label="Selecione um recurso"
          className="gap-sm flex flex-col"
        >
          {(kind === "room"
            ? visibleRooms.map((r) => ({
                id: r.id,
                name: r.name,
                meta: [
                  r.block ? `Bloco ${r.block}` : null,
                  `${r.capacity} lugares`,
                ]
                  .filter(Boolean)
                  .join(" · "),
                icon: "meeting_room",
              }))
            : visibleEquipment.map((e) => ({
                id: e.id,
                name: e.name,
                meta: [e.block ? `Bloco ${e.block}` : null, e.type]
                  .filter(Boolean)
                  .join(" · "),
                icon: "videocam",
              }))
          ).map((item) => {
            const selected = state.resourceId === item.id;
            return (
              <li key={item.id}>
                <label
                  className={`p-md gap-md flex cursor-pointer items-center rounded-lg border-2 transition-colors ${
                    selected
                      ? "border-primary bg-surface"
                      : "border-outline-variant bg-surface hover:bg-surface-container-low"
                  }`}
                >
                  <input
                    type="radio"
                    name="recurso"
                    checked={selected}
                    onChange={() =>
                      patch({
                        resourceId: item.id,
                        resourceLabel: `${item.name} (${item.meta})`,
                      })
                    }
                    className="text-primary h-5 w-5"
                  />
                  <span className="bg-primary-fixed flex h-12 w-12 items-center justify-center rounded-lg">
                    <span
                      className="material-symbols-outlined text-on-primary-fixed"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                  </span>
                  <span className="flex-1">
                    <span className="text-body-md text-on-surface block font-medium">
                      {item.name}
                    </span>
                    <span className="text-body-sm text-on-surface-variant block">
                      {item.meta}
                    </span>
                  </span>
                  <span className="bg-secondary-container text-on-secondary-container text-label-sm rounded-full px-2 py-0.5">
                    Disponível
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
