/**
 * Testes unitários das utilidades de calendário (F-13).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  formatTime,
  getHourSlots,
  parseIso,
  timeToHours,
  toIso,
} from "../src/lib/calendar.ts";

// CA01 — 12 faixas horárias de 07h a 18h
test("getHourSlots cobre 07h–19h em 12 faixas", () => {
  const slots = getHourSlots();
  assert.equal(slots.length, 12);
  assert.equal(slots[0], 7);
  assert.equal(slots.at(-1), 18);
});

test("parseIso rejeita datas impossíveis", () => {
  assert.equal(parseIso("2025-02-30"), null);
  assert.equal(parseIso("2025-13-01"), null);
  assert.equal(parseIso(""), null);
  assert.equal(parseIso(undefined), null);
  assert.ok(parseIso("2025-02-28"));
});

test("timeToHours e formatTime convertem o tipo time do Postgres", () => {
  assert.equal(timeToHours("08:30:00"), 8.5);
  assert.equal(timeToHours("14:00:00"), 14);
  assert.equal(formatTime("08:00:00"), "08:00");
});

test("addDays não muta a data original", () => {
  const base = parseIso("2025-01-13")!;
  const later = addDays(base, 7);
  assert.equal(toIso(base), "2025-01-13");
  assert.equal(toIso(later), "2025-01-20");
});
import { getWeekDays, isSameWeek, startOfWeek } from "../src/lib/calendar.ts";

// CA01 — 7 dias começando na segunda-feira.
test("getWeekDays retorna 7 dias SEG→DOM", () => {
  const week = startOfWeek(parseIso("2025-01-15")!); // quarta
  const days = getWeekDays(week, new Date("2025-01-15T12:00:00Z"));
  assert.equal(days.length, 7);
  assert.equal(days[0].iso, "2025-01-13"); // segunda
  assert.equal(days[0].weekdayLabel, "SEG");
  assert.equal(days[6].iso, "2025-01-19"); // domingo
  assert.equal(days[6].weekdayLabel, "DOM");
  assert.equal(days[6].isWeekend, true);
  assert.equal(days[5].isWeekend, true); // sábado
  assert.equal(days[0].isWeekend, false);
});

test("startOfWeek de um domingo recua para a segunda anterior", () => {
  const sunday = parseIso("2025-01-19")!;
  assert.equal(toIso(startOfWeek(sunday)), "2025-01-13");
});

// CA05 — identificar se a semana exibida é a atual
test("isSameWeek detecta a semana atual", () => {
  const now = parseIso("2025-01-15")!;
  assert.equal(isSameWeek(now, parseIso("2025-01-13")!), true);
  assert.equal(isSameWeek(now, parseIso("2025-01-20")!), false);
});