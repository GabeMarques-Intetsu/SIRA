/**
 * Testes unitários da lógica de "Minhas Reservas" (EP-07 · RF-007).
 * Rastreabilidade:
 *  - F-16: CA02 (ordem desc), CA03 (status múltiplo), CA04 (período),
 *    CA05 (busca por sala), CA06 (combinação AND), CA08 (vazio), CA09 (PAGE_SIZE).
 *  - F-20: CA01/CA02 (linhas + colunas), CA03 (BOM), CA04 (vazio tratado pelo chamador).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyFilters,
  buildCsv,
  COMPLETED_META,
  CSV_BOM,
  displayStatus,
  escapeCsvField,
  EMPTY_FILTERS,
  groupByWhen,
  isCompleted,
  PAGE_SIZE,
  parseFilters,
  periodRange,
  sortByDateDesc,
  STATUS_META,
  type MyReservationRow,
} from "../src/lib/my-reservations.ts";

const NOW = new Date("2026-06-13T12:00:00Z");

function row(over: Partial<MyReservationRow>): MyReservationRow {
  return {
    id: "r1",
    reservation_date: "2026-06-15",
    start_time: "14:00:00",
    end_time: "16:00:00",
    status: "pending",
    resource_kind: "room",
    purpose: "Aula",
    recurrence_type: "none",
    room_id: "room1",
    equipment_id: null,
    rooms: { name: "Lab 1", block: "B", type: "laboratorio" },
    equipment: null,
    ...over,
  };
}

// ── F-16 CA02 — ordenação por data desc ──────────────────────────────────────
test("sortByDateDesc ordena da mais recente para a mais antiga (CA02)", () => {
  const out = sortByDateDesc([
    row({ id: "a", reservation_date: "2026-06-10" }),
    row({ id: "b", reservation_date: "2026-06-20" }),
    row({ id: "c", reservation_date: "2026-06-15" }),
  ]);
  assert.deepEqual(
    out.map((r) => r.id),
    ["b", "c", "a"],
  );
});

test("sortByDateDesc desempata por horário inicial desc", () => {
  const out = sortByDateDesc([
    row({ id: "a", reservation_date: "2026-06-15", start_time: "09:00:00" }),
    row({ id: "b", reservation_date: "2026-06-15", start_time: "14:00:00" }),
  ]);
  assert.deepEqual(
    out.map((r) => r.id),
    ["b", "a"],
  );
});

// ── F-16 CA03 — filtro de status múltiplo ─────────────────────────────────────
test("applyFilters filtra por múltiplos status em OR dentro do grupo (CA03)", () => {
  const rows = [
    row({ id: "p", status: "pending" }),
    row({ id: "a", status: "approved" }),
    row({ id: "x", status: "rejected" }),
  ];
  const out = applyFilters(
    rows,
    { ...EMPTY_FILTERS, statuses: ["pending", "approved"] },
    NOW,
  );
  assert.deepEqual(out.map((r) => r.id).sort(), ["a", "p"]);
});

// ── F-16 CA04 — filtro de período ─────────────────────────────────────────────
test("periodRange next7 cobre hoje + 7 dias (CA04)", () => {
  assert.deepEqual(periodRange("next7", NOW), {
    from: "2026-06-13",
    to: "2026-06-20",
  });
});

test("periodRange month cobre o mês corrente (CA04)", () => {
  assert.deepEqual(periodRange("month", NOW), {
    from: "2026-06-01",
    to: "2026-06-30",
  });
});

test("applyFilters period month exclui datas fora do mês (CA04)", () => {
  const rows = [
    row({ id: "in", reservation_date: "2026-06-15" }),
    row({ id: "out", reservation_date: "2026-07-01" }),
  ];
  const out = applyFilters(rows, { ...EMPTY_FILTERS, period: "month" }, NOW);
  assert.deepEqual(
    out.map((r) => r.id),
    ["in"],
  );
});

// ── F-16 CA05 — busca por nome de sala (acento-insensível) ───────────────────
test("applyFilters busca por nome de sala ignorando acento/caixa (CA05)", () => {
  const rows = [
    row({
      id: "lab",
      rooms: {
        name: "Laboratório de Informática",
        block: "A",
        type: "laboratorio",
      },
    }),
    row({
      id: "aud",
      rooms: { name: "Auditório", block: "C", type: "auditorio" },
    }),
  ];
  const out = applyFilters(
    rows,
    { ...EMPTY_FILTERS, query: "laboratorio" },
    NOW,
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ["lab"],
  );
});

// ── F-16 CA06 — filtros combinam em AND ──────────────────────────────────────
test("applyFilters combina status + período + busca em AND (CA06)", () => {
  const rows = [
    row({
      id: "hit",
      status: "approved",
      reservation_date: "2026-06-15",
      rooms: { name: "Lab 1", block: "B", type: "laboratorio" },
    }),
    row({
      id: "wrongStatus",
      status: "pending",
      reservation_date: "2026-06-15",
      rooms: { name: "Lab 1", block: "B", type: "laboratorio" },
    }),
    row({
      id: "wrongDate",
      status: "approved",
      reservation_date: "2026-07-15",
      rooms: { name: "Lab 1", block: "B", type: "laboratorio" },
    }),
    row({
      id: "wrongName",
      status: "approved",
      reservation_date: "2026-06-15",
      rooms: { name: "Sala 2", block: "B", type: "sala" },
    }),
  ];
  const out = applyFilters(
    rows,
    { statuses: ["approved"], kind: "all", period: "month", query: "lab" },
    NOW,
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ["hit"],
  );
});

test("applyFilters por kind separa salas de equipamentos (abas)", () => {
  const rows = [
    row({ id: "room", resource_kind: "room" }),
    row({
      id: "equip",
      resource_kind: "equipment",
      rooms: null,
      equipment: { name: "Projetor", block: null, type: "projetor" },
    }),
  ];
  assert.deepEqual(
    applyFilters(rows, { ...EMPTY_FILTERS, kind: "equipment" }, NOW).map(
      (r) => r.id,
    ),
    ["equip"],
  );
});

// ── F-16 CA08 — vazio ────────────────────────────────────────────────────────
test("applyFilters sem correspondência devolve lista vazia (CA08)", () => {
  const out = applyFilters(
    [row({})],
    { ...EMPTY_FILTERS, query: "inexistente" },
    NOW,
  );
  assert.equal(out.length, 0);
});

// ── F-16 CA09 — limiar de paginação ──────────────────────────────────────────
test("PAGE_SIZE é 50 (CA09)", () => {
  assert.equal(PAGE_SIZE, 50);
});

// ── Agrupamento Próximas/Anteriores (mockup 06) ──────────────────────────────
test("groupByWhen separa futuras (>= hoje) de passadas (< hoje)", () => {
  const { upcoming, past } = groupByWhen(
    [
      row({ id: "future", reservation_date: "2026-06-20" }),
      row({ id: "today", reservation_date: "2026-06-13" }),
      row({ id: "past", reservation_date: "2026-06-01" }),
    ],
    NOW,
  );
  assert.deepEqual(upcoming.map((r) => r.id).sort(), ["future", "today"]);
  assert.deepEqual(
    past.map((r) => r.id),
    ["past"],
  );
});

// ── ADR-006 — rótulo derivado "Concluída" (aprovada + término no passado) ────
test("isCompleted: aprovada que já terminou é concluída (ADR-006)", () => {
  // NOW = 2026-06-13T12:00Z; término 11:00 do mesmo dia já passou.
  assert.equal(
    isCompleted(
      {
        status: "approved",
        reservation_date: "2026-06-13",
        end_time: "11:00:00",
      },
      NOW,
    ),
    true,
  );
});

test("isCompleted: aprovada com término futuro NÃO é concluída (ADR-006)", () => {
  assert.equal(
    isCompleted(
      {
        status: "approved",
        reservation_date: "2026-06-20",
        end_time: "16:00:00",
      },
      NOW,
    ),
    false,
  );
});

test("isCompleted: só vale para approved (pending passada não conclui)", () => {
  assert.equal(
    isCompleted(
      {
        status: "pending",
        reservation_date: "2026-06-01",
        end_time: "11:00:00",
      },
      NOW,
    ),
    false,
  );
});

test("displayStatus: badge vira 'Concluída' só quando aprovada já terminou (ADR-006)", () => {
  const done = displayStatus(
    {
      status: "approved",
      reservation_date: "2026-06-13",
      end_time: "11:00:00",
    },
    NOW,
  );
  assert.equal(done.label, COMPLETED_META.label);

  const future = displayStatus(
    {
      status: "approved",
      reservation_date: "2026-06-20",
      end_time: "16:00:00",
    },
    NOW,
  );
  assert.equal(future.label, STATUS_META.approved.label);
});

// ── parseFilters lê o estado da URL ──────────────────────────────────────────
test("parseFilters lê status csv, tipo, periodo e q da URL", () => {
  const f = parseFilters({
    status: "pending,approved,lixo",
    tipo: "room",
    periodo: "next7",
    q: "  Lab 1 ",
  });
  assert.deepEqual(f.statuses, ["pending", "approved"]);
  assert.equal(f.kind, "room");
  assert.equal(f.period, "next7");
  assert.equal(f.query, "Lab 1");
});

// ── F-20 — CSV ───────────────────────────────────────────────────────────────
test("buildCsv inclui cabeçalho + uma linha por reserva filtrada (CA01/CA02)", () => {
  const csv = buildCsv([
    row({
      reservation_date: "2026-06-15",
      start_time: "14:00:00",
      end_time: "16:00:00",
      purpose: "Aula POO",
    }),
  ]);
  const lines = csv.replace(CSV_BOM, "").split("\r\n");
  assert.equal(lines[0], "Data;Início;Fim;Recurso;Status;Justificativa");
  assert.equal(
    lines[1],
    "2026-06-15;14:00;16:00;Lab 1;Aguardando aprovação;Aula POO",
  );
});

test("buildCsv prefixa BOM UTF-8 para preservar acentuação no Excel (CA03)", () => {
  const csv = buildCsv([row({})]);
  assert.ok(csv.startsWith(CSV_BOM));
});

test("escapeCsvField protege separador, aspas e quebras de linha", () => {
  assert.equal(escapeCsvField('Aula "POO"; turma'), '"Aula ""POO""; turma"');
  assert.equal(escapeCsvField("simples"), "simples");
});
