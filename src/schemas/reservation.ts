/**
 * Schema Zod da Nova Reserva — "quando" (F-14 / RF-006 · CA02 início<fim ·
 * CA03 data ≥ hoje). Espelha `validateSlot` de `@/lib/reservation`, que continua
 * sendo a FONTE da regra (datas/horas/ordem). Aqui expressamos as mesmas regras
 * em Zod para reuso client+servidor; o cross-field (início < fim, data ≥ hoje)
 * fica em `.superRefine`, delegando a `validateSlot` + `SLOT_ERROR_MESSAGE`.
 */
import { z } from "zod";
import {
  SLOT_ERROR_MESSAGE,
  validateSlot,
  type SlotError,
} from "@/lib/reservation";

/** `YYYY-MM-DD`. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** `HH:MM` 24h. */
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Mapeia o erro do slot para o caminho de campo correto na issue do Zod. */
const FIELD_OF_ERROR: Record<SlotError, "date" | "start" | "end"> = {
  "date-required": "date",
  "date-invalid": "date",
  "date-past": "date",
  "time-required": "start",
  "time-invalid": "start",
  "time-order": "end",
};

export const slotSchema = z
  .object({
    date: z
      .string()
      .trim()
      .min(1, SLOT_ERROR_MESSAGE["date-required"])
      .regex(ISO_DATE_RE, SLOT_ERROR_MESSAGE["date-invalid"]),
    start: z
      .string()
      .trim()
      .min(1, SLOT_ERROR_MESSAGE["time-required"])
      .regex(TIME_RE, SLOT_ERROR_MESSAGE["time-invalid"]),
    end: z
      .string()
      .trim()
      .min(1, SLOT_ERROR_MESSAGE["time-required"])
      .regex(TIME_RE, SLOT_ERROR_MESSAGE["time-invalid"]),
  })
  .superRefine((value, ctx) => {
    // Delega à regra única (CA02/CA03), evitando duplicar a lógica de datas.
    const error = validateSlot(value);
    if (error) {
      ctx.addIssue({
        code: "custom",
        message: SLOT_ERROR_MESSAGE[error],
        path: [FIELD_OF_ERROR[error]],
      });
    }
  });

export type SlotFormInput = z.infer<typeof slotSchema>;

/** Schema da etapa "finalidade" (CA — finalidade obrigatória da reserva). */
export const purposeSchema = z.object({
  purpose: z.string().trim().min(3, "Descreva a finalidade da reserva."),
});

export type PurposeInput = z.infer<typeof purposeSchema>;

/** Schema completo da Nova Reserva (quando + finalidade). */
export const reservationSchema = z.intersection(slotSchema, purposeSchema);

export type ReservationInput = z.infer<typeof reservationSchema>;
