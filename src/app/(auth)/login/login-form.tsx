"use client";

/**
 * Formulário de login (F-01) migrado para React Hook Form + zodResolver. O
 * `loginSchema` (compartilhado com a Server Action) valida no client para UX
 * imediata; no submit chamamos a MESMA `loginAction` dentro de `startTransition`,
 * preservando o redirect e os erros vindos do servidor (credenciais/conta
 * inativa). a11y mantida: erros de campo via FormMessage (aria-invalid +
 * aria-describedby), erro do servidor com role="alert".
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { z } from "zod";
import { loginSchema, type LoginInput } from "@/schemas/auth";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.input<typeof loginSchema>, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      // Mantém a Server Action existente: em sucesso ela redireciona (a Promise
      // não resolve com retorno); em falha devolve `{ error }`.
      const res = await loginAction({ error: null }, toFormData(values));
      if (res?.error) setServerError(res.error);
    });
  };

  return (
    <div className="gap-xl flex w-full max-w-[420px] flex-col">
      <header className="gap-sm flex flex-col">
        <div className="text-primary mb-xs gap-xs flex items-center">
          <span className="material-symbols-outlined" aria-hidden="true">
            school
          </span>
          <span className="text-label-md tracking-widest uppercase">
            Instituto Federal da Paraíba
          </span>
        </div>
        <h1 className="text-headline-lg text-on-surface">SIRA</h1>
        <p className="text-body-md text-on-surface-variant">
          Sistema de Reserva de Salas · Acesse sua conta.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="gap-lg flex flex-col"
          noValidate
        >
          <div className="gap-md flex flex-col">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail institucional</FormLabel>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined text-on-surface-variant left-md absolute top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    >
                      mail
                    </span>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username"
                        placeholder="usuario@ifpb.edu.br"
                        className="pr-md pl-[48px]"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>Use seu e-mail @ifpb.edu.br</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined text-on-surface-variant left-md absolute top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    >
                      lock
                    </span>
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-[48px] pl-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="touch-target text-on-surface-variant hover:text-primary hover:bg-surface-container absolute top-1/2 right-2 -translate-y-1/2 rounded-full transition-colors"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      aria-pressed={showPassword}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-error-container text-on-error-container gap-sm p-md flex items-start rounded-lg"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  error
                </span>
                <span className="text-body-sm">{serverError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="group gap-sm flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="border-outline-variant text-primary focus:ring-primary h-5 w-5 cursor-pointer rounded transition-all"
                {...form.register("remember")}
              />
              <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                Lembrar-me
              </span>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-sm w-full py-3"
          >
            <span>{isPending ? "Entrando…" : "Entrar"}</span>
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </Button>
        </form>
      </Form>

      <footer className="text-center">
        <p className="text-body-sm text-on-surface-variant">
          Não possui acesso?{" "}
          <Link
            href="/cadastro"
            className="text-primary font-medium hover:underline"
          >
            Solicitar cadastro
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

/** Converte os valores validados num FormData p/ a Server Action existente. */
function toFormData(values: LoginInput): FormData {
  const fd = new FormData();
  fd.set("email", values.email);
  fd.set("password", values.password);
  if (values.remember) fd.set("remember", "on");
  return fd;
}
