"use client";

/**
 * Formulário de solicitação de cadastro (F-03) migrado para React Hook Form +
 * zodResolver. O `signupSchema` (compartilhado com a Server Action) valida no
 * client; no submit chamamos a MESMA `signupAction` em `startTransition`,
 * preservando o estado de sucesso e os erros do servidor (e-mail já cadastrado/
 * solicitação pendente). a11y: FormMessage por campo + role="alert"/role="status".
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { z } from "zod";
import { signupSchema, type SignupInput } from "@/schemas/auth";
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
import { signupAction } from "./actions";

const INPUT_CLASS =
  "border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-primary text-body-md px-md w-full rounded-lg border py-3 shadow-sm outline-none transition-all focus:ring-2";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.input<typeof signupSchema>, unknown, SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: "",
      email: "",
      matricula: "",
      perfil: "professor",
      departamento: "",
      motivo: "",
      termos: false as unknown as true,
    },
  });

  const onSubmit = (values: SignupInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await signupAction(
        { error: null, success: false },
        toFormData(values),
      );
      if (res.success) setSuccess(true);
      else if (res.error) setServerError(res.error);
    });
  };

  if (success) {
    return (
      <div className="gap-lg flex w-full max-w-[560px] flex-col">
        <div
          role="status"
          aria-live="polite"
          className="bg-secondary-container text-on-secondary-container gap-md p-lg flex items-start rounded-xl"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            check_circle
          </span>
          <div className="gap-xs flex flex-col">
            <h1 className="text-headline-sm">Solicitação enviada</h1>
            <p className="text-body-md">
              Seu pedido foi registrado e está aguardando aprovação do
              administrador. Você será avisado por e-mail quando for liberado.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="text-primary text-label-md gap-xs inline-flex items-center hover:underline"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            arrow_back
          </span>
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="gap-xl flex w-full max-w-[560px] flex-col">
      <header className="gap-sm flex flex-col">
        <Link
          href="/login"
          className="text-primary text-label-md gap-xs inline-flex w-fit items-center hover:underline"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            arrow_back
          </span>
          Voltar ao login
        </Link>
        <h1 className="text-headline-lg text-on-surface mt-sm">
          Solicitar acesso
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Preencha seus dados. O administrador será notificado.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="gap-lg flex flex-col"
          noValidate
        >
          <div className="gap-md grid grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="Maria da Silva"
                      className={INPUT_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>E-mail institucional *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="maria.silva@ifpb.edu.br"
                      className={INPUT_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Use seu e-mail @ifpb.edu.br</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matricula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula / SIAPE</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="20231234567"
                      className={INPUT_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil *</FormLabel>
                  <FormControl>
                    <select className={INPUT_CLASS} {...field}>
                      <option value="professor">Professor</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departamento"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Departamento / Coordenação</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex.: DTSI · Coordenação de Informática"
                      className={INPUT_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Motivo do acesso (opcional)</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      placeholder="Descreva brevemente como pretende usar o sistema."
                      className={`${INPUT_CLASS} resize-none`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <FormField
            control={form.control}
            name="termos"
            render={({ field }) => (
              <FormItem>
                <Label className="gap-sm flex cursor-pointer items-start">
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="border-outline-variant text-primary focus:ring-primary mt-0.5 h-5 w-5 cursor-pointer rounded transition-all"
                  />
                  <span className="text-body-sm text-on-surface-variant">
                    Aceito os termos de uso e a política de privacidade do
                    SIRA-IFPB.
                  </span>
                </Label>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="gap-md flex flex-col-reverse sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/login">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              <span>{isPending ? "Enviando…" : "Enviar solicitação"}</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                send
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

/** Converte os valores validados num FormData p/ a Server Action existente. */
function toFormData(values: SignupInput): FormData {
  const fd = new FormData();
  fd.set("nome", values.nome);
  fd.set("email", values.email);
  fd.set("matricula", values.matricula ?? "");
  fd.set("perfil", values.perfil);
  fd.set("departamento", values.departamento ?? "");
  fd.set("motivo", values.motivo ?? "");
  if (values.termos) fd.set("termos", "on");
  return fd;
}
