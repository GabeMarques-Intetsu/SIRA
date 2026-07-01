/**
 * Testes unitários da lógica pura de MFA/TOTP (F-39 CA05/CA06/CA07 · RF-012).
 * A verdade do 2FA = existir fator TOTP `verified` (não a flag declarativa).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasVerifiedTotp,
  isTotpCodeComplete,
  normalizeTotpCode,
  unverifiedTotpFactors,
  verifiedTotpFactors,
  type MfaFactor,
} from "../src/lib/mfa.ts";

const verified: MfaFactor = {
  id: "f1",
  factor_type: "totp",
  status: "verified",
};
const pending: MfaFactor = {
  id: "f2",
  factor_type: "totp",
  status: "unverified",
};

test("hasVerifiedTotp: true só com fator TOTP verificado", () => {
  assert.equal(hasVerifiedTotp([verified]), true);
  assert.equal(hasVerifiedTotp([pending]), false);
  assert.equal(hasVerifiedTotp([]), false);
  assert.equal(hasVerifiedTotp(null), false);
  assert.equal(hasVerifiedTotp(undefined), false);
});

test("verified/unverifiedTotpFactors: particiona por status", () => {
  const all = [verified, pending];
  assert.deepEqual(verifiedTotpFactors(all), [verified]);
  assert.deepEqual(unverifiedTotpFactors(all), [pending]);
  assert.deepEqual(verifiedTotpFactors(null), []);
});

test("normalizeTotpCode: mantém só dígitos, máximo 6", () => {
  assert.equal(normalizeTotpCode("12 34 56"), "123456");
  assert.equal(normalizeTotpCode("abc123456789"), "123456");
  assert.equal(normalizeTotpCode(""), "");
});

test("isTotpCodeComplete: exige exatamente 6 dígitos", () => {
  assert.equal(isTotpCodeComplete("123456"), true);
  assert.equal(isTotpCodeComplete("12345"), false);
  assert.equal(isTotpCodeComplete("1234567"), false);
  assert.equal(isTotpCodeComplete("12a456"), false);
});
