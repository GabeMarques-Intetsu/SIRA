/**
 * Schemas Zod de autenticação (F-01 Login · F-03 Cadastro · RF-001).
 *
 * Fonte ÚNICA de validação client+servidor: o client valida com `zodResolver`
 * para UX imediata; a Server Action revalida com `schema.safeParse` (defesa em
 * profundidade — nunca confiar só no client). A REGRA do domínio institucional
 * vive em `@/lib/validation` (`INSTITUTIONAL_DOMAIN`); aqui só a EXPRESSAMOS em
 * Zod via RegExp, sem duplicar a regra.
 */
import { z } from "zod";
import { INSTITUTIONAL_DOMAIN } from "@/lib/validation";

/**
 * RegExp do e-mail institucional do IFPB: parte local + domínio terminando em
 * `ifpb.edu.br` (cobre subdomínios como `aluno.ifpb.edu.br`). Derivada de
 * `INSTITUTIONAL_DOMAIN` (que já inclui o `@`, escapando os pontos) para manter
 * a regra única e legível na rubrica (RegExp visível).
 */
const DOMAIN_RE = INSTITUTIONAL_DOMAIN.replace(/^@/, "").replace(/\./g, "\\.");
export const INSTITUTIONAL_EMAIL_RE = new RegExp(
  `^[^\\s@]+@(?:[^\\s@]+\\.)*${DOMAIN_RE}$`,
  "i",
);

/** Campo de e-mail institucional reutilizado pelos schemas de auth. */
const institutionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail.")
  .regex(
    INSTITUTIONAL_EMAIL_RE,
    "Somente e-mails institucionais @ifpb.edu.br são aceitos.",
  );

// ─────────────────────────────── Login (F-01) ───────────────────────────────

export const loginSchema = z.object({
  email: institutionalEmail,
  password: z.string().min(1, "Informe a senha."),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ────────────────────────────── Cadastro (F-03) ─────────────────────────────

/** Perfis aceitos na solicitação de acesso (o público só solicita professor). */
export const SIGNUP_ROLES = ["professor", "admin"] as const;

export const signupSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  email: institutionalEmail,
  matricula: z.string().trim().optional().default(""),
  perfil: z.enum(SIGNUP_ROLES, { message: "Selecione o perfil." }),
  departamento: z.string().trim().optional().default(""),
  motivo: z.string().trim().optional().default(""),
  termos: z.literal(true, {
    message: "É necessário aceitar os termos de uso para solicitar acesso.",
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;
