/**
 * Testes unitários da imagem de recurso (F-47/F-48 · RNF-imagem-de-recurso).
 * Rastreabilidade:
 *  - IMG02: só JPG/PNG/WebP são aceitos (validateImageFile / imageExtFromMime).
 *  - IMG03: tamanho ≤ 2 MB.
 *  - IMG08/CA08/CA09: resourceImageUrl monta a URL pública ou cai em null.
 *
 * Runner: `node:test`. Execução: `npm run test:unit`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IMAGE_MAX_BYTES,
  imageExtFromMime,
  validateImageFile,
} from "../src/schemas/resource.ts";
import { resourceImageUrl } from "../src/lib/resources.ts";

// ─────────────────────────── validateImageFile (IMG02/IMG03) ────────────────

test("validateImageFile: aceita JPG/PNG/WebP dentro do limite (IMG02/IMG03)", () => {
  assert.equal(validateImageFile({ type: "image/jpeg", size: 1024 }), null);
  assert.equal(validateImageFile({ type: "image/png", size: 1024 }), null);
  assert.equal(validateImageFile({ type: "image/webp", size: 1024 }), null);
});

test("validateImageFile: recusa formato não permitido (IMG02)", () => {
  const msg = validateImageFile({ type: "image/gif", size: 1024 });
  assert.ok(msg && /JPG|PNG|WebP/i.test(msg));
});

test("validateImageFile: recusa arquivo acima de 2 MB (IMG03)", () => {
  const msg = validateImageFile({
    type: "image/png",
    size: IMAGE_MAX_BYTES + 1,
  });
  assert.ok(msg && /2 MB/.test(msg));
  // Exatamente no limite é aceito.
  assert.equal(
    validateImageFile({ type: "image/png", size: IMAGE_MAX_BYTES }),
    null,
  );
});

test("imageExtFromMime: mapeia MIME→ext e nega o resto (IMG02/IMG04)", () => {
  assert.equal(imageExtFromMime("image/jpeg"), "jpg");
  assert.equal(imageExtFromMime("image/png"), "png");
  assert.equal(imageExtFromMime("image/webp"), "webp");
  assert.equal(imageExtFromMime("image/gif"), null);
});

// ─────────────────────────── resourceImageUrl (CA08/CA09) ───────────────────

test("resourceImageUrl: null quando não há image_path (CA09/IMG08)", () => {
  assert.equal(resourceImageUrl(null), null);
  assert.equal(resourceImageUrl(undefined), null);
  assert.equal(resourceImageUrl(""), null);
});

test("resourceImageUrl: monta a URL pública do bucket (CA08)", () => {
  const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  try {
    assert.equal(
      resourceImageUrl("room/abc.png"),
      "https://proj.supabase.co/storage/v1/object/public/resource-images/room/abc.png",
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
  }
});
