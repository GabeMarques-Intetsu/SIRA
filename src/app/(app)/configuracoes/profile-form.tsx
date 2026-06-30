"use client";

/**
 * Seção Perfil (F-37) migrada para React Hook Form + zodResolver. O
 * `profileSchema` (compartilhado com a Server Action) valida no client; "Salvar"
 * só persiste ao confirmar (CA05) chamando `updateProfileAction` em
 * `startTransition`; "Cancelar" restaura os valores originais (CA06). Avatar com
 * iniciais como fallback (CA08). E-mail BLOQUEADO (CA02).
 *
 * A11y (WCAG 2.2 AA): <fieldset>/<legend>, labels associadas, erros de campo via
 * FormMessage (aria-invalid + aria-describedby), feedback via role="status"/"alert".
 */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { z } from "zod";
import { initials, type Profile } from "@/lib/preferences";
import { profileSchema, type ProfileFormInput } from "@/schemas/profile";
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
import { updateProfileAction } from "./actions";

interface Props {
  profile: Profile;
}

export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const defaults: ProfileFormInput = {
    fullName: profile.full_name,
    department: profile.department ?? "",
    phone: profile.phone ?? "",
  };
  const form = useForm<
    z.input<typeof profileSchema>,
    unknown,
    ProfileFormInput
  >({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  const watchedName = useWatch({ control: form.control, name: "fullName" });

  const handleReset = () => {
    // CA06 — descarta alterações não salvas.
    form.reset(defaults);
    setFormError(null);
    setSaved(false);
  };

  const onSubmit = (values: ProfileFormInput) => {
    setFormError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfileAction({
        fullName: values.fullName,
        department: values.department ?? "",
        phone: values.phone ?? "",
      });
      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) {
          for (const [field, message] of Object.entries(res.fieldErrors)) {
            form.setError(field as keyof ProfileFormInput, { message });
          }
        }
        return;
      }
      setSaved(true); // CA05 — confirmação clara de salvo
      form.reset(values); // novo baseline (limpa "dirty")
      router.refresh();
    });
  };

  // CA09 — valida tipo/tamanho da foto; sem storage configurado, é só feedback.
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoNotice("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoNotice("A imagem deve ter no máximo 2 MB.");
      return;
    }
    setPhotoNotice(
      "Upload de foto ainda não disponível (storage não configurado).",
    );
  };

  const dirty = form.formState.isDirty;

  return (
    <section
      id="perfil"
      aria-labelledby="perfil-h"
      className="bg-surface-container-lowest border-outline-variant p-md md:p-lg scroll-mt-24 rounded-xl border shadow-sm"
    >
      <h2 id="perfil-h" className="text-headline-sm text-on-surface mb-md">
        Perfil
      </h2>

      <div className="gap-md mb-lg pb-lg border-outline-variant flex flex-col items-start border-b sm:flex-row sm:items-center">
        <div
          className="bg-primary text-on-primary text-headline-md flex h-20 w-20 items-center justify-center rounded-full font-bold"
          aria-hidden="true"
        >
          {initials(watchedName || profile.full_name)}
        </div>
        <div className="flex-1">
          <p className="text-body-md text-on-surface font-medium">
            {watchedName || profile.full_name}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {profile.role === "admin" ? "Administrador" : "Professor"}
            {profile.department ? ` · ${profile.department}` : ""}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {profile.email}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            photo_camera
          </span>
          Alterar foto
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Selecionar foto de perfil"
          onChange={handlePhoto}
        />
      </div>

      {photoNotice && (
        <p role="status" className="text-body-sm text-on-surface-variant mb-md">
          {photoNotice}
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <fieldset className="gap-md grid grid-cols-1 border-0 p-0 md:grid-cols-2">
            <legend className="sr-only">Dados pessoais</legend>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-mail bloqueado (F-37 CA02) — fora do RHF (imutável). */}
            <div className="gap-xs flex flex-col">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                readOnly
                disabled
                aria-disabled="true"
                aria-describedby="profile-email-hint"
                className="bg-surface-container text-on-surface-variant cursor-not-allowed"
              />
              <p
                id="profile-email-hint"
                className="text-body-sm text-on-surface-variant"
              >
                E-mail institucional não pode ser alterado.
              </p>
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(83) 99999-9999"
                      autoComplete="tel"
                      {...field}
                    />
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
                    <Input placeholder="Ex.: DTSI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          {saved && (
            <p
              role="status"
              className="text-body-sm text-on-secondary-container bg-secondary-container px-md mt-md gap-xs flex items-center rounded-lg py-2"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              >
                check_circle
              </span>
              Alterações salvas.
            </p>
          )}

          {formError && (
            <p
              role="alert"
              className="text-body-sm text-on-error-container bg-error-container px-md mt-md gap-xs flex items-center rounded-lg py-2"
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

          <div className="mt-md gap-sm flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending || !dirty}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !dirty}>
              {isPending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
