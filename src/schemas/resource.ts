/**
 * Schemas Zod de Recursos — Salas (F-24/F-26) e Equipamentos (F-43/F-45) ·
 * RF-009/RF-013. Espelham `validateRoomInput`/`validateEquipmentInput` de
 * `@/lib/resources` (que seguem sendo a regra canônica reusada pela Server
 * Action). Aqui expressamos os campos em Zod para `zodResolver` no client e
 * `safeParse` no servidor. Os enums vêm das constantes de `resources.ts`.
 */
import { z } from "zod";
import { ROOM_TYPES } from "@/lib/resources";

// ─────────────────────────── Imagem do recurso (F-47/F-48 · RNF) ─────────────

/**
 * Restrições de imagem (RNF-imagem-de-recurso · IMG02/IMG03). Expostas como
 * constantes para reúso client (UX imediata) + servidor (garantia). A allowlist
 * de MIME é a fonte canônica: só JPG, PNG ou WebP são aceitos.
 */
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ImageMime = (typeof IMAGE_MIME_TYPES)[number];

/** Tamanho máximo por imagem: 2 MB (IMG03). */
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** `accept` do input file (espelha a allowlist). */
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");

/** Mensagens canônicas (mesmas no client e no servidor). */
export const IMAGE_TYPE_MESSAGE = "Use uma imagem JPG, PNG ou WebP.";
export const IMAGE_SIZE_MESSAGE = "A imagem deve ter no máximo 2 MB.";

/** MIME → extensão da chave no Storage (uma imagem por recurso, IMG04). */
const MIME_TO_EXT: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isImageMime(value: string): value is ImageMime {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function imageExtFromMime(mime: string): string | null {
  return isImageMime(mime) ? MIME_TO_EXT[mime] : null;
}

/**
 * Valida tipo e tamanho de um arquivo de imagem (IMG02/IMG03). Estrutural —
 * aceita qualquer objeto com `type`/`size`, então roda no client (File) e no
 * servidor (File da Web API). Retorna a 1ª mensagem de erro ou `null` se ok.
 */
export function validateImageFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!isImageMime(file.type)) return IMAGE_TYPE_MESSAGE;
  if (file.size > IMAGE_MAX_BYTES) return IMAGE_SIZE_MESSAGE;
  return null;
}

/** Estados possíveis de um recurso (espelha o enum `entity_status`). */
export const ENTITY_STATUSES = ["active", "inactive", "maintenance"] as const;

const status = z.enum(ENTITY_STATUSES, { message: "Estado inválido." });

// ─────────────────────────────── Sala (F-24) ────────────────────────────────

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da sala."),
  type: z.enum(ROOM_TYPES, { message: "Selecione um tipo válido." }),
  capacity: z
    .number({ message: "Informe a capacidade." })
    .int("A capacidade deve ser um número inteiro.")
    .positive("A capacidade deve ser um número maior que zero."),
  block: z.string().trim().optional().default(""),
  resources: z.array(z.string().trim().min(1)).default([]),
  status,
});

export type RoomFormInput = z.infer<typeof roomSchema>;

// ──────────────────────────── Equipamento (F-43) ────────────────────────────

export const equipmentSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do equipamento."),
    type: z.string().trim().min(1, "Informe o tipo do equipamento."),
    block: z.string().trim().optional().default(""),
    roomId: z.string().trim().nullable().optional().default(null),
    status,
  })
  .refine((v) => Boolean(v.block) || Boolean(v.roomId), {
    // F-43 CA02 — vínculo a bloco OU sala obrigatório (cross-field).
    message: "Vincule o equipamento a um bloco ou sala.",
    path: ["block"],
  });

export type EquipmentFormInput = z.infer<typeof equipmentSchema>;
