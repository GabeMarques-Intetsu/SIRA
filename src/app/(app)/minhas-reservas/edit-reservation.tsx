"use client";

/**
 * Edição inline de reserva PENDENTE (F-18 CA01/CA02/CA03/CA04). Só é montado
 * pelo detalhe quando `status === 'pending'` (CA01/CA03 — aprovada/recusada fica
 * read-only). Permite alterar data, horário e sala (CA02). A Server Action
 * re-checa o conflito antes de gravar (CA04) e devolve a mensagem de erro.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SLOT_ERROR_MESSAGE, validateSlot } from "@/lib/reservation";
import { editReservationAction } from "./actions";

interface RoomOption {
  id: string;
  name: string;
  block: string | null;
}

interface Props {
  reservationId: string;
  isRoom: boolean;
  initial: {
    date: string;
    start: string;
    end: string;
    roomId: string | null;
  };
  rooms: RoomOption[];
}

export function EditReservation({
  reservationId,
  isRoom,
  initial,
  rooms,
}: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [roomId, setRoomId] = useState(initial.roomId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const slotError = validateSlot({ date, start, end });

  const handleSave = () => {
    if (slotError) {
      setError(SLOT_ERROR_MESSAGE[slotError]);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await editReservationAction({
        reservationId,
        date,
        start,
        end,
        roomId: isRoom ? roomId || null : null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-md border-outline-variant text-on-surface hover:bg-surface-container text-label-md gap-xs flex items-center rounded-lg border py-2"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          edit
        </span>
        Editar reserva
      </button>
    );
  }

  return (
    <section
      aria-label="Editar reserva"
      className="bg-surface-container-low p-md gap-md border-outline-variant flex w-full flex-col rounded-xl border"
    >
      <h3 className="text-label-md text-on-surface">Editar reserva pendente</h3>

      <div className="gap-md grid grid-cols-1 md:grid-cols-3">
        <label className="gap-xs flex flex-col">
          <span className="text-label-sm text-on-surface">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          />
        </label>
        <label className="gap-xs flex flex-col">
          <span className="text-label-sm text-on-surface">Início</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          />
        </label>
        <label className="gap-xs flex flex-col">
          <span className="text-label-sm text-on-surface">Fim</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          />
        </label>
      </div>

      {isRoom && rooms.length > 0 && (
        <label className="gap-xs flex flex-col">
          <span className="text-label-sm text-on-surface">Sala</span>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.block ? ` · Bloco ${r.block}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p
          role="alert"
          className="text-body-sm text-on-error-container bg-error-container px-md gap-xs flex items-center rounded-lg py-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            error
          </span>
          {error}
        </p>
      )}

      <div className="gap-sm flex flex-wrap justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={isPending}
          className="px-md border-outline-variant text-on-surface hover:bg-surface-container text-label-md rounded-lg border py-2"
        >
          Cancelar edição
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || Boolean(slotError)}
          className="px-md bg-primary text-on-primary hover:bg-surface-tint text-label-md gap-xs flex items-center rounded-lg py-2 disabled:opacity-50"
        >
          {isPending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </section>
  );
}
