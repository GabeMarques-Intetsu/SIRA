"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/schemas/auth";
import { homeForRole } from "@/components/shell/nav-config";

export interface LoginState {
  error: string | null;
}

/**
 * Server Action de login (F-01).
 * - CA01/CA02: exige domínio @ifpb.edu.br.
 * - CA03/CA04: credenciais inválidas → mensagem genérica (não revela qual campo).
 * - CA05: conta inativa → aviso específico (e desfaz a sessão).
 * - CA06: campos obrigatórios.
 * - CA07: redireciona p/ a tela inicial do perfil.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Defesa em profundidade: revalida com o MESMO schema Zod do client (DRY).
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") != null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "E-mail ou senha incorretos. Verifique e tente novamente.",
    };
  }

  // CA05 — conta inativa não acessa mesmo com senha correta.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      error: "Sua conta está inativa. Procure o administrador do sistema.",
    };
  }

  redirect(homeForRole(profile.role));
}
