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
      groupId: string | null;
    }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, status, user_id, reservation_date, start_time, recurrence_group_id",
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
    groupId: data.recurrence_group_id,
  };
}

/**
 * Aplica a decisão (`approved`/`rejected`) à ocorrência OU à SÉRIE inteira:
 * quando a reserva tem `recurrence_group_id`, TODAS as ocorrências ainda
 * pendentes daquela série são decididas de uma vez (o usuário pediu "decidir a
 * série inteira"). Mantém a guarda anti-corrida (`.eq("status","pending")`) e
 * registra um `approval_event` por ocorrência decidida (trilha de auditoria).
 * Retorna os ids decididos (≥1) ou um erro de corrida/DB.
 */
async function applyDecision(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: {
    reservationId: string;
    groupId: string | null;
    status: "approved" | "rejected";
    adminId: string;
    reason?: string;
  },
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const verb = opts.status === "approved" ? "aprovar" : "recusar";

  let update = supabase
    .from("reservations")
    .update({ status: opts.status })
    .eq("status", "pending");
  update = opts.groupId
    ? update.eq("recurrence_group_id", opts.groupId)
    : update.eq("id", opts.reservationId);

  const { data: updated, error } = await update.select("id");
  if (error) {
    return { ok: false, error: `Não foi possível ${verb} a reserva.` };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }

  const ids = updated.map((r) => r.id);
  await supabase.from("approval_events").insert(
    ids.map((id) => ({
      reservation_id: id,
      actor_id: opts.adminId,
      action: opts.status,
      reason: opts.reason ?? null,
    })),
  );
  return { ok: true, ids };
}

/**
 * Aprova uma reserva pendente (F-22 CA01/CA02/CA03/CA04). Muda status →
 * `approved`, registra `approval_events(action="approved")` e notifica o autor
 * (`type="reservation_approved"`, alinhado ao mapa de tipos da Central de
 * Notificações — F-34). NÃO aprova reservas já decididas (CA01).
 */
export async function approveReservationAction(
  reservationId: string,
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

  // Decide a ocorrência OU a série inteira (guarda anti-corrida + auditoria).
  const decided = await applyDecision(supabase, {
    reservationId,
    groupId: current.groupId,
    status: "approved",
    adminId: admin.id,
  });
  if (!decided.ok) return { ok: false, error: decided.error };

  // Notificação automática ao autor (F-22 CA03) — UMA por decisão de série.
  const isSeries = decided.ids.length > 1;
  await supabase.from("notifications").insert({
    user_id: current.userId,
    type: "reservation_approved",
    title: "Reserva aprovada",
    message: isSeries
      ? `Sua solicitação recorrente (${decided.ids.length} datas) foi aprovada.`
      : `Sua solicitação para ${current.date} foi aprovada.`,
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

  // Decide a ocorrência OU a série inteira (guarda anti-corrida + auditoria).
  const decided = await applyDecision(supabase, {
    reservationId,
    groupId: current.groupId,
    status: "rejected",
    adminId: admin.id,
    reason: trimmed,
  });
  if (!decided.ok) return { ok: false, error: decided.error };

  // Notificação com o motivo (F-23 CA03) — UMA por decisão de série.
  const isSeries = decided.ids.length > 1;
  await supabase.from("notifications").insert({
    user_id: current.userId,
    type: "reservation_rejected",
    title: "Reserva recusada",
    message: isSeries
      ? `Sua solicitação recorrente (${decided.ids.length} datas) foi recusada. Motivo: ${trimmed}`
      : `Sua solicitação para ${current.date} foi recusada. Motivo: ${trimmed}`,
    related_reservation_id: reservationId,
  });

  revalidateApprovalSurfaces();
  return { ok: true, error: null };
}
