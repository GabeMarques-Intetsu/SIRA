/**
 * E2E F-47/F-48 — upload e exibição da imagem de uma sala (CA02/CA05/CA08).
 *
 * Fluxo real, browser + Supabase ativo:
 *  login admin → /salas → editar uma sala existente → anexar um PNG pequeno
 *  válido → salvar → recarregar /salas → a imagem aparece no card daquela sala.
 *
 * Limpeza obrigatória: ao final, reverte `image_path = null` da sala via
 * service-role e apaga o objeto enviado do bucket, para não deixar lixo.
 *
 * Credenciais e chaves: lidas SOMENTE de env (nunca hardcoded).
 */
import { test, expect } from "@playwright/test";
import {
  login,
  adminClient,
  hasAdminCreds,
  hasServiceRole,
  tinyPngBuffer,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from "./_helpers";

const RESOURCE_IMAGES_BUCKET = "resource-images";
/** Sala-alvo estável do seed (existe no projeto). */
const TARGET_ROOM = "Sala 105";

test.describe("F-47 — imagem da sala (upload + exibição)", () => {
  test.skip(
    !hasAdminCreds() || !hasServiceRole(),
    "Requer SMOKE_ADMIN_* e SUPABASE_SERVICE_ROLE_KEY no ambiente.",
  );

  // Guarda o image_path original da sala p/ restaurar no final.
  let roomId = "";
  let originalImagePath: string | null = null;
  let uploadedPath: string | null = null;

  test.beforeAll(async () => {
    const sb = adminClient();
    const { data, error } = await sb
      .from("rooms")
      .select("id, image_path")
      .eq("name", TARGET_ROOM)
      .single();
    if (error || !data) {
      throw new Error(`Sala-alvo "${TARGET_ROOM}" não encontrada para o E2E.`);
    }
    roomId = data.id as string;
    originalImagePath = (data.image_path as string | null) ?? null;
  });

  test.afterAll(async () => {
    // ── Limpeza: reverte o image_path e remove o objeto enviado ──────────────
    const sb = adminClient();
    await sb
      .from("rooms")
      .update({ image_path: originalImagePath })
      .eq("id", roomId);

    // Descobre o(s) objeto(s) que ficaram sob room/<id> e apaga os novos.
    if (uploadedPath && uploadedPath !== originalImagePath) {
      await sb.storage.from(RESOURCE_IMAGES_BUCKET).remove([uploadedPath]);
    }
  });

  test("anexa imagem, salva e a imagem aparece no card da sala", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/salas");
    await expect(page.locator("#main-content")).toBeVisible();

    // Abre o diálogo de edição da sala-alvo (aria-label="Editar <nome>").
    await page.getByRole("button", { name: `Editar ${TARGET_ROOM}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Anexa o PNG pequeno válido ao input de imagem (label "Imagem (opcional)").
    const fileInput = dialog.getByLabel(/imagem/i);
    await fileInput.setInputFiles({
      name: "e2e-sala.png",
      mimeType: "image/png",
      buffer: tinyPngBuffer(),
    });

    // Pré-visualização local aparece antes de salvar (CA05) e nenhum erro.
    await expect(
      dialog.getByRole("img", { name: /pré-visualização/i }),
    ).toBeVisible();
    await expect(dialog.getByRole("alert")).toHaveCount(0);

    // Salva — o diálogo fecha ao concluir (Server Action faz o upload).
    await dialog.getByRole("button", { name: /salvar alterações/i }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    // Confirma no banco que o image_path foi gravado (verdade autoritativa).
    const sb = adminClient();
    await expect
      .poll(
        async () => {
          const { data } = await sb
            .from("rooms")
            .select("image_path")
            .eq("id", roomId)
            .single();
          return (data?.image_path as string | null) ?? null;
        },
        { timeout: 15_000, message: "image_path deveria ser gravado" },
      )
      .not.toBeNull();

    const { data: after } = await sb
      .from("rooms")
      .select("image_path")
      .eq("id", roomId)
      .single();
    uploadedPath = (after?.image_path as string | null) ?? null;
    expect(uploadedPath).toBeTruthy();

    // Recarrega /salas e verifica que a imagem aparece no card (CA08).
    await page.goto("/salas");
    await expect(page.locator("#main-content")).toBeVisible();
    const cardImg = page.getByRole("img", { name: TARGET_ROOM });
    await expect(cardImg).toBeVisible({ timeout: 15_000 });
    const src = await cardImg.getAttribute("src");
    expect(src).toContain(
      `/storage/v1/object/public/${RESOURCE_IMAGES_BUCKET}/`,
    );
  });
});
