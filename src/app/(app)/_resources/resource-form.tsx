"use client";

/**
 * Diálogo de formulário de Recurso (criar/editar), compartilhado por Salas e
 * Equipamentos e parametrizado por `kind` (F-24/F-26 · F-43/F-45), migrado para
 * React Hook Form + zodResolver.
 *
 * Validação compartilhada: usa o MESMO schema (`roomSchema`/`equipmentSchema`)
 * que a Server Action revalida com `safeParse` — DRY client+servidor. Erros de
 * campo via FormMessage; erros só conhecidos no servidor (nome duplicado) são
 * reinjetados via `form.setError`. Pending via `useTransition`.
 *
 * Acessibilidade (WCAG 2.2 AA): role="dialog" + aria-modal, foco inicial no 1º
 * campo, Esc fecha, foco preso entre focáveis, labels associadas, erros com
 * `aria-invalid` + `aria-describedby` (cabeados pelo form.tsx). Alvo ≥44px.
 */
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  ROOM_TYPES,
  resourceImageUrl,
  roomTypeLabel,
  type Equipment,
  type ResourceKind,
  type Room,
} from "@/lib/resources";
import {
  equipmentSchema,
  IMAGE_ACCEPT,
  roomSchema,
  validateImageFile,
  type EquipmentFormInput,
  type RoomFormInput,
} from "@/schemas/resource";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createEquipmentAction,
  createRoomAction,
  updateEquipmentAction,
  updateRoomAction,
  type ResourceActionResult,
} from "./resource-actions";

interface RoomOption {
  id: string;
  name: string;
  block: string | null;
}

interface Props {
  kind: ResourceKind;
  /** null = criar; objeto = editar. */
  room?: Room | null;
  equipment?: Equipment | null;
  /** Salas p/ o select de vínculo do equipamento (F-43 CA02). */
  rooms?: RoomOption[];
  onClose: () => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "maintenance", label: "Em manutenção" },
];

