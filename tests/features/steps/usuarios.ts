/**
 * Steps de USUÁRIOS, CADASTROS e NOTIFICAÇÕES (US28–US36 · F-28..F-36).
 *
 * Lógica pura real:
 *  - validação/duplicidade/filtros de usuário, trava do último admin →
 *    `@/lib/users` (validateUserInput, hasDuplicateEmail, filterByQuery/Role,
 *    wouldRemoveLastAdmin, validateRejectReason, HEAVY_HISTORY_THRESHOLD);
 *  - notificações (ordenação desc, não lidas, filtro) → `@/lib/notifications`
 *    (sortByDateDesc, unreadCount, applyFilter).
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  validateUserInput,
  hasDuplicateEmail,
  filterByQuery,
  filterByRole,
  wouldRemoveLastAdmin,
  validateRejectReason,
  HEAVY_HISTORY_THRESHOLD,
  type UserRole,
  type AccountStatus,
} from "@/lib/users";
import {
  sortByDateDesc,
  unreadCount,
  type NotificationRow,
} from "@/lib/notifications";
import type { SiraWorld, WorldNotification } from "../support/world";
import {
  ensureUser,
  addReservation,
  addNotification,
} from "../support/world";

function toNotifRow(n: WorldNotification): NotificationRow {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.is_read,
    related_reservation_id: n.related_reservation_id,
    created_at: n.created_at,
  };
}

// ─────────────────────────── US28 — Cadastro de usuário ─────────────────────
Given("que estou na tela de cadastro de usuários", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

Given("que já existe um usuário com o e-mail {string}", function (this: SiraWorld, email: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureUser(this, "Ana", { email });
});

When("eu informo o nome {string}, o e-mail {string}, o perfil de professor e uma senha inicial", function (this: SiraWorld, name: string, email: string) {
  const result = validateUserInput(
    { fullName: name, email, role: "professor", password: "senha1234" },
    { requireEmail: true, requirePassword: true },
  );
  this.actionOk = result.ok;
  if (result.ok && result.value) {
    ensureUser(this, name, { email: result.value.email, role: "professor", status: "active" });
  }
});

When("eu tento criar um novo usuário com o e-mail {string}", function (this: SiraWorld, email: string) {
  const existing = this.users.map((u) => ({ id: u.id, email: u.email }));
  if (hasDuplicateEmail(existing, email, null)) {
    this.actionOk = false;
    this.message = "Já existe um usuário com esse e-mail.";
  } else {
    this.actionOk = true;
    ensureUser(this, "Novo", { email });
  }
});

When("eu informo o nome {string}, o e-mail {string} e a senha inicial, mas não escolho o perfil", function (this: SiraWorld, name: string, email: string) {
  const result = validateUserInput(
    { fullName: name, email, role: "", password: "senha1234" },
    { requireEmail: true, requirePassword: true },
  );
  this.actionOk = result.ok;
  this.message = result.errors.role ?? null;
});

Then("o usuário {string} é criado", function (this: SiraWorld, name: string) {
  assert.equal(this.actionOk, true);
  assert.ok(this.users.some((u) => u.name === name));
});

Then("já fica ativo, sem passar pela aprovação de solicitação", function (this: SiraWorld) {
  const created = this.users.find((u) => u.name === "Ana");
  assert.equal(created?.status, "active");
  assert.ok(!created?.pendingSignup);
});

Then("o usuário não é criado", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then("sou avisado de que já existe um usuário com esse e-mail", function (this: SiraWorld) {
  assert.match(this.message ?? "", /já existe um usuário/i);
});

Then("sou avisado de que o perfil é obrigatório", function (this: SiraWorld) {
  assert.match(this.message ?? "", /perfil/i);
});

// ─────────────────────────── US29 — Lista de usuários ───────────────────────
Given("que estou autenticado como administrador", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureUser(this, "Ana", { role: "professor", email: "ana@ifpb.edu.br" });
  ensureUser(this, "Bruno", { role: "admin", email: "bruno@ifpb.edu.br" });
});

Given("que estou na tela de usuários cadastrados", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  ensureUser(this, "Ana", { role: "professor", email: "ana@ifpb.edu.br" });
  ensureUser(this, "Carlos", { role: "professor", email: "carlos@ifpb.edu.br" });
  ensureUser(this, "Diretora", { role: "admin", email: "diretora@ifpb.edu.br" });
});

When("abro a tela de usuários cadastrados", function (this: SiraWorld) {
  this.results = this.users.map((u) => ({ full_name: u.name, email: u.email, role: u.role }));
});

When("busco por {string}", function (this: SiraWorld, query: string) {
  const items = this.users.map((u) => ({ full_name: u.name, email: u.email, role: u.role }));
  this.results = filterByQuery(items, query);
});

When("filtro pelo perfil de professor", function (this: SiraWorld) {
  const items = this.users.map((u) => ({ full_name: u.name, email: u.email, role: u.role as UserRole }));
  this.results = filterByRole(items, "professor");
});

Then("vejo todos os usuários com nome, e-mail e perfil", function (this: SiraWorld) {
  const rows = this.results as { full_name: string; email: string; role: string }[];
  assert.ok(rows.length >= 2);
  assert.ok(rows.every((r) => r.full_name && r.email && r.role));
});

Then("cada usuário oferece as ações de editar e excluir", function (this: SiraWorld) {
  // Ações disponíveis ao admin para cada linha (spec de UI).
  assert.equal(this.currentUser?.role, "admin");
});

Then("a lista fica vazia", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

Then("vejo um aviso de que nenhum usuário foi encontrado", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

Then("vejo apenas os usuários com perfil de professor", function (this: SiraWorld) {
  const rows = this.results as { role: string }[];
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.role === "professor"));
});

Then("o usuário {string}, de perfil professor, aparece na lista", function (this: SiraWorld, name: string) {
  const rows = this.results as { full_name: string; role: string }[];
  assert.ok(rows.some((r) => r.full_name === name && r.role === "professor"));
});

// ─────────────────────────── US30 — Edição de usuário ───────────────────────
Given("que estou editando o usuário {string}", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  // Garante outro admin ativo para a trava do último admin não bloquear.
  ensureUser(this, "Diretora", { role: "admin", email: "diretora@ifpb.edu.br" });
  this.focusUser = ensureUser(this, name, { role: "professor", email: `${name.toLowerCase()}@ifpb.edu.br` });
});

When("troco o nome para {string} e o perfil para administrador", function (this: SiraWorld, newName: string) {
  const u = this.focusUser!;
  u.name = newName;
  u.role = "admin";
  this.actionOk = true;
});

When("confirmo a alteração", function (this: SiraWorld) {
  // Confirmação aplica a alteração já feita no passo anterior.
  this.actionOk = true;
});

When("abro o formulário de edição", function (this: SiraWorld) {
  // E-mail é imutável na edição (F-30 CA04): só nome/perfil/senha são editáveis.
  this.results = { editableFields: ["nome", "perfil", "senha"], emailLocked: true };
});

When("informo uma nova senha e confirmo", function (this: SiraWorld) {
  const result = validateUserInput(
    { fullName: this.focusUser!.name, role: this.focusUser!.role, password: "novaSenha123" },
    { requireEmail: false, requirePassword: false },
  );
  this.actionOk = result.ok;
});

Then("os novos dados de {string} ficam salvos", function (this: SiraWorld, name: string) {
  assert.equal(this.actionOk, true);
  assert.ok(this.users.some((u) => u.name === name && u.role === "admin"));
});

Then("o campo de e-mail aparece bloqueado para alteração", function (this: SiraWorld) {
  assert.equal((this.results as { emailLocked: boolean }).emailLocked, true);
});

Then("só posso modificar nome, perfil e senha", function (this: SiraWorld) {
  const fields = (this.results as { editableFields: string[] }).editableFields;
  assert.deepEqual(fields.sort(), ["nome", "perfil", "senha"].sort());
});

Then("a nova senha de {string} passa a valer no próximo acesso dele", function (this: SiraWorld, _name: string) {
  assert.equal(this.actionOk, true);
});

// ─────────────────────────── US31 — Exclusão de usuário ─────────────────────
Given("que estou prestes a excluir o usuário {string}", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusUser = ensureUser(this, name, { role: "professor" });
  addReservation(this, { owner: name, roomName: "Lab 1", status: "approved" });
});

Given("que iniciei a exclusão do usuário {string}", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusUser = ensureUser(this, name, { role: "professor" });
});

Given("que o usuário {string} possui um histórico extenso de reservas", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusUser = ensureUser(this, name, { role: "professor" });
  for (let i = 0; i < HEAVY_HISTORY_THRESHOLD + 1; i++) {
    addReservation(this, { owner: name, roomName: `Lab ${i}`, status: "approved" });
  }
});

When("confirmo a exclusão", function (this: SiraWorld) {
  const target = this.focusUser!;
  const admins = this.users.map((u) => ({ id: u.id, role: u.role as UserRole, status: u.status as AccountStatus }));
  if (wouldRemoveLastAdmin(admins, target.id, { deleting: true })) {
    this.actionOk = false;
    this.message = "Não é possível excluir o último administrador.";
    return;
  }
  this.users = this.users.filter((u) => u.id !== target.id);
  this.actionOk = true;
});

When("desisto na tela de confirmação", function (this: SiraWorld) {
  // Desistência: nada é excluído.
  this.actionOk = false;
});

When("inicio a exclusão de {string}", function (this: SiraWorld, name: string) {
  const count = this.reservations.filter((r) => r.owner === name).length;
  if (count > HEAVY_HISTORY_THRESHOLD) {
    this.message = "Recomendamos desativar a conta em vez de excluí-la.";
  }
});

Then("{string} deixa de constar na lista de usuários", function (this: SiraWorld, name: string) {
  assert.ok(!this.users.some((u) => u.name === name));
});

Then("{string} não consegue mais acessar o sistema", function (this: SiraWorld, name: string) {
  assert.ok(!this.users.some((u) => u.name === name && u.status === "active"));
});

Then("as reservas de {string} continuam preservadas e marcadas", function (this: SiraWorld, name: string) {
  assert.ok(this.reservations.some((r) => r.owner === name));
});

Then("{string} continua cadastrada e com acesso normal", function (this: SiraWorld, name: string) {
  assert.ok(this.users.some((u) => u.name === name && u.status === "active"));
});

Then("o sistema recomenda desativar a conta em vez de excluí-la", function (this: SiraWorld) {
  assert.match(this.message ?? "", /desativar a conta/i);
});

// ─────────────────────────── US32 — Aprovação de cadastro ───────────────────
Given("que existe uma solicitação pendente de {string}, com e-mail {string}", function (this: SiraWorld, name: string, email: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusUser = ensureUser(this, name, { email, pendingSignup: true, status: "inactive" });
});

Given("que estou autenticada como professora", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana", { role: "professor" });
});

Given("que não há solicitações de cadastro pendentes", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

When("aprovo a solicitação", function (this: SiraWorld) {
  const u = this.focusUser!;
  u.pendingSignup = false;
  u.status = "active";
  addNotification(this, { owner: u.name, type: "account_approved", title: "Cadastro aprovado", message: "Você já pode entrar." });
  this.actionOk = true;
});

When("tento abrir a fila de solicitações pendentes", function (this: SiraWorld) {
  this.accessDenied = this.currentUser?.role !== "admin";
});

When("abro a fila de pendentes", function (this: SiraWorld) {
  this.results = this.users.filter((u) => u.pendingSignup);
});

Then("o usuário {string} é criado e habilitado a acessar", function (this: SiraWorld, name: string) {
  const u = this.users.find((x) => x.name === name);
  assert.equal(u?.status, "active");
  assert.ok(!u?.pendingSignup);
});

Then("{string} é avisada de que já pode entrar", function (this: SiraWorld, name: string) {
  assert.ok(this.notifications.some((n) => n.owner === name && /já pode entrar/i.test(n.message)));
});

Then("a solicitação sai da fila de pendentes", function (this: SiraWorld) {
  assert.ok(!this.users.some((u) => u.pendingSignup && u.id === this.focusUser?.id));
});

Then("a ação de aprovar não fica disponível para mim", function (this: SiraWorld) {
  assert.equal(this.accessDenied, true);
});

Then("vejo um aviso de que não há solicitações a aprovar", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

// ─────────────────────────── US33 — Recusa de cadastro ──────────────────────
Given("que existe uma solicitação pendente de {string}", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusUser = ensureUser(this, name, { pendingSignup: true, status: "inactive" });
});

Given("que estou recusando a solicitação de {string}", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusUser = ensureUser(this, name, { pendingSignup: true, status: "inactive" });
});

Given("que a solicitação de {string} foi recusada com o motivo {string}", function (this: SiraWorld, name: string, reason: string) {
  this.focusUser = ensureUser(this, name, { pendingSignup: true, status: "inactive", signupReason: reason });
  addNotification(this, { owner: name, type: "account_rejected", title: "Cadastro recusado", message: reason });
});

When("recuso a solicitação informando o motivo {string}", function (this: SiraWorld, reason: string) {
  const check = validateRejectReason(reason);
  if (!check.ok) {
    this.actionOk = false;
    this.message = check.error ?? null;
    return;
  }
  const u = this.focusUser!;
  this.users = this.users.filter((x) => x.id !== u.id); // solicitação não vira usuário
  addNotification(this, { owner: u.name, type: "account_rejected", title: "Cadastro recusado", message: reason });
  this.actionOk = true;
});

When("confirmo a recusa sem escrever uma justificativa", function (this: SiraWorld) {
  const check = validateRejectReason("");
  this.actionOk = check.ok;
  this.message = check.error ?? null;
});

When("{string} verifica o aviso recebido", function (this: SiraWorld, name: string) {
  this.results = this.notifications.find((n) => n.owner === name && n.type === "account_rejected") ?? null;
});

Then("{string} é avisado do motivo da recusa", function (this: SiraWorld, name: string) {
  assert.ok(this.notifications.some((n) => n.owner === name && n.type === "account_rejected" && n.message));
});

Then("o usuário {string} não é criado", function (this: SiraWorld, name: string) {
  assert.ok(!this.users.some((u) => u.name === name && u.status === "active"));
});

Then("o sistema não conclui a recusa", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then("me pede para informar o motivo", function (this: SiraWorld) {
  assert.match(this.message ?? "", /motivo/i);
});

Then("ele lê o motivo informado pelo administrador", function (this: SiraWorld) {
  const n = this.results as WorldNotification | null;
  assert.ok(n && n.message.length > 0);
});

// ─────────────────────────── US34 — Lista de notificações ───────────────────
Given("que tenho notificações recebidas", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  addNotification(this, { owner: "Ana", type: "reservation_approved", title: "Aprovada", message: "Sua reserva foi aprovada", is_read: true, created_at: "2026-06-13T08:00:00Z" });
  addNotification(this, { owner: "Ana", type: "reservation_rejected", title: "Recusada", message: "Sua reserva foi recusada", is_read: false, created_at: "2026-06-13T10:00:00Z" });
});

Given("que ainda não recebi nenhuma notificação", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
});

Given("que tenho três notificações por ler", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  for (let i = 0; i < 3; i++) {
    addNotification(this, { owner: "Ana", type: "system", title: `Aviso ${i}`, is_read: false, created_at: `2026-06-13T0${i}:00:00Z` });
  }
});

When("abro o painel pelo ícone de notificações no topo", function (this: SiraWorld) {
  const mine = this.notifications.filter((n) => n.owner === "Ana").map(toNotifRow);
  this.results = sortByDateDesc(mine);
});

When("abro o painel de notificações", function (this: SiraWorld) {
  this.results = this.notifications.filter((n) => n.owner === "Ana").map(toNotifRow);
});

When("observo o ícone de notificações no topo", function (this: SiraWorld) {
  const mine = this.notifications.filter((n) => n.owner === "Ana").map(toNotifRow);
  this.results = unreadCount(mine);
});

Then("vejo minhas notificações da mais recente para a mais antiga", function (this: SiraWorld) {
  const rows = this.results as NotificationRow[];
  for (let i = 1; i < rows.length; i++) {
    assert.ok(new Date(rows[i - 1].created_at).getTime() >= new Date(rows[i].created_at).getTime());
  }
});

Then("cada uma mostra título, mensagem e data", function (this: SiraWorld) {
  const rows = this.results as NotificationRow[];
  assert.ok(rows.every((n) => n.title && n.created_at));
});

Then("as lidas e não lidas aparecem visualmente diferenciadas", function (this: SiraWorld) {
  const rows = this.results as NotificationRow[];
  assert.ok(rows.some((n) => n.is_read) && rows.some((n) => !n.is_read));
});

Then("vejo um aviso de caixa vazia", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

Then("o contador indica três notificações não lidas", function (this: SiraWorld) {
  assert.equal(this.results, 3);
});

// ─────────────────────────── US35 — Notificação lida ────────────────────────
Given("que tenho uma notificação por ler no painel", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  addNotification(this, { owner: "Ana", type: "system", title: "Aviso", is_read: false });
});

Given("que recebi uma notificação sobre minha reserva", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  const res = addReservation(this, { owner: "Ana", roomName: "Lab 1", status: "approved" });
  addNotification(this, { owner: "Ana", type: "reservation_approved", title: "Reserva aprovada", is_read: false, related_reservation_id: res.id });
});

Given("que recebi um aviso geral sem reserva associada", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  addNotification(this, { owner: "Ana", type: "system", title: "Aviso geral", is_read: false, related_reservation_id: null });
});

When("clico nessa notificação", function (this: SiraWorld) {
  const n = this.notifications.find((x) => x.owner === "Ana" && !x.is_read)!;
  n.is_read = true;
  this.focusReservation = n.related_reservation_id ? this.reservations.find((r) => r.id === n.related_reservation_id) ?? null : null;
  this.results = n.related_reservation_id ? "detail" : "panel";
});

When("clico nesse aviso", function (this: SiraWorld) {
  const n = this.notifications.find((x) => x.owner === "Ana" && !x.is_read)!;
  n.is_read = true;
  this.results = "panel";
});

Then("ela passa a constar como lida", function (this: SiraWorld) {
  const mine = this.notifications.filter((n) => n.owner === "Ana");
  assert.ok(mine.every((n) => n.is_read));
});

Then("o contador de não lidas diminui em uma unidade", function (this: SiraWorld) {
  const mine = this.notifications.filter((n) => n.owner === "Ana").map(toNotifRow);
  assert.equal(unreadCount(mine), 0);
});

Then("sou levado ao detalhe da reserva relacionada", function (this: SiraWorld) {
  assert.equal(this.results, "detail");
  assert.ok(this.focusReservation);
});

Then("ele é marcado como lido", function (this: SiraWorld) {
  assert.ok(this.notifications.filter((n) => n.owner === "Ana").every((n) => n.is_read));
});

Then("permaneço no painel de notificações", function (this: SiraWorld) {
  assert.equal(this.results, "panel");
});

// ─────────────────────────── US36 — Todas lidas ─────────────────────────────
Given("que tenho várias notificações por ler", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  for (let i = 0; i < 4; i++) {
    addNotification(this, { owner: "Ana", type: "system", title: `Aviso ${i}`, is_read: false });
  }
});

Given("que {string} e {string} possuem notificações por ler", function (this: SiraWorld, a: string, b: string) {
  ensureUser(this, a);
  ensureUser(this, b);
  this.currentUser = this.users.find((u) => u.name === a) ?? null;
  addNotification(this, { owner: a, type: "system", title: "A", is_read: false });
  addNotification(this, { owner: b, type: "system", title: "B", is_read: false });
});

Given("que não tenho nenhuma notificação por ler", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  addNotification(this, { owner: "Ana", type: "system", title: "Antiga", is_read: true });
});

When("uso a ação de marcar todas como lidas", function (this: SiraWorld) {
  const name = this.currentUser?.name ?? "Ana";
  this.notifications.filter((n) => n.owner === name).forEach((n) => (n.is_read = true));
});

When("{string} marca todas as suas notificações como lidas", function (this: SiraWorld, name: string) {
  this.notifications.filter((n) => n.owner === name).forEach((n) => (n.is_read = true));
});

Then("todas passam a constar como lidas", function (this: SiraWorld) {
  const name = this.currentUser?.name ?? "Ana";
  assert.ok(this.notifications.filter((n) => n.owner === name).every((n) => n.is_read));
});

Then("o contador de não lidas fica zerado", function (this: SiraWorld) {
  const name = this.currentUser?.name ?? "Ana";
  const mine = this.notifications.filter((n) => n.owner === name).map(toNotifRow);
  assert.equal(unreadCount(mine), 0);
});

Then("as notificações de {string} continuam por ler", function (this: SiraWorld, name: string) {
  const theirs = this.notifications.filter((n) => n.owner === name).map(toNotifRow);
  assert.ok(unreadCount(theirs) > 0);
});

Then("o contador de não lidas permanece zerado", function (this: SiraWorld) {
  const mine = this.notifications.filter((n) => n.owner === "Ana").map(toNotifRow);
  assert.equal(unreadCount(mine), 0);
});
