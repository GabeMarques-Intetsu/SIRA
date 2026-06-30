"use client";

/**
 * Diálogo de edição de usuário (F-30) migrado para React Hook Form + zodResolver.
 * Permite alterar nome, perfil, departamento, matrícula, telefone e (opcional)
 * redefinir senha. O e-mail aparece BLOQUEADO (F-30 CA04).
 *
 * Validação compartilhada: usa o MESMO `userSchema` que `updateUserAction`
 * revalida com `safeParse` — DRY client+servidor. Erros de campo via FormMessage;
 * `fieldErrors` do servidor reinjetados via `form.setError`. Pending via
 * `useTransition`.
 *
 * Acessibilidade (WCAG 2.2 AA): role="dialog" + aria-modal, foco inicial no 1º
 * campo, Esc fecha, foco preso entre focáveis, labels associadas, erros com
 * `aria-invalid` + `aria-describedby` (cabeados pelo form.tsx).
 */
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { roleLabel, type Profile, type UserRole } from "@/lib/users";
import { userSchema, type UserFormInput } from "@/schemas/user";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateUserAction, type ActionResult } from "./actions";

interface Props {
  user: Profile;
  onClose: () => void;
}

const ROLE_OPTIONS: UserRole[] = ["professor", "admin"];

const SELECT_CLASS =
  "border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md px-md w-full rounded-lg border py-2 outline-none focus:ring-2 aria-[invalid=true]:border-error aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-error";

export function UserForm({ user, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const form = useForm<z.input<typeof userSchema>, unknown, UserFormInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: user.full_name,
      role: user.role,
      department: user.department ?? "",
      siapeMatricula: user.siape_matricula ?? "",
      phone: user.phone ?? "",
      password: "",
    },
  });

  useEffect(() => {
    form.setFocus("fullName");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
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

  const onSubmit = (values: UserFormInput) => {
    setFormError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await updateUserAction(user.id, {
        fullName: values.fullName,
        role: values.role,
        department: values.department ?? "",
        siapeMatricula: values.siapeMatricula ?? "",
        phone: values.phone ?? "",
        password: values.password ? values.password : null,
      });
      finish(res);
    });
  };

  const finish = (res: ActionResult) => {
    if (!res.ok) {
      setFormError(res.error);
      if (res.fieldErrors) {
        for (const [field, message] of Object.entries(res.fieldErrors)) {
          form.setError(field as keyof UserFormInput, { message });
        }
      }
      return;
    }
    // Ações podem voltar `ok: true` com aviso (ex.: senha não trocada). Nesse
    // caso mostramos o aviso e mantemos o diálogo aberto; senão, fechamos.
    if (res.error) {
      setNotice(res.error);
      form.setValue("password", "");
      router.refresh();
      return;
    }
    onClose();
    router.refresh();
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
        className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex max-h-[90vh] w-full max-w-[34rem] flex-col overflow-y-auto rounded-t-xl border shadow-lg sm:rounded-xl"
      >
        <div className="flex items-start justify-between">
          <h2 id={titleId} className="text-headline-sm text-on-surface">
            Editar usuário
          </h2>
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input className="py-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-mail bloqueado (F-30 CA04) — fora do RHF (imutável). */}
            <div className="gap-xs flex flex-col">
              <Label htmlFor={`${titleId}-email`}>E-mail (não editável)</Label>
              <Input
                id={`${titleId}-email`}
                type="email"
                value={user.email}
                readOnly
                disabled
                aria-disabled="true"
                className="bg-surface-container text-on-surface-variant cursor-not-allowed py-2"
              />
            </div>

            <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <select className={SELECT_CLASS} {...field}>
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: DTSI"
                        className="py-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="siapeMatricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIAPE / Matrícula</FormLabel>
                    <FormControl>
                      <Input className="py-2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input type="tel" className="py-2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redefinir senha (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Deixe em branco para manter a atual"
                      className="py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {notice && (
              <p
                role="status"
                className="text-body-sm text-on-surface bg-surface-container px-md gap-xs flex items-start rounded-lg py-2"
              >
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  style={{ fontSize: 18 }}
                  aria-hidden="true"
                >
                  info
                </span>
                {notice}
              </p>
            )}

            {formError && (
              <p
                role="alert"
                className="text-body-sm text-on-error-container bg-error-container px-md gap-xs flex items-start rounded-lg py-2"
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
                {isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
