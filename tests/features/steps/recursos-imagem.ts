/**
 * Steps de IMAGEM DE RECURSO (F-47/F-48).
 *
 * Lógica pura real chamada:
 *  - `@/schemas/resource` (validateImageFile, mensagens de tipo/tamanho);
 *  - `@/lib/resources` (resourceImageUrl, RESOURCE_IMAGES_BUCKET).
 *
 * Dono (Sprint 2, Bloco 4): Pedro — domínio de recursos/imagem.
 * Par: `reserva-hold.ts` (F-49, José). Os dois saíram do antigo
 * `recursos-imagem-hold.ts`, separados para manter "um arquivo, um dono".
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  filterByStatus,
  hasDuplicateName,
  statusBadge,
  validateRoomInput,
  type EntityStatus,
} from "@/lib/resources";
import {
  validateImageFile,
  IMAGE_TYPE_MESSAGE,
  IMAGE_SIZE_MESSAGE,
} from "@/schemas/resource";
import { resourceImageUrl, RESOURCE_IMAGES_BUCKET } from "@/lib/resources";
import type { SiraWorld, WorldRoom } from "../support/world";
import {
  TOMORROW_ISO,
  addReservation,
  ensureRoom,
  ensureUser,
} from "../support/world";

interface RoomListItem extends WorldRoom {
  reservationCount: number;
  statusLabel: string;
}

function roomInput(over: {
  name: string;
  capacity: number;
  resources?: string[];
  status?: EntityStatus;
}) {
  return {
    name: over.name,
    type: "laboratorio",
    capacity: over.capacity,
    block: "Bloco A",
    resources: over.resources ?? ["datashow", "quadro"],
    status: over.status ?? "active",
  };
}

function roomList(world: SiraWorld): RoomListItem[] {
  return world.rooms.map((room) => ({
    ...room,
    reservationCount: world.reservations.filter(
      (reservation) => reservation.roomName === room.name,
    ).length,
    statusLabel: statusBadge(room.status).label,
  }));
}

function futureReservationsForRoom(world: SiraWorld, roomName: string): number {
  return world.reservations.filter(
    (reservation) =>
      reservation.roomName === roomName && reservation.date >= TOMORROW_ISO,
  ).length;
}

// ─────────────────────────── Salas (US24-US27) ───────────────────────────

Given("que estou na tela de cadastro de salas", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Admin", { role: "admin" });
});

When(
  "eu informo o nome {string}, a capacidade {string}, os recursos disponíveis e a localização",
  function (this: SiraWorld, name: string, capacity: string) {
    const validation = validateRoomInput(
      roomInput({ name, capacity: Number(capacity) }),
    );
    if (!validation.ok) {
      this.actionOk = false;
      this.message = Object.values(validation.errors)[0] ?? null;
      return;
    }
    if (hasDuplicateName(this.rooms, validation.value.name, null)) {
      this.actionOk = false;
      this.message = "Já existe uma sala com esse nome.";
      return;
    }
    this.focusRoom = ensureRoom(this, validation.value.name, {
      capacity: validation.value.capacity,
      resources: validation.value.resources,
      status: validation.value.status,
    });
    this.actionOk = true;
  },
);

When(
  "eu informo o nome {string} e a capacidade {string}",
  function (this: SiraWorld, name: string, capacity: string) {
    const validation = validateRoomInput(
      roomInput({ name, capacity: Number(capacity) }),
    );
    if (!validation.ok) {
      this.actionOk = false;
      this.message = validation.errors.capacity ?? null;
      return;
    }
    this.focusRoom = ensureRoom(this, validation.value.name, {
      capacity: validation.value.capacity,
      resources: validation.value.resources,
      status: validation.value.status,
    });
    this.actionOk = true;
  },
);

Given(
  "que já existe uma sala chamada {string}",
  function (this: SiraWorld, name: string) {
    this.currentUser = ensureUser(this, "Admin", { role: "admin" });
    this.focusRoom = ensureRoom(this, name, {
      capacity: 20,
      resources: ["datashow"],
      status: "active",
    });
  },
);

When(
  "eu tento cadastrar uma nova sala com o nome {string}",
  function (this: SiraWorld, name: string) {
    if (hasDuplicateName(this.rooms, name, null)) {
      this.actionOk = false;
      this.message = "Já existe uma sala com esse nome.";
      return;
    }
    this.focusRoom = ensureRoom(this, name, {
      capacity: 20,
      resources: ["datashow"],
      status: "active",
    });
    this.actionOk = true;
  },
);

Then("a sala {string} é cadastrada", function (this: SiraWorld, name: string) {
  assert.equal(this.actionOk, true);
  assert.ok(this.rooms.some((room) => room.name === name));
});

Then("fica imediatamente disponível para reserva", function (this: SiraWorld) {
  assert.equal(this.focusRoom?.status, "active");
});

Then(
  "sou avisado de que a capacidade deve ser um número maior que zero",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /maior que zero/i);
  },
);

Then("a sala não é cadastrada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then(
  "sou avisado de que já existe uma sala com esse nome",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /já existe uma sala/i);
  },
);

Given(
  "que existem as salas {string} e {string} cadastradas",
  function (this: SiraWorld, first: string, second: string) {
    ensureRoom(this, first, {
      capacity: 20,
      resources: ["datashow", "quadro"],
      status: "active",
    });
    ensureRoom(this, second, {
      capacity: 30,
      resources: ["som"],
      status: "active",
    });
    addReservation(this, {
      owner: "Ana",
      roomName: first,
      date: TOMORROW_ISO,
      status: "approved",
    });
  },
);

When("eu abro a listagem de salas", function (this: SiraWorld) {
  this.results = roomList(this);
});

Then(
  "vejo cada sala com sua capacidade e seus recursos",
  function (this: SiraWorld) {
    const rows = this.results as RoomListItem[];
    assert.ok(rows.length > 0);
    assert.ok(rows.every((room) => room.capacity > 0));
    assert.ok(rows.every((room) => Array.isArray(room.resources)));
  },
);

Then(
  "vejo a quantidade de reservas atuais e próximas de cada sala",
  function (this: SiraWorld) {
    const rows = this.results as RoomListItem[];
    assert.ok(rows.every((room) => Number.isInteger(room.reservationCount)));
  },
);

Given(
  "que nenhuma sala ativa possui o recurso {string}",
  function (this: SiraWorld, resource: string) {
    ensureRoom(this, "Lab 1", {
      capacity: 20,
      resources: ["quadro"],
      status: "active",
    });
    ensureRoom(this, "Lab 2", {
      capacity: 30,
      resources: [resource],
      status: "inactive",
    });
  },
);

When(
  "eu filtro por salas ativas com o recurso {string}",
  function (this: SiraWorld, resource: string) {
    const active = filterByStatus(this.rooms, "active");
    const rows = active.filter((room) =>
      room.resources.some(
        (item) => item.toLowerCase() === resource.toLowerCase(),
      ),
    );
    this.results = rows;
    if (rows.length === 0) {
      this.message = "Nenhuma sala atende ao filtro.";
    }
  },
);

Then("a listagem aparece vazia", function (this: SiraWorld) {
  assert.equal((this.results as unknown[]).length, 0);
});

Then(
  "sou informado de que nenhuma sala atende ao filtro",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /nenhuma sala atende/i);
  },
);

Given(
  "que a sala {string} está ativa e a sala {string} está inativa",
  function (this: SiraWorld, activeRoom: string, inactiveRoom: string) {
    ensureRoom(this, activeRoom, {
      capacity: 20,
      resources: ["datashow"],
      status: "active",
    });
    ensureRoom(this, inactiveRoom, {
      capacity: 25,
      resources: ["quadro"],
      status: "inactive",
    });
  },
);

Then(
  "a sala {string} aparece visualmente diferenciada como inativa",
  function (this: SiraWorld, roomName: string) {
    const rows = this.results as RoomListItem[];
    const room = rows.find((item) => item.name === roomName);
    assert.ok(room);
    assert.equal(room.status, "inactive");
    assert.equal(room.statusLabel, "Inativo");
  },
);

Given(
  "que existe a sala {string} com capacidade {string}",
  function (this: SiraWorld, name: string, capacity: string) {
    this.focusRoom = ensureRoom(this, name, {
      capacity: Number(capacity),
      resources: ["datashow"],
      status: "active",
    });
  },
);

When(
  "eu altero a capacidade para {string} e atualizo os recursos",
  function (this: SiraWorld, capacity: string) {
    assert.ok(this.focusRoom);
    const validation = validateRoomInput(
      roomInput({
        name: this.focusRoom.name,
        capacity: Number(capacity),
        resources: ["datashow", "lousa digital"],
        status: this.focusRoom.status,
      }),
    );
    assert.equal(validation.ok, true);
    Object.assign(this.focusRoom, {
      capacity: validation.value!.capacity,
      resources: validation.value!.resources,
    });
    this.actionOk = true;
  },
);

When(
  "eu tento alterar a capacidade para {string}",
  function (this: SiraWorld, capacity: string) {
    assert.ok(this.focusRoom);
    const validation = validateRoomInput(
      roomInput({
        name: this.focusRoom.name,
        capacity: Number(capacity),
        resources: this.focusRoom.resources,
        status: this.focusRoom.status,
      }),
    );
    if (!validation.ok) {
      this.actionOk = false;
      this.message = validation.errors.capacity ?? null;
    }
  },
);

Then(
  "a sala {string} passa a constar com capacidade {string} e os novos recursos",
  function (this: SiraWorld, name: string, capacity: string) {
    const room = this.rooms.find((item) => item.name === name);
    assert.ok(room);
    assert.equal(room.capacity, Number(capacity));
    assert.ok(room.resources.includes("lousa digital"));
  },
);

Then(
  "a capacidade da sala permanece {string}",
  function (this: SiraWorld, capacity: string) {
    assert.equal(this.focusRoom?.capacity, Number(capacity));
  },
);

Given(
  "que a sala {string} possui uma reserva já confirmada da professora Ana",
  function (this: SiraWorld, roomName: string) {
    this.focusRoom = ensureRoom(this, roomName, {
      capacity: 20,
      resources: ["datashow"],
      status: "active",
    });
    addReservation(this, {
      owner: "Ana",
      roomName,
      date: TOMORROW_ISO,
      status: "approved",
    });
  },
);

When(
  "eu desativo a sala {string}",
  function (this: SiraWorld, roomName: string) {
    const room = this.rooms.find((item) => item.name === roomName);
    assert.ok(room);
    room.status = "inactive";
    this.focusRoom = room;
  },
);

Then("a sala deixa de aceitar novas reservas", function (this: SiraWorld) {
  assert.equal(this.focusRoom?.status, "inactive");
});

Then(
  "a reserva já confirmada da professora Ana permanece inalterada",
  function (this: SiraWorld) {
    assert.ok(
      this.reservations.some(
        (reservation) =>
          reservation.owner === "Ana" && reservation.status === "approved",
      ),
    );
  },
);

Given(
  "que a sala {string} não possui reservas futuras",
  function (this: SiraWorld, roomName: string) {
    this.focusRoom = ensureRoom(this, roomName, {
      capacity: 20,
      resources: ["datashow"],
      status: "active",
    });
  },
);

When(
  "eu solicito a exclusão e confirmo a operação",
  function (this: SiraWorld) {
    assert.ok(this.focusRoom);
    if (futureReservationsForRoom(this, this.focusRoom.name) > 0) {
      this.actionOk = false;
      this.message = "Migre ou cancele as reservas antes de excluir.";
      return;
    }
    this.rooms = this.rooms.filter((room) => room.id !== this.focusRoom?.id);
    this.actionOk = true;
  },
);

Then(
  "a sala {string} é excluída",
  function (this: SiraWorld, roomName: string) {
    assert.equal(this.actionOk, true);
    assert.ok(!this.rooms.some((room) => room.name === roomName));
  },
);

Then("deixa de aparecer nas listagens e na busca", function (this: SiraWorld) {
  assert.ok(!this.rooms.some((room) => room.id === this.focusRoom?.id));
});

Given(
  "que a sala {string} possui uma reserva futura da professora Ana",
  function (this: SiraWorld, roomName: string) {
    this.focusRoom = ensureRoom(this, roomName, {
      capacity: 20,
      resources: ["datashow"],
      status: "active",
    });
    addReservation(this, {
      owner: "Ana",
      roomName,
      date: TOMORROW_ISO,
      status: "approved",
    });
  },
);

When(
  "eu solicito a exclusão da sala {string}",
  function (this: SiraWorld, roomName: string) {
    const room = this.rooms.find((item) => item.name === roomName);
    assert.ok(room);
    this.focusRoom = room;
    if (futureReservationsForRoom(this, roomName) > 0) {
      this.actionOk = false;
      this.message = "Migre ou cancele as reservas antes de excluir.";
    }
  },
);

Then("a exclusão é bloqueada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
  assert.ok(this.focusRoom);
  assert.ok(this.rooms.some((room) => room.id === this.focusRoom?.id));
});

Then(
  "sou orientado a migrar ou cancelar as reservas antes de excluir",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /migre ou cancele/i);
  },
);

When(
  "eu solicito a exclusão e não confirmo a operação",
  function (this: SiraWorld) {
    this.actionOk = false;
  },
);

Then(
  "a sala {string} continua disponível nas listagens e na busca",
  function (this: SiraWorld, roomName: string) {
    assert.ok(this.rooms.some((room) => room.name === roomName));
  },
);

// ─────────────────────────── Imagem de recurso (F-47/F-48) ──────────────────

Given(
  "uma imagem do tipo {string} com {int} bytes",
  function (this: SiraWorld, type: string, size: number) {
    this.imageFile = { type, size };
  },
);

When("a imagem do recurso é validada", function (this: SiraWorld) {
  assert.ok(this.imageFile, "esperava um arquivo de imagem no cenário");
  this.imageValidation = validateImageFile(this.imageFile);
});

Then("a imagem é aceita", function (this: SiraWorld) {
  assert.equal(
    this.imageValidation,
    null,
    `esperava aceitar, mas veio: ${this.imageValidation}`,
  );
});

Then("a imagem é recusada com aviso de formato", function (this: SiraWorld) {
  assert.equal(this.imageValidation, IMAGE_TYPE_MESSAGE);
});

Then("a imagem é recusada com aviso de tamanho", function (this: SiraWorld) {
  assert.equal(this.imageValidation, IMAGE_SIZE_MESSAGE);
});

Given(
  "um recurso cujo caminho de imagem é {string}",
  function (this: SiraWorld, path: string) {
    this.imagePath = path;
  },
);

Given("um recurso sem imagem", function (this: SiraWorld) {
  this.imagePath = null;
});

When("a URL pública da imagem é resolvida", function (this: SiraWorld) {
  // Garante uma base estável e determinística para o assert da URL.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  }
  this.imageUrl = resourceImageUrl(this.imagePath);
});

Then(
  "a URL pública aponta para o bucket {string}",
  function (this: SiraWorld, bucket: string) {
    assert.equal(bucket, RESOURCE_IMAGES_BUCKET);
    assert.ok(this.imageUrl, "esperava uma URL pública");
    assert.ok(
      this.imageUrl!.includes(`/storage/v1/object/public/${bucket}/`),
      `URL não aponta para o bucket: ${this.imageUrl}`,
    );
    assert.ok(this.imageUrl!.endsWith(this.imagePath!));
  },
);

Then(
  "não há URL pública e o recurso usa o ícone padrão",
  function (this: SiraWorld) {
    assert.equal(this.imageUrl, null);
  },
);
