"use client";

/**
 * Seção Segurança (F-39). Troca de senha em diálogo (CA01-04, via
 * supabase.auth.updateUser — suportado no client autenticado); 2FA TOTP REAL
 * (CA05/06/07) via `supabase.auth.mfa.*` (enroll → QR → verify → unenroll), no
 * contexto do usuário autenticado (sem service-role); e "Ver sessões" (CA08-10)
 * sinalizado como dependente da admin API.
 *
 * A verdade do 2FA = existir fator TOTP `verified` (a flag em
 * `user_preferences.two_factor_enabled` só ESPELHA isso — nunca o contrário).
 *
 * A11y: diálogo com role="dialog"/aria-modal, foco inicial, Esc fecha, foco
 * preso; QR com descrição textual e segredo legível; input com label; erros com
 * aria-invalid + aria-describedby; loading via useTransition.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  passwordChangeSchema,
  type PasswordChangeFormInput,
} from "@/schemas/profile";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  hasVerifiedTotp,
  isTotpCodeComplete,
  normalizeTotpCode,
  unverifiedTotpFactors,
  verifiedTotpFactors,
} from "@/lib/mfa";
import {
  changePasswordAction,
  setTwoFactorAction,
  type ActionResult,
} from "./actions";

interface Props {
  twoFactorEnabled: boolean;
}

export function SecurityPanel({ twoFactorEnabled }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionsNotice, setSessionsNotice] = useState<string | null>(null);

  return (
    <section
      id="seguranca"
      aria-labelledby="seg-h"
      className="bg-surface-container-lowest border-outline-variant p-md md:p-lg scroll-mt-24 rounded-xl border shadow-sm"
    >
      <h2 id="seg-h" className="text-headline-sm text-on-surface mb-md">
        Segurança
      </h2>

      <div className="divide-outline-variant divide-y">
        <div className="py-md gap-md flex items-center justify-between">
          <div>
            <p className="text-body-md text-on-surface font-medium">Senha</p>
            <p className="text-body-sm text-on-surface-variant">
              Defina uma nova senha de acesso.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container text-label-md rounded-lg border py-2"
          >
            Alterar senha
          </button>
        </div>

        <TwoFactorRow initialEnabled={twoFactorEnabled} />

        <div className="py-md gap-md flex items-start justify-between">
          <div>
            <p className="text-body-md text-on-surface font-medium">
              Sessões ativas
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Veja e encerre sessões em outros dispositivos.
            </p>
            {sessionsNotice && (
              <p
                role="status"
                className="text-body-sm text-on-surface-variant mt-xs"
              >
                {sessionsNotice}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              setSessionsNotice(
                "A revisão de sessões será habilitada pela equipe de TI (depende da API administrativa).",
              )
            }
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container text-label-md rounded-lg border py-2"
          >
            Ver sessões
          </button>
        </div>
      </div>

      {dialogOpen && <PasswordDialog onClose={() => setDialogOpen(false)} />}
    </section>
  );
}

// ──────────────────────── 2FA TOTP (F-39 CA05/06/07) ────────────────────────

type EnrollData = {
  factorId: string;
  qrCode: string; // data-URL/SVG do QR (data.totp.qr_code)
  secret: string; // segredo legível p/ entrada manual (data.totp.secret)
};

/**
 * Linha de 2FA: lê os fatores reais ao montar, sincroniza a flag, e abre o
 * diálogo de enroll (QR + código). A verdade vem de `mfa.listFactors`.
 */
