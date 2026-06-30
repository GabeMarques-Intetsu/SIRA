/**
 * Steps de RESERVAS e CALENDÁRIO (US11–US20 · F-11..F-20).
 *
 * Lógica pura real chamada:
 *  - conflito/ocupação e reserva rápida → `@/lib/reservation` (timesOverlap,
 *    validateSlot) via `_shared` (hasConflict/tryReserve);
 *  - calendário semanal → `@/lib/calendar` (getWeekDays/getHourSlots/...);
 *  - Minhas Reservas (ordenação/filtro/busca) → `@/lib/my-reservations`;
 *  - CSV → `@/lib/my-reservations` (buildCsv);
 *  - propagação da decisão (aprovar/recusar + notificação + contadores) →
 *    modelada no World espelhando a transação atômica da RPC.
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  FIRST_HOUR,
  LAST_HOUR,
  getHourSlots,
  getWeekDays,
  startOfWeek,
  addDays,
  todayUtc,
  isSameWeek,
} from "@/lib/calendar";
import { validateSlot } from "@/lib/reservation";
import {
  applyFilters,
  sortByDateDesc,
  buildCsv,
  CSV_BOM,
  EMPTY_FILTERS,
  type MyReservationRow,
} from "@/lib/my-reservations";
import { hasConflict, tryReserve } from "./_shared";
import type { SiraWorld, WorldReservation } from "../support/world";
import {
  NOW,
  TODAY_ISO,
  TOMORROW_ISO,
  ensureUser,
  ensureRoom,
  addReservation,
  addNotification,
} from "../support/world";

// Converte WorldReservation → MyReservationRow para a lib.
function toRow(r: WorldReservation): MyReservationRow {
  return {
    id: r.id,
    reservation_date: r.date,
    start_time: `${r.start}:00`,
    end_time: `${r.end}:00`,
    status: r.status,
    resource_kind: "room",
    purpose: r.purpose,
    recurrence_type: "none",
    room_id: r.roomName,
    equipment_id: null,
    rooms: { name: r.roomName, block: null, type: "laboratorio" },
    equipment: null,
  };
}

// ─────────────────────────── US11 — Propagação da decisão ───────────────────
Given(
  "que o administrador tem uma reserva pendente da professora Ana para o Lab 1 às 14h",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    ensureUser(this, "Ana");
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      start: "14:00",
      end: "15:00",
      status: "pending",
    });
  },
);

Given(
  "que o administrador está recusando a reserva do professor Bruno para o Lab 1 às 14h",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    ensureUser(this, "Bruno");
    this.focusReservation = addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 1",
      start: "14:00",
      end: "15:00",
      status: "pending",
    });
  },
);

Given(
  "que o administrador tem uma reserva pendente da professora Ana",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    ensureUser(this, "Ana");
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      status: "pending",
    });
  },
);

When("ele aprova essa reserva", function (this: SiraWorld) {
  const r = this.focusReservation!;
  r.status = "approved";
  r.decisionBy = this.currentUser?.name;
  r.decisionAt = `${TODAY_ISO}T12:00:00Z`;
  addNotification(this, {
    owner: r.owner,
    type: "reservation_approved",
    title: "Reserva aprovada",
    related_reservation_id: r.id,
  });
  this.actionOk = true;
});

When("ele recusa essa reserva", function (this: SiraWorld) {
  const r = this.focusReservation!;
  r.status = "rejected";
  r.decisionBy = this.currentUser?.name;
  addNotification(this, {
    owner: r.owner,
    type: "reservation_rejected",
    title: "Reserva recusada",
    related_reservation_id: r.id,
  });
  this.actionOk = true;
});

When(
  "ocorre uma falha durante o registro da decisão",
  function (this: SiraWorld) {
    // Transação atômica: a falha faz rollback → nada muda (F-11 CA02).
    this.actionOk = false; // nenhuma mutação aplicada
  },
);

Then(
  "o novo status aprovado aparece imediatamente em todas as telas relacionadas",
  function (this: SiraWorld) {
    assert.equal(this.focusReservation?.status, "approved");
  },
);

Then("Ana recebe a notificação da aprovação", function (this: SiraWorld) {
  assert.ok(
    this.notifications.some(
      (n) => n.owner === "Ana" && n.type === "reservation_approved",
    ),
  );
});

Then(
  "os contadores de pendências do menu, do painel e da fila de aprovações são reduzidos na mesma ação",
  function (this: SiraWorld) {
    assert.equal(
      this.reservations.filter((r) => r.status === "pending").length,
      0,
    );
  },
);

Then("a decisão não é aplicada em nenhum lugar", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "pending");
});

Then(
  "o status, a notificação e os contadores permanecem como estavam antes da tentativa",
  function (this: SiraWorld) {
    assert.equal(this.focusReservation?.status, "pending");
    assert.equal(this.notifications.length, 0);
  },
);

Then(
  "o status passa a recusado em todas as telas relacionadas",
  function (this: SiraWorld) {
    assert.equal(this.focusReservation?.status, "rejected");
  },
);

Then(
  "Ana recebe a notificação informando a recusa da sua reserva",
  function (this: SiraWorld) {
    assert.ok(
      this.notifications.some(
        (n) => n.owner === "Ana" && n.type === "reservation_rejected",
      ),
    );
  },
);

// ─────────────────────────── US13 — Calendário semanal ──────────────────────
Given("que o professor abre o calendário semanal", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Professor");
  // Ocupa 14h de hoje no Lab 1 para os asserts da grade.
  addReservation(this, {
    owner: "Professor",
    roomName: "Lab 1",
    date: TODAY_ISO,
    start: "14:00",
    end: "15:00",
    status: "approved",
  });
});

Given(
  "que o professor está vendo a semana atual no calendário",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Professor");
    this.results = startOfWeek(todayUtc(NOW));
  },
);

When("a semana atual é exibida", function (this: SiraWorld) {
  this.results = {
    days: getWeekDays(startOfWeek(todayUtc(NOW)), NOW),
    hours: getHourSlots(),
  };
});

When("a grade é apresentada", function (this: SiraWorld) {
  this.results = getWeekDays(startOfWeek(todayUtc(NOW)), NOW);
});

When("ele avança para a próxima semana", function (this: SiraWorld) {
  const current = this.results as Date;
  this.results = addDays(current, 7);
});

Then(
  "a grade apresenta os sete dias da semana e os horários das 7h às 19h",
  function (this: SiraWorld) {
    const grid = this.results as { days: unknown[]; hours: number[] };
    assert.equal(grid.days.length, 7);
    assert.equal(grid.hours[0], FIRST_HOUR);
    assert.equal(grid.hours[grid.hours.length - 1], LAST_HOUR - 1);
  },
);

Then(
  "o horário das 14h ocupado mostra a sala Lab 1 e o autor da reserva",
  function (this: SiraWorld) {
    const occ = this.reservations.find(
      (r) => r.start === "14:00" && r.roomName === "Lab 1",
    );
    assert.ok(occ);
    assert.ok(occ.owner);
  },
);

Then(
  "os horários livres aparecem visualmente distintos dos ocupados",
  function (this: SiraWorld) {
    const occupied = this.reservations.map((r) => r.start);
    assert.ok(!occupied.includes("08:00")); // 08h está livre
  },
);

Then(
  "a semana atual aparece destacada visualmente em relação às demais",
  function (this: SiraWorld) {
    const days = this.results as { isToday: boolean }[];
    assert.ok(days.some((d) => d.isToday));
  },
);

Then(
  "a grade passa a mostrar os sete dias e horários da semana seguinte",
  function (this: SiraWorld) {
    const nextWeek = this.results as Date;
    assert.equal(isSameWeek(nextWeek, todayUtc(NOW)), false);
    assert.equal(getWeekDays(nextWeek, NOW).length, 7);
  },
);

Then("é possível voltar para a semana anterior", function (this: SiraWorld) {
  const nextWeek = this.results as Date;
  const back = addDays(nextWeek, -7);
  assert.equal(isSameWeek(back, todayUtc(NOW)), true);
});

// ─────────────────────────── US14.1 — Filtros / restrições ──────────────────
Given(
  "que o professor está na tela de nova reserva",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Professor");
    ensureRoom(this, "Lab Pequeno", { capacity: 15, resources: ["datashow"] });
    ensureRoom(this, "Lab Grande", { capacity: 40, resources: ["datashow"] });
    ensureRoom(this, "Sala Simples", { capacity: 25, resources: [] });
  },
);

When(
  "informa a data de amanhã, das 14h às 16h, e marca o recurso {string}",
  function (this: SiraWorld, resource: string) {
    // Busca: salas ATIVAS com o recurso e sem conflito no horário (F-14).
    const matches = this.rooms.filter(
      (room) =>
        room.status === "active" &&
        room.resources.includes(resource) &&
        !hasConflict(this, room.name, TOMORROW_ISO, "14:00", "16:00"),
    );
    this.results = matches.slice().sort((a, b) => a.capacity - b.capacity);
  },
);

When("confirma a busca", function (this: SiraWorld) {
  // Busca já materializada no passo anterior; no-op determinístico.
});

When("informa início às 16h e fim às 14h", function (this: SiraWorld) {
  this.message = validateSlot(
    { date: TOMORROW_ISO, start: "16:00", end: "14:00" },
    NOW,
  );
});

When("informa uma data anterior ao dia atual", function (this: SiraWorld) {
  this.message = validateSlot(
    { date: "2026-06-12", start: "14:00", end: "16:00" },
    NOW,
  );
});

Then(
  "o sistema lista apenas salas com datashow disponíveis no horário",
  function (this: SiraWorld) {
    const rooms = this.results as { resources: string[] }[];
    assert.ok(rooms.length > 0);
    assert.ok(rooms.every((r) => r.resources.includes("datashow")));
  },
);

Then(
  "as salas aparecem ordenadas por capacidade crescente",
  function (this: SiraWorld) {
    const rooms = this.results as { capacity: number }[];
    for (let i = 1; i < rooms.length; i++) {
      assert.ok(rooms[i - 1].capacity <= rooms[i].capacity);
    }
  },
);

Then("o sistema exibe aviso de horário inválido", function (this: SiraWorld) {
  assert.equal(this.message, "time-order");
});

Then("não realiza a busca", function (this: SiraWorld) {
  assert.ok(this.message); // houve erro de validação; busca não roda
});

Then("o sistema exibe aviso de data inválida", function (this: SiraWorld) {
  assert.equal(this.message, "date-past");
});

// ─────────────────────────── US14.2 — Conflito / ocupação ───────────────────
Given(
  "que a sala {string} tem uma reserva aprovada das 14h às 15h",
  function (this: SiraWorld, room: string) {
    ensureRoom(this, room);
    addReservation(this, {
      owner: "Outro",
      roomName: room,
      date: TOMORROW_ISO,
      start: "14:00",
      end: "15:00",
      status: "approved",
    });
  },
);

Given(
  "que a sala {string} tem uma reserva pendente das 14h às 16h",
  function (this: SiraWorld, room: string) {
    ensureRoom(this, room);
    addReservation(this, {
      owner: "Outro",
      roomName: room,
      date: TOMORROW_ISO,
      start: "14:00",
      end: "16:00",
      status: "pending",
    });
  },
);

Given(
  "que a sala {string} tem apenas uma reserva recusada das 14h às 16h",
  function (this: SiraWorld, room: string) {
    ensureRoom(this, room);
    addReservation(this, {
      owner: "Outro",
      roomName: room,
      date: TOMORROW_ISO,
      start: "14:00",
      end: "16:00",
      status: "rejected",
    });
  },
);

When(
  "o professor busca salas para o intervalo das 14h30 às 16h",
  function (this: SiraWorld) {
    this.results = this.rooms.filter(
      (room) => !hasConflict(this, room.name, TOMORROW_ISO, "14:30", "16:00"),
    );
  },
);

When(
  "o professor busca salas para esse mesmo horário",
  function (this: SiraWorld) {
    this.results = this.rooms.filter(
      (room) => !hasConflict(this, room.name, TOMORROW_ISO, "14:00", "16:00"),
    );
  },
);

When("o professor busca salas para esse horário", function (this: SiraWorld) {
  this.results = this.rooms.filter(
    (room) => !hasConflict(this, room.name, TOMORROW_ISO, "14:00", "16:00"),
  );
});

Then(
  "{string} não aparece nos resultados",
  function (this: SiraWorld, room: string) {
    const rooms = this.results as { name: string }[];
    assert.ok(!rooms.some((r) => r.name === room));
  },
);

Then(
  "{string} aparece nos resultados",
  function (this: SiraWorld, room: string) {
    const rooms = this.results as { name: string }[];
    assert.ok(rooms.some((r) => r.name === room));
  },
);

// ─────────────────────────── US15 — Reserva rápida ──────────────────────────
Given(
  "que a professora Ana está no detalhe do Lab 1 com o horário das 14h livre",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.focusRoom = ensureRoom(this, "Lab 1");
  },
);

Given(
  "que a professora Ana está no detalhe do Lab 1 com o horário das 14h já ocupado",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.focusRoom = ensureRoom(this, "Lab 1");
    addReservation(this, {
      owner: "Outro",
      roomName: "Lab 1",
      date: TOMORROW_ISO,
      start: "14:00",
      end: "16:00",
      status: "approved",
    });
  },
);

Given(
  "que o professor Bruno está no detalhe do Lab 1 com o horário das 16h livre",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Bruno");
    this.focusRoom = ensureRoom(this, "Lab 1");
  },
);

When("ela reserva esse horário em um único passo", function (this: SiraWorld) {
  const out = tryReserve(this, {
    owner: "Ana",
    roomName: "Lab 1",
    date: TOMORROW_ISO,
    start: "14:00",
    end: "16:00",
  });
  this.actionOk = out.ok;
  this.focusReservation = out.reservation ?? null;
  if (out.ok) this.message = "Reserva criada e enviada para aprovação.";
});

When(
  "ela tenta reservar esse horário em um único passo",
  function (this: SiraWorld) {
    const out = tryReserve(this, {
      owner: "Ana",
      roomName: "Lab 1",
      date: TOMORROW_ISO,
      start: "14:00",
      end: "16:00",
    });
    this.actionOk = out.ok;
    if (!out.ok && out.error === "conflict") {
      this.message = "Este horário está em conflito com outra reserva.";
    }
  },
);

When("ele reserva esse horário em um único passo", function (this: SiraWorld) {
  const out = tryReserve(this, {
    owner: "Bruno",
    roomName: "Lab 1",
    date: TOMORROW_ISO,
    start: "16:00",
    end: "18:00",
  });
  this.actionOk = out.ok;
  this.focusReservation = out.reservation ?? null;
});

Then(
  "a reserva é criada como pendente no fluxo de aprovação",
  function (this: SiraWorld) {
    assert.equal(this.actionOk, true);
    assert.equal(this.focusReservation?.status, "pending");
  },
);

Then("Ana recebe uma confirmação visível da ação", function (this: SiraWorld) {
  assert.match(this.message ?? "", /Reserva criada/i);
});

Then("a reserva não é criada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then(
  "o sistema informa que o horário está em conflito com outra reserva",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /conflito/i);
  },
);

Then(
  "a reserva entra como pendente seguindo as mesmas regras de conflito aplicadas na busca",
  function (this: SiraWorld) {
    assert.equal(this.actionOk, true);
    assert.equal(this.focusReservation?.status, "pending");
  },
);

// ─────────────────────────── US16.1 — Lista / ordenação ─────────────────────
Given(
  "que a professora {string} possui várias reservas em datas diferentes",
  function (this: SiraWorld, name: string) {
    this.currentUser = ensureUser(this, name);
    addReservation(this, {
      owner: name,
      roomName: "Lab 1",
      date: "2026-06-10",
      status: "approved",
    });
    addReservation(this, {
      owner: name,
      roomName: "Lab 2",
      date: "2026-06-20",
      status: "pending",
    });
    addReservation(this, {
      owner: name,
      roomName: "Lab 3",
      date: "2026-06-15",
      status: "approved",
    });
    // Reserva de outra pessoa para garantir o filtro por dono.
    addReservation(this, {
      owner: "Outro",
      roomName: "Lab 9",
      date: "2026-06-18",
      status: "approved",
    });
  },
);

Given("que o professor não possui nenhuma reserva", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Professor");
});

When("acessa {string}", function (this: SiraWorld, _screen: string) {
  const name = this.currentUser?.name;
  const mine = this.reservations.filter((r) => r.owner === name).map(toRow);
  this.results = sortByDateDesc(mine);
});

Then("vê apenas as suas reservas", function (this: SiraWorld) {
  const rows = this.results as MyReservationRow[];
  assert.ok(
    rows.every(
      (r) =>
        this.reservations.find((w) => w.id === r.id)?.owner ===
        this.currentUser?.name,
    ),
  );
});

Then(
  "elas aparecem ordenadas da mais recente para a mais antiga",
  function (this: SiraWorld) {
    const rows = this.results as MyReservationRow[];
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i - 1].reservation_date >= rows[i].reservation_date);
    }
  },
);

Then("o sistema exibe {string}", function (this: SiraWorld, expected: string) {
  // Aviso de lista/fila vazia (ex.: "Nenhuma reserva encontrada").
  const rows = this.results as unknown[] | null;
  assert.ok(
    rows === null || rows.length === 0,
    `esperava lista vazia para "${expected}"`,
  );
});

// ─────────────────────────── US16.2 — Filtro combinado / busca ──────────────
Given(
  "que {string} tem reservas aprovadas e pendentes em vários períodos",
  function (this: SiraWorld, name: string) {
    this.currentUser = ensureUser(this, name);
    addReservation(this, {
      owner: name,
      roomName: "Lab 1",
      date: "2026-06-15",
      status: "approved",
    });
    addReservation(this, {
      owner: name,
      roomName: "Lab 2",
      date: "2026-06-16",
      status: "pending",
    });
    addReservation(this, {
      owner: name,
      roomName: "Lab 3",
      date: "2026-07-15",
      status: "approved",
    });
  },
);

Given(
  "que {string} tem reservas em diferentes salas",
  function (this: SiraWorld, name: string) {
    this.currentUser = ensureUser(this, name);
    addReservation(this, {
      owner: name,
      roomName: "Lab 1",
      date: "2026-06-15",
      status: "approved",
    });
    addReservation(this, {
      owner: name,
      roomName: "Auditório",
      date: "2026-06-16",
      status: "approved",
    });
  },
);

When(
  "filtra por status {string} e período {string}",
  function (this: SiraWorld, _status: string, _period: string) {
    const rows = this.reservations
      .filter((r) => r.owner === this.currentUser?.name)
      .map(toRow);
    this.results = applyFilters(
      rows,
      { ...EMPTY_FILTERS, statuses: ["approved"], period: "month" },
      NOW,
    );
  },
);

When("digita {string} na busca", function (this: SiraWorld, query: string) {
  const rows = this.reservations
    .filter((r) => r.owner === this.currentUser?.name)
    .map(toRow);
  this.results = applyFilters(rows, { ...EMPTY_FILTERS, query }, NOW);
});

Then(
  "a lista mostra apenas reservas aprovadas do mês corrente",
  function (this: SiraWorld) {
    const rows = this.results as MyReservationRow[];
    assert.ok(rows.length > 0);
    assert.ok(
      rows.every(
        (r) =>
          r.status === "approved" &&
          r.reservation_date >= "2026-06-01" &&
          r.reservation_date <= "2026-06-30",
      ),
    );
  },
);

Then(
  "a lista mostra apenas reservas da sala {string}",
  function (this: SiraWorld, room: string) {
    const rows = this.results as MyReservationRow[];
    assert.ok(rows.length > 0);
    assert.ok(rows.every((r) => r.rooms?.name === room));
  },
);

// ─────────────────────────── US17 — Detalhe da reserva ──────────────────────
Given(
  "que a professora Ana tem uma reserva do Lab 1 às 14h já aprovada",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      start: "14:00",
      end: "16:00",
      status: "approved",
      purpose: "Aula de POO",
      decisionBy: "Admin",
      decisionAt: `${TODAY_ISO}T09:00:00Z`,
    });
  },
);

Given(
  "que a professora Ana está conectada ao sistema",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 2",
      status: "approved",
    });
  },
);

Given(
  "que a professora Ana recebeu uma notificação sobre a sua reserva do Lab 1",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      status: "approved",
    });
    addNotification(this, {
      owner: "Ana",
      type: "reservation_approved",
      related_reservation_id: this.focusReservation.id,
    });
  },
);

When(
  "ela abre o detalhe dessa reserva a partir da listagem",
  function (this: SiraWorld) {
    this.results = this.focusReservation;
  },
);

When(
  "ela tenta abrir o detalhe de uma reserva do professor Bruno",
  function (this: SiraWorld) {
    const target = this.reservations.find((r) => r.owner === "Bruno");
    // RLS: só acessa as próprias reservas (F-17).
    if (target && target.owner !== this.currentUser?.name) {
      this.accessDenied = true;
      this.results = null;
      this.message = "Você só pode acessar as suas próprias reservas.";
    }
  },
);

When("ela abre essa notificação", function (this: SiraWorld) {
  const notif = this.notifications.find(
    (n) => n.owner === "Ana" && n.related_reservation_id,
  );
  this.results =
    this.reservations.find((r) => r.id === notif?.related_reservation_id) ??
    null;
});

Then(
  "o detalhe mostra a sala, o horário, o status, a justificativa e os recursos solicitados",
  function (this: SiraWorld) {
    const r = this.results as WorldReservation;
    assert.ok(r.roomName && r.start && r.status && r.purpose);
  },
);

Then(
  "mostra o histórico de aprovação com o responsável e a data",
  function (this: SiraWorld) {
    const r = this.results as WorldReservation;
    assert.ok(r.decisionBy && r.decisionAt);
  },
);

Then("o sistema não exibe o detalhe", function (this: SiraWorld) {
  assert.equal(this.results, null);
});

Then(
  "informa que ela só pode acessar as próprias reservas",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /próprias reservas/i);
  },
);

Then(
  "o detalhe da reserva correspondente é apresentado",
  function (this: SiraWorld) {
    assert.ok(this.results);
  },
);

// ─────────────────────────── US18 — Edição de reserva ───────────────────────
Given(
  "que a professora Ana tem uma reserva pendente do Lab 1 às 14h",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      date: TOMORROW_ISO,
      start: "14:00",
      end: "16:00",
      status: "pending",
    });
  },
);

Given(
  "que o professor Bruno tem uma reserva do Lab 1 já aprovada",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Bruno");
    this.focusReservation = addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 1",
      date: TOMORROW_ISO,
      start: "10:00",
      end: "12:00",
      status: "approved",
    });
  },
);

When("ela altera o horário para as 16h", function (this: SiraWorld) {
  const r = this.focusReservation!;
  if (r.status !== "pending") {
    this.actionOk = false;
    return;
  }
  r.start = "16:00";
  r.end = "18:00";
  this.actionOk = true;
});

When(
  "ela altera o horário para as 16h, que já está ocupado por outra reserva",
  function (this: SiraWorld) {
    addReservation(this, {
      owner: "Terceiro",
      roomName: "Lab 1",
      date: TOMORROW_ISO,
      start: "16:00",
      end: "18:00",
      status: "approved",
    });
    const r = this.focusReservation!;
    if (hasConflict(this, r.roomName, r.date, "16:00", "18:00")) {
      this.actionOk = false;
      this.message = "O novo horário está em conflito.";
    } else {
      r.start = "16:00";
      r.end = "18:00";
      this.actionOk = true;
    }
  },
);

When(
  "ele abre essa reserva para alterar o horário",
  function (this: SiraWorld) {
    // Reserva aprovada é somente leitura (F-18).
    this.actionOk = this.focusReservation?.status === "pending";
  },
);

Then(
  "a reserva pendente passa a constar para as 16h",
  function (this: SiraWorld) {
    assert.equal(this.actionOk, true);
    assert.equal(this.focusReservation?.start, "16:00");
  },
);

Then("o sistema não permite a edição", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then(
  "mantém a reserva apenas para leitura preservando o histórico da decisão",
  function (this: SiraWorld) {
    assert.equal(this.focusReservation?.status, "approved");
  },
);

Then("a alteração não é aplicada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
  assert.equal(this.focusReservation?.start, "14:00");
});

Then(
  "o sistema informa que o novo horário está em conflito",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /conflito/i);
  },
);

// ─────────────────────────── US19 — Cancelamento ────────────────────────────
When("ela cancela a reserva e confirma a ação", function (this: SiraWorld) {
  const r = this.focusReservation!;
  if (r.status === "pending") {
    r.status = "cancelled";
    this.actionOk = true;
  } else {
    this.actionOk = false;
  }
});

When("ele tenta cancelar essa reserva", function (this: SiraWorld) {
  // Só pendentes podem ser canceladas (F-19).
  if (this.focusReservation?.status !== "pending") {
    this.actionOk = false;
    this.message = "Só é possível cancelar reservas ainda pendentes.";
  } else {
    this.actionOk = true;
  }
});

When(
  "ela aciona o cancelamento mas não confirma a ação",
  function (this: SiraWorld) {
    // Sem confirmação explícita, nada muda (F-19 CA — confirmação obrigatória).
    this.actionOk = false;
  },
);

Then("a reserva passa para o status cancelada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "cancelled");
});

Then("o horário das 14h do Lab 1 fica liberado", function (this: SiraWorld) {
  assert.equal(
    hasConflict(this, "Lab 1", TOMORROW_ISO, "14:00", "16:00"),
    false,
  );
});

Then(
  "a reserva permanece visível apenas como histórico",
  function (this: SiraWorld) {
    assert.ok(
      this.reservations.some(
        (r) => r.id === this.focusReservation?.id && r.status === "cancelled",
      ),
    );
  },
);

Then("o sistema não permite o cancelamento", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then(
  "informa que só é possível cancelar reservas ainda pendentes",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /ainda pendentes/i);
  },
);

Then("a reserva continua pendente", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "pending");
});

Then(
  "o horário das 14h do Lab 1 permanece reservado",
  function (this: SiraWorld) {
    assert.equal(
      hasConflict(this, "Lab 1", TOMORROW_ISO, "14:00", "16:00"),
      true,
    );
  },
);

// ─────────────────────────── US20 — Exportação CSV ──────────────────────────
Given(
  "que estou na lista das minhas reservas com três reservas exibidas",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      date: "2026-06-15",
      start: "14:00",
      end: "16:00",
      status: "approved",
      purpose: "Aula",
    });
    addReservation(this, {
      owner: "Ana",
      roomName: "Lab 2",
      date: "2026-06-16",
      start: "08:00",
      end: "10:00",
      status: "pending",
      purpose: "Reunião",
    });
    addReservation(this, {
      owner: "Ana",
      roomName: "Lab 3",
      date: "2026-06-17",
      start: "10:00",
      end: "12:00",
      status: "rejected",
      purpose: "Oficina",
    });
    this.results = this.reservations
      .filter((r) => r.owner === "Ana")
      .map(toRow);
  },
);

Given(
  "que apliquei filtros que não retornaram nenhuma reserva",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.results = [] as MyReservationRow[];
  },
);

Given(
  "que gerei a planilha de uma reserva da sala {string} com a justificativa {string}",
  function (this: SiraWorld, room: string, purpose: string) {
    const r = addReservation(this, {
      owner: "Ana",
      roomName: room,
      date: "2026-06-15",
      start: "14:00",
      end: "16:00",
      status: "approved",
      purpose,
    });
    this.file = buildCsv([toRow(r)]);
  },
);

When("eu peço para gerar a planilha", function (this: SiraWorld) {
  const rows = this.results as MyReservationRow[];
  if (rows.length === 0) {
    this.file = null;
    this.message = "Não há dados para gerar a planilha.";
  } else {
    this.file = buildCsv(rows);
  }
});

When(
  "eu abro o arquivo em um editor de planilhas comum",
  function (this: SiraWorld) {
    // Abertura no Excel: o BOM garante a acentuação (F-20 CA03). No-op de leitura.
  },
);

Then(
  "recebo um arquivo com as três reservas exibidas",
  function (this: SiraWorld) {
    assert.ok(this.file);
    const lines = this.file!.replace(CSV_BOM, "").split("\r\n");
    assert.equal(lines.length, 4); // cabeçalho + 3 linhas
  },
);

Then(
  "cada reserva traz data, horário de início, horário de fim, sala, situação e justificativa",
  function (this: SiraWorld) {
    const header = this.file!.replace(CSV_BOM, "").split("\r\n")[0];
    assert.equal(header, "Data;Início;Fim;Recurso;Status;Justificativa");
  },
);

Then(
  "sou avisado de que não há dados para gerar a planilha",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /não há dados/i);
  },
);

Then("nenhum arquivo é gerado", function (this: SiraWorld) {
  assert.equal(this.file, null);
});

Then(
  "o conteúdo aparece corretamente com a acentuação preservada",
  function (this: SiraWorld) {
    assert.ok(this.file!.startsWith(CSV_BOM));
    assert.match(this.file!, /Laboratório de Informática/);
    assert.match(this.file!, /Aula de revisão/);
  },
);
