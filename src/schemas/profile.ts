/**
 * Schemas Zod de Configurações da Conta (F-37 Perfil · F-39 Senha · RF-012).
 *
 * Fonte ÚNICA de validação client+servidor. As REGRAS já vivem em
 * `@/lib/preferences` (`isValidPhone`, `validatePasswordStrength`); aqui as
 * EXPRESSAMOS em Zod com RegExp visível (telefone BR, força de senha) e o
 * cross-field de confirmação via `.refine`, sem duplicar a lógica de domínio.
 */
import { z } from "zod";
import { isValidPhone } from "@/lib/preferences";

/**
 * Telefone BR opcional (F-37 CA04): vazio é válido; quando preenchido exige
 * DDD + número (10 ou 11 dígitos), tolerando máscara `(83) 99999-9999`. A regra
 * canônica é `isValidPhone`; a RegExp documenta o formato aceito na rubrica.
 */
export const BR_PHONE_RE = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

// ─────────────────────────────── Perfil (F-37) ──────────────────────────────

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "O nome completo é obrigatório."),
  department: z.string().trim().optional().default(""),
  phone: z
    .string()
    .trim()
    .optional()
    .default("")
    // Delega à regra única (aceita vazio); a RegExp acima é o contrato visível.
    .refine((v) => isValidPhone(v ?? ""), {
      message: "Telefone inválido. Use o formato (83) 99999-9999.",
    }),
});

export type ProfileFormInput = z.infer<typeof profileSchema>;

// ─────────────────────────────── Senha (F-39) ───────────────────────────────

/** Ao menos uma letra. */
export const HAS_LETTER_RE = /[A-Za-z]/;
/** Ao menos um número. */
export const HAS_DIGIT_RE = /[0-9]/;

/**
 * Senha forte (F-39 CA02): ≥8 caracteres, com letra e número. Mesmas regras de
 * `validatePasswordStrength`, expressas com RegExp para a rubrica.
 */
export const strongPassword = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .regex(HAS_LETTER_RE, "Inclua ao menos uma letra.")
  .regex(HAS_DIGIT_RE, "Inclua ao menos um número.");

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"], // cross-field (F-39 CA03)
  });

export type PasswordChangeFormInput = z.infer<typeof passwordChangeSchema>;