function TwoFactorRow({ initialEnabled }: { initialEnabled: boolean }) {
  // Otimista a partir da flag persistida; reconciliada com a verdade no efeito.
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollDialog, setEnrollDialog] = useState<EnrollData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Lê a verdade (fatores) e sincroniza a flag persistida com ela.
  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError("Não foi possível carregar o estado do 2FA.");
      setLoading(false);
      return;
    }
    const real = hasVerifiedTotp(data?.totp ?? data?.all ?? []);
    setEnabled(real);
    setLoading(false);
    // Reconcilia a flag declarativa com a verdade (sem falsa sensação).
    if (real !== initialEnabled) {
      await setTwoFactorAction(real);
    }
  }, [initialEnabled]);

  useEffect(() => {
    // Busca assíncrona dos fatores MFA no mount (uso legítimo de efeito): os
    // setState ocorrem só após o await em `refresh`, não sincronamente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Começa o enroll: cria um fator TOTP e mostra o QR + segredo.
  const startEnroll = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const supabase = createClient();
      // Limpa enrolments TOTP pendentes anteriores (evita "factor already exists").
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of unverifiedTotpFactors(list?.all ?? [])) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollError || !data) {
        setError("Não foi possível iniciar o 2FA. Tente novamente.");
        return;
      }
      setEnrollDialog({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    });
  };

  // Desativa: remove todos os fatores TOTP verificados.
  const disable = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of verifiedTotpFactors(list?.all ?? [])) {
        const { error: unErr } = await supabase.auth.mfa.unenroll({
          factorId: f.id,
        });
        if (unErr) {
          setError("Não foi possível desativar o 2FA.");
          return;
        }
      }
      await setTwoFactorAction(false);
      setEnabled(false);
      setNotice("Autenticação em dois fatores desativada.");
    });
  };

  return (
    <div className="py-md gap-md flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-body-md text-on-surface font-medium">
          Autenticação em dois fatores (2FA)
        </p>
        <p className="text-body-sm text-on-surface-variant">
          Camada extra de proteção via app autenticador (TOTP).
        </p>
        <p
          className={`text-label-sm mt-xs gap-xs flex items-center ${
            enabled ? "text-secondary" : "text-on-surface-variant"
          }`}
          role="status"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16 }}
            aria-hidden="true"
          >
            {enabled ? "verified_user" : "shield"}
          </span>
          {loading ? "Verificando…" : enabled ? "Ativo" : "Inativo"}
        </p>
        {notice && (
          <p
            role="status"
            className="text-body-sm text-on-surface-variant mt-xs"
          >
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="text-body-sm text-error mt-xs">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={enabled ? disable : startEnroll}
        disabled={isPending || loading}
        className={`px-md text-label-md rounded-lg border py-2 disabled:opacity-60 ${
          enabled
            ? "border-error text-error hover:bg-error-container"
            : "border-outline-variant text-on-surface hover:bg-surface-container"
        }`}
      >
        {isPending ? "Processando…" : enabled ? "Desativar" : "Ativar 2FA"}
      </button>

      {enrollDialog && (
        <EnrollDialog
          enroll={enrollDialog}
          onClose={() => setEnrollDialog(null)}
          onVerified={async () => {
            setEnrollDialog(null);
            await setTwoFactorAction(true);
            setEnabled(true);
            setNotice("Autenticação em dois fatores ativada.");
            void refresh();
          }}
        />
      )}
    </div>
  );
}

/**
 * Diálogo de enroll TOTP (F-39 CA06): mostra o QR + segredo, recebe o código do
 * app e verifica via `mfa.challenge` + `mfa.verify`. A11y: foco inicial no
 * input, Esc fecha, foco preso, QR com descrição textual, código com label e
 * aria-invalid + erro associado.
 */
