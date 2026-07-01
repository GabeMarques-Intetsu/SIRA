/**
 * Steps de RESERVA TEMPORÁRIA / HOLD (F-49).
 *
 * Lógica pura real chamada:
 *  - TTL/expiração via `@/lib/holds` (HOLD_TTL_MINUTES, holdExpiry);
 *  - regra de disponibilidade espelhando a RPC `check_resource_availability`
 *    em `./_holds` (isAvailableFor). `now` é o relógio fixo da suíte (NOW).
 *
 * Determinismo: nenhuma data aleatória — slots usam TOMORROW_ISO sob NOW.
 *
 * Dono (Sprint 2, Bloco 3): José — domínio de reservas/hold.
 * Par: `recursos-imagem.ts` (F-47/F-48, Pedro). Os dois saíram do antigo
 * `recursos-imagem-hold.ts`, separados para manter "um arquivo, um dono".
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { HOLD_TTL_MINUTES, holdExpiry } from "@/lib/holds";
import { isAvailableFor } from "./_holds";
import type { SiraWorld } from "../support/world";
import {
  NOW,
  TOMORROW_ISO,
  nextId,
  ensureUser,
  ensureRoom,
  addReservation,
} from "../support/world";

// ─────────────────────────── Reserva temporária / hold (F-49) ────────────────

/** Slot fixo padrão dos cenários de hold. */
const SLOT_DATE = TOMORROW_ISO;

/** Cria/renova um hold vivo (expires_at = NOW + 10 min) para `owner`. */
function startHold(
  world: SiraWorld,
  owner: string,
  roomName: string,
  start: string,
  end: string,
) {
  ensureUser(world, owner);
  ensureRoom(world, roomName);
  // Renovação idempotente: limpa holds próprios do mesmo recurso/slot.
  world.holds = world.holds.filter(
    (h) =>
      !(
        h.owner === owner &&
        h.roomName === roomName &&
        h.date === SLOT_DATE &&
        h.start === start &&
        h.end === end
      ),
  );
  world.holds.push({
    id: nextId("hold"),
    owner,
    roomName,
    date: SLOT_DATE,
    start,
    end,
    expiresAt: holdExpiry(NOW), // NOW + HOLD_TTL_MINUTES
  });
}

Given(
  "que a professora {string} inicia uma solicitação da sala {string} para o horário das {string} às {string}",
  function (this: SiraWorld, owner, roomName, start, end) {
    startHold(this, owner, roomName, start, end);
  },
);

Given(
  "que a professora {string} iniciou uma solicitação da sala {string} para o horário das {string} às {string}",
  function (this: SiraWorld, owner, roomName, start, end) {
    startHold(this, owner, roomName, start, end);
  },
);

Given(
  "o hold de {string} expirou após o prazo de 10 minutos",
  function (this: SiraWorld, owner: string) {
    // Expira: empurra `expires_at` para o passado relativo ao NOW fixo,
    // reusando a métrica de TTL (NOW - 1 min < NOW, já fora da janela viva).
    const expired = new Date(NOW.getTime() - 60_000).toISOString();
    assert.equal(HOLD_TTL_MINUTES, 10); // sanidade: o prazo é 10 min
    for (const h of this.holds) {
      if (h.owner === owner) h.expiresAt = expired;
    }
  },
);

Given(
  "{string} volta e libera o recurso",
  function (this: SiraWorld, owner: string) {
    // releaseHold: remove os holds do próprio solicitante imediatamente.
    this.holds = this.holds.filter((h) => h.owner !== owner);
  },
);

Given(
  "que a professora {string} enviou a solicitação da sala {string} para o horário das {string} às {string}",
  function (this: SiraWorld, owner, roomName, start, end) {
    ensureUser(this, owner);
    ensureRoom(this, roomName);
    // O envio transfere hold → reserva pending: o hold deixa de existir e
    // quem passa a bloquear é a reserva. Modelamos como reserva pending.
    this.holds = this.holds.filter((h) => h.owner !== owner);
    addReservation(this, {
      owner,
      roomName,
      date: SLOT_DATE,
      start,
      end,
      status: "pending",
    });
  },
);

Given(
  "a solicitação de {string} está pendente de decisão",
  function (this: SiraWorld, owner: string) {
    const r = this.reservations.find((x) => x.owner === owner);
    assert.ok(r, "esperava uma reserva enviada por " + owner);
    r!.status = "pending";
  },
);

Given(
  "a solicitação de {string} foi aprovada",
  function (this: SiraWorld, owner: string) {
    const r = this.reservations.find((x) => x.owner === owner);
    assert.ok(r, "esperava uma reserva enviada por " + owner);
    r!.status = "approved";
  },
);

Given(
  "a solicitação de {string} foi recusada",
  function (this: SiraWorld, owner: string) {
    const r = this.reservations.find((x) => x.owner === owner);
    assert.ok(r, "esperava uma reserva enviada por " + owner);
    r!.status = "rejected";
  },
);

When(
  "o professor {string} verifica a disponibilidade da sala {string} no mesmo horário",
  function (this: SiraWorld, viewer, roomName) {
    this.available = isAvailableFor(
      this,
      viewer,
      roomName,
      SLOT_DATE,
      "14:00",
      "16:00",
    );
  },
);

When(
  "a professora {string} verifica a disponibilidade da sala {string} no mesmo horário",
  function (this: SiraWorld, viewer, roomName) {
    this.available = isAvailableFor(
      this,
      viewer,
      roomName,
      SLOT_DATE,
      "14:00",
      "16:00",
    );
  },
);

When(
  "o professor {string} verifica a disponibilidade da sala {string} no horário das {string} às {string}",
  function (this: SiraWorld, viewer, roomName, start, end) {
    this.available = isAvailableFor(
      this,
      viewer,
      roomName,
      SLOT_DATE,
      start,
      end,
    );
  },
);

Then(
  "a sala {string} está indisponível para {string}",
  function (this: SiraWorld, _roomName: string, _viewer: string) {
    assert.equal(this.available, false, "esperava INDISPONÍVEL");
  },
);

Then(
  "a sala {string} está disponível para {string}",
  function (this: SiraWorld, _roomName: string, _viewer: string) {
    assert.equal(this.available, true, "esperava DISPONÍVEL");
  },
);
