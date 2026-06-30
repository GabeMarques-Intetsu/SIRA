import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  applySearch,
  canActOn,
  computeKpis,
  dateShort,
  findConflictingPendingIds,
  parseTab,
  recurrenceLabel,
  relativeTime,
  resourceName,
  statusBadge,
  timeRange,
  type ApprovalConflictRow,
  type ApprovalRow,
  type ApprovalTab,
} from "@/lib/approvals";
import { ApprovalFilters } from "./approval-filters";
import { ApprovalActions } from "./approval-actions";

export const metadata: Metadata = { title: "Aprovações · SIRA" };

interface SearchParams {
  status?: string;
  q?: string;
}

const SELECT = `id, reservation_date, start_time, end_time, status, resource_kind,
  purpose, recurrence_type, created_at, user_id, room_id, equipment_id,
  profiles:user_id ( full_name, department ),
  rooms ( name, block ),
  equipment ( name, block )`;

const CONFLICT_SELECT =
  "id, reservation_date, start_time, end_time, status, resource_kind, room_id, equipment_id";

/**
 * Fila de Aprovações (F-21/F-22/F-23 · RF-008). Admin-only via `requireAdmin()`
 * (F-21 CA01). Server Component:
 * - lê as reservas por status (RLS `is_admin()` libera o admin a ver TODAS),
 *   ordenando por `created_at` asc — FIFO, mais antigas primeiro (CA03);
 * - aplica a busca textual vinda da URL (solicitante/recurso, CA07);
 * - calcula os KPIs (pendentes/decisões de hoje/tempo médio — CA09/CA10) a
 *   partir de `reservations` + `approval_events`;
 * - sinaliza conflito real quando uma pendente sobrepõe reserva aprovada do
 *   mesmo recurso e horário (F-22 CA05/CA07).
 *
 * A lista é HTML do servidor (LCP bom, sem CLS); só as ações Aprovar/Recusar
 * são client islands.
 */