function EnrollDialog({
  enroll,
  onClose,
  onVerified,
}: {
  enroll: EnrollData;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const secretId = useId();
  const errorId = useId();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const verify = () => {
    if (!isTotpCodeComplete(code)) {
      setError("Digite o código de 6 dígitos do app.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
      if (challengeError || !challenge) {
        setError("Não foi possível iniciar a verificação. Tente novamente.");
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) {
        setError("Código incorreto ou expirado. Gere um novo no app e tente.");
        return;
      }
      onVerified();
    });
  };

  const showError = Boolean(error);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex max-h-[90vh] w-full max-w-[28rem] flex-col overflow-y-auto rounded-t-xl border shadow-lg sm:rounded-xl"
      >
        <div className="flex items-start justify-between">
          <h3 id={titleId} className="text-headline-sm text-on-surface">
            Ativar 2FA
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <ol className="text-body-sm text-on-surface-variant gap-xs flex list-decimal flex-col pl-5">
          <li>
            Abra seu app autenticador (Google Authenticator, Authy, 1Password…).
          </li>
          <li>Escaneie o QR Code abaixo ou digite o segredo manualmente.</li>
          <li>Informe o código de 6 dígitos gerado pelo app.</li>
        </ol>

        <div className="gap-sm flex flex-col items-center">
          {/* QR é um data-URL gerado pela Supabase (não um asset) — next/image
              não se aplica; <img> com width/height fixos evita CLS. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enroll.qrCode}
            alt="QR Code para configurar a autenticação em dois fatores no seu app autenticador"
            width={180}
            height={180}
            className="border-outline-variant rounded-lg border bg-white p-2"
          />
          <div className="text-center">
            <p className="text-label-sm text-on-surface-variant">
              Ou informe este segredo manualmente:
            </p>
            <code
              id={secretId}
              className="text-body-sm text-on-surface bg-surface-container px-sm rounded py-1 tracking-widest select-all"
            >
              {enroll.secret}
            </code>
          </div>
        </div>

        <div className="gap-xs flex flex-col">
          <label
            htmlFor={`${titleId}-code`}
            className="text-label-sm text-on-surface"
          >
            Código de verificação
          </label>
          <input
            id={`${titleId}-code`}
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(normalizeTotpCode(e.target.value))}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : secretId}
            placeholder="000000"
            className={`border-outline-variant bg-surface text-on-surface focus:ring-primary text-headline-sm px-md w-full rounded-lg border py-2 text-center tracking-[0.5em] outline-none focus:ring-2 ${
              showError ? "border-error ring-error ring-1" : ""
            }`}
          />
          {showError && (
            <span
              id={errorId}
              role="alert"
              className="text-label-sm text-error"
            >
              {error}
            </span>
          )}
        </div>

        <div className="gap-sm mt-sm flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container-high text-label-md rounded-lg border py-2 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={verify}
            disabled={isPending || !isTotpCodeComplete(code)}
            className="px-md bg-primary text-on-primary hover:bg-surface-tint text-label-md rounded-lg py-2 disabled:opacity-60"
          >
            {isPending ? "Verificando…" : "Verificar e ativar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── Diálogo de troca de senha ─────────────────────────

/**
 * Diálogo de troca de senha (F-39 CA01-04) migrado para RHF + zodResolver. O
 * `passwordChangeSchema` (compartilhado com a Server Action) valida força (CA02)
 * e confirmação cross-field (CA03) no client; o submit chama `changePasswordAction`
 * em `startTransition`, que revalida com o MESMO schema e reautentica a senha
 * atual (CA04). A11y: foco inicial, Esc fecha, foco preso, FormMessage por campo.
 */
function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const form = useForm<PasswordChangeFormInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    form.setFocus("currentPassword");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, form]);

  const onSubmit = (values: PasswordChangeFormInput) => {
    setFormError(null);
    startTransition(async () => {
      const res: ActionResult = await changePasswordAction(values);
      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) {
          for (const [field, message] of Object.entries(res.fieldErrors)) {
            form.setError(field as keyof PasswordChangeFormInput, { message });
          }
        }
        return;
      }
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex max-h-[90vh] w-full max-w-[28rem] flex-col overflow-y-auto rounded-t-xl border shadow-lg sm:rounded-xl"
      >
        <div className="flex items-start justify-between">
          <h3 id={titleId} className="text-headline-sm text-on-surface">
            Alterar senha
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="gap-md flex flex-col"
            noValidate
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      className="py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo de 8 caracteres, com letra e número.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="gap-sm mt-sm flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Salvando…" : "Alterar senha"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
