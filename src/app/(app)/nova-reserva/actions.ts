"use server";

/**
 * Server Actions da Nova Reserva (F-14 / RF-006). Toda a leitura de
 * disponibilidade e a criação acontecem no servidor (RLS-safe): NUNCA
 * consultamos reservas de terceiros direto — usamos as RPCs
 * `search_available_*` (que já filtram conflito + recursos + ativo) e
 * `check_resource_availability` (re-checagem anti-corrida na confirmação).
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Tables, Enums } from "@/lib/supabase/database.types";
import {
  expandReservationDates,
  validateSlot,
  type RecurrenceType,
  type ResourceKind,
} from "@/lib/reservation";
import { holdExpiry } from "@/lib/holds";

export type RoomResult = Tables<"rooms">;
export type EquipmentResult = Tables<"equipment">;

export interface SearchInput {
  kind: ResourceKind;
  date: string;
  start: string;
  end: string;
  /** Tipo de sala (sala/laboratorio/auditorio) ou de equipamento (string livre). */
  resourceType?: string;
  /** Recursos exigidos em AND (apenas para salas — CA07). */
  resources?: string[];
}

export interface SearchResult {
  rooms: RoomResult[];
  equipment: EquipmentResult[];
  error: string | null;
}

/**
 * Passo "Escolher" (CA04/CA05/CA06/CA07/CA08/CA09/CA10/CA16): retorna apenas
 * recursos do tipo escolhido, disponíveis no horário e ativos, ordenados por
 * capacidade (salas). As RPCs aplicam a regra de conflito no banco.
 */
export async function searchResourcesAction(
  input: SearchInput,
): Promise<SearchResult> {
  await requireProfile();

  // Revalida o slot no servidor (defesa em profundidade — CA02/CA03).
  const slotError = validateSlot({
    date: input.date,
    start: input.start,
    end: input.end,
  });
  if (slotError) {
    return { rooms: [], equipment: [], error: "Período inválido." };
  }

  const supabase = await createClient();

  if (input.kind === "equipment") {
    const { data, error } = await supabase.rpc("search_available_equipment", {
      p_date: input.date,
      p_start: input.start,
      p_end: input.end,
      p_type: input.resourceType || null,
    });
    return {
      rooms: [],
      equipment: error ? [] : (data ?? []),
      error: error ? "Não foi possível buscar os equipamentos." : null,
    };
  }

  const roomType = (input.resourceType || null) as Enums<"room_type"> | null;
  const { data, error } = await supabase.rpc("search_available_rooms", {
    p_date: input.date,
    p_start: input.start,
    p_end: input.end,
    p_type: roomType,
    p_resources: input.resources ?? [],
  });
  return {
    rooms: error ? [] : (data ?? []),
    equipment: [],
    error: error ? "Não foi possível buscar as salas." : null,
  };
}

/**
 * Reserva temporária (hold) — F-49 / RF-006 / ADR-009.
 *
 * Um hold NÃO é uma reserva: bloqueia o recurso/slot apenas para os DEMAIS
 * usuários (a RPC ignora o próprio `auth.uid()`) e expira sozinho pelo TTL
 * (`expires_at > now()` na checagem). O `user_id` é fixado por RLS/DEFAULT no
 * banco como `auth.uid()`, então não o enviamos no Insert.
 */
export interface HoldInput {
  kind: ResourceKind;
  resourceId: string;
  /**
   * Data(s) cobertas pelo hold. Em reservas recorrentes, uma entrada por
   * data expandida — assim o bloqueio cobre todo o conjunto que será enviado.
   */
  dates: string[];
  start: string;
  end: string;
}

export interface HoldResult {
  ok: boolean;
  error: string | null;
}

/**
 * Cria (ou renova) o hold do solicitante ao escolher um recurso e avançar para
 * a confirmação. Insere uma linha por data com `expires_at = now() + 10 min`.
 * Para evitar acumular holds duplicados ao revisitar o passo, primeiro remove
 * os holds próprios do mesmo recurso/slot e então reinsere com TTL renovado.
 */
export async function createHoldAction(input: HoldInput): Promise<HoldResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!input.resourceId) {
    return { ok: false, error: "Selecione um recurso." };
  }

  const slotError = validateSlot({
    date: input.dates[0] ?? "",
    start: input.start,
    end: input.end,
  });
  if (slotError) {
    return { ok: false, error: "Período inválido." };
  }

  const isRoom = input.kind === "room";
  const expiresAt = holdExpiry();

  // Renovação idempotente: limpa os holds próprios deste recurso/slot/datas
  // antes de reinserir (evita linhas órfãs ao voltar e avançar de novo).
  await deleteOwnHolds(supabase, profile.id, input, isRoom);

  const rows = input.dates.map((date) => ({
    user_id: profile.id,
    resource_kind: input.kind,
    room_id: isRoom ? input.resourceId : null,
    equipment_id: isRoom ? null : input.resourceId,
    reservation_date: date,
    start_time: input.start,
    end_time: input.end,
    expires_at: expiresAt,
  }));

  const { error } = await supabase.from("reservation_holds").insert(rows);
  if (error) {
    return { ok: false, error: "Não foi possível reservar o recurso." };
  }
  return { ok: true, error: null };
}

