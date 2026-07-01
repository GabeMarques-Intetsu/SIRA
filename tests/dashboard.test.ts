/**
 * Testes unitários da lógica do Painel administrativo (EP-04 · F-12 · RF-004).
 * Rastreabilidade:
 *  - CA02: total de reservas, taxa de aprovação, salas mais ocupadas.
 *  - CA04: período sem dados → indicadores zerados (total 0, taxa null).
 *  - CA05/CA06: série de ocupação por dia + alternativa textual.
 *  - CA07: parsePeriodKey/resolvePeriod (hoje/semana/mês).
 *  - CA09: toActivity + relativeTime (atividade recente).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approvalRate,
  EMPTY_STATUS_COUNTS,
  occupancyAriaLabel,
  occupancyByDay,
  parsePeriodKey,
  relativeTime,
  resolvePeriod,
  toActivity,
  topRooms,
  totalReservations,
  type ReservationStatus,
} from "../src/lib/dashboard.ts";

const NOW = new Date("2026-06-13T12:00:00Z"); // sábado

// ─────────────────────────── período (CA07) ─────────────────────────────────

test("parsePeriodKey aceita chaves válidas e cai em 'week' por padrão", () => {
  assert.equal(parsePeriodKey("today"), "today");
  assert.equal(parsePeriodKey("month"), "month");
  assert.equal(parsePeriodKey("week"), "week");
  assert.equal(parsePeriodKey(undefined), "week");
  assert.equal(parsePeriodKey("lixo"), "week");
});

test("resolvePeriod('today') cobre apenas o dia corrente", () => {
  const p = resolvePeriod("today", NOW);
  assert.equal(p.startIso, "2026-06-13");
  assert.equal(p.endIso, "2026-06-13");
});

test("resolvePeriod('week') vai de segunda a domingo", () => {
  const p = resolvePeriod("week", NOW); // 13/06 é sábado
  assert.equal(p.startIso, "2026-06-08"); // segunda
  assert.equal(p.endIso, "2026-06-14"); // domingo
});

test("resolvePeriod('week') a partir de um domingo ancora na semana que termina nele", () => {
  const sunday = new Date("2026-06-14T12:00:00Z");
  const p = resolvePeriod("week", sunday);
  assert.equal(p.startIso, "2026-06-08");
  assert.equal(p.endIso, "2026-06-14");
});

test("resolvePeriod('month') vai do dia 1 ao último dia do mês", () => {
  const p = resolvePeriod("month", NOW);
  assert.equal(p.startIso, "2026-06-01");
  assert.equal(p.endIso, "2026-06-30");
});

// ─────────────────────────── KPIs (CA02/CA04) ───────────────────────────────

test("totalReservations soma todos os status", () => {
  assert.equal(
    totalReservations({ pending: 2, approved: 5, rejected: 1, cancelled: 3 }),
    11,
  );
  assert.equal(totalReservations(EMPTY_STATUS_COUNTS), 0); // CA04
});

test("approvalRate = aprovadas / decididas, arredondado", () => {
  assert.equal(
    approvalRate({ pending: 0, approved: 3, rejected: 1, cancelled: 0 }),
    75,
  );
});

test("approvalRate ignora pendentes/canceladas no denominador", () => {
  assert.equal(
    approvalRate({ pending: 10, approved: 1, rejected: 1, cancelled: 4 }),
    50,
  );
});

test("approvalRate é null sem decisões (CA04 → '—')", () => {
  assert.equal(approvalRate(EMPTY_STATUS_COUNTS), null);
  assert.equal(
    approvalRate({ pending: 5, approved: 0, rejected: 0, cancelled: 2 }),
    null,
  );
});

// ─────────────────────── ocupação por dia (CA05/CA06) ───────────────────────

function dated(date: string, status: ReservationStatus) {
  return { reservation_date: date, status };
}

test("occupancyByDay conta só aprovadas e cobre todo o range", () => {
  const period = resolvePeriod("week", NOW); // 08–14/06
  const bars = occupancyByDay(
    [
      dated("2026-06-08", "approved"),
      dated("2026-06-08", "approved"),
      dated("2026-06-08", "pending"), // ignorada
      dated("2026-06-10", "approved"),
      dated("2026-06-10", "cancelled"), // ignorada
    ],
    period,
  );
  assert.equal(bars.length, 7);
  assert.equal(bars[0].count, 2); // segunda
  assert.equal(bars[0].heightPct, 100); // pico
  assert.equal(bars[2].count, 1); // quarta
  assert.equal(bars[2].heightPct, 50);
  assert.equal(bars[6].weekend, true); // domingo
});

test("occupancyByDay com período vazio → todas as barras zeradas (CA04)", () => {
  const period = resolvePeriod("week", NOW);
  const bars = occupancyByDay([], period);
  assert.equal(bars.length, 7);
  assert.ok(bars.every((b) => b.count === 0 && b.heightPct === 0));
});

test("occupancyAriaLabel expõe os mesmos números em texto (CA06)", () => {
  const period = resolvePeriod("today", NOW);
  const bars = occupancyByDay([dated("2026-06-13", "approved")], period);
  const label = occupancyAriaLabel(bars);
  assert.match(label, /Sáb 1/);
});

// ─────────────────────── salas mais ocupadas (CA02) ─────────────────────────

function roomRow(name: string | null, status: ReservationStatus) {
  return { status, rooms: name ? { name } : null };
}

test("topRooms ranqueia salas por aprovadas, desc, ignorando o resto", () => {
  const ranked = topRooms([
    roomRow("Lab 1", "approved"),
    roomRow("Lab 1", "approved"),
    roomRow("Lab 1", "approved"),
    roomRow("Sala 204", "approved"),
    roomRow("Sala 204", "pending"), // ignorada
    roomRow(null, "approved"), // sem sala (equipamento)
  ]);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].name, "Lab 1");
  assert.equal(ranked[0].count, 3);
  assert.equal(ranked[0].widthPct, 100);
  assert.equal(ranked[1].name, "Sala 204");
  assert.equal(ranked[1].widthPct, 33);
});

test("topRooms vazio quando não há aprovadas (CA04)", () => {
  assert.deepEqual(topRooms([roomRow("Lab 1", "pending")]), []);
});

// ─────────────────────── atividade recente (CA09) ───────────────────────────

test("relativeTime formata distâncias em pt-BR", () => {
  assert.equal(relativeTime("2026-06-13T11:58:00Z", NOW), "há 2 min");
  assert.equal(relativeTime("2026-06-13T10:00:00Z", NOW), "há 2 h");
  assert.equal(relativeTime("2026-06-12T12:00:00Z", NOW), "ontem");
  assert.equal(relativeTime("2026-06-13T12:00:00Z", NOW), "agora");
});

test("toActivity mapeia eventos para linhas com rótulo + badge", () => {
  const rows = [
    {
      id: "e1",
      created_at: "2026-06-13T11:58:00Z",
      action: "approved" as const,
      actor: { full_name: "Ana Silva" },
      reservation: { rooms: { name: "Auditório" }, equipment: null },
    },
    {
      id: "e2",
      created_at: "2026-06-13T11:00:00Z",
      action: "submitted" as const,
      actor: null,
      reservation: { rooms: null, equipment: { name: "Projetor #12" } },
    },
  ];
  const acts = toActivity(rows, NOW);
  assert.equal(acts[0].who, "Ana Silva");
  assert.equal(acts[0].actionLabel, "Aprovou reserva");
  assert.equal(acts[0].resource, "Auditório");
  assert.equal(acts[0].badgeLabel, "Aprovada");
  assert.equal(acts[1].who, "Usuário do sistema"); // fallback
  assert.equal(acts[1].resource, "Projetor #12");
  assert.equal(acts[1].actionLabel, "Solicitou reserva");
});
