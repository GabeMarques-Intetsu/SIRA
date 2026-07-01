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
import { canActOn } from "../src/lib/approvals.ts";

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
