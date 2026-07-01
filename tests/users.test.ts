/**
 * Testes unitários da lógica pura da Gestão de Usuários (EP-10 · RF-010).
 * Rastreabilidade:
 *  - F-28: CA02 (campos obrigatórios + senha), CA03 (e-mail único).
 *  - F-29: CA01 (perfil/badge), CA02 (busca nome/e-mail/matrícula), CA03 (filtro perfil).
 *  - F-30: CA01/CA02 (alterar nome/perfil, validar), CA03 (redefinir senha), CA04 (e-mail imutável → não exige na edição).
 *  - F-31: CA03 (recomendar inativar em histórico extenso — limite).
 *  - F-33: CA01 (motivo obrigatório).
 *  - SEGURANÇA: trava do último admin (rebaixar/inativar/excluir).
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterByQuery,
  filterByRole,
  hasDuplicateEmail,
  initials,
  isEmailAlreadyExistsError,
  isEmailDeliveryError,
  isLastActiveAdmin,
  isProvisioningUnavailable,
  matchesQuery,
  parseRoleFilter,
  parseTab,
  passwordSetupRedirectTo,
  roleBadge,
  statusBadge,
  validateRejectReason,
  validateUserInput,
  wouldRemoveLastAdmin,
  type AccountStatus,
  type UserRole,
} from "../src/lib/users.ts";

// ─────────────────── Provisionamento por e-mail (F-28/F-30/F-32) ─────────────

test("passwordSetupRedirectTo: monta URL absoluta sem barra dupla", () => {
  assert.equal(
    passwordSetupRedirectTo("https://sira.ifpb.edu.br"),
    "https://sira.ifpb.edu.br/redefinir-senha",
  );
  assert.equal(
    passwordSetupRedirectTo("https://sira.ifpb.edu.br/"),
    "https://sira.ifpb.edu.br/redefinir-senha",
  );
});

test("passwordSetupRedirectTo: sem base cai em localhost (dev)", () => {
  assert.equal(
    passwordSetupRedirectTo(undefined),
    "http://localhost:3000/redefinir-senha",
  );
  assert.equal(
    passwordSetupRedirectTo(null),
    "http://localhost:3000/redefinir-senha",
  );
});

test("isEmailDeliveryError: reconhece falhas de SMTP/mailer", () => {
  assert.equal(
    isEmailDeliveryError(new Error("Error sending invite email")),
    true,
  );
  assert.equal(isEmailDeliveryError(new Error("SMTP not configured")), true);
  assert.equal(isEmailDeliveryError("email rate limit exceeded"), true);
  assert.equal(isEmailDeliveryError(new Error("permission denied")), false);
  assert.equal(isEmailDeliveryError(null), false);
});

// ─────────────────────────── Parsing de URL ─────────────────────────────────

test("parseTab: aba inválida cai em 'active' (default mockup 09)", () => {
  assert.equal(parseTab(undefined), "active");
  assert.equal(parseTab("lixo"), "active");
  assert.equal(parseTab("signups"), "signups");
  assert.equal(parseTab("inactive"), "inactive");
});

test("parseRoleFilter: valor inválido cai em 'all' (F-29 CA03)", () => {
  assert.equal(parseRoleFilter(undefined), "all");
  assert.equal(parseRoleFilter("hacker"), "all");
  assert.equal(parseRoleFilter("admin"), "admin");
  assert.equal(parseRoleFilter("professor"), "professor");
});

// ─────────────────────────── Badges (WCAG 1.4.1) ────────────────────────────

test("roleBadge/statusBadge: trazem rótulo textual além da cor (F-29 CA01)", () => {
  assert.equal(roleBadge("admin").label, "Administrador");
  assert.equal(roleBadge("professor").label, "Professor");
  assert.equal(statusBadge("active").label, "Ativo");
  assert.equal(statusBadge("inactive").label, "Inativo");
});

// ─────────────────────────── Busca / filtro (F-29) ──────────────────────────

const sample = [
  {
    id: "1",
    full_name: "Ana Silva",
    email: "ana.silva@ifpb.edu.br",
    role: "professor" as UserRole,
    siape_matricula: "1234567",
  },
  {
    id: "2",
    full_name: "Bruno Costa",
    email: "bruno@ifpb.edu.br",
    role: "admin" as UserRole,
    siape_matricula: null,
  },
];

test("matchesQuery: busca por nome é acento/caixa-insensível (F-29 CA02)", () => {
  assert.equal(matchesQuery(sample[0]!, "ANA"), true);
  assert.equal(matchesQuery(sample[0]!, "silva"), true);
});

test("matchesQuery: busca por e-mail e por matrícula (F-29 CA02)", () => {
  assert.equal(matchesQuery(sample[0]!, "bruno"), false);
  assert.equal(matchesQuery(sample[0]!, "ifpb"), true);
  assert.equal(matchesQuery(sample[0]!, "1234567"), true);
});

test("filterByQuery: sem termo retorna todos; termo sem match retorna vazio (F-29 CA02)", () => {
  assert.equal(filterByQuery(sample, "").length, 2);
  assert.equal(filterByQuery(sample, "Zuleica").length, 0);
  assert.equal(filterByQuery(sample, "Ana").length, 1);
});

test("filterByRole: filtra por perfil; 'all' não filtra (F-29 CA03)", () => {
  assert.equal(filterByRole(sample, "all").length, 2);
  assert.equal(filterByRole(sample, "professor").length, 1);
  assert.equal(filterByRole(sample, "professor")[0]!.full_name, "Ana Silva");
  assert.equal(filterByRole(sample, "admin").length, 1);
});

// ─────────────────────────── Avatar ─────────────────────────────────────────

test("initials: usa 1ª e última palavra", () => {
  assert.equal(initials("Ana Silva"), "AS");
  assert.equal(initials("Maria das Dores Souza"), "MS");
  assert.equal(initials("Cher"), "CH");
  assert.equal(initials("   "), "?");
});

// ─────────────────────────── Validação (F-28/F-30) ──────────────────────────

test("validateUserInput: criação exige nome, perfil e senha (F-28 CA02)", () => {
  const r = validateUserInput(
    { fullName: "", email: "x@y.com", role: "", password: "" },
    { requireEmail: true, requirePassword: true },
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.fullName);
  assert.ok(r.errors.role);
  assert.ok(r.errors.password);
});

test("validateUserInput: criação válida saneia e normaliza e-mail (F-28 CA02)", () => {
  const r = validateUserInput(
    {
      fullName: "  Ana Silva ",
      email: "ANA@IFPB.edu.br",
      role: "professor",
      department: " DTSI ",
      password: "segredo12",
    },
    { requireEmail: true, requirePassword: true },
  );
  assert.equal(r.ok, true);
  assert.equal(r.value?.email, "ana@ifpb.edu.br");
  assert.equal(r.value?.fullName, "Ana Silva");
  assert.equal(r.value?.department, "DTSI");
  assert.equal(r.value?.role, "professor");
});

test("validateUserInput: perfil inválido é rejeitado (F-28 CA02)", () => {
  const r = validateUserInput(
    {
      fullName: "Ana",
      email: "a@b.com",
      role: "superuser",
      password: "segredo12",
    },
    { requireEmail: true, requirePassword: true },
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.role);
});

test("validateUserInput: edição não exige e-mail nem senha (F-30 CA04/CA03)", () => {
  const r = validateUserInput(
    { fullName: "Ana Paula", role: "admin" },
    { requireEmail: false, requirePassword: false },
  );
  assert.equal(r.ok, true);
  assert.equal(r.value?.role, "admin");
  assert.equal(r.value?.password, null);
});

test("validateUserInput: edição com senha curta é rejeitada (F-30 CA03)", () => {
  const r = validateUserInput(
    { fullName: "Ana", role: "admin", password: "123" },
    { requireEmail: false, requirePassword: false },
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.password);
});

test("hasDuplicateEmail: detecta duplicata ignorando o próprio id (F-28 CA03)", () => {
  const existing = [{ id: "1", email: "ana@ifpb.edu.br" }];
  assert.equal(hasDuplicateEmail(existing, "ANA@ifpb.edu.br", null), true);
  assert.equal(hasDuplicateEmail(existing, "ana@ifpb.edu.br", "1"), false);
  assert.equal(hasDuplicateEmail(existing, "novo@ifpb.edu.br", null), false);
});

// ─────────────────────────── Trava do último admin (segurança) ──────────────

const admins = [
  { id: "a1", role: "admin" as UserRole, status: "active" as AccountStatus },
  { id: "a2", role: "admin" as UserRole, status: "inactive" as AccountStatus },
  {
    id: "p1",
    role: "professor" as UserRole,
    status: "active" as AccountStatus,
  },
];

test("isLastActiveAdmin: só verdadeiro p/ o único admin ATIVO", () => {
  assert.equal(isLastActiveAdmin(admins, "a1"), true);
  assert.equal(isLastActiveAdmin(admins, "a2"), false);
  assert.equal(isLastActiveAdmin(admins, "p1"), false);
});

test("wouldRemoveLastAdmin: bloqueia rebaixar/inativar/excluir o último admin", () => {
  assert.equal(wouldRemoveLastAdmin(admins, "a1", { role: "professor" }), true);
  assert.equal(
    wouldRemoveLastAdmin(admins, "a1", { status: "inactive" }),
    true,
  );
  assert.equal(wouldRemoveLastAdmin(admins, "a1", { deleting: true }), true);
  // Mantê-lo admin+ativo é permitido (ex.: só renomear).
  assert.equal(
    wouldRemoveLastAdmin(admins, "a1", { role: "admin", status: "active" }),
    false,
  );
  // Não é o último admin → nunca bloqueia.
  const twoAdmins = [
    { id: "a1", role: "admin" as UserRole, status: "active" as AccountStatus },
    { id: "a3", role: "admin" as UserRole, status: "active" as AccountStatus },
  ];
  assert.equal(
    wouldRemoveLastAdmin(twoAdmins, "a1", { deleting: true }),
    false,
  );
});

// ─────────────────────────── Recusa de cadastro (F-33) ──────────────────────

test("validateRejectReason: motivo vazio é rejeitado (F-33 CA01)", () => {
  assert.equal(validateRejectReason("").ok, false);
  assert.equal(validateRejectReason("   ").ok, false);
  assert.equal(validateRejectReason(null).ok, false);
});

test("validateRejectReason: motivo válido é saneado (F-33 CA01)", () => {
  const r = validateRejectReason("  E-mail não institucional  ");
  assert.equal(r.ok, true);
  assert.equal(r.value, "E-mail não institucional");
});

// ─────────── Provisionamento service-role (F-28/F-30/F-32/F-42) ──────────────

test("isProvisioningUnavailable: reconhece o erro de chave ausente", () => {
  assert.equal(
    isProvisioningUnavailable(
      new Error(
        "SUPABASE_SERVICE_ROLE_KEY ausente: provisionamento indisponível",
      ),
    ),
    true,
  );
  assert.equal(
    isProvisioningUnavailable("SUPABASE_SERVICE_ROLE_KEY ausente"),
    true,
  );
});

test("isProvisioningUnavailable: outros erros não acionam o degrade", () => {
  assert.equal(isProvisioningUnavailable(new Error("network down")), false);
  assert.equal(isProvisioningUnavailable(null), false);
  assert.equal(isProvisioningUnavailable(undefined), false);
});

test("isEmailAlreadyExistsError: detecta variações da Admin API (F-28 CA03)", () => {
  assert.equal(
    isEmailAlreadyExistsError(
      new Error("A user with this email address has already been registered"),
    ),
    true,
  );
  assert.equal(isEmailAlreadyExistsError(new Error("email_exists")), true);
  assert.equal(
    isEmailAlreadyExistsError(new Error("User already registered")),
    true,
  );
});

test("isEmailAlreadyExistsError: erro alheio não é falso-positivo", () => {
  assert.equal(isEmailAlreadyExistsError(new Error("weak password")), false);
  assert.equal(isEmailAlreadyExistsError(null), false);
});
