/**
 * Testes unitários da lógica pura da Nova Reserva (F-14 / RF-006).
 * Rastreabilidade: CA02 (início < fim), CA03 (data ≥ hoje), CA09 (sobreposição
 * parcial), CA17/CA19 (recorrência: única é padrão; diária/semanal/custom).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expandReservationDates,
  timesOverlap,
  validateSlot,
} from "../src/lib/reservation.ts";

const NOW = new Date("2026-06-13T12:00:00Z"); // sábado

// CA03 — data anterior a hoje é barrada.
test("validateSlot barra data no passado (CA03)", () => {
  assert.equal(
    validateSlot({ date: "2026-06-12", start: "14:00", end: "16:00" }, NOW),
    "date-past",
  );
});

// CA03 — hoje é aceito.
test("validateSlot aceita hoje", () => {
  assert.equal(
    validateSlot({ date: "2026-06-13", start: "14:00", end: "16:00" }, NOW),
    null,
  );
});

// CA02 — início >= fim é barrado.
test("validateSlot barra início >= fim (CA02)", () => {
  assert.equal(
    validateSlot({ date: "2026-06-20", start: "16:00", end: "14:00" }, NOW),
    "time-order",
  );
  assert.equal(
    validateSlot({ date: "2026-06-20", start: "14:00", end: "14:00" }, NOW),
    "time-order",
  );
});

test("validateSlot aceita slot válido futuro", () => {
  assert.equal(
    validateSlot({ date: "2026-06-20", start: "14:00", end: "16:00" }, NOW),
    null,
  );
});

// CA09 — sobreposição parcial e total contam; encostar não conta.
test("timesOverlap detecta sobreposição parcial (CA09)", () => {
  assert.equal(timesOverlap("14:30", "16:00", "14:00", "15:00"), true);
});
test("timesOverlap detecta contenção total", () => {
  assert.equal(timesOverlap("14:00", "18:00", "15:00", "16:00"), true);
});
test("timesOverlap: intervalos que apenas encostam não colidem", () => {
  assert.equal(timesOverlap("14:00", "15:00", "15:00", "16:00"), false);
});

// CA19 — sem recorrência, uma única data (padrão).
test("expandReservationDates: none gera uma única data (CA19)", () => {
  assert.deepEqual(
    expandReservationDates({ type: "none", startDate: "2026-06-20" }),
    ["2026-06-20"],
  );
});

// CA17 — diária.
test("expandReservationDates: daily gera N dias consecutivos (CA17)", () => {
  assert.deepEqual(
    expandReservationDates({
      type: "daily",
      startDate: "2026-06-20",
      count: 3,
    }),
    ["2026-06-20", "2026-06-21", "2026-06-22"],
  );
});

// CA17 — semanal.
test("expandReservationDates: weekly gera N semanas (CA17)", () => {
  assert.deepEqual(
    expandReservationDates({
      type: "weekly",
      startDate: "2026-06-20",
      count: 3,
    }),
    ["2026-06-20", "2026-06-27", "2026-07-04"],
  );
});

// CA17 — personalizada: seg+qua por 2 semanas a partir de uma segunda (15/06).
test("expandReservationDates: custom respeita dias da semana (CA17)", () => {
  const out = expandReservationDates({
    type: "custom",
    startDate: "2026-06-15", // segunda
    count: 2,
    weekdays: [1, 3], // SEG, QUA
  });
  assert.deepEqual(out, [
    "2026-06-15",
    "2026-06-17",
    "2026-06-22",
    "2026-06-24",
  ]);
});

// custom nunca gera datas anteriores à inicial.
test("expandReservationDates: custom não retrocede antes da data inicial", () => {
  const out = expandReservationDates({
    type: "custom",
    startDate: "2026-06-17", // quarta
    count: 1,
    weekdays: [1, 3], // SEG (anterior) e QUA (a própria)
  });
  assert.deepEqual(out, ["2026-06-17"]);
});