export function ResourceForm({
  kind,
  room = null,
  equipment = null,
  rooms = [],
  onClose,
}: Props) {
  const isRoom = kind === "room";
  const editing = isRoom ? room : equipment;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Foco inicial + Esc + armadilha de foco (WCAG 2.1.2 / 2.4.3).
  useEffect(() => {
    const firstField = dialogRef.current?.querySelector<HTMLElement>(
      "input, select, textarea",
    );
    firstField?.focus();
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
  }, [onClose]);

  const heading = editing
    ? isRoom
      ? "Editar sala"
      : "Editar equipamento"
    : isRoom
      ? "Nova sala"
      : "Novo equipamento";

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
            {heading}
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

        {isRoom ? (
          <RoomFields
            room={room}
            statusOptions={STATUS_OPTIONS}
            onClose={onClose}
          />
        ) : (
          <EquipmentFields
            equipment={equipment}
            rooms={rooms}
            statusOptions={STATUS_OPTIONS}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────── Sala (F-24) ────────────────────────────────

function RoomFields({
  room,
  statusOptions,
  onClose,
}: {
  room: Room | null;
  statusOptions: { value: string; label: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [resourceDraft, setResourceDraft] = useState("");
  const image = useResourceImage(room?.image_path);

  const form = useForm<z.input<typeof roomSchema>, unknown, RoomFormInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name ?? "",
      type: (room?.type ?? "sala") as RoomFormInput["type"],
      capacity: room ? room.capacity : (undefined as unknown as number),
      block: room?.block ?? "",
      resources: Array.isArray(room?.resources)
        ? (room!.resources as unknown[]).filter(
            (r): r is string => typeof r === "string",
          )
        : [],
      status: (room?.status ?? "active") as RoomFormInput["status"],
    },
  });

  const resources =
    useWatch({ control: form.control, name: "resources" }) ?? [];

  const addResource = () => {
    const v = resourceDraft.trim();
    if (!v) return;
    if (!resources.some((r) => r.toLowerCase() === v.toLowerCase())) {
      form.setValue("resources", [...resources, v], { shouldDirty: true });
    }
    setResourceDraft("");
  };

  const onSubmit = (values: RoomFormInput) => {
    setFormError(null);
    startTransition(async () => {
      const payload = {
        name: values.name,
        type: values.type,
        capacity: values.capacity,
        block: values.block ?? "",
        resources: values.resources ?? [],
        status: values.status,
      };
      const imageForm = new FormData();
      image.appendTo(imageForm);
      const res = room
        ? await updateRoomAction(room.id, payload, imageForm)
        : await createRoomAction(payload, imageForm);
      finish(res, form, setFormError, onClose, router);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="gap-md flex flex-col"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input className="py-2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <select
                    className="border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md px-md aria-[invalid=true]:border-error aria-[invalid=true]:ring-error w-full rounded-lg border py-2 outline-none focus:ring-2 aria-[invalid=true]:ring-1"
                    {...field}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {roomTypeLabel(t)}
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    className="py-2"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="block"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localização (bloco)</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Bloco B" className="py-2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recursos como chips editáveis (F-24 CA02) */}
        <fieldset className="gap-xs flex flex-col">
          <legend className="text-label-sm text-on-surface mb-xs">
            Recursos disponíveis
          </legend>
          <div className="gap-sm flex">
            <Input
              type="text"
              value={resourceDraft}
              onChange={(e) => setResourceDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addResource();
                }
              }}
              placeholder="Ex.: Projetor"
              aria-label="Adicionar recurso"
              className="py-2"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addResource}
            >
              Adicionar
            </Button>
          </div>
          {resources.length > 0 && (
            <ul className="gap-xs mt-xs flex flex-wrap" aria-label="Recursos">
              {resources.map((r) => (
                <li
                  key={r}
                  className="gap-xs bg-surface-container text-on-surface text-label-sm flex items-center rounded-full py-1 pr-1 pl-3"
                >
                  {r}
                  <button
                    type="button"
                    onClick={() =>
                      form.setValue(
                        "resources",
                        resources.filter((x) => x !== r),
                        { shouldDirty: true },
                      )
                    }
                    className="touch-target hover:bg-surface-container-high flex items-center justify-center rounded-full"
                    aria-label={`Remover ${r}`}
                    style={{ minWidth: 28, minHeight: 28 }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16 }}
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <ImageField image={image} />

        <StatusField control={form.control} statusOptions={statusOptions} />
        <FormErrorBox message={formError} />
        <DialogActions
          isPending={isPending}
          editing={Boolean(room)}
          onClose={onClose}
        />
      </form>
    </Form>
  );
}

// ──────────────────────────── Equipamento (F-43) ────────────────────────────

function EquipmentFields({
  equipment,
  rooms,
  statusOptions,
  onClose,
}: {
  equipment: Equipment | null;
  rooms: RoomOption[];
  statusOptions: { value: string; label: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const image = useResourceImage(equipment?.image_path);

  const form = useForm<
    z.input<typeof equipmentSchema>,
    unknown,
    EquipmentFormInput
  >({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: equipment?.name ?? "",
      type: equipment?.type ?? "",
      block: equipment?.block ?? "",
      roomId: equipment?.room_id ?? null,
      status: (equipment?.status ?? "active") as EquipmentFormInput["status"],
    },
  });

  const onSubmit = (values: EquipmentFormInput) => {
    setFormError(null);
    startTransition(async () => {
      const payload = {
        name: values.name,
        type: values.type,
        block: values.block ?? "",
        roomId: values.roomId ?? null,
        status: values.status,
      };
      const imageForm = new FormData();
      image.appendTo(imageForm);
      const res = equipment
        ? await updateEquipmentAction(equipment.id, payload, imageForm)
        : await createEquipmentAction(payload, imageForm);
      finish(res, form, setFormError, onClose, router);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="gap-md flex flex-col"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input className="py-2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Projetor"
                  className="py-2"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="block"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bloco</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex.: Bloco A"
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
            name="roomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sala (opcional)</FormLabel>
                <FormControl>
                  <select
                    className="border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md px-md w-full rounded-lg border py-2 outline-none focus:ring-2"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  >
                    <option value="">— Sem sala —</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                        {r.block ? ` · ${r.block}` : ""}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ImageField image={image} />

        <StatusField control={form.control} statusOptions={statusOptions} />
        <FormErrorBox message={formError} />
        <DialogActions
          isPending={isPending}
          editing={Boolean(equipment)}
          onClose={onClose}
        />
      </form>
    </Form>
  );
}

// ─────────────────────────── Imagem do recurso (F-47/F-48) ──────────────────

interface ImageState {
  /** Arquivo novo escolhido nesta sessão (a enviar). */
  file: File | null;
  /** URL de preview (objectURL do novo arquivo, ou imagem atual ao editar). */
  previewUrl: string | null;
  /** Erro de validação client (tipo/tamanho) — acessível via aria. */
  error: string | null;
  /** Marca que a imagem atual deve ser removida no servidor. */
  removed: boolean;
}

/**
 * Gerencia a escolha/preview/remoção da imagem do recurso (F-47/F-48 ·
 * IMG01–IMG07). Valida tipo/tamanho no client (UX); o servidor revalida.
 * Revoga o objectURL ao trocar/desmontar para não vazar memória.
 */
export function useResourceImage(currentPath: string | null | undefined) {
  const initialUrl = currentPath ? resourceImageUrl(currentPath) : null;
  const [state, setState] = useState<ImageState>({
    file: null,
    previewUrl: initialUrl,
    error: null,
    removed: false,
  });
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const revokePreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const choose = (file: File | null) => {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      // IMG02/IMG03 — arquivo recusado, não anexa nem gera preview.
      setState((s) => ({ ...s, error }));
      return;
    }
    revokePreview();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setState({ file, previewUrl: url, error: null, removed: false });
  };

  const remove = () => {
    revokePreview();
    setState({ file: null, previewUrl: null, error: null, removed: true });
  };

  /** Anexa a intenção de imagem ao FormData enviado à Server Action. */
  const appendTo = (form: FormData) => {
    if (state.file) form.set("image", state.file);
    else if (state.removed) form.set("removeImage", "true");
  };

  return { state, choose, remove, appendTo };
}

export function ImageField({
  image,
}: {
  image: ReturnType<typeof useResourceImage>;
}) {
  const inputId = useId();
  const errorId = useId();
  const { state, choose, remove } = image;

  return (
    <div className="gap-xs flex flex-col">
      <label htmlFor={inputId} className="text-label-sm text-on-surface">
        Imagem (opcional)
      </label>

      {state.previewUrl ? (
        <div className="gap-sm flex items-center">
          <div className="border-outline-variant aspect-[16/9] w-32 overflow-hidden rounded-lg border">
            {/* Preview local/atual: objectURL ou URL pública do Storage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.previewUrl}
              alt="Pré-visualização da imagem do recurso"
              width={128}
              height={72}
              className="h-full w-full object-cover"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={remove}>
            Remover imagem
          </Button>
        </div>
      ) : null}

      <input
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT}
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? errorId : undefined}
        onChange={(e) => choose(e.target.files?.[0] ?? null)}
        className="text-body-sm text-on-surface-variant file:bg-secondary-container file:text-on-secondary-container file:mr-sm file:rounded-lg file:border-0 file:px-3 file:py-2"
      />
      <p className="text-label-sm text-on-surface-variant">
        JPG, PNG ou WebP · até 2 MB.
      </p>
      {state.error ? (
        <p id={errorId} role="alert" className="text-label-sm text-error">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

// ─────────────────────────── Helpers compartilhados ─────────────────────────

/** Campo de Estado (comum a sala e equipamento). */
function StatusField({
  control,
  statusOptions,
}: {
  // O `control` é genérico entre dois schemas distintos; `any` aqui é o ponto de
  // junção pragmático (o campo `status` existe em ambos com os mesmos valores).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  statusOptions: { value: string; label: string }[];
}) {
  return (
    <FormField
      control={control}
      name="status"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render={({ field }: { field: any }) => (
        <FormItem>
          <FormLabel>Estado</FormLabel>
          <FormControl>
            <select
              className="border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md px-md w-full rounded-lg border py-2 outline-none focus:ring-2"
              {...field}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
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
      {message}
    </p>
  );
}

function DialogActions({
  isPending,
  editing,
  onClose,
}: {
  isPending: boolean;
  editing: boolean;
  onClose: () => void;
}) {
  return (
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
        {isPending ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}
      </Button>
    </div>
  );
}

/**
 * Trata o retorno da Server Action: erro de campo (nome duplicado) reinjetado no
 * RHF; sucesso fecha o diálogo e revalida a rota.
 */
function finish(
  res: ResourceActionResult,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: { setError: (name: any, error: { message: string }) => void },
  setFormError: (v: string | null) => void,
  onClose: () => void,
  router: ReturnType<typeof useRouter>,
) {
  if (!res.ok) {
    setFormError(res.error);
    if (res.fieldErrors) {
      for (const [field, message] of Object.entries(res.fieldErrors)) {
        form.setError(field, { message });
      }
    }
    return;
  }
  onClose();
  router.refresh();
}

export type { RoomOption };