export default async function AprovacoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const tab = parseTab(params.status);
  const query = params.q ?? "";

  const supabase = await createClient();

  // Lista da aba ativa (FIFO p/ pendentes; mais recentes primeiro p/ decididas).
  const ascending = tab === "pending";
  let listQuery = supabase
    .from("reservations")
    .select(SELECT)
    .order("created_at", { ascending });
  if (tab !== "all") {
    listQuery = listQuery.eq("status", tab);
  }

  // Lista, conflitos e KPIs são independentes; buscamos em paralelo, sem
  // waterfall (react-best-practices → server-parallel-fetching).
  const [{ data, error }, conflictRes, kpis] = await Promise.all([
    listQuery,
    loadConflictRows(supabase),
    loadKpis(supabase),
  ]);

  const allRows = error ? [] : ((data ?? []) as unknown as ApprovalRow[]);
  const rows = applySearch(allRows, query);

  const conflictRows = conflictRes.error
    ? []
    : ((conflictRes.data ?? []) as unknown as ApprovalConflictRow[]);
  const conflictIds = findConflictingPendingIds(conflictRows);

  return (
    <div className="gap-lg mx-auto flex w-full max-w-[1280px] flex-col">
      <header className="gap-md flex flex-wrap items-start justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface">Aprovações</h1>
          <p className="text-body-sm text-on-surface-variant hidden md:block">
            {kpis.pending} solicitaç{kpis.pending === 1 ? "ão" : "ões"} pendente
            {kpis.pending === 1 ? "" : "s"} · {kpis.approvedToday} aprovada
            {kpis.approvedToday === 1 ? "" : "s"} hoje
          </p>
        </div>
      </header>

      {/* KPIs (F-21 CA09/CA10) */}
      <section
        aria-label="Indicadores de aprovação"
        className="gap-md grid grid-cols-2 lg:grid-cols-4"
      >
        <Kpi
          icon="pending_actions"
          label="Pendentes"
          value={String(kpis.pending)}
          valueClass="text-error"
        />
        <Kpi
          icon="check_circle"
          label="Aprovadas hoje"
          value={String(kpis.approvedToday)}
          valueClass="text-secondary"
        />
        <Kpi
          icon="cancel"
          label="Recusadas hoje"
          value={String(kpis.rejectedToday)}
          valueClass="text-on-surface"
        />
        <Kpi
          icon="timer"
          label="Tempo médio"
          value={kpis.avgDecisionLabel}
          valueClass="text-on-surface"
        />
      </section>

      <ApprovalFilters tab={tab} query={query} pendingCount={kpis.pending} />

      {rows.length === 0 ? (
        <EmptyState tab={tab} filtered={query.length > 0} />
      ) : (
        <section aria-label="Solicitações" className="gap-md flex flex-col">
          {rows.map((row) => (
            <RequestCard
              key={row.id}
              row={row}
              adminId={admin.id}
              hasConflict={row.status === "pending" && conflictIds.has(row.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

// ─────────────────────────── KPI card ───────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: string;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <article className="bg-surface-container-lowest border-outline-variant p-md rounded-xl border shadow-sm">
      <div className="gap-sm text-on-surface-variant text-body-sm mb-xs flex items-center">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          {icon}
        </span>
        {label}
      </div>
      <div className={`text-headline-lg ${valueClass}`}>{value}</div>
    </article>
  );
}

// ─────────────────────────── Card da solicitação ────────────────────────────

/** Card de uma solicitação (vira card no mobile naturalmente — F-08). */
function RequestCard({
  row,
  adminId,
  hasConflict,
}: {
  row: ApprovalRow;
  adminId: string;
  hasConflict: boolean;
}) {
  const badge = statusBadge(row.status);
  const author = row.profiles?.full_name ?? "Solicitante";
  const dept = row.profiles?.department;
  const isPending = row.status === "pending";
  // Segregação de funções: o admin não avalia a própria solicitação. Calculado
  // no servidor (mesma regra pura da Server Action) — esconde os botões.
  const isOwn = !canActOn({ user_id: row.user_id }, adminId);

  return (
    <article className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border shadow-sm">
      <div className="p-md md:p-lg gap-md md:gap-lg flex flex-col md:flex-row">
        <div className="bg-tertiary hidden w-1 flex-shrink-0 rounded-full md:block" />
        <div className="gap-sm flex flex-1 flex-col">
          <div className="gap-md flex flex-wrap items-start justify-between">
            <div>
              <h2 className="text-headline-sm text-on-surface">
                {resourceName(row)}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Solicitado por{" "}
                <strong className="text-on-surface">{author}</strong>
                {dept ? ` · ${dept}` : ""} · {relativeTime(row.created_at)}
              </p>
            </div>
            <span
              className={`text-label-sm rounded-full px-2 py-0.5 ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <dl className="gap-md text-body-sm mt-sm grid grid-cols-2 md:grid-cols-4">
            <Field label="Data" value={dateShort(row)} />
            <Field label="Horário" value={timeRange(row)} />
            <Field label="Finalidade" value={row.purpose ?? "—"} />
            <Field
              label="Recorrência"
              value={recurrenceLabel(row.recurrence_type)}
            />
          </dl>

          {hasConflict && (
            <div className="gap-sm mt-sm p-sm bg-error-container/40 border-error/30 flex items-center rounded-md border">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              >
                warning
              </span>
              <span className="text-body-sm text-on-surface">
                Conflito de horário: já existe reserva aprovada para este
                recurso no mesmo período.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-low border-outline-variant p-md gap-sm flex flex-wrap items-center justify-end border-t">
        <Link
          href={`/minhas-reservas/${row.id}`}
          className="px-md text-on-surface-variant hover:bg-surface-container-high text-label-md rounded-lg py-2"
        >
          Ver detalhes
        </Link>
        {isPending &&
          (isOwn ? (
            <p
              role="note"
              className="text-label-md text-on-surface-variant gap-xs flex items-center"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              >
                hourglass_empty
              </span>
              Aguardando avaliação de outro administrador
            </p>
          ) : (
            <ApprovalActions reservationId={row.id} hasConflict={hasConflict} />
          ))}
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface mt-0.5">{value}</dd>
    </div>
  );
}

// ─────────────────────────── Empty state (F-21 CA08) ────────────────────────

function EmptyState({
  tab,
  filtered,
}: {
  tab: ApprovalTab;
  filtered: boolean;
}) {
  const message = filtered
    ? "Nenhuma solicitação corresponde à busca."
    : tab === "pending"
      ? "Nenhuma solicitação pendente"
      : "Nenhuma solicitação neste filtro.";
  return (
    <section className="bg-surface-container-lowest border-outline-variant p-xxl gap-md flex flex-col items-center rounded-xl border text-center shadow-sm">
      <div className="bg-secondary-container flex h-16 w-16 items-center justify-center rounded-full">
        <span
          className="material-symbols-outlined text-on-secondary-container"
          style={{ fontSize: 32 }}
          aria-hidden="true"
        >
          task_alt
        </span>
      </div>
      <h2 className="text-headline-sm text-on-surface">
        Nada para aprovar agora!
      </h2>
      <p className="text-body-md text-on-surface-variant max-w-[24rem]">
        {message}
      </p>
    </section>
  );
}

// ─────────────────────────── Dados auxiliares (servidor) ────────────────────

function loadConflictRows(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("reservations")
    .select(CONFLICT_SELECT)
    .in("status", ["pending", "approved"]);
}

// ─────────────────────────── KPIs (servidor) ────────────────────────────────

async function loadKpis(supabase: Awaited<ReturnType<typeof createClient>>) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sinceIso = startOfToday.toISOString();

  const [{ count: pendingCount }, decisionsRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // Decisões: junta o evento (decisão) com a criação da reserva p/ o tempo médio.
    supabase
      .from("approval_events")
      .select("action, created_at, reservations:reservation_id ( created_at )")
      .in("action", ["approved", "rejected"])
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  type DecisionEvent = {
    action: "submitted" | "approved" | "rejected";
    created_at: string;
    reservations: { created_at: string } | null;
  };
  const events = (decisionsRes.data ?? []) as unknown as DecisionEvent[];

  const approvedToday = events.filter(
    (e) => e.action === "approved" && e.created_at >= sinceIso,
  ).length;
  const rejectedToday = events.filter(
    (e) => e.action === "rejected" && e.created_at >= sinceIso,
  ).length;

  const samples = events
    .filter((e) => e.reservations?.created_at)
    .map((e) => ({
      created_at: e.reservations!.created_at,
      decided_at: e.created_at,
    }));

  return computeKpis({
    pendingCount: pendingCount ?? 0,
    approvedToday,
    rejectedToday,
    samples,
  });
}
