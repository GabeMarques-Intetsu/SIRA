"use server";

/**
 * Server Actions da Fila de Aprovações (F-22 aprovação · F-23 recusa · RF-008).
 *
 * Segurança e idempotência (regras de F-21 CA01 / F-22 CA01 / F-23 CA01):
 * - `requireAdmin()` reconfirma o papel NO SERVIDOR a cada ação — nunca
 *   confiamos em campo oculto do client p/ identidade;
 * - antes de decidir, relemos a reserva e exigimos `status === "pending"`. O
 *   UPDATE ainda carrega `.eq("status","pending")` como guarda anti-corrida
 *   (duplo-clique / duas abas) — só a 1ª decisão vence;
 * - o RLS de `approval_events` permite o admin inserir (is_admin()); o RLS de
 *   `notifications` permite gravar a notificação destinada ao solicitante;
 * - SEGREGAÇÃO DE FUNÇÕES: como o admin também cria reservas (pending → fila),
 *   ele NÃO pode avaliar a PRÓPRIA solicitação. Após reler a reserva, `canActOn`
 *   bloqueia se `reservation.user_id === admin.id` (defesa no servidor; a UI
 *   também esconde os botões via `isOwn`, mas a regra real é aqui).
 *
 * Sincronização (F-22 CA04): revalidamos /aprovacoes, "/" (dashboard/KPIs) e o
 * layout (badges da sidebar) — o calendário e a lista pessoal re-leem do banco.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { canActOn, REJECT_REASON_MAX } from "@/lib/approvals";

/**
 * Mensagem canônica do bloqueio de auto-aprovação (servidor + UI usam o mesmo
 * texto). Regra: outro admin tem que avaliar; o autor não pode avaliar a si.
 */
const SELF_REVIEW_BLOCKED =
  "Você não pode avaliar a própria solicitação; outro administrador deve aprová-la ou recusá-la.";

export interface ActionResult {
  ok: boolean;
  error: string | null;
  needsConfirmation?: boolean;
}

interface ApproveOptions {
  confirmConflict?: boolean;
}

/** Revalida todas as superfícies que refletem o estado de uma reserva. */
function revalidateApprovalSurfaces(): void {
  revalidatePath("/aprovacoes");
  revalidatePath("/"); // dashboard + KPIs
  revalidatePath("/calendario");
  revalidatePath("/minhas-reservas");
  revalidatePath("/(app)", "layout"); // badges da sidebar (contador de pendências)
}

/** Relê a reserva e confirma que segue pendente (defesa em profundidade). */
async function loadPendingReservation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reservationId: string,
): Promise<
  | {
      ok: true;
      userId: string;
      date: string;
      start: string;
      end: string;
      resourceKind: "room" | "equipment";
      roomId: string | null;
      equipmentId: string | null;
    }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, status, user_id, reservation_date, start_time, end_time, resource_kind, room_id, equipment_id",
    )
    .eq("id", reservationId)
    .single();

  if (error || !data) return { ok: false, error: "Reserva não encontrada." };
  if (data.status !== "pending") {
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }
  return {
    ok: true,
    userId: data.user_id,
    date: data.reservation_date,
    start: data.start_time,
    end: data.end_time,
    resourceKind: data.resource_kind,
    roomId: data.room_id,
    equipmentId: data.equipment_id,
  };
}

async function checkApprovalConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reservation: Extract<
    Awaited<ReturnType<typeof loadPendingReservation>>,
    { ok: true }
  >,
  reservationId: string,
): Promise<{ ok: true; hasConflict: boolean } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("check_resource_availability", {
    p_resource_kind: reservation.resourceKind,
    p_room_id: reservation.roomId,
    p_equipment_id: reservation.equipmentId,
    p_date: reservation.date,
    p_start: reservation.start,
    p_end: reservation.end,
    p_exclude_reservation: reservationId,
  });

  if (error) {
    return {
      ok: false,
      error: "Não foi possível verificar conflitos antes da aprovação.",
    };
  }

  return { ok: true, hasConflict: data === false };
}

/**
 * Aprova uma reserva pendente (F-22 CA01/CA02/CA03/CA04). Muda status →
 * `approved`, registra `approval_events(action="approved")` e notifica o autor
 * (`type="reservation_approved"`, alinhado ao mapa de tipos da Central de
 * Notificações — F-34). NÃO aprova reservas já decididas (CA01).
 */
