/**
 * Testes unitários da lógica pura da reserva temporária (hold).
 * Rastreabilidade: RNF-reserva-temporaria (TTL 10 min) · F-49 / ADR-009.
 *
 * Runner: `node:test`. Execução: `npm run test:unit`. `now` é fixo (relógio
 * controlado), como exige a métrica "prazo de expiração com relógio controlado".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { HOLD_TTL_MINUTES, holdExpiry } from "../src/lib/holds.ts";

const NOW = new Date("2026-06-26T12:00:00.000Z");

test("HOLD_TTL_MINUTES é 10 (RNF-reserva-temporaria)", () => {
  assert.equal(HOLD_TTL_MINUTES, 10);
});

test("holdExpiry retorna now + 10 minutos em ISO-8601 UTC", () => {
  assert.equal(holdExpiry(NOW), "2026-06-26T12:10:00.000Z");
});

test("holdExpiry é sempre posterior a now", () => {
  const expiry = new Date(holdExpiry(NOW));
  assert.ok(expiry.getTime() > NOW.getTime());
  assert.equal(expiry.getTime() - NOW.getTime(), HOLD_TTL_MINUTES * 60_000);
});
