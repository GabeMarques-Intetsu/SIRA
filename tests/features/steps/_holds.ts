/**
 * Regra de disponibilidade com reserva temporária (hold) — F-49.
 *
 * Espelho 1:1 da RPC `check_resource_availability` (migration 0008): um recurso
 * está DISPONÍVEL para `viewer` num slot quando NÃO existe
 *  (a) reserva pending/approved sobreposta, NEM
 *  (b) hold VIVO (`expiresAt > now`) de OUTRO usuário sobreposto.
 *
 * Reusa `timesOverlap` de `@/lib/reservation` (a MESMA função de sobreposição
 * usada na busca e na reserva). O `now` é o relógio fixo da suíte (`NOW`).
 */
import { timesOverlap } from "@/lib/reservation";
import type { SiraWorld, WorldReservation } from "../support/world";
import { NOW } from "../support/world";

/** Status de reserva que ocupam o slot (bloqueiam). */
const BLOCKING: WorldReservation["status"][] = ["pending", "approved"];

/** Há reserva pending/approved sobreposta para a sala no slot? */
function reservationBlocks(
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

/** Há hold VIVO de OUTRO usuário (≠ viewer) sobreposto? */
function holdBlocks(
  world: SiraWorld,
  viewer: string,
  roomName: string,
  date: string,
  start: string,
  end: string,
  now: Date,
): boolean {
  return world.holds.some(
    (h) =>
      h.roomName === roomName &&
      h.date === date &&
      h.owner !== viewer && // exclusão por auth.uid()
      new Date(h.expiresAt).getTime() > now.getTime() && // expires_at > now()
      timesOverlap(start, end, h.start, h.end),
  );
}

/**
 * Disponibilidade do recurso para `viewer` no slot — mesma semântica da RPC.
 * `now` default = relógio fixo da suíte.
 */
export function isAvailableFor(
  world: SiraWorld,
  viewer: string,
  roomName: string,
  date: string,
  start: string,
  end: string,
  now: Date = NOW,
): boolean {
  if (reservationBlocks(world, roomName, date, start, end)) return false;
  if (holdBlocks(world, viewer, roomName, date, start, end, now)) return false;
  return true;
}
