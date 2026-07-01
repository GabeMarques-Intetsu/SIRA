/**
 * Testes unitários dos schemas Zod compartilhados (camada de Formulários/
 * Validação). Rastreabilidade: F-01/F-03 (auth), F-14 (reserva), F-37/F-39
 * (perfil/senha), F-24/F-43 (recursos), F-28/F-30 (usuário).
 *
 * Os schemas são a FONTE ÚNICA de validação client+servidor: estes testes
 * provam que a mesma regra que o `zodResolver` aplica no client é a que o
 * `safeParse` aplica na Server Action. Runner: `node:test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INSTITUTIONAL_EMAIL_RE,
  loginSchema,
  signupSchema,
} from "../src/schemas/auth.ts";
import { reservationSchema, slotSchema } from "../src/schemas/reservation.ts";
import {
  BR_PHONE_RE,
  passwordChangeSchema,
  profileSchema,
} from "../src/schemas/profile.ts";
import { equipmentSchema, roomSchema } from "../src/schemas/resource.ts";
import { createUserSchema, SIAPE_RE, userSchema } from "../src/schemas/user.ts";

// ─────────────────────────── auth (F-01 / F-03) ─────────────────────────────

test("INSTITUTIONAL_EMAIL_RE: aceita @ifpb.edu.br e subdomínio, rejeita externo", () => {
  assert.equal(INSTITUTIONAL_EMAIL_RE.test("maria@ifpb.edu.br"), true);
  assert.equal(INSTITUTIONAL_EMAIL_RE.test("joao@aluno.ifpb.edu.br"), true);
  assert.equal(INSTITUTIONAL_EMAIL_RE.test("ana@gmail.com"), false);
});

test("loginSchema: exige domínio institucional e senha (F-01 CA02/CA06)", () => {
  assert.equal(
    loginSchema.safeParse({ email: "a@gmail.com", password: "x" }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: "a@ifpb.edu.br", password: "" }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: "a@ifpb.edu.br", password: "x" }).success,
    true,
  );
});

test("signupSchema: exige aceite de termos e nome (F-03 CA02)", () => {
  const base = {
    nome: "Zé Silva",
    email: "z@ifpb.edu.br",
    perfil: "professor",
  };
  assert.equal(
    signupSchema.safeParse({ ...base, termos: false }).success,
    false,
  );
  assert.equal(signupSchema.safeParse({ ...base, termos: true }).success, true);
  assert.equal(
    signupSchema.safeParse({ ...base, nome: "Z", termos: true }).success,
    false,
  );
});

// ─────────────────────────── reserva (F-14) ─────────────────────────────────

test("slotSchema: barra início ≥ fim (F-14 CA02)", () => {
  assert.equal(
    slotSchema.safeParse({ date: "2999-01-01", start: "10:00", end: "09:00" })
      .success,
    false,
  );
});

test("slotSchema: barra data no passado (F-14 CA03)", () => {
  assert.equal(
    slotSchema.safeParse({ date: "2000-01-01", start: "09:00", end: "10:00" })
      .success,
    false,
  );
});

test("reservationSchema: exige finalidade e slot válido", () => {
  assert.equal(
    reservationSchema.safeParse({
      date: "2999-01-01",
      start: "09:00",
      end: "10:00",
      purpose: "Aula de cálculo",
    }).success,
    true,
  );
  assert.equal(
    reservationSchema.safeParse({
      date: "2999-01-01",
      start: "09:00",
      end: "10:00",
      purpose: "",
    }).success,
    false,
  );
});

// ─────────────────────────── perfil / senha (F-37 / F-39) ───────────────────

test("BR_PHONE_RE: aceita formato com máscara", () => {
  assert.equal(BR_PHONE_RE.test("(83) 99999-9999"), true);
  assert.equal(BR_PHONE_RE.test("8399999999"), true);
});

test("profileSchema: nome obrigatório; telefone opcional válido (F-37 CA03/CA04)", () => {
  assert.equal(profileSchema.safeParse({ fullName: "Ana" }).success, true);
  assert.equal(profileSchema.safeParse({ fullName: "A" }).success, false);
  assert.equal(
    profileSchema.safeParse({ fullName: "Ana", phone: "123" }).success,
    false,
  );
});

test("passwordChangeSchema: força + confirmação cross-field (F-39 CA02/CA03)", () => {
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old",
      newPassword: "abcd1234",
      confirmPassword: "abcd1234",
    }).success,
    true,
  );
  // senha fraca (sem número)
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old",
      newPassword: "abcdefgh",
      confirmPassword: "abcdefgh",
    }).success,
    false,
  );
  // confirmação divergente
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old",
      newPassword: "abcd1234",
      confirmPassword: "abcd0000",
    }).success,
    false,
  );
});

// ─────────────────────────── recursos (F-24 / F-43) ─────────────────────────

test("roomSchema: capacidade > 0 inteira (F-24 CA03)", () => {
  const base = { name: "Lab 1", type: "laboratorio", status: "active" };
  assert.equal(roomSchema.safeParse({ ...base, capacity: 30 }).success, true);
  assert.equal(roomSchema.safeParse({ ...base, capacity: 0 }).success, false);
  assert.equal(roomSchema.safeParse({ ...base, capacity: 1.5 }).success, false);
});

test("equipmentSchema: vínculo a bloco OU sala obrigatório (F-43 CA02)", () => {
  const base = { name: "Projetor", type: "Projetor", status: "active" };
  assert.equal(
    equipmentSchema.safeParse({ ...base, block: "", roomId: null }).success,
    false,
  );
  assert.equal(
    equipmentSchema.safeParse({ ...base, block: "B" }).success,
    true,
  );
  assert.equal(
    equipmentSchema.safeParse({ ...base, roomId: "r-1" }).success,
    true,
  );
});

// ─────────────────────────── usuário (F-28 / F-30) ──────────────────────────

test("SIAPE_RE: só dígitos 7–12", () => {
  assert.equal(SIAPE_RE.test("1234567"), true);
  assert.equal(SIAPE_RE.test("abc"), false);
});

test("userSchema (edição): e-mail e senha opcionais (F-30 CA03/CA04)", () => {
  assert.equal(
    userSchema.safeParse({ fullName: "Ana Silva", role: "professor" }).success,
    true,
  );
  assert.equal(
    userSchema.safeParse({
      fullName: "Ana Silva",
      role: "professor",
      siapeMatricula: "abc",
    }).success,
    false,
  );
});

test("createUserSchema (criação): e-mail e senha obrigatórios (F-28 CA02)", () => {
  assert.equal(
    createUserSchema.safeParse({
      fullName: "Ana Silva",
      role: "professor",
      email: "ana@ifpb.edu.br",
      password: "abcdef12",
    }).success,
    true,
  );
  assert.equal(
    createUserSchema.safeParse({
      fullName: "Ana Silva",
      role: "professor",
      email: "",
      password: "abcdef12",
    }).success,
    false,
  );
});
