"use client";

/**
 * Definição/redefinição de senha a partir do link de e-mail (F-28/F-30/F-32).
 *
 * Fluxo:
 *  1. Ao montar, o Supabase pode ter colocado uma sessão de recuperação na URL
 *     (`?code=` PKCE ou hash `#access_token`). Trocamos por sessão via
 *     `exchangeCodeForSession`; o cliente `@supabase/ssr` também resolve o hash
 *     automaticamente (detectSessionInUrl). Confirmamos com `getUser`.
 *  2. Com sessão válida, o usuário define a nova senha → `auth.updateUser`.
 *  3. Sucesso → leva ao login. Sem sessão (link expirado/ inválido) → orienta.
 *
 * A11y: labels associados, erros com aria-invalid + aria-describedby, loading
 * via useTransition, estados anunciados (role="alert"/"status").
 */
import { useEffect, useId, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordStrength } from "@/lib/preferences";

const INPUT_CLASS =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 px-md text-on-surface placeholder:text-on-surface-variant/60 shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary text-body-md";

type SessionState = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const nextId = useId();
  const confirmId = useId();

  // Estabelece a sessão de recuperação vinda do link de e-mail.
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const code = searchParams.get("code");

    (async () => {
      if (code) {
        // PKCE: troca o code da URL por sessão.
        await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      }
      // detectSessionInUrl (padrão do @supabase/ssr) resolve o hash
      // `#access_token` automaticamente; confirmamos a sessão resultante.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setSessionState(user ? "ready" : "invalid");
    })();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleSubmit = () => {
    setFormError(null);
    const errors: Record<string, string> = {};
    const strength = validatePasswordStrength(next);
    if (strength) errors.next = strength;
    if (next !== confirm) errors.confirm = "As senhas não coincidem.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        setFormError(
          "Não foi possível definir a senha. O link pode ter expirado — peça um novo ao administrador.",
        );
        return;
      }
      // Encerra a sessão de recuperação e leva ao login para entrar com a nova senha.
      await supabase.auth.signOut();
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    });
  };

  if (sessionState === "checking") {
    return (
      <div className="gap-md flex w-full max-w-[420px] flex-col" role="status">
        <p className="text-body-md text-on-surface-variant">
          Validando seu link de acesso…
        </p>
      </div>
    );
  }

  if (sessionState === "invalid") {
    return (
      <div className="gap-md flex w-full max-w-[420px] flex-col">
        <h1 className="text-headline-md text-on-surface">Link inválido</h1>
        <p role="alert" className="text-body-md text-on-surface-variant">
          Este link de definição de senha é inválido ou expirou. Peça ao
          administrador para reenviar o convite ou a redefinição.
        </p>
        <Link
          href="/login"
          className="text-label-md text-primary hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="gap-md flex w-full max-w-[420px] flex-col">
        <h1 className="text-headline-md text-on-surface">Senha definida</h1>
        <p role="status" className="text-body-md text-on-surface-variant">
          Sua senha foi definida com sucesso. Redirecionando para o login…
        </p>
        <Link
          href="/login"
          className="text-label-md text-primary hover:underline"
        >
          Ir para o login agora
        </Link>
      </div>
    );
  }

  return (
    <div className="gap-xl flex w-full max-w-[420px] flex-col">
      <header className="gap-sm flex flex-col">
        <h1 className="text-headline-lg text-on-surface">Definir senha</h1>
        <p className="text-body-md text-on-surface-variant">
          Escolha uma senha para acessar o SIRA.
        </p>
      </header>

      <form
        className="gap-lg flex flex-col"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="gap-xs flex flex-col">
          <label htmlFor={nextId} className="text-label-sm text-on-surface">
            Nova senha
          </label>
          <input
            id={nextId}
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.next)}
            aria-describedby={
              fieldErrors.next ? `${nextId}-error` : `${nextId}-hint`
            }
            className={`${INPUT_CLASS} ${fieldErrors.next ? "border-error ring-error ring-1" : ""}`}
          />
          {fieldErrors.next ? (
            <span
              id={`${nextId}-error`}
              role="alert"
              className="text-label-sm text-error"
            >
              {fieldErrors.next}
            </span>
          ) : (
            <span
              id={`${nextId}-hint`}
              className="text-body-sm text-on-surface-variant"
            >
              Mínimo de 8 caracteres, com letra e número.
            </span>
          )}
        </div>

        <div className="gap-xs flex flex-col">
          <label htmlFor={confirmId} className="text-label-sm text-on-surface">
            Confirmar nova senha
          </label>
          <input
            id={confirmId}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.confirm)}
            aria-describedby={
              fieldErrors.confirm ? `${confirmId}-error` : undefined
            }
            className={`${INPUT_CLASS} ${fieldErrors.confirm ? "border-error ring-error ring-1" : ""}`}
          />
          {fieldErrors.confirm && (
            <span
              id={`${confirmId}-error`}
              role="alert"
              className="text-label-sm text-error"
            >
              {fieldErrors.confirm}
            </span>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="text-body-sm text-on-error-container bg-error-container px-md gap-xs flex items-center rounded-lg py-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              error
            </span>
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-on-primary hover:bg-surface-tint text-label-lg rounded-lg py-3 disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Definir senha"}
        </button>
      </form>
    </div>
  );
}
