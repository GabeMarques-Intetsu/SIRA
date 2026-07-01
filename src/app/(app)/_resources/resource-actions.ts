"use server";

/**
 * Server Actions compartilhadas da Gestão de Recursos (EP-09 · RF-009/RF-013).
 * Salas: F-24 (criar) · F-26 (editar/desativar) · F-27 (excluir).
 * Equipamentos: F-43 (criar) · F-45 (editar) · F-46 (excluir).
 *
 * Segurança (F-24 CA01 · F-43 CA01 · F-45 CA01 · F-46 CA01):
 * - `requireAdmin()` reconfirma o papel NO SERVIDOR a cada ação. A RLS
 *   `rooms_write`/`equipment_write` (is_admin()) é a segunda camada — mesmo que
 *   o client seja burlado, o banco recusa a escrita de não-admins.
 *
 * Validação: reusa `validateRoomInput`/`validateEquipmentInput` de `resources.ts`
 * — a MESMA função do client (nunca confiar só no client). Unicidade de nome é
 * checada relendo a coleção (F-24 CA04 · F-43 CA04 · F-45 CA03).
 *
 * Exclusão (F-27/F-46): bloqueada quando há reserva FUTURA não-cancelada do
 * recurso — preferimos preservar dados a deletar em cascata; a UI orienta a
 * migrar/cancelar antes (F-27 CA02/CA03 · F-46 CA03).
 *
 * Sincronização: revalidamos /salas, /equipamentos e as superfícies que leem
 * o catálogo (calendário/nova-reserva/painel) + o layout (badges).
 */
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { hasDuplicateName, RESOURCE_IMAGES_BUCKET } from "@/lib/resources";
import {
  equipmentSchema,
  imageExtFromMime,
  roomSchema,
  validateImageFile,
  type EquipmentFormInput,
  type RoomFormInput,
} from "@/schemas/resource";

export interface ResourceActionResult {
  ok: boolean;
  error: string | null;
  /** Erros por campo (espelham a validação compartilhada). */
  fieldErrors?: Record<string, string>;
}

/** Converte as issues do Zod em mapa campo→mensagem (1ª por campo). */
function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Revalida as superfícies que refletem o catálogo de recursos. */
function revalidateResourceSurfaces(): void {
  revalidatePath("/salas");
  revalidatePath("/equipamentos");
  revalidatePath("/calendario");
  revalidatePath("/nova-reserva");
  revalidatePath("/painel");
}

const today = (): string => new Date().toISOString().slice(0, 10);

/** Há reserva futura não-cancelada para o recurso? (bloqueia exclusão). */
async function hasFutureReservations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  column: "room_id" | "equipment_id",
  id: string,
): Promise<boolean> {
  const { count } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq(column, id)
    .in("status", ["pending", "approved"])
    .gte("reservation_date", today());
  return (count ?? 0) > 0;
}

// ─────────────────────────── Imagem do recurso (F-47/F-48) ──────────────────

/**
 * Intenção de imagem extraída do FormData enviado pelo formulário:
 * - `file`  → enviar/substituir a imagem;
 * - `remove` → apagar a imagem atual (volta ao ícone padrão — IMG06/CA07);
 * - `keep`  → não mexer na imagem (edição que não tocou no campo).
 */
type ImageIntent =
  | { kind: "file"; file: File }
  | { kind: "remove" }
  | { kind: "keep" };

/** Lê a intenção de imagem do FormData (campos `image` e `removeImage`). */
function parseImageIntent(form: FormData): ImageIntent {
  if (form.get("removeImage") === "true") return { kind: "remove" };
  const file = form.get("image");
  if (file instanceof File && file.size > 0) return { kind: "file", file };
  return { kind: "keep" };
}

/**
 * Aplica a intenção de imagem e devolve o novo valor de `image_path`:
 * - `keep`   → mantém o atual;
 * - `remove` → apaga o objeto do Storage e devolve `null`;
 * - `file`   → valida tipo/tamanho NO SERVIDOR, faz upsert na chave
 *   `<kind>/<id>.<ext>` e devolve a chave. Trocar a extensão (ex.: png→webp)
 *   pode deixar o objeto antigo órfão, então apagamos o anterior se a chave mudar.
 *
 * `upsert: true` torna a substituição idempotente quando a extensão é a mesma
 * (IMG04 — uma imagem por recurso). Retorna `{ error }` em falha de validação.
 */
