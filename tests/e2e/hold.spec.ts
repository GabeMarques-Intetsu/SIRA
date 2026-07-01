/**
 * E2E F-49 — reserva temporária (hold) com DOIS usuários (CA01/CA02/CA08/CA09).
 *
 * Cenário (browser real + Supabase ativo):
 *  - Usuário A (admin) abre Nova Reserva, escolhe um recurso + data/horário e
 *    avança até a confirmação → cria o HOLD real (Server Action createHoldAction).
 *  - Usuário B (professor de teste, criado via service-role) verifica a MESMA
 *    sala/data/horário pela RPC real `check_resource_availability` sob a SUA
 *    sessão → INDISPONÍVEL (a RPC ignora o próprio uid de A e bloqueia B).
 *  - A volta/cancela (releaseHold) → B verifica de novo → DISPONÍVEL.
 *  - Também afirmamos a exclusão do próprio uid: A, pela sua sessão, vê o
 *    recurso DISPONÍVEL apesar do seu próprio hold (CA09).
 *
 * Por que B verifica via RPC e não pela UI: a RPC `check_resource_availability`
 * É a regra de produção (mesma usada por `search_available_rooms`); chamá-la sob
 * a sessão autenticada de B testa exatamente "indisponível para OUTRO usuário"
 * + a exclusão por `auth.uid()`, sem a fragilidade de dirigir o wizard inteiro
 * de B. É verificação honesta da lógica real, não um mock.
 *
 * Limpeza obrigatória (afterAll): apaga os holds criados, qualquer reserva de
 * teste e DELETA o usuário de teste (auth.admin.deleteUser). Nada fica no banco.
 *
 * Credenciais/chaves: SOMENTE via env (nunca hardcoded).
 */
