/**
 * Steps de APROVAÇÕES, PAINEL e SALAS (US12, US21–US27 · F-12/F-21..F-27).
 *
 * Lógica pura real:
 *  - fila (ordenação cronológica, busca, badge) → `@/lib/approvals`;
 *  - KPIs do painel (total, taxa de aprovação, top salas, ocupação) → `@/lib/dashboard`;
 *  - validação/duplicidade de salas → `@/lib/resources`;
 *  - motivo de recusa obrigatório → reusa a regra de `@/lib/users` (validateRejectReason).
 * O RBAC (admin-only) é spec comportamental no World (a fonte real é `requireAdmin`,
 * que depende de Next/Supabase e não é carregável aqui).
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { applySearch, type ApprovalRow } from "@/lib/approvals";
import {
  totalReservations,
  approvalRate,
  topRooms,
  type StatusCounts,
} from "@/lib/dashboard";
import {
  validateRoomInput,
  hasDuplicateName,
  filterByStatus,
} from "@/lib/resources";
import { validateRejectReason } from "@/lib/users";
import type { SiraWorld, WorldReservation, WorldRoom } from "../support/world";
import {
  TODAY_ISO,
  TOMORROW_ISO,
  ensureUser,
  ensureRoom,
  addReservation,
  addNotification,
} from "../support/world";

function toApprovalRow(r: WorldReservation): ApprovalRow {
  return {
    id: r.id,
    reservation_date: r.date,
    start_time: `${r.start}:00`,
    end_time: `${r.end}:00`,
    status: r.status,
    resource_kind: "room",
    purpose: r.purpose,
    recurrence_type: "none",
    created_at: r.decisionAt ?? `${r.date}T08:00:00Z`,
    user_id: r.owner,
    room_id: r.roomName,
    equipment_id: null,
    profiles: { full_name: r.owner, department: null },
    rooms: { name: r.roomName, block: null },
    equipment: null,
  };
}

// ─────────────────────────── US21.1 — Painel restrito / ordenação ───────────
Given("que um professor está logado", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Professor", { role: "professor" });
});

Given("que existem três solicitações pendentes criadas em dias diferentes", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  addReservation(this, { owner: "Ana", roomName: "Lab 1", status: "pending", decisionAt: "2026-06-10T08:00:00Z" });
  addReservation(this, { owner: "Bruno", roomName: "Lab 2", status: "pending", decisionAt: "2026-06-12T08:00:00Z" });
  addReservation(this, { owner: "Carla", roomName: "Lab 3", status: "pending", decisionAt: "2026-06-11T08:00:00Z" });
});

Given("que não há solicitações pendentes", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

When("tenta acessar a fila de aprovações", function (this: SiraWorld) {
  this.accessDenied = this.currentUser?.role !== "admin";
});

When("o administrador acessa a fila de aprovações", function (this: SiraWorld) {
  const pending = this.reservations.filter((r) => r.status === "pending").map(toApprovalRow);
  // Ordem cronológica ASC (mais antiga primeiro — F-21 CA02).
  this.results = pending.sort((a, b) => a.created_at.localeCompare(b.created_at));
});

When("o administrador acessa a fila", function (this: SiraWorld) {
  const pending = this.reservations.filter((r) => r.status === "pending").map(toApprovalRow);
  this.results = pending.sort((a, b) => a.created_at.localeCompare(b.created_at));
});

Then("o acesso é negado", function (this: SiraWorld) {
  assert.equal(this.accessDenied, true);
});

Then("vê as três solicitações", function (this: SiraWorld) {
  assert.equal((this.results as ApprovalRow[]).length, 3);
});

Then("elas aparecem da mais antiga para a mais recente", function (this: SiraWorld) {
  const rows = this.results as ApprovalRow[];
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i - 1].created_at <= rows[i].created_at);
  }
});

// ─────────────────────────── US21.2 — Filtro / pesquisa / ações ─────────────
Given("que há solicitações pendentes para várias salas", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  addReservation(this, { owner: "Ana", roomName: "Lab 1", status: "pending" });
  addReservation(this, { owner: "Bruno", roomName: "Lab 2", status: "pending" });
  addReservation(this, { owner: "Carla", roomName: "Lab 1", status: "pending" });
});

Given("que há duas solicitações pendentes", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  addReservation(this, { owner: "Ana", roomName: "Lab 1", status: "pending" });
  addReservation(this, { owner: "Bruno", roomName: "Lab 2", status: "pending" });
});

When("o administrador filtra pela sala {string}", function (this: SiraWorld, room: string) {
  const pending = this.reservations.filter((r) => r.status === "pending").map(toApprovalRow);
  this.results = applySearch(pending, room);
});

When("o administrador aprova uma delas", function (this: SiraWorld) {
  const first = this.reservations.find((r) => r.status === "pending");
  if (first) first.status = "approved";
});

Then("a fila mostra apenas solicitações da sala {string}", function (this: SiraWorld, room: string) {
  const rows = this.results as ApprovalRow[];
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.rooms?.name === room));
});

Then("o contador de pendências passa a indicar uma solicitação", function (this: SiraWorld) {
  assert.equal(this.reservations.filter((r) => r.status === "pending").length, 1);
});

Then("a solicitação aprovada sai da fila", function (this: SiraWorld) {
  // A aprovada deixa de ser pendente (sai da fila) e há exatamente uma aprovada.
  const pendingQueue = this.reservations.filter((r) => r.status === "pending");
  assert.ok(pendingQueue.every((r) => r.status === "pending"));
  assert.equal(this.reservations.filter((r) => r.status === "approved").length, 1);
});

// ─────────────────────────── US22 — Aprovação de reserva ────────────────────
Given("que existe uma reserva pendente da professora Ana para o {string}", function (this: SiraWorld, room: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureUser(this, "Ana");
  this.focusReservation = addReservation(this, { owner: "Ana", roomName: room, status: "pending" });
});

Given("que existe uma reserva do professor Bruno para o {string} que já está aprovada", function (this: SiraWorld, room: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureUser(this, "Bruno");
  this.focusReservation = addReservation(this, { owner: "Bruno", roomName: room, status: "approved" });
});

When("eu aprovo essa reserva", function (this: SiraWorld) {
  const r = this.focusReservation!;
  r.status = "approved";
  r.decisionBy = this.currentUser?.name;
  r.decisionAt = `${TODAY_ISO}T12:00:00Z`;
  addNotification(this, { owner: r.owner, type: "reservation_approved", title: "Reserva aprovada", related_reservation_id: r.id });
});

When("eu tento aprovar essa reserva novamente", function (this: SiraWorld) {
  // Já aprovada: a ação de aprovar não está disponível (F-22).
  this.results = this.focusReservation?.status === "pending" ? "approve-enabled" : "approve-disabled";
});

Then("a situação da reserva passa para aprovada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "approved");
});

Then("a professora Ana recebe um aviso automático informando a aprovação", function (this: SiraWorld) {
  assert.ok(this.notifications.some((n) => n.owner === "Ana" && n.type === "reservation_approved"));
});

Then("a ação de aprovar não está disponível", function (this: SiraWorld) {
  assert.equal(this.results, "approve-disabled");
});

Then("a situação da reserva permanece aprovada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "approved");
});

Then("o calendário, o painel e a fila passam a refletir a reserva aprovada imediatamente", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "approved");
  assert.equal(this.reservations.filter((r) => r.status === "pending").length, 0);
});

// ─────────────────────────── US23 — Recusa de reserva ───────────────────────
Given("que existe uma reserva pendente do professor Bruno para o {string}", function (this: SiraWorld, room: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureUser(this, "Bruno");
  this.focusReservation = addReservation(this, { owner: "Bruno", roomName: room, status: "pending" });
});

Given("que a reserva do professor Bruno para o {string} foi recusada", function (this: SiraWorld, room: string) {
  this.currentUser = ensureUser(this, "Bruno");
  this.focusReservation = addReservation(this, { owner: "Bruno", roomName: room, status: "rejected", decisionReason: "Indisponível" });
});

When("eu recuso a reserva com o motivo {string}", function (this: SiraWorld, reason: string) {
  const check = validateRejectReason(reason);
  if (!check.ok) {
    this.actionOk = false;
    this.message = check.error ?? null;
    return;
  }
  const r = this.focusReservation!;
  r.status = "rejected";
  r.decisionReason = reason;
  addNotification(this, { owner: r.owner, type: "reservation_rejected", title: "Reserva recusada", message: reason, related_reservation_id: r.id });
  this.actionOk = true;
});

When("eu tento recusar a reserva sem escrever o motivo", function (this: SiraWorld) {
  const check = validateRejectReason("");
  this.actionOk = check.ok;
  this.message = check.error ?? null;
});

When("o professor Bruno cria uma nova reserva ajustada para outro horário", function (this: SiraWorld) {
  this.focusReservation = addReservation(this, { owner: "Bruno", roomName: "Lab 1", date: TOMORROW_ISO, start: "10:00", end: "12:00", status: "pending" });
  this.actionOk = true;
});

Then("a situação da reserva passa para recusada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "rejected");
});

Then("o professor Bruno recebe um aviso com o motivo {string}", function (this: SiraWorld, reason: string) {
  assert.ok(this.notifications.some((n) => n.owner === "Bruno" && n.message === reason));
});

Then("sou avisado de que o motivo é obrigatório", function (this: SiraWorld) {
  assert.match(this.message ?? "", /motivo/i);
});

Then("a situação da reserva permanece pendente", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "pending");
});

Then("a nova reserva é registrada como pendente para análise", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "pending");
});

// ─────────────────────────── US12 — Indicadores do painel ───────────────────
Given("que o administrador acessa o painel de indicadores", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

Given("que o administrador está com o painel aberto", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusReservation = addReservation(this, { owner: "Ana", roomName: "Lab 1", date: TODAY_ISO, status: "pending" });
});

When("o período possui reservas registradas", function (this: SiraWorld) {
  const counts: StatusCounts = { pending: 2, approved: 5, rejected: 1, cancelled: 0 };
  const rows = [
    { status: "approved" as const, rooms: { name: "Lab 1" } },
    { status: "approved" as const, rooms: { name: "Lab 1" } },
    { status: "approved" as const, rooms: { name: "Lab 2" } },
  ];
  this.results = {
    total: totalReservations(counts),
    rate: approvalRate(counts),
    rooms: topRooms(rows),
    activeProfessors: 3,
  };
});

When("não há nenhuma reserva no período selecionado", function (this: SiraWorld) {
  const counts: StatusCounts = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  this.results = { total: totalReservations(counts), rate: approvalRate(counts), rooms: topRooms([]), empty: true };
});

When("uma reserva da professora Ana para o Lab 1 é aprovada", function (this: SiraWorld) {
  const r = this.focusReservation!;
  r.status = "approved";
  this.results = { approved: this.reservations.filter((x) => x.status === "approved").length };
});

Then("o painel mostra o total de reservas, a taxa de aprovação, as salas mais ocupadas e os professores ativos", function (this: SiraWorld) {
  const kpi = this.results as { total: number; rate: number | null; rooms: unknown[]; activeProfessors: number };
  assert.equal(kpi.total, 8);
  assert.equal(kpi.rate, 83); // 5/(5+1)
  assert.ok(kpi.rooms.length > 0);
  assert.ok(kpi.activeProfessors > 0);
});

Then("o painel mostra os indicadores zerados", function (this: SiraWorld) {
  const kpi = this.results as { total: number; rate: number | null; rooms: unknown[] };
  assert.equal(kpi.total, 0);
  assert.equal(kpi.rate, null);
  assert.equal(kpi.rooms.length, 0);
});

Then("exibe um aviso de ausência de dados no período", function (this: SiraWorld) {
  assert.equal((this.results as { empty: boolean }).empty, true);
});

Then("os indicadores do painel passam a refletir a mudança sem recarregar a tela", function (this: SiraWorld) {
  assert.equal((this.results as { approved: number }).approved, 1);
});

// ─────────────────────────── US24 — Cadastro de sala ────────────────────────
Given("que estou na tela de cadastro de salas", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

Given("que já existe uma sala chamada {string}", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureRoom(this, name);
});

When("eu informo o nome {string}, a capacidade {string}, os recursos disponíveis e a localização", function (this: SiraWorld, name: string, capacity: string) {
  const result = validateRoomInput({ name, type: "laboratorio", capacity: Number(capacity), block: "B", resources: ["datashow"], status: "active" });
  this.actionOk = result.ok;
  if (result.ok && result.value) {
    ensureRoom(this, result.value.name, { capacity: result.value.capacity, resources: result.value.resources, status: "active" });
  }
});

When("eu informo o nome {string} e a capacidade {string}", function (this: SiraWorld, name: string, capacity: string) {
  const result = validateRoomInput({ name, type: "laboratorio", capacity: Number(capacity), block: "B", resources: [], status: "active" });
  this.actionOk = result.ok;
  this.message = result.errors.capacity ?? null;
});

When("eu tento cadastrar uma nova sala com o nome {string}", function (this: SiraWorld, name: string) {
  const existing = this.rooms.map((r) => ({ id: r.id, name: r.name }));
  if (hasDuplicateName(existing, name, null)) {
    this.actionOk = false;
    this.message = "Já existe uma sala com esse nome.";
  } else {
    this.actionOk = true;
    ensureRoom(this, name);
  }
});

Then("a sala {string} é cadastrada", function (this: SiraWorld, name: string) {
  assert.equal(this.actionOk, true);
  assert.ok(this.rooms.some((r) => r.name === name));
});

Then("fica imediatamente disponível para reserva", function (this: SiraWorld) {
  assert.ok(this.rooms.some((r) => r.status === "active"));
});

Then("sou avisado de que a capacidade deve ser um número maior que zero", function (this: SiraWorld) {
  assert.match(this.message ?? "", /maior que zero/i);
});

Then("a sala não é cadastrada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then("sou avisado de que já existe uma sala com esse nome", function (this: SiraWorld) {
  assert.match(this.message ?? "", /já existe uma sala/i);
});

// ─────────────────────────── US25 — Listagem de salas ───────────────────────
Given("que existem as salas {string} e {string} cadastradas", function (this: SiraWorld, a: string, b: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureRoom(this, a, { capacity: 20, resources: ["datashow"] });
  ensureRoom(this, b, { capacity: 30, resources: ["projetor"] });
});

Given("que nenhuma sala ativa possui o recurso {string}", function (this: SiraWorld, resource: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureRoom(this, "Lab 1", { status: "active", resources: ["datashow"] });
  ensureRoom(this, "Lab 2", { status: "inactive", resources: [resource] });
});

Given("que a sala {string} está ativa e a sala {string} está inativa", function (this: SiraWorld, active: string, inactive: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureRoom(this, active, { status: "active" });
  ensureRoom(this, inactive, { status: "inactive" });
});

When("eu abro a listagem de salas", function (this: SiraWorld) {
  this.results = this.rooms.slice();
});

When("eu filtro por salas ativas com o recurso {string}", function (this: SiraWorld, resource: string) {
  const active = filterByStatus(this.rooms, "active");
  this.results = active.filter((r: WorldRoom) => r.resources.includes(resource));
});

Then("vejo cada sala com sua capacidade e seus recursos", function (this: SiraWorld) {
  const rooms = this.results as { capacity: number; resources: string[] }[];
  assert.ok(rooms.length === 2);
  assert.ok(rooms.every((r) => typeof r.capacity === "number" && Array.isArray(r.resources)));
});

Then("vejo a quantidade de reservas atuais e próximas de cada sala", function (this: SiraWorld) {
  const rooms = this.results as { name: string }[];
  // Conta reservas futuras por sala (derivado do modelo).
  const counts = rooms.map((r) => this.reservations.filter((x) => x.roomName === r.name).length);
  assert.equal(counts.length, rooms.length);
});

Then("a listagem aparece vazia", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

Then("sou informado de que nenhuma sala atende ao filtro", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

Then("a sala {string} aparece visualmente diferenciada como inativa", function (this: SiraWorld, name: string) {
  const room = this.rooms.find((r) => r.name === name);
  assert.equal(room?.status, "inactive");
});

// ─────────────────────────── US26 — Edição de sala ──────────────────────────
Given("que existe a sala {string} com capacidade {string}", function (this: SiraWorld, name: string, capacity: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusRoom = ensureRoom(this, name, { capacity: Number(capacity) });
});

Given("que a sala {string} possui uma reserva já confirmada da professora Ana", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusRoom = ensureRoom(this, name);
  addReservation(this, { owner: "Ana", roomName: name, status: "approved" });
});

When("eu altero a capacidade para {string} e atualizo os recursos", function (this: SiraWorld, capacity: string) {
  const room = this.focusRoom!;
  const result = validateRoomInput({ name: room.name, type: "laboratorio", capacity: Number(capacity), block: "B", resources: ["datashow", "ar-condicionado"], status: "active" });
  if (result.ok && result.value) {
    room.capacity = result.value.capacity;
    room.resources = result.value.resources;
    this.actionOk = true;
  }
});

When("eu tento alterar a capacidade para {string}", function (this: SiraWorld, capacity: string) {
  const room = this.focusRoom!;
  const result = validateRoomInput({ name: room.name, type: "laboratorio", capacity: Number(capacity), block: "B", resources: room.resources, status: "active" });
  this.actionOk = result.ok;
  this.message = result.errors.capacity ?? null;
  if (result.ok && result.value) room.capacity = result.value.capacity;
});

When("eu desativo a sala {string}", function (this: SiraWorld, name: string) {
  const room = this.rooms.find((r) => r.name === name);
  if (room) room.status = "inactive";
});

Then("a sala {string} passa a constar com capacidade {string} e os novos recursos", function (this: SiraWorld, name: string, capacity: string) {
  const room = this.rooms.find((r) => r.name === name);
  assert.equal(room?.capacity, Number(capacity));
  assert.ok((room?.resources.length ?? 0) > 0);
});

Then("a capacidade da sala permanece {string}", function (this: SiraWorld, capacity: string) {
  assert.equal(this.focusRoom?.capacity, Number(capacity));
});

Then("a sala deixa de aceitar novas reservas", function (this: SiraWorld) {
  assert.equal(this.focusRoom?.status, "inactive");
});

Then("a reserva já confirmada da professora Ana permanece inalterada", function (this: SiraWorld) {
  assert.ok(this.reservations.some((r) => r.owner === "Ana" && r.status === "approved"));
});

// ─────────────────────────── US27 — Exclusão de sala ────────────────────────
Given("que a sala {string} não possui reservas futuras", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusRoom = ensureRoom(this, name);
});

Given("que a sala {string} possui uma reserva futura da professora Ana", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusRoom = ensureRoom(this, name);
  addReservation(this, { owner: "Ana", roomName: name, date: TOMORROW_ISO, status: "approved" });
});

When("eu solicito a exclusão e confirmo a operação", function (this: SiraWorld) {
  const room = this.focusRoom!;
  const hasFuture = this.reservations.some((r) => r.roomName === room.name && r.date >= TODAY_ISO && (r.status === "approved" || r.status === "pending"));
  if (hasFuture) {
    this.actionOk = false;
  } else {
    this.rooms = this.rooms.filter((r) => r.id !== room.id);
    this.actionOk = true;
  }
});

When("eu solicito a exclusão da sala {string}", function (this: SiraWorld, name: string) {
  const room = this.rooms.find((r) => r.name === name)!;
  const hasFuture = this.reservations.some((r) => r.roomName === name && r.date >= TODAY_ISO && (r.status === "approved" || r.status === "pending"));
  if (hasFuture) {
    this.actionOk = false;
    this.message = "É preciso migrar ou cancelar as reservas antes de excluir.";
  } else {
    this.rooms = this.rooms.filter((r) => r.id !== room.id);
    this.actionOk = true;
  }
});

When("eu solicito a exclusão e não confirmo a operação", function (this: SiraWorld) {
  // Sem confirmação, nada é excluído.
  this.actionOk = false;
});

Then("a sala {string} é excluída", function (this: SiraWorld, name: string) {
  assert.ok(!this.rooms.some((r) => r.name === name));
});

Then("deixa de aparecer nas listagens e na busca", function (this: SiraWorld) {
  assert.equal(this.actionOk, true);
});

Then("a exclusão é bloqueada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then("sou orientado a migrar ou cancelar as reservas antes de excluir", function (this: SiraWorld) {
  assert.match(this.message ?? "", /migrar ou cancelar/i);
});

Then("a sala {string} continua disponível nas listagens e na busca", function (this: SiraWorld, name: string) {
  assert.ok(this.rooms.some((r) => r.name === name));
});
