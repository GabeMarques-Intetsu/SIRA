/**
 * Testes do mapeamento reserva → evento (F-13 · CA02/CA03).
 * Execução: `node --test --experimental-strip-types tests/calendar-events.test.ts`
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reservationsToEvents,
  type ReservationRow,
} from "../src/lib/calendar-events.ts";

const WEEK = [
  "2025-01-13",
  "2025-01-14",
  "2025-01-15",
  "2025-01-16",
  "2025-01-17",
  "2025-01-18",
  "2025-01-19",
];

function row(over: Partial<ReservationRow>): ReservationRow {
  return {
    id: "r1",
    reservation_date: "2025-01-14",
    start_time: "14:00:00",
    end_time: "16:00:00",
    status: "approved",
    resource_kind: "room",
    purpose: null,
    rooms: { name: "Lab 1", block: "A" },
    equipment: null,
    profiles: { full_name: "Ana Souza" },
    ...over,
  };
}

// CA02 — célula ocupada mostra sala e autor.
test("evento expõe sala/equipamento e autor", () => {
  const [ev] = reservationsToEvents([row({})], WEEK);
  assert.equal(ev.resourceName, "Lab 1");
  assert.equal(ev.authorName, "Ana Souza");
  assert.equal(ev.timeLabel, "14:00 – 16:00");
  assert.equal(ev.dayIndex, 1); // terça
});

// CA02 — evento de 2h ocupa 2 faixas (row-span).
test("evento multi-hora ocupa as faixas correspondentes", () => {
  const [ev] = reservationsToEvents([row({})], WEEK); // 14h–16h
  assert.equal(ev.slotIndex, 7); // 14h = faixa 7 (07h = 0)
  assert.equal(ev.span, 2);
});

test("usa nome do equipamento quando não é sala", () => {
  const [ev] = reservationsToEvents(
    [
      row({
        resource_kind: "equipment",
        rooms: null,
        equipment: { name: "Projetor X", block: "C" },
      }),
    ],
    WEEK,
  );
  assert.equal(ev.resourceName, "Projetor X");
  assert.equal(ev.resourceKind, "equipment");
});

test("descarta reserva fora da semana visível", () => {
  const events = reservationsToEvents(
    [row({ reservation_date: "2025-02-01" })],
    WEEK,
  );
  assert.equal(events.length, 0);
});

test("recorta reserva que ultrapassa o intervalo visível", () => {
  // 18h–21h deve recortar para terminar às 19h (1 faixa).
  const [ev] = reservationsToEvents(
    [row({ start_time: "18:00:00", end_time: "21:00:00" })],
    WEEK,
  );
  assert.equal(ev.slotIndex, 11); // 18h
  assert.equal(ev.span, 1);
});

// Ativas (pending/approved) aparecem e preservam o status p/ cor (CA03);
// recusadas/canceladas SOMEM da agenda (não recolorem) — fix do bug reportado.
test("recusadas e canceladas não aparecem; ativas preservam o status (CA03)", () => {
  const pending = reservationsToEvents([row({ status: "pending" })], WEEK);
  const approved = reservationsToEvents([row({ status: "approved" })], WEEK);
  const rejected = reservationsToEvents([row({ status: "rejected" })], WEEK);
  const cancelled = reservationsToEvents([row({ status: "cancelled" })], WEEK);

  assert.equal(pending[0].status, "pending");
  assert.equal(approved[0].status, "approved");
  assert.equal(rejected.length, 0, "reserva recusada deve sumir da agenda");
  assert.equal(cancelled.length, 0, "reserva cancelada deve sumir da agenda");
});