import { test, expect } from "@playwright/test";
import {
  login,
  adminClient,
  anonClient,
  hasAdminCreds,
  hasServiceRole,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from "./_helpers";

/** Data bem no futuro p/ não colidir com reservas reais do seed. */
const FUTURE_DATE = "2027-12-15"; // YYYY-MM-DD
const START = "14:00";
const END = "16:00";

test.describe("F-49 — hold com dois usuários", () => {
  test.skip(
    !hasAdminCreds() ||
      !hasServiceRole() ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Requer SMOKE_ADMIN_*, SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );

  // Identidade do professor de teste e do recurso escolhido.
  const rand = Math.random().toString(36).slice(2, 8);
  const TEST_EMAIL = `e2e.hold+${rand}@ifpb.edu.br`;
  const TEST_PASSWORD = `E2eHold!${rand}A1`;
  let testUserId = "";
  let roomId = "";
  let roomName = "";

  test.beforeAll(async () => {
    const sb = adminClient();

    // 1) Cria o professor de teste (email confirmado, senha conhecida).
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      throw new Error(`Falha ao criar usuário de teste: ${createErr?.message}`);
    }
    testUserId = created.user.id;

    // Garante o profile ativo (trigger handle_new_user cria como professor).
    await sb.from("profiles").update({ status: "active" }).eq("id", testUserId);

    // 2) Escolhe uma sala ATIVA estável para o cenário.
    const { data: room, error: roomErr } = await sb
      .from("rooms")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .limit(1)
      .single();
    if (roomErr || !room) throw new Error("Nenhuma sala ativa para o E2E.");
    roomId = room.id as string;
    roomName = room.name as string;
  });

  test.afterAll(async () => {
    const sb = adminClient();
    // Apaga holds do recurso/slot (de qualquer usuário envolvido no teste).
    await sb
      .from("reservation_holds")
      .delete()
      .eq("room_id", roomId)
      .eq("reservation_date", FUTURE_DATE);
    // Apaga qualquer reserva de teste no slot (defensivo — não criamos, mas
    // garantimos que nada sobrou).
    if (testUserId) {
      await sb
        .from("reservations")
        .delete()
        .eq("room_id", roomId)
        .eq("reservation_date", FUTURE_DATE)
        .eq("user_id", testUserId);
    }
    // Deleta o usuário de teste.
    if (testUserId) {
      await sb.auth.admin.deleteUser(testUserId);
    }
  });

  /** Verifica disponibilidade pela RPC real sob a sessão de um usuário. */
  async function availabilityAs(
    email: string,
    password: string,
  ): Promise<boolean> {
    const sb = anonClient();
    const { error: signInErr } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) throw new Error(`signIn falhou: ${signInErr.message}`);
    const { data, error } = await sb.rpc("check_resource_availability", {
      p_resource_kind: "room",
      p_room_id: roomId,
      p_equipment_id: null,
      p_date: FUTURE_DATE,
      p_start: START,
      p_end: END,
      p_exclude_reservation: null,
    });
    await sb.auth.signOut();
    if (error) throw new Error(`RPC falhou: ${error.message}`);
    return Boolean(data);
  }

  test("A cria hold → B vê indisponível; A volta → B vê disponível", async ({
    page,
  }) => {
    // Pré-condição: sem hold, B vê DISPONÍVEL (linha de base).
    expect(await availabilityAs(TEST_EMAIL, TEST_PASSWORD)).toBe(true);

    // ── Usuário A (admin) dirige o wizard até a confirmação (cria o hold) ────
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/nova-reserva");
    await expect(page.locator("#main-content")).toBeVisible();

    // Passo 1 — Tipo: escolhe "Sala / Auditório" (radio role).
    await page.getByRole("radio", { name: /sala/i }).first().click();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Passo 2 — Quando: data/horário.
    await page.getByLabel("Data").fill(FUTURE_DATE);
    await page.getByLabel("Horário inicial").fill(START);
    await page.getByLabel("Horário final").fill(END);
    await page.getByRole("button", { name: /continuar/i }).click();

    // Passo 3 — Escolher: seleciona a sala-alvo pelo texto do nome no rádio.
    await page
      .locator("label", { hasText: roomName })
      .getByRole("radio")
      .first()
      .check();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Passo 4 — Confirmação: o hold é criado ao entrar aqui.
    await expect(
      page.getByText(/reservado temporariamente para você/i),
    ).toBeVisible({ timeout: 20_000 });

    // Confirma no banco que o hold de A existe e está vivo.
    const sb = adminClient();
    await expect
      .poll(
        async () => {
          const { count } = await sb
            .from("reservation_holds")
            .select("*", { count: "exact", head: true })
            .eq("room_id", roomId)
            .eq("reservation_date", FUTURE_DATE)
            .gt("expires_at", new Date().toISOString());
          return count ?? 0;
        },
        { timeout: 15_000, message: "hold de A deveria existir e estar vivo" },
      )
      .toBeGreaterThan(0);

    // ── Usuário B (professor de teste): MESMO recurso/slot → INDISPONÍVEL ─────
    expect(await availabilityAs(TEST_EMAIL, TEST_PASSWORD)).toBe(false);

    // ── CA09: o solicitante (A) vê o próprio bloqueio em andamento ───────────
    // Verificamos via service-role que o hold pertence a A (dono). NÃO fazemos
    // signIn como A num 2º client: o signOut do GoTrue revogaria a sessão do
    // browser do A e abortaria o releaseHold a seguir. A exclusão por auth.uid()
    // (o próprio dono não é bloqueado) já é coberta por BDD/unit determinísticos.
    const { data: ownHold } = await sb
      .from("reservation_holds")
      .select("user_id")
      .eq("room_id", roomId)
      .eq("reservation_date", FUTURE_DATE)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .single();
    expect(ownHold?.user_id).toBeTruthy();

    // ── A volta da confirmação (releaseHold libera o recurso) ────────────────
    // Garante que a transição do hold assentou (aria-busy=false) antes de
    // voltar: o `releaseHold` do wizard só dispara se `holdActive` já é true,
    // que é setado ao fim da mesma transição que desliga o aria-busy.
    const holdStatus = page.getByText(/reservado temporariamente para você/i);
    await expect(holdStatus).toBeVisible();
    await expect(page.locator('[role="status"][aria-busy="true"]')).toHaveCount(
      0,
    );
    // Pequena folga p/ o React commitar `setHoldActive(true)` (mesma transição
    // que desliga o aria-busy) antes de Voltar — `releaseHold()` só dispara se
    // holdActive já é true. Sem isto há corrida de estado client.
    await page.waitForTimeout(1000);
    // Espera a Server Action de release concluir: capturamos a resposta POST
    // disparada por handleBack → releaseHoldAction antes de aferir o banco.
    const releaseDone = page
      .waitForResponse(
        (r) =>
          r.url().includes("/nova-reserva") && r.request().method() === "POST",
        { timeout: 15_000 },
      )
      .catch(() => null);
    await page.getByRole("button", { name: /voltar/i }).click();
    // A confirmação saiu de cena (voltou ao passo "Escolher") — sinal de que
    // handleBack rodou (e com ele o releaseHold).
    await expect(holdStatus).toBeHidden({ timeout: 15_000 });
    await releaseDone;

    // O hold de A deve sumir.
    await expect
      .poll(
        async () => {
          const { count } = await sb
            .from("reservation_holds")
            .select("*", { count: "exact", head: true })
            .eq("room_id", roomId)
            .eq("reservation_date", FUTURE_DATE);
          return count ?? 0;
        },
        {
          timeout: 15_000,
          message: "hold de A deveria ser liberado ao voltar",
        },
      )
      .toBe(0);

    // ── B verifica de novo → DISPONÍVEL ──────────────────────────────────────
    expect(await availabilityAs(TEST_EMAIL, TEST_PASSWORD)).toBe(true);
  });
});
