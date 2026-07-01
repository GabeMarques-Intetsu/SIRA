/**
 * Schema Zod de Usuário (F-28 Criar · F-30 Editar · RF-010). Espelha
 * `validateUserInput` de `@/lib/users` (regra canônica reusada pela Server
 * Action) e reusa a constante `PASSWORD_MIN` como fonte do tamanho mínimo.
 *
 * O e-mail e a senha são opcionais por construção (edição: e-mail imutável —
 * F-30 CA04; senha só muda se preenchida — F-30 CA03). RegExp visível no e-mail
 * e no SIAPE/matrícula (a rubrica valoriza RegExp).
 */
import { z } from "zod";
import { PASSWORD_MIN } from "@/lib/users";

/** Estrutura mínima de e-mail (igual ao `EMAIL_RE` interno de `users.ts`). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** SIAPE/matrícula: apenas dígitos quando informado (7 a 12). */
export const SIAPE_RE = /^\d{7,12}$/;

/** Perfis de usuário (espelha o enum `user_role`). */
export const USER_ROLES = ["admin", "professor"] as const;

/** Campo de e-mail opcional mas, se vier, com formato válido. */
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || EMAIL_RE.test(v), { message: "E-mail inválido." })
  .optional()
  .default("");

/** Campo de SIAPE opcional mas, se vier, só dígitos (7–12). */
const optionalSiape = z
  .string()
  .trim()
  .refine((v) => v === "" || SIAPE_RE.test(v), {
    message: "SIAPE/Matrícula deve conter de 7 a 12 dígitos.",
  })
  .optional()
  .default("");

export const userSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: optionalEmail,
  role: z.enum(USER_ROLES, { message: "Selecione o perfil." }),
  department: z.string().trim().optional().default(""),
  siapeMatricula: optionalSiape,
  phone: z.string().trim().optional().default(""),
  /** Vazio = manter a senha atual (edição); validado no schema de criação. */
  password: z
    .string()
    .refine((v) => v === "" || v.length >= PASSWORD_MIN, {
      message: `Mínimo de ${PASSWORD_MIN} caracteres.`,
    })
    .optional()
    .default(""),
});

export type UserFormInput = z.infer<typeof userSchema>;

/**
 * Variante de CRIAÇÃO (F-28 CA02): e-mail e senha tornam-se obrigatórios. O
 * schema base cobre a EDIÇÃO (ambos opcionais — F-30 CA03/CA04).
 */
export const createUserSchema = userSchema.extend({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe o e-mail.")
    .regex(EMAIL_RE, "E-mail inválido."),
  password: z
    .string()
    .min(PASSWORD_MIN, `Mínimo de ${PASSWORD_MIN} caracteres.`),
});

export type CreateUserFormInput = z.infer<typeof createUserSchema>;