async function applyImageIntent(
  kind: "room" | "equipment",
  resourceId: string,
  currentPath: string | null,
  intent: ImageIntent,
): Promise<{ imagePath: string | null } | { error: string }> {
  if (intent.kind === "keep") return { imagePath: currentPath };

  const admin = getAdminClient();
  const storage = admin.storage.from(RESOURCE_IMAGES_BUCKET);

  if (intent.kind === "remove") {
    if (currentPath) await storage.remove([currentPath]);
    return { imagePath: null };
  }

  // intent.kind === "file" — validação de garantia no servidor (IMG02/IMG03).
  const validationError = validateImageFile(intent.file);
  if (validationError) return { error: validationError };

  const ext = imageExtFromMime(intent.file.type);
  if (!ext) return { error: "Use uma imagem JPG, PNG ou WebP." };

  const path = `${kind}/${resourceId}.${ext}`;
  const { error: uploadError } = await storage.upload(path, intent.file, {
    upsert: true,
    contentType: intent.file.type,
  });
  if (uploadError) {
    return { error: "Não foi possível enviar a imagem." };
  }

  // Extensão mudou? O objeto anterior (outra extensão) fica órfão — apaga.
  if (currentPath && currentPath !== path) {
    await storage.remove([currentPath]);
  }
  return { imagePath: path };
}

// ════════════════════════════════ SALAS ═════════════════════════════════════

