/**
 * Testes unitários da lógica pura da Fila de Aprovações (EP-08 · RF-008).
 * Rastreabilidade:
 *  - Bloqueio de auto-aprovação ("outro admin tem que aceitar; o próprio não
 *    pode aceitar a própria solicitação"): `canActOn(reservation, actorId)`.
 *  - Já cobre o helper puro reusado pelo Server Component (isOwn) e pelas
 *    Server Actions (defesa no servidor).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approvalIntervalsOverlap,
  canActOn,
  computeKpis,
  findConflictingPendingIds,
  formatDuration,
  type ApprovalConflictRow,
} from "../src/lib/approvals.ts";

test("canActOn: admin NÃO pode avaliar a própria solicitação", () => {
  assert.equal(canActOn({ user_id: "admin-1" }, "admin-1"), false);
});

test("canActOn: admin pode avaliar a solicitação de OUTRO usuário", () => {
  assert.equal(canActOn({ user_id: "prof-9" }, "admin-1"), true);
});

test("canActOn: actor ausente nunca pode agir (defensivo)", () => {
  assert.equal(canActOn({ user_id: "prof-9" }, ""), false);
  assert.equal(canActOn({ user_id: "prof-9" }, null), false);
});

function conflictRow(
  over: Partial<ApprovalConflictRow> = {},
): ApprovalConflictRow {
  return {
    id: "r-1",
    reservation_date: "2026-06-13",
    start_time: "14:00:00",
    end_time: "15:00:00",
    status: "pending",
    resource_kind: "room",
    room_id: "room-1",
    equipment_id: null,
    ...over,
  };
}

test("approvalIntervalsOverlap: detecta sobreposição parcial", () => {
  assert.equal(
    approvalIntervalsOverlap(
      conflictRow({ start_time: "14:00:00", end_time: "15:00:00" }),
      conflictRow({ start_time: "14:30:00", end_time: "16:00:00" }),
    ),
    true,
  );
  assert.equal(
    approvalIntervalsOverlap(
      conflictRow({ start_time: "14:00:00", end_time: "15:00:00" }),
      conflictRow({ start_time: "15:00:00", end_time: "16:00:00" }),
    ),
    false,
  );
});

test("findConflictingPendingIds: sinaliza pendente que conflita com aprovada", () => {
  const pending = conflictRow({
    id: "pending-1",
    status: "pending",
    start_time: "14:30:00",
    end_time: "16:00:00",
  });
  const approved = conflictRow({
    id: "approved-1",
    status: "approved",
    start_time: "14:00:00",
    end_time: "15:00:00",
  });

  assert.deepEqual(
    findConflictingPendingIds([pending, approved]),
    new Set(["pending-1"]),
  );
});

test("findConflictingPendingIds: ignora recurso diferente ou intervalo contíguo", () => {
  const pending = conflictRow({ id: "pending-1", start_time: "15:00:00" });
  const otherRoom = conflictRow({
    id: "approved-1",
    status: "approved",
    room_id: "room-2",
  });

  assert.equal(findConflictingPendingIds([pending, otherRoom]).size, 0);
});

test("formatDuration: formata minutos e horas", () => {
  assert.equal(formatDuration(null), "—");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(135), "2 h 15 min");
});

test("computeKpis: calcula pendentes, decisões do dia e tempo médio", () => {
  const kpis = computeKpis({
    pendingCount: 2,
    approvedToday: 1,
    rejectedToday: 1,
    samples: [
      {
        created_at: "2026-06-13T08:00:00Z",
        decided_at: "2026-06-13T10:00:00Z",
      },
      {
        created_at: "2026-06-13T09:00:00Z",
        decided_at: "2026-06-13T10:00:00Z",
      },
    ],
  });

  assert.equal(kpis.pending, 2);
  assert.equal(kpis.approvedToday, 1);
  assert.equal(kpis.rejectedToday, 1);
  assert.equal(kpis.avgDecisionLabel, "1 h 30 min");
});
