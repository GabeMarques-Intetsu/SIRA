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