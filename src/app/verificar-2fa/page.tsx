import type { Metadata } from "next";
import { Verify2faForm } from "./verify-form";
import { signOutAction } from "@/components/shell/logout-action";

export const metadata: Metadata = {
  title: "Verificação em duas etapas · SIRA",
};

/**
 * Tela de desafio de 2FA no acesso (F-39 US39.4 · ADR-010). O middleware
 * redireciona para cá quando a sessão está em `aal1` mas o usuário tem 2FA
 * verificado (`nextLevel = aal2`). Fora dos grupos (auth)/(app): só o layout
 * raiz, sem shell — nenhuma área interna monta enquanto o 2FA está pendente
 * (CA12). Oferece a saída da sessão para quem não tiver o app em mãos.
 */
export default function Verificar2faPage() {
  return (
    <main className="bg-surface text-on-surface p-margin-mobile flex min-h-screen items-center justify-center">
      <div className="gap-lg flex w-full max-w-[420px] flex-col">
        <header className="gap-sm flex flex-col items-center text-center">
          <span
            className="bg-primary-container text-on-primary-container flex h-14 w-14 items-center justify-center rounded-full"
            aria-hidden="true"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28 }}
            >
              encrypted
            </span>
          </span>
          <h1 className="text-headline-sm text-on-surface">
            Verificação em duas etapas
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Sua conta tem a verificação em duas etapas ativa. Digite o código de
            6 dígitos do seu aplicativo autenticador para entrar.
          </p>
        </header>

        <Verify2faForm />

        <form action={signOutAction} className="text-center">
          <button
            type="submit"
            className="text-label-md text-on-surface-variant hover:text-on-surface underline-offset-2 hover:underline"
          >
            Não é você? Sair da conta
          </button>
        </form>
      </div>
    </main>
  );
}
