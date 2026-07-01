"use client";

/**
 * Desafio de 2FA no acesso (F-39 US39.4 · CA11/CA13). A sessão chega em `aal1`
 * (só senha); aqui o usuário informa o código TOTP do app → `mfa.challenge` +
 * `mfa.verify` elevam a sessão a `aal2` e liberam as áreas internas.
 *
 * A11y: label associado, input numérico com `autocomplete="one-time-code"`,
 * foco inicial, erro com `role="alert"` + `aria-describedby`/`aria-invalid`.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isTotpCodeComplete, normalizeTotpCode } from "@/lib/mfa";

export function Verify2faForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = "verify-2fa-error";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verify = async () => {
    if (!isTotpCodeComplete(code)) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();

    // Fator TOTP verificado do usuário.
    const { data: factors, error: fErr } =
      await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];
    if (fErr || !totp) {
      setError("Nenhum fator de duas etapas encontrado na sua conta.");
      setLoading(false);
      return;
    }

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: totp.id,
    });
    if (cErr || !challenge) {
      setError("Não foi possível iniciar a verificação. Tente novamente.");
      setLoading(false);
      return;
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge.id,
      code,
    });
    if (vErr) {
      // CA13 — código incorreto barra e permite nova tentativa.
      setError("Código inválido. Verifique no app e tente novamente.");
      setCode("");
      setLoading(false);
      inputRef.current?.focus();
      return;
    }

    // Sucesso: sessão elevada a aal2 (cookies atualizados). Libera o app.
    router.refresh();
    router.replace("/calendario");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
      className="gap-md flex flex-col"
    >
      <div className="gap-xs flex flex-col">
        <label
          htmlFor="verify-2fa-code"
          className="text-label-md text-on-surface"
        >
          Código de verificação
        </label>
        <input
          id="verify-2fa-code"
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(normalizeTotpCode(e.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="000000"
          className="border-outline-variant bg-surface text-on-surface focus:ring-primary text-headline-sm px-md w-full rounded-lg border py-2 text-center tracking-[0.5em] outline-none focus:ring-2"
        />
        {error && (
          <p id={errorId} role="alert" className="text-label-sm text-error">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !isTotpCodeComplete(code)}
        className="bg-primary text-on-primary hover:bg-surface-tint text-label-lg rounded-lg py-2.5 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Verificando…" : "Verificar e entrar"}
      </button>
    </form>
  );
}