/**
 * Libera explicitamente o hold do solicitante (voltar/cancelar a confirmação
 * sem enviar). Não espera o TTL para não segurar o recurso 10 min à toa.
 * Idempotente: nenhum erro se já não houver hold.
 */
export async function releaseHoldAction(input: HoldInput): Promise<HoldResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!input.resourceId || input.dates.length === 0) {
    return { ok: true, error: null };
  }

  const isRoom = input.kind === "room";
  const { error } = await deleteOwnHolds(supabase, profile.id, input, isRoom);
  if (error) {
    return { ok: false, error: "Não foi possível liberar o recurso." };
  }
  return { ok: true, error: null };
}

/**
 * Apaga os holds do PRÓPRIO usuário para o recurso/slot/datas informados.
 * RLS já restringe a `auth.uid()`; filtrar por `user_id` é defesa em
 * profundidade e idempotência (não toca holds de terceiros).
 */
async function deleteOwnHolds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: HoldInput,
  isRoom: boolean,
) {
  return supabase
    .from("reservation_holds")
    .delete()
    .eq("user_id", userId)
    .eq("resource_kind", input.kind)
    .eq(isRoom ? "room_id" : "equipment_id", input.resourceId)
    .eq("start_time", input.start)
    .eq("end_time", input.end)
    .in("reservation_date", input.dates);
}

export interface CreateInput {
  kind: ResourceKind;
  resourceId: string;
  start: string;
  end: string;
  purpose: string;
  recurrence: {
    type: RecurrenceType;
    startDate: string;
    count?: number;
    weekdays?: number[];
  };
}

export interface CreateResult {
  ok: boolean;
  /** Quantidade de ocorrências efetivamente criadas. */
  created: number;
  /** Datas (ISO) que colidiram e foram puladas (CA18). */
  conflicts: string[];
  error: string | null;
}

/**
 * Passo "Confirmar": para CADA data expandida pela recorrência, re-checa
 * `check_resource_availability` (evita corrida com outra reserva criada entre
 * a busca e a confirmação) e, se livre, insere a reserva como `pending`.
 * Ocorrências em conflito são puladas e reportadas (CA18). NÃO inserimos em
 * `approval_events` — o trigger 0005 registra 'submitted' automaticamente.
 */
export async function createReservationAction(
  input: CreateInput,
): Promise<CreateResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const slotError = validateSlot({
    date: input.recurrence.startDate,
    start: input.start,
    end: input.end,
  });
  if (slotError) {
    return { ok: false, created: 0, conflicts: [], error: "Período inválido." };
  }
  if (!input.resourceId) {
    return {
      ok: false,
      created: 0,
      conflicts: [],
      error: "Selecione um recurso.",
    };
  }

  const dates = expandReservationDates(input.recurrence);
  if (dates.length === 0) {
    return {
      ok: false,
      created: 0,
      conflicts: [],
      error: "Nenhuma data válida para a recorrência.",
    };
  }

  const isRoom = input.kind === "room";
  const recurrenceGroupId =
    input.recurrence.type === "none" ? null : randomUUID();

  const conflicts: string[] = [];
  let created = 0;

  for (const date of dates) {
    // Re-checagem anti-corrida (CA04/CA05/CA09 reaplicados no commit).
    const { data: available, error: checkError } = await supabase.rpc(
      "check_resource_availability",
      {
        p_resource_kind: input.kind,
        p_room_id: isRoom ? input.resourceId : null,
        p_equipment_id: isRoom ? null : input.resourceId,
        p_date: date,
        p_start: input.start,
        p_end: input.end,
        p_exclude_reservation: null,
      },
    );

    if (checkError || !available) {
      conflicts.push(date);
      continue;
    }

    const { error: insertError } = await supabase.from("reservations").insert({
      user_id: profile.id,
      resource_kind: input.kind,
      room_id: isRoom ? input.resourceId : null,
      equipment_id: isRoom ? null : input.resourceId,
      reservation_date: date,
      start_time: input.start,
      end_time: input.end,
      purpose: input.purpose.trim() || null,
      recurrence_group_id: recurrenceGroupId,
      recurrence_type: input.recurrence.type,
      status: "pending",
    });

    if (insertError) {
      conflicts.push(date);
      continue;
    }
    created += 1;
  }

  // Transferência hold → reserva: agora quem bloqueia é a reserva `pending`,
  // então removemos os holds próprios deste recurso/slot para TODAS as datas
  // expandidas (criadas e em conflito) — sequência segura: cria depois remove.
  // Falha aqui não invalida a reserva já criada; o hold remanescente expira
  // pelo TTL de qualquer forma (`expires_at > now()`).
  await deleteOwnHolds(
    supabase,
    profile.id,
    { kind: input.kind, resourceId: input.resourceId, dates, start: input.start, end: input.end },
    isRoom,
  );

  if (created === 0) {
    return {
      ok: false,
      created: 0,
      conflicts,
      error:
        "O recurso já está ocupado em todas as datas escolhidas. Ajuste o horário ou as datas.",
    };
  }

  return { ok: true, created, conflicts, error: null };
}
