/**
 * Helpers de domínio compartilhados pelos step files. Concentram a CHAMADA à
 * lógica pura de `src/lib` para que cada step apenas orquestre estado→ação→assert.
 *
 * Regra de conflito (F-14/F-15): uma sala fica indisponível num intervalo quando
 * existe reserva PENDENTE ou APROVADA que sobrepõe o horário (recusada/cancelada
 * não bloqueiam). Reusa `timesOverlap` de `@/lib/reservation` — a MESMA regra
 * usada pela busca e pela reserva rápida.
 */
import { timesOverlap, validateSlot } from "@/lib/reservation";
import type { SiraWorld, WorldReservation } from "../support/world";
import { NOW, addReservation } from "../support/world";

/** Status que ocupam o horário (bloqueiam nova reserva no mesmo slot). */
const BLOCKING: WorldReservation["status"][] = ["pending", "approved"];

/** Há conflito para `roomName` no intervalo [start,end) na data `date`? */
export function hasConflict(
  world: SiraWorld,
  roomName: string,
  date: string,
  start: string,
  end: string,
): boolean {
  return world.reservations.some(
    (r) =>
      r.roomName === roomName &&
      r.date === date &&
      BLOCKING.includes(r.status) &&
      timesOverlap(start, end, r.start, r.end),
  );
}

/**
 * Tentativa de reserva rápida / nova reserva, aplicando as MESMAS regras de
 * conflito da busca (F-15 CA03). Cria pendente quando livre; senão sinaliza
 * conflito sem criar. Valida também o slot (CA02/CA03) via `validateSlot`.
 */
export function tryReserve(
  world: SiraWorld,
  input: {
    owner: string;
    roomName: string;
    date: string;
    start: string;
    end: string;
    purpose?: string | null;
  },
): { ok: boolean; reservation?: WorldReservation; error?: string } {
  const slotError = validateSlot(
    { date: input.date, start: input.start, end: input.end },
    NOW,
  );
  if (slotError) return { ok: false, error: slotError };

  if (hasConflict(world, input.roomName, input.date, input.start, input.end)) {
    return { ok: false, error: "conflict" };
  }
  const reservation = addReservation(world, {
    owner: input.owner,
    roomName: input.roomName,
    date: input.date,
    start: input.start,
    end: input.end,
    status: "pending",
    purpose: input.purpose ?? null,
  });
  return { ok: true, reservation };
}