export async function createRoomAction(
  input: RoomFormInput,
  imageForm?: FormData,
): Promise<ResourceActionResult> {
  await requireAdmin();
  // Defesa em profundidade: revalida com o MESMO schema Zod do client (DRY).
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const v = { ...parsed.data, block: parsed.data.block ?? "" };
  const intent = imageForm
    ? parseImageIntent(imageForm)
    : { kind: "keep" as const };

  const supabase = await createClient();

  // F-24 CA04 — nome único (case/acento-insensível), checado no servidor.
  const { data: existing } = await supabase.from("rooms").select("id, name");
  if (hasDuplicateName(existing ?? [], v.name, null)) {
    return {
      ok: false,
      error: "Já existe uma sala com esse nome.",
      fieldErrors: { name: "Nome já utilizado." },
    };
  }

  const { data: created, error } = await supabase
    .from("rooms")
    .insert({
      name: v.name,
      type: v.type as never,
      capacity: v.capacity,
      block: v.block || null,
      resources: v.resources,
      status: v.status as never,
    })
    .select("id")
    .single();
  if (error || !created)
    return { ok: false, error: "Não foi possível cadastrar a sala." };

  if (intent.kind === "file") {
    const img = await applyImageIntent("room", created.id, null, intent);
    if ("error" in img) {
      return { ok: false, error: img.error, fieldErrors: { image: img.error } };
    }
    if (img.imagePath) {
      await supabase
        .from("rooms")
        .update({ image_path: img.imagePath })
        .eq("id", created.id);
    }
  }

  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

export async function updateRoomAction(
  id: string,
  input: RoomFormInput,
  imageForm?: FormData,
): Promise<ResourceActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Sala inválida." };
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const v = { ...parsed.data, block: parsed.data.block ?? "" };
  const intent = imageForm
    ? parseImageIntent(imageForm)
    : { kind: "keep" as const };

  const supabase = await createClient();

  const { data: existing } = await supabase.from("rooms").select("id, name");
  if (hasDuplicateName(existing ?? [], v.name, id)) {
    return {
      ok: false,
      error: "Já existe uma sala com esse nome.",
      fieldErrors: { name: "Nome já utilizado." },
    };
  }

  // Resolve a imagem (upload/remoção) antes de gravar a linha; lê o path atual.
  const { data: row } = await supabase
    .from("rooms")
    .select("image_path")
    .eq("id", id)
    .single();
  const img = await applyImageIntent(
    "room",
    id,
    row?.image_path ?? null,
    intent,
  );
  if ("error" in img) {
    return { ok: false, error: img.error, fieldErrors: { image: img.error } };
  }

  // F-26 CA03 — desativar só muda o status; reservas existentes ficam intactas.
  const { error } = await supabase
    .from("rooms")
    .update({
      name: v.name,
      type: v.type as never,
      capacity: v.capacity,
      block: v.block || null,
      resources: v.resources,
      status: v.status as never,
      image_path: img.imagePath,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível atualizar a sala." };

  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

/** Muda apenas o estado da sala (ativar/inativar/manutenção) — F-26 CA02. */
export async function setRoomStatusAction(
  id: string,
  status: string,
): Promise<ResourceActionResult> {
  await requireAdmin();
  if (
    !id ||
    (status !== "active" && status !== "inactive" && status !== "maintenance")
  ) {
    return { ok: false, error: "Estado inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ status: status as never })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível alterar o estado." };
  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

/** Exclui a sala; bloqueia se houver reservas futuras (F-27 CA02/CA03). */
export async function deleteRoomAction(
  id: string,
): Promise<ResourceActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Sala inválida." };
  const supabase = await createClient();

  if (await hasFutureReservations(supabase, "room_id", id)) {
    return {
      ok: false,
      error:
        "Esta sala possui reservas futuras. Migre ou cancele as reservas antes de excluir, ou apenas inative a sala.",
    };
  }

  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { ok: false, error: "Não foi possível excluir a sala." };
  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

// ═══════════════════════════════ EQUIPAMENTOS ═══════════════════════════════

export async function createEquipmentAction(
  input: EquipmentFormInput,
  imageForm?: FormData,
): Promise<ResourceActionResult> {
  await requireAdmin();
  // Defesa em profundidade: revalida com o MESMO schema Zod do client (DRY).
  const parsed = equipmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const v = {
    ...parsed.data,
    block: parsed.data.block ?? "",
    roomId: parsed.data.roomId ?? null,
  };
  const intent = imageForm
    ? parseImageIntent(imageForm)
    : { kind: "keep" as const };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("equipment")
    .select("id, name");
  if (hasDuplicateName(existing ?? [], v.name, null)) {
    return {
      ok: false,
      error: "Já existe um equipamento com esse nome.",
      fieldErrors: { name: "Nome já utilizado." },
    };
  }

  const { data: created, error } = await supabase
    .from("equipment")
    .insert({
      name: v.name,
      type: v.type,
      block: v.block || null,
      room_id: v.roomId,
      status: v.status as never,
    })
    .select("id")
    .single();
  if (error || !created)
    return { ok: false, error: "Não foi possível cadastrar o equipamento." };

  if (intent.kind === "file") {
    const img = await applyImageIntent("equipment", created.id, null, intent);
    if ("error" in img) {
      return { ok: false, error: img.error, fieldErrors: { image: img.error } };
    }
    if (img.imagePath) {
      await supabase
        .from("equipment")
        .update({ image_path: img.imagePath })
        .eq("id", created.id);
    }
  }

  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

export async function updateEquipmentAction(
  id: string,
  input: EquipmentFormInput,
  imageForm?: FormData,
): Promise<ResourceActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Equipamento inválido." };
  const parsed = equipmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const v = {
    ...parsed.data,
    block: parsed.data.block ?? "",
    roomId: parsed.data.roomId ?? null,
  };
  const intent = imageForm
    ? parseImageIntent(imageForm)
    : { kind: "keep" as const };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("equipment")
    .select("id, name");
  if (hasDuplicateName(existing ?? [], v.name, id)) {
    return {
      ok: false,
      error: "Já existe um equipamento com esse nome.",
      fieldErrors: { name: "Nome já utilizado." },
    };
  }

  const { data: row } = await supabase
    .from("equipment")
    .select("image_path")
    .eq("id", id)
    .single();
  const img = await applyImageIntent(
    "equipment",
    id,
    row?.image_path ?? null,
    intent,
  );
  if ("error" in img) {
    return { ok: false, error: img.error, fieldErrors: { image: img.error } };
  }

  // F-45 CA04/CA05 — mudar p/ inativo/manutenção só altera o status; as
  // reservas aprovadas existentes não são apagadas.
  const { error } = await supabase
    .from("equipment")
    .update({
      name: v.name,
      type: v.type,
      block: v.block || null,
      room_id: v.roomId,
      status: v.status as never,
      image_path: img.imagePath,
    })
    .eq("id", id);
  if (error)
    return { ok: false, error: "Não foi possível atualizar o equipamento." };

  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

export async function setEquipmentStatusAction(
  id: string,
  status: string,
): Promise<ResourceActionResult> {
  await requireAdmin();
  if (
    !id ||
    (status !== "active" && status !== "inactive" && status !== "maintenance")
  ) {
    return { ok: false, error: "Estado inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("equipment")
    .update({ status: status as never })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível alterar o estado." };
  revalidateResourceSurfaces();
  return { ok: true, error: null };
}

/** Exclui o equipamento; bloqueia se houver reservas futuras (F-46 CA03). */
export async function deleteEquipmentAction(
  id: string,
): Promise<ResourceActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Equipamento inválido." };
  const supabase = await createClient();

  if (await hasFutureReservations(supabase, "equipment_id", id)) {
    return {
      ok: false,
      error:
        "Este equipamento possui reservas futuras. Cancele as reservas antes de excluir, ou apenas inative o equipamento.",
    };
  }

  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error)
    return { ok: false, error: "Não foi possível excluir o equipamento." };
  revalidateResourceSurfaces();
  return { ok: true, error: null };
}
