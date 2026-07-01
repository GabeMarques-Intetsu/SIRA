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
  validateImageFile,
  IMAGE_TYPE_MESSAGE,
  IMAGE_SIZE_MESSAGE,
} from "@/schemas/resource";
import { resourceImageUrl, RESOURCE_IMAGES_BUCKET } from "@/lib/resources";
import type { SiraWorld } from "../support/world";

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
