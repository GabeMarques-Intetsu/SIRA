/**
 * Testes unitários da lógica pura da Gestão de Recursos (EP-09 · RF-009/RF-013).
 * Rastreabilidade:
 *  - F-24: CA02 (campos obrigatórios), CA03 (capacidade > 0), CA04 (nome único).
 *  - F-25: CA02 (filtro por estado), CA04 (diferenciação de inativas via badge).
 *  - F-26: CA01/CA04 (edição valida capacidade > 0).
 *  - F-43: CA02 (campos), CA03 (estado válido), CA04 (nome único).
 *  - F-44: CA02 (filtro estado), CA03 (busca por nome), CA05 (paginação total/faixa).
 *  - F-45: CA03 (renomear p/ nome existente barrado, ignorando o próprio).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterByName,
  filterByStatus,
  hasDuplicateName,
  paginate,
  parsePage,
  parseResources,
  parseStatusFilter,
  PAGE_SIZE,
  statusBadge,
  validateEquipmentInput,
  validateRoomInput,
  type EntityStatus,
} from "../src/lib/resources.ts";

// ─────────────────────────── Validação de Sala ──────────────────────────────

test("validateRoomInput: dados válidos passam e saneiam (F-24 CA02)", () => {
  const r = validateRoomInput({
    name: "  Lab 2 ",
    type: "laboratorio",
    capacity: 30,
    block: " Bloco B ",
    resources: ["Projetor", " ", "Lousa "],
    status: "active",
  });
  assert.equal(r.ok, true);
  assert.equal(r.value?.name, "Lab 2");
  assert.equal(r.value?.block, "Bloco B");
  assert.deepEqual(r.value?.resources, ["Projetor", "Lousa"]);
});

test("validateRoomInput: capacidade 0 é rejeitada (F-24 CA03 · F-26 CA04)", () => {
  const r = validateRoomInput({
    name: "Lab 2",
    type: "laboratorio",
    capacity: 0,
    block: "",
    resources: [],
    status: "active",
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.capacity, /maior que zero/);
});

test("validateRoomInput: nome vazio e tipo inválido reportam erros (F-24 CA02)", () => {
  const r = validateRoomInput({
    name: "   ",
    type: "xxx",
    capacity: 10,
    block: "",
    resources: [],
    status: "active",
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.name);
  assert.ok(r.errors.type);
});

// ─────────────────────── Validação de Equipamento ───────────────────────────

test("validateEquipmentInput: válido com vínculo a sala (F-43 CA02)", () => {
  const r = validateEquipmentInput({
    name: "Projetor 04",
    type: "Projetor",
    block: "",
    roomId: "room-1",
    status: "active",
  });
  assert.equal(r.ok, true);
  assert.equal(r.value?.roomId, "room-1");
});

test("validateEquipmentInput: sem bloco nem sala é rejeitado (F-43 CA02)", () => {
  const r = validateEquipmentInput({
    name: "Câmera 02",
    type: "Câmera",
    block: "",
    roomId: "",
    status: "maintenance",
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.block);
});

test("validateEquipmentInput: estado inválido é rejeitado (F-43 CA03)", () => {
  const r = validateEquipmentInput({
    name: "X",
    type: "Tipo",
    block: "Bloco A",
    roomId: "",
    status: "broken",
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.status);
});

// ─────────────────────────── Nome duplicado ─────────────────────────────────

test("hasDuplicateName: detecta duplicata acento/caixa-insensível (F-24 CA04)", () => {
  const existing = [{ id: "1", name: "Laboratório 1" }];
  assert.equal(hasDuplicateName(existing, "laboratorio 1", null), true);
  assert.equal(hasDuplicateName(existing, "Lab 2", null), false);
});

test("hasDuplicateName: ignora o próprio registro na edição (F-45 CA03)", () => {
  const existing = [
    { id: "1", name: "Microfone 01" },
    { id: "2", name: "Notebook 04" },
  ];
  // Editar o id=1 mantendo o nome não é duplicata.
  assert.equal(hasDuplicateName(existing, "Microfone 01", "1"), false);
  // Editar o id=2 para colidir com o id=1 é duplicata.
  assert.equal(hasDuplicateName(existing, "microfone 01", "2"), true);
});

// ─────────────────────────── Filtro + busca ─────────────────────────────────

const rows: { id: string; name: string; status: EntityStatus }[] = [
  { id: "1", name: "Projetor Epson", status: "active" },
  { id: "2", name: "Câmera Canon", status: "maintenance" },
  { id: "3", name: "Caixa de Som", status: "inactive" },
];

test("filterByStatus: 'all' não filtra; estado específico filtra (F-44 CA02)", () => {
  assert.equal(filterByStatus(rows, "all").length, 3);
  assert.deepEqual(
    filterByStatus(rows, "maintenance").map((r) => r.id),
    ["2"],
  );
});

test("filterByName: busca por nome acento-insensível (F-44 CA03)", () => {
  assert.deepEqual(
    filterByName(rows, "camera").map((r) => r.id),
    ["2"],
  );
  assert.deepEqual(
    filterByName(rows, "projetor").map((r) => r.id),
    ["1"],
  );
});

test("parseStatusFilter: normaliza valor inválido p/ 'all'", () => {
  assert.equal(parseStatusFilter("maintenance"), "maintenance");
  assert.equal(parseStatusFilter("zzz"), "all");
  assert.equal(parseStatusFilter(undefined), "all");
});

// ─────────────────────────── Paginação (F-44 CA05) ──────────────────────────

test("paginate: total e faixa exibida (F-44 CA05)", () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ id: String(i) }));
  const p1 = paginate(many, 1);
  assert.equal(p1.items.length, PAGE_SIZE);
  assert.equal(p1.total, 30);
  assert.equal(p1.from, 1);
  assert.equal(p1.to, PAGE_SIZE);
  assert.equal(p1.totalPages, Math.ceil(30 / PAGE_SIZE));

  const last = paginate(many, 99); // clamp para a última página
  assert.equal(last.page, p1.totalPages);
  assert.equal(last.to, 30);
});

test("paginate: coleção vazia → from/to 0, 1 página", () => {
  const p = paginate([], 1);
  assert.equal(p.total, 0);
  assert.equal(p.from, 0);
  assert.equal(p.to, 0);
  assert.equal(p.totalPages, 1);
});

test("parsePage: aceita inteiro positivo, default 1", () => {
  assert.equal(parsePage("3"), 3);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage("x"), 1);
});

// ─────────────────────────── Misc ───────────────────────────────────────────

test("statusBadge: cor + texto p/ inativo (F-25 CA04 · WCAG 1.4.1)", () => {
  const b = statusBadge("inactive");
  assert.equal(b.label, "Inativo");
  assert.match(b.className, /text-/); // nunca cor isolada
});

test("parseResources: saneia jsonb defensivamente", () => {
  assert.deepEqual(parseResources(["A", 2, "", " B "]), ["A", "B"]);
  assert.deepEqual(parseResources(null), []);
  assert.deepEqual(parseResources("nope"), []);
});
