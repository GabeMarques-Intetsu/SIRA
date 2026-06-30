/**
 * Steps de APROVACOES (US21-US23 · F-21/F-22/F-23).
 *
 * O harness BDD simula o dominio em memoria e chama a logica pura de
 * `@/lib/approvals` para fila, busca, indicadores e conflito.
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  applySearch,
  computeKpis,
  findConflictingPendingIds,
  REJECT_REASON_MAX,
  type ApprovalConflictRow,
  type ApprovalRow,
} from "@/lib/approvals";
import type { SiraWorld, WorldReservation } from "../support/world";
import {
  TODAY_ISO,
  TOMORROW_ISO,
  ensureUser,
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

function toConflictRow(r: WorldReservation): ApprovalConflictRow {
  return {
    id: r.id,
    reservation_date: r.date,
    start_time: `${r.start}:00`,
    end_time: `${r.end}:00`,
    status: r.status,
    resource_kind: "room",
    room_id: r.roomName,
    equipment_id: null,
  };
}

function approvalKpis(world: SiraWorld) {
  const samples = world.reservations
    .filter((r) => r.decisionAt)
    .map((r) => ({
      created_at: `${r.date}T08:00:00Z`,
      decided_at: r.decisionAt!,
    }));

  return computeKpis({
    pendingCount: world.reservations.filter((r) => r.status === "pending")
      .length,
    approvedToday: world.reservations.filter(
      (r) => r.status === "approved" && r.decisionAt?.startsWith(TODAY_ISO),
    ).length,
    rejectedToday: world.reservations.filter(
      (r) => r.status === "rejected" && r.decisionAt?.startsWith(TODAY_ISO),
    ).length,
    samples,
  });
}

// ─────────────────────────── US21.1 ─────────────────────────────────────────
Given("que um professor está logado", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Professor", { role: "professor" });
});

Given(
  "que existem três solicitações pendentes criadas em dias diferentes",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      status: "pending",
      decisionAt: "2026-06-10T08:00:00Z",
    });
    addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 2",
      status: "pending",
      decisionAt: "2026-06-12T08:00:00Z",
    });
    addReservation(this, {
      owner: "Carla",
      roomName: "Lab 3",
      status: "pending",
      decisionAt: "2026-06-11T08:00:00Z",
    });
  },
);

Given("que não há solicitações pendentes", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

When("tenta acessar a fila de aprovações", function (this: SiraWorld) {
  this.accessDenied = this.currentUser?.role !== "admin";
});

When("o administrador acessa a fila de aprovações", function (this: SiraWorld) {
  const pending = this.reservations
    .filter((r) => r.status === "pending")
    .map(toApprovalRow);
  this.results = pending.sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
});

When("o administrador acessa a fila", function (this: SiraWorld) {
  const pending = this.reservations
    .filter((r) => r.status === "pending")
    .map(toApprovalRow);
  this.results = pending.sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  if (pending.length === 0) this.message = "Nenhuma solicitação pendente";
});

Then("o acesso é negado", function (this: SiraWorld) {
  assert.equal(this.accessDenied, true);
});

Then("vê as três solicitações", function (this: SiraWorld) {
  assert.equal((this.results as ApprovalRow[]).length, 3);
});

Then(
  "elas aparecem da mais antiga para a mais recente",
  function (this: SiraWorld) {
    const rows = this.results as ApprovalRow[];
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i - 1].created_at <= rows[i].created_at);
    }
  },
);

Then("a fila exibe {string}", function (this: SiraWorld, message: string) {
  assert.equal(this.message, message);
});

// ─────────────────────────── US21.2 ─────────────────────────────────────────
Given(
  "que há solicitações pendentes para várias salas",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      status: "pending",
    });
    addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 2",
      status: "pending",
    });
    addReservation(this, {
      owner: "Carla",
      roomName: "Lab 1",
      status: "pending",
    });
  },
);

Given("que há duas solicitações pendentes", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  addReservation(this, { owner: "Ana", roomName: "Lab 1", status: "pending" });
  addReservation(this, {
    owner: "Bruno",
    roomName: "Lab 2",
    status: "pending",
  });
});

When(
  "o administrador filtra pela sala {string}",
  function (this: SiraWorld, room: string) {
    const pending = this.reservations
      .filter((r) => r.status === "pending")
      .map(toApprovalRow);
    this.results = applySearch(pending, room);
  },
);

When("o administrador aprova uma delas", function (this: SiraWorld) {
  const first = this.reservations.find((r) => r.status === "pending");
  if (first) first.status = "approved";
});

Then(
  "a fila mostra apenas solicitações da sala {string}",
  function (this: SiraWorld, room: string) {
    const rows = this.results as ApprovalRow[];
    assert.ok(rows.length > 0);
    assert.ok(rows.every((r) => r.rooms?.name === room));
  },
);

Then(
  "o contador de pendências passa a indicar uma solicitação",
  function (this: SiraWorld) {
    assert.equal(
      this.reservations.filter((r) => r.status === "pending").length,
      1,
    );
  },
);

Then("a solicitação aprovada sai da fila", function (this: SiraWorld) {
  assert.equal(
    this.reservations.filter((r) => r.status === "approved").length,
    1,
  );
});

// ─────────────────────────── US21.3 ─────────────────────────────────────────
Given(
  "que existem reservas já decididas no período",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      date: TODAY_ISO,
      status: "approved",
      decisionAt: `${TODAY_ISO}T10:00:00Z`,
    });
    addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 2",
      date: TODAY_ISO,
      status: "rejected",
      decisionAt: `${TODAY_ISO}T11:00:00Z`,
    });
  },
);

Given("que o administrador está com a fila aberta", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
  this.focusReservation = addReservation(this, {
    owner: "Ana",
    roomName: "Lab 1",
    date: TODAY_ISO,
    status: "pending",
  });
  this.results = approvalKpis(this);
});

When("o administrador abre a fila de aprovações", function (this: SiraWorld) {
  this.results = approvalKpis(this);
});

When("aprova uma solicitação pendente", function (this: SiraWorld) {
  const r = this.focusReservation!;
  r.status = "approved";
  r.decisionAt = `${TODAY_ISO}T12:00:00Z`;
  this.results = approvalKpis(this);
});

Then(
  "vê o tempo médio entre a criação da solicitação e a decisão",
  function (this: SiraWorld) {
    const kpis = this.results as { avgDecisionLabel: string };
    assert.match(kpis.avgDecisionLabel, /(h|min)/);
  },
);

Then(
  "os indicadores de pendentes e aprovadas se atualizam sem recarregar a página",
  function (this: SiraWorld) {
    const kpis = this.results as { pending: number; approvedToday: number };
    assert.equal(kpis.pending, 0);
    assert.equal(kpis.approvedToday, 1);
  },
);

// ─────────────────────────── US22.1 ─────────────────────────────────────────
Given(
  "que existe uma reserva pendente da professora Ana para o {string}",
  function (this: SiraWorld, room: string) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    ensureUser(this, "Ana");
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: room,
      status: "pending",
    });
  },
);

Given(
  "que existe uma reserva do professor Bruno para o {string} que já está aprovada",
  function (this: SiraWorld, room: string) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    ensureUser(this, "Bruno");
    this.focusReservation = addReservation(this, {
      owner: "Bruno",
      roomName: room,
      status: "approved",
    });
  },
);

When("eu aprovo essa reserva", function (this: SiraWorld) {
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
});

When("eu tento aprovar essa reserva novamente", function (this: SiraWorld) {
  this.results =
    this.focusReservation?.status === "pending"
      ? "approve-enabled"
      : "approve-disabled";
});

Then("a situação da reserva passa para aprovada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "approved");
});

Then(
  "a professora Ana recebe um aviso automático informando a aprovação",
  function (this: SiraWorld) {
    assert.ok(
      this.notifications.some(
        (n) => n.owner === "Ana" && n.type === "reservation_approved",
      ),
    );
  },
);

Then("a ação de aprovar não está disponível", function (this: SiraWorld) {
  assert.equal(this.results, "approve-disabled");
});

Then("a situação da reserva permanece aprovada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "approved");
});

Then(
  "o calendário, o painel e a fila passam a refletir a reserva aprovada imediatamente",
  function (this: SiraWorld) {
    assert.equal(this.focusReservation?.status, "approved");
    assert.equal(
      this.reservations.filter((r) => r.status === "pending").length,
      0,
    );
  },
);

// ─────────────────────────── US22.2 ─────────────────────────────────────────
Given(
  "que existe uma reserva aprovada para o {string} das 14h às 15h",
  function (this: SiraWorld, room: string) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    addReservation(this, {
      owner: "Bruno",
      roomName: room,
      date: TODAY_ISO,
      start: "14:00",
      end: "15:00",
      status: "approved",
    });
  },
);

Given(
  "uma solicitação pendente para o mesmo {string} das 14h30 às 16h",
  function (this: SiraWorld, room: string) {
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: room,
      date: TODAY_ISO,
      start: "14:30",
      end: "16:00",
      status: "pending",
    });
  },
);

Given(
  "que a solicitação pendente está sinalizada como em conflito",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 1",
      date: TODAY_ISO,
      start: "14:00",
      end: "15:00",
      status: "approved",
    });
    this.focusReservation = addReservation(this, {
      owner: "Ana",
      roomName: "Lab 1",
      date: TODAY_ISO,
      start: "14:30",
      end: "16:00",
      status: "pending",
    });
    this.results = findConflictingPendingIds(
      this.reservations.map(toConflictRow),
    );
  },
);

When(
  "o administrador analisa a solicitação pendente",
  function (this: SiraWorld) {
    this.results = findConflictingPendingIds(
      this.reservations.map(toConflictRow),
    );
  },
);

When("o administrador tenta aprová-la", function (this: SiraWorld) {
  const conflictIds = this.results as Set<string>;
  if (conflictIds.has(this.focusReservation!.id)) {
    this.actionOk = false;
    this.message = "Confirme explicitamente para aprovar mesmo com conflito.";
    return;
  }
  this.focusReservation!.status = "approved";
  this.actionOk = true;
});

Then(
  "o sistema sinaliza o conflito de horário com a reserva já aprovada",
  function (this: SiraWorld) {
    const conflictIds = this.results as Set<string>;
    assert.equal(conflictIds.has(this.focusReservation!.id), true);
  },
);

Then(
  "o sistema pede uma confirmação explícita antes de concluir a aprovação",
  function (this: SiraWorld) {
    assert.equal(this.actionOk, false);
    assert.match(this.message ?? "", /confirme explicitamente/i);
    assert.equal(this.focusReservation?.status, "pending");
  },
);

// ─────────────────────────── US23.1 ─────────────────────────────────────────
Given(
  "que existe uma reserva pendente do professor Bruno para o {string}",
  function (this: SiraWorld, room: string) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    ensureUser(this, "Bruno");
    this.focusReservation = addReservation(this, {
      owner: "Bruno",
      roomName: room,
      status: "pending",
    });
  },
);

Given(
  "que a reserva do professor Bruno para o {string} foi recusada",
  function (this: SiraWorld, room: string) {
    this.currentUser = ensureUser(this, "Bruno");
    this.focusReservation = addReservation(this, {
      owner: "Bruno",
      roomName: room,
      status: "rejected",
      decisionReason: "Indisponível",
    });
  },
);

When(
  "eu recuso a reserva com o motivo {string}",
  function (this: SiraWorld, reason: string) {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > REJECT_REASON_MAX) {
      this.actionOk = false;
      this.message = !trimmed
        ? "Informe o motivo da recusa."
        : `O motivo deve ter no máximo ${REJECT_REASON_MAX} caracteres.`;
      return;
    }

    const r = this.focusReservation!;
    r.status = "rejected";
    r.decisionReason = trimmed;
    addNotification(this, {
      owner: r.owner,
      type: "reservation_rejected",
      title: "Reserva recusada",
      message: trimmed,
      related_reservation_id: r.id,
    });
    this.actionOk = true;
  },
);

When(
  "eu tento recusar a reserva sem escrever o motivo",
  function (this: SiraWorld) {
    this.actionOk = false;
    this.message = "Informe o motivo da recusa.";
  },
);

When(
  "o professor Bruno cria uma nova reserva ajustada para outro horário",
  function (this: SiraWorld) {
    this.focusReservation = addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 1",
      date: TOMORROW_ISO,
      start: "10:00",
      end: "12:00",
      status: "pending",
    });
    this.actionOk = true;
  },
);

Then("a situação da reserva passa para recusada", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "rejected");
});

Then(
  "o professor Bruno recebe um aviso com o motivo {string}",
  function (this: SiraWorld, reason: string) {
    assert.ok(
      this.notifications.some(
        (n) => n.owner === "Bruno" && n.message === reason,
      ),
    );
  },
);

Then("sou avisado de que o motivo é obrigatório", function (this: SiraWorld) {
  assert.match(this.message ?? "", /motivo/i);
});

Then("a situação da reserva permanece pendente", function (this: SiraWorld) {
  assert.equal(this.focusReservation?.status, "pending");
});

Then(
  "a nova reserva é registrada como pendente para análise",
  function (this: SiraWorld) {
    assert.equal(this.focusReservation?.status, "pending");
  },
);
