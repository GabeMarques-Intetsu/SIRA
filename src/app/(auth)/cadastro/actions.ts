"use server";

import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/schemas/auth";
import type { Enums } from "@/lib/supabase/database.types";

export interface SignupState {
  error: string | null;
  success: boolean;
}

/**
 * Server Action de solicitação de cadastro (F-03).
 * INSERE em signup_requests com status pendente — NÃO cria auth.user
 * (a criação ocorre na aprovação do admin, F-32).
 * - CA02: nome, e-mail e perfil obrigatórios + aceite de termos.
 * - CA03: domínio institucional.
 * - CA04: bloqueia e-mail já cadastrado (profiles) ou já solicitado (pendente).
 * - CA05: registra como pendente e avisa o solicitante.
 */
export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // Defesa em profundidade: revalida com o MESMO schema Zod do client (DRY).
  const parsed = signupSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    matricula: formData.get("matricula") ?? "",
    perfil: formData.get("perfil"),
    departamento: formData.get("departamento") ?? "",
    motivo: formData.get("motivo") ?? "",
    termos: formData.get("termos") != null,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Verifique os campos.",
      success: false,
    };
  }

  const {
    nome: fullName,
    email,
    matricula,
    perfil,
    departamento: department,
    motivo,
  } = parsed.data;
  // Reforça a regra: público só solicita professor (admin nunca pelo cadastro).
  const role: Enums<"user_role"> = perfil === "admin" ? "professor" : perfil;

  const supabase = await createClient();

  // CA04 — e-mail já cadastrado como usuário?
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return {
      error: "Este e-mail já possui cadastro no sistema.",
      success: false,
    };
  }

  // CA04 — já existe solicitação pendente para este e-mail?
  const { data: existingRequest } = await supabase
    .from("signup_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingRequest) {
    return {
      error: "Já existe uma solicitação pendente para este e-mail.",
      success: false,
    };
  }

  const { error } = await supabase.from("signup_requests").insert({
    full_name: fullName,
    email,
    role,
    department: department || null,
    motivo: motivo || null,
    reason: matricula ? `Matrícula/SIAPE: ${matricula}` : null,
    status: "pending",
  });

  if (error) {
    return {
      error: "Não foi possível enviar a solicitação. Tente novamente.",
      success: false,
    };
  }

  return { error: null, success: true };
}
