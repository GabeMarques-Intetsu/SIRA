import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Definir senha · SIRA",
};

/**
 * Destino do link de convite/recuperação enviado por e-mail (F-28/F-30/F-32).
 * O Supabase redireciona para cá com uma sessão de recuperação na URL; o form
 * (client) troca o code por sessão e define a nova senha via
 * `supabase.auth.updateUser`. Não é admin-only — é o próprio usuário definindo
 * sua senha pela 1ª vez ou redefinindo-a.
 */
export default function RedefinirSenhaPage() {
  // useSearchParams() no form exige um limite de Suspense para o prerender
  // do App Router (Next 16 / CSR bailout).
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
