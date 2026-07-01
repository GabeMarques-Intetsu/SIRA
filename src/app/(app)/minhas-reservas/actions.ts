"use server";

/**
 * Server Actions de "Minhas Reservas" (F-18 edição · F-19 cancelamento ·
 * RF-007). RLS-safe: o UPDATE só atinge a própria reserva pendente porque a
 * política de `reservations` restringe ao dono; ainda assim revalidamos o
 * status no servidor (defesa em profundidade) antes de gravar.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { validateSlot } from "@/lib/reservation";

export interface ActionResult {
  ok: boolean;
  error: string | null;
}

/**
 * Cancela uma reserva PRÓPRIA e PENDENTE (F-19 CA01/CA02/CA03/CA04). A
 * confirmação explícita (CA02) é exigida na UI antes de chamar esta action.
 * Não removemos a linha: mudamos para `cancelled` (CA03 libera o horário, pois
 * `check_resource_availability` ignora canceladas) e ela segue como histórico
 * (CA04). Reservas aprovadas/recusadas são barradas (CA01).
 */
export async function cancelReservationAction(
  reservationId: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!reservationId) return { ok: false, error: "Reserva inválida." };

  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("reservations")
    .select("id, status, user_id")
    .eq("id", reservationId)
    .single();

  if (readError || !current) {
    return { ok: false, error: "Reserva não encontrada." };
  }
  // CA01 — só própria e pendente (admin não cancela aqui; é fluxo do professor).
  if (current.user_id !== profile.id) {
    return { ok: false, error: "Você só pode cancelar as próprias reservas." };
  }
  if (current.status !== "pending") {
    return {
      ok: false,
      error: "Só é possível cancelar reservas ainda pendentes.",
    };
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId)
    .eq("status", "pending"); // guarda anti-corrida

  if (updateError) {
    return { ok: false, error: "Não foi possível cancelar a reserva." };
  }

  revalidatePath("/minhas-reservas");
  revalidatePath(`/minhas-reservas/${reservationId}`);
  return { ok: true, error: null };
}

export interface EditInput {
  reservationId: string;
  /** Nova data `YYYY-MM-DD`. */
  date: string;
  /** Novo início `HH:MM`. */
  start: string;
  /** Novo fim `HH:MM`. */
  end: string;
  /** Nova sala (apenas reservas de sala podem trocar de recurso). */
  roomId?: string | null;
}

/**
 * Edita uma reserva PRÓPRIA e PENDENTE (F-18 CA01/CA02/CA03/CA04). Revalida o
 * slot, RE-CHECA conflito via `check_resource_availability` excluindo a própria
 * reserva (CA04) e só então grava. Aprovadas/recusadas são bloqueadas (CA01/CA03).
 */
export async function editReservationAction(
  input: EditInput,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!input.reservationId) return { ok: false, error: "Reserva inválida." };

  const slotError = validateSlot({
    date: input.date,
    start: input.start,
    end: input.end,
  });
  if (slotError) return { ok: false, error: "Período inválido." };

  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("reservations")
    .select("id, status, user_id, resource_kind, room_id, equipment_id")
    .eq("id", input.reservationId)
    .single();

  if (readError || !current) {
    return { ok: false, error: "Reserva não encontrada." };
  }
  if (current.user_id !== profile.id) {
    return { ok: false, error: "Você só pode editar as próprias reservas." };
  }
  // CA01/CA03 — somente pendentes; aprovada/recusada fica read-only.
  if (current.status !== "pending") {
    return {
      ok: false,
      error: "Só é possível editar reservas ainda pendentes.",
    };
  }

  const isRoom = current.resource_kind === "room";
  const nextRoomId = isRoom ? (input.roomId ?? current.room_id) : null;
  const nextEquipmentId = isRoom ? null : current.equipment_id;

  // CA04 — re-checa conflito do NOVO horário, excluindo a própria reserva.
  const { data: available, error: checkError } = await supabase.rpc(
    "check_resource_availability",
    {
      p_resource_kind: current.resource_kind,
      p_room_id: nextRoomId,
      p_equipment_id: nextEquipmentId,
      p_date: input.date,
      p_start: input.start,
      p_end: input.end,
      p_exclude_reservation: input.reservationId,
    },
  );

  if (checkError) {
    return { ok: false, error: "Não foi possível validar o horário." };
  }
  if (!available) {
    return {
      ok: false,
      error: "O novo horário está em conflito com outra reserva.",
    };
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update({
      reservation_date: input.date,
      start_time: input.start,
      end_time: input.end,
      room_id: nextRoomId,
    })
    .eq("id", input.reservationId)
    .eq("status", "pending");

  if (updateError) {
    return { ok: false, error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/minhas-reservas");
  revalidatePath(`/minhas-reservas/${input.reservationId}`);
  return { ok: true, error: null };
}

/** Salas ativas para o seletor de edição (F-18 CA02). */
export async function listActiveRoomsAction(): Promise<
  { id: string; name: string; block: string | null }[]
> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, block")
    .eq("status", "active")
    .order("name", { ascending: true });
  return error ? [] : (data ?? []);
}