export async function approveReservationAction(
  reservationId: string,
  options: ApproveOptions = {},
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!reservationId) return { ok: false, error: "Reserva inválida." };

  const supabase = await createClient();

  const current = await loadPendingReservation(supabase, reservationId);
  if (!current.ok) return { ok: false, error: current.error };

  // Segregação de funções: o autor NÃO aprova a própria solicitação (defesa no
  // servidor — relemos o user_id da reserva, não confiamos no client).
  if (!canActOn({ user_id: current.userId }, admin.id)) {
    return { ok: false, error: SELF_REVIEW_BLOCKED };
  }

  const conflict = await checkApprovalConflict(
    supabase,
    current,
    reservationId,
  );
  if (!conflict.ok) return { ok: false, error: conflict.error };
  if (conflict.hasConflict && !options.confirmConflict) {
    return {
      ok: false,
      error:
        "Há conflito de horário com outra reserva. Confirme explicitamente para aprovar mesmo assim.",
      needsConfirmation: true,
    };
  }

  // Guarda anti-corrida: só atinge a linha se AINDA estiver pendente (CA01).
  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update({ status: "approved" })
    .eq("id", reservationId)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    return { ok: false, error: "Não foi possível aprovar a reserva." };
  }
  if (!updated || updated.length === 0) {
    // Outra requisição venceu a corrida entre a leitura e o UPDATE.
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }

  // Trilha de auditoria (RLS permite admin inserir).
  await supabase.from("approval_events").insert({
    reservation_id: reservationId,
    actor_id: admin.id,
    action: "approved",
  });

  // Notificação automática ao autor (F-22 CA03).
  await supabase.from("notifications").insert({
    user_id: current.userId,
    type: "reservation_approved",
    title: "Reserva aprovada",
    message: `Sua solicitação para ${current.date} foi aprovada.`,
    related_reservation_id: reservationId,
  });

  revalidateApprovalSurfaces();
  return { ok: true, error: null };
}

/**
 * Recusa uma reserva pendente com justificativa OBRIGATÓRIA (F-23
 * CA01/CA02/CA03). O motivo é validado no servidor (não só na UI): vazio →
 * erro e a reserva permanece pendente (CA01). Muda status → `rejected`,
 * registra `approval_events(action="rejected", reason)` e envia o motivo ao
 * autor na notificação (`type="reservation_rejected"`, CA03). Após recusada, o
 * autor segue livre para criar nova reserva (CA04 — não bloqueamos nada).
 */
export async function rejectReservationAction(
  reservationId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!reservationId) return { ok: false, error: "Reserva inválida." };

  // CA01 — motivo obrigatório, validado no servidor.
  const trimmed = (reason ?? "").trim();
  if (!trimmed) {
    return { ok: false, error: "Informe o motivo da recusa." };
  }
  if (trimmed.length > REJECT_REASON_MAX) {
    return {
      ok: false,
      error: `O motivo deve ter no máximo ${REJECT_REASON_MAX} caracteres.`,
    };
  }

  const supabase = await createClient();

  const current = await loadPendingReservation(supabase, reservationId);
  if (!current.ok) return { ok: false, error: current.error };

  // Segregação de funções: o autor NÃO recusa a própria solicitação (defesa no
  // servidor — relemos o user_id da reserva, não confiamos no client).
  if (!canActOn({ user_id: current.userId }, admin.id)) {
    return { ok: false, error: SELF_REVIEW_BLOCKED };
  }

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update({ status: "rejected" })
    .eq("id", reservationId)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    return { ok: false, error: "Não foi possível recusar a reserva." };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }

  await supabase.from("approval_events").insert({
    reservation_id: reservationId,
    actor_id: admin.id,
    action: "rejected",
    reason: trimmed,
  });

  // Notificação com o motivo (F-23 CA03).
  await supabase.from("notifications").insert({
    user_id: current.userId,
    type: "reservation_rejected",
    title: "Reserva recusada",
    message: `Sua solicitação para ${current.date} foi recusada. Motivo: ${trimmed}`,
    related_reservation_id: reservationId,
  });

  revalidateApprovalSurfaces();
  return { ok: true, error: null };
}
