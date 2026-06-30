/**
 * Testes unitários da lógica da Central de Notificações (EP-11 · RF-011).
 * Rastreabilidade:
 *  - F-34: CA02 (ordem desc), CA03 (tipo→ícone), CA04 (lida/não-lida diferenciadas),
 *    CA05 (caixa vazia → grupos vazios omitidos), agrupamento Hoje/Semana/Anteriores.
 *  - F-35: CA01/CA02 (contador de não lidas decrementa via unreadCount).
 *  - F-36: CA02 (zera contador quando todas lidas).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyFilter,
  filterCounts,
  groupByRecency,
  NOTIFICATION_TYPE_DEFAULT,
  parseFilter,
  relativeTime,
  sortByDateDesc,
  typeMeta,
  unreadCount,
  type NotificationRow,
} from "../src/lib/notifications.ts";

const NOW = new Date("2026-06-13T12:00:00Z");

function n(over: Partial<NotificationRow>): NotificationRow {
  return {
    id: "n1",
    type: "system",
    title: "Aviso",
    message: "Mensagem",
    is_read: false,
    related_reservation_id: null,
    created_at: "2026-06-13T11:45:00Z",
    ...over,
  };
}

test("sortByDateDesc — mais recentes primeiro (F-34 CA02)", () => {
  const rows = [
    n({ id: "a", created_at: "2026-06-10T10:00:00Z" }),
    n({ id: "b", created_at: "2026-06-13T10:00:00Z" }),
    n({ id: "c", created_at: "2026-06-11T10:00:00Z" }),
  ];
  assert.deepEqual(
    sortByDateDesc(rows).map((r) => r.id),
    ["b", "c", "a"],
  );
});

test("typeMeta — tipo conhecido mapeia ícone; desconhecido cai no default (F-34 CA03)", () => {
  assert.equal(typeMeta("reservation_approved").icon, "check_circle");
  assert.equal(typeMeta("reservation_rejected").icon, "cancel");
  assert.equal(typeMeta("xpto_desconhecido"), NOTIFICATION_TYPE_DEFAULT);
});

test("unreadCount — conta apenas não lidas (F-35 CA02 / F-36 CA02)", () => {
  const rows = [
    n({ is_read: false }),
    n({ is_read: true }),
    n({ is_read: false }),
  ];
  assert.equal(unreadCount(rows), 2);
  assert.equal(unreadCount(rows.map((r) => ({ ...r, is_read: true }))), 0);
});

test("groupByRecency — Hoje / Esta semana / Anteriores (mockup 10)", () => {
  const rows = [
    n({ id: "hoje", created_at: "2026-06-13T08:00:00Z" }),
    n({ id: "semana", created_at: "2026-06-10T08:00:00Z" }),
    n({ id: "antigo", created_at: "2026-05-01T08:00:00Z" }),
  ];
  const groups = groupByRecency(rows, NOW);
  assert.deepEqual(
    groups.map((g) => g.key),
    ["today", "week", "earlier"],
  );
  assert.equal(groups[0].items[0].id, "hoje");
});

test("groupByRecency — grupos vazios são omitidos; caixa vazia → [] (F-34 CA05)", () => {
  assert.deepEqual(groupByRecency([], NOW), []);
  const onlyToday = groupByRecency(
    [n({ created_at: "2026-06-13T09:00:00Z" })],
    NOW,
  );
  assert.equal(onlyToday.length, 1);
  assert.equal(onlyToday[0].key, "today");
});

test("applyFilter — unread / reservations / approvals / system", () => {
  const rows = [
    n({ id: "u", type: "system", is_read: false }),
    n({ id: "r", type: "reservation_approved", is_read: true }),
    n({ id: "ap", type: "reservation_pending", is_read: true }),
    n({ id: "sys", type: "system", is_read: true }),
  ];
  assert.deepEqual(
    applyFilter(rows, "unread").map((r) => r.id),
    ["u"],
  );
  assert.deepEqual(
    applyFilter(rows, "reservations")
      .map((r) => r.id)
      .sort(),
    ["ap", "r"],
  );
  assert.deepEqual(
    applyFilter(rows, "approvals").map((r) => r.id),
    ["ap"],
  );
  assert.deepEqual(
    applyFilter(rows, "system")
      .map((r) => r.id)
      .sort(),
    ["sys", "u"],
  );
  assert.equal(applyFilter(rows, "all").length, 4);
});

test("filterCounts — badges de cada chip", () => {
  const rows = [
    n({ type: "reservation_approved", is_read: false }),
    n({ type: "system", is_read: true }),
  ];
  const c = filterCounts(rows);
  assert.equal(c.all, 2);
  assert.equal(c.unread, 1);
  assert.equal(c.reservations, 1);
  assert.equal(c.system, 1);
});

test("parseFilter — valida o search param", () => {
  assert.equal(parseFilter("unread"), "unread");
  assert.equal(parseFilter("lixo"), "all");
  assert.equal(parseFilter(undefined), "all");
});

test("relativeTime — minutos, horas, ontem, data absoluta", () => {
  assert.equal(relativeTime("2026-06-13T11:45:00Z", NOW), "há 15 min");
  assert.equal(relativeTime("2026-06-13T09:00:00Z", NOW), "há 3 h");
  assert.equal(relativeTime("2026-06-12T20:00:00Z", NOW), "ontem");
  assert.equal(relativeTime("2026-05-01T10:00:00Z", NOW), "01/05");
});
