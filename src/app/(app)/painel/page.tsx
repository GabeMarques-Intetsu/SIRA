import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/calendar";
import {
  approvalRate,
  occupancyAriaLabel,
  occupancyByDay,
  parsePeriodKey,
  resolvePeriod,
  toActivity,
  topRooms,
  totalReservations,
  type ReservationStatus,
  type StatusCounts,
} from "@/lib/dashboard";
import { PeriodFilter } from "./period-filter";

export const metadata: Metadata = { title: "Painel · SIRA" };

interface SearchParams {
  periodo?: string;
}

/**
 * Painel administrativo de indicadores (EP-04 · F-12 · RF-004). Server Component:
 * - admin-only (CA01) via requireAdmin();
 * - resolve o período da URL (CA07) e dispara TODAS as queries em paralelo com
 *   Promise.all (react-best-practices → async-parallel); usa `count: exact`
 *   nos KPIs para não trazer linhas à toa (RNF-desempenho);
 * - agrega no servidor (KPIs, ocupação por dia, salas mais ocupadas, atividade
 *   recente — CA02/CA05/CA09); o HTML chega pronto (bom LCP, sem CLS, sem JS de
 *   render no client);
 * - a única ilha client é o seletor de período (estado na URL → re-busca server,
 *   CA08), o que também cobre "refletir mudanças sem recarregar a página" (CA03)
 *   ao revisitar/trocar período.
 *
 * O RLS `is_admin()` libera leitura global ao admin, então os agregados cobrem
 * o campus inteiro sem vazar nada a professores.
 *
 * TODO(ADR): CA03 pede atualização em tempo real (Supabase Realtime). Entregue
 * aqui via re-fetch no servidor (revisita/troca de período). A subscrição
 * Realtime fica para uma fase posterior — registrar ADR antes de adicionar
 * canal client (custo de conexões + invalidação de cache).
 */
export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const period = resolvePeriod(parsePeriodKey(params.periodo));
  const supabase = await createClient();

  // Helper de contagem por status no período (head:true → não traz linhas).
  const countByStatus = (status: ReservationStatus) =>
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", status)
      .gte("reservation_date", period.startIso)
      .lte("reservation_date", period.endIso);

  // ── Todas as agregações em paralelo (async-parallel) ──────────────────────
  const [
    pendingRes,
    approvedRes,
    rejectedRes,
    cancelledRes,
    roomsRes,
    equipmentRes,
    professorsRes,
    periodRowsRes,
    upcomingRes,
    pendingListRes,
    activityRes,
  ] = await Promise.all([
    countByStatus("pending"),
    countByStatus("approved"),
    countByStatus("rejected"),
    countByStatus("cancelled"),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("equipment")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "professor")
      .eq("status", "active"),
    // Linhas do período (limitadas pelo range) para ocupação por dia + top salas.
    supabase
      .from("reservations")
      .select("reservation_date, status, resource_kind, rooms ( name )")
      .gte("reservation_date", period.startIso)
      .lte("reservation_date", period.endIso),
    // Próximas reservas aprovadas (dentro do período) — limit 5.
    supabase
      .from("reservations")
      .select(
        "id, reservation_date, start_time, status, rooms ( name ), equipment ( name ), profiles ( full_name )",
      )
      .eq("status", "approved")
      .gte("reservation_date", period.startIso)
      .lte("reservation_date", period.endIso)
      .order("reservation_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5),
    // Últimas solicitações pendentes — limit 5.
    supabase
      .from("reservations")
      .select(
        "id, reservation_date, start_time, status, rooms ( name ), equipment ( name ), profiles ( full_name )",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    // Atividade recente do período (eventos de aprovação) — limit 8.
    supabase
      .from("approval_events")
      .select(
        "id, created_at, action, actor:profiles ( full_name ), reservation:reservations ( rooms ( name ), equipment ( name ) )",
      )
      .gte("created_at", `${period.startIso}T00:00:00`)
      .lte("created_at", `${period.endIso}T23:59:59`)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const counts: StatusCounts = {
    pending: pendingRes.count ?? 0,
    approved: approvedRes.count ?? 0,
    rejected: rejectedRes.count ?? 0,
    cancelled: cancelledRes.count ?? 0,
  };
  const total = totalReservations(counts);
  const rate = approvalRate(counts);
  const activeRooms = roomsRes.count ?? 0;
  const activeEquipment = equipmentRes.count ?? 0;
  const activeProfessors = professorsRes.count ?? 0;

  const periodRows = (periodRowsRes.data ?? []) as unknown as {
    reservation_date: string;
    status: ReservationStatus;
    rooms: { name: string } | null;
  }[];
  const bars = occupancyByDay(periodRows, period);
  const rooms = topRooms(periodRows);
  const upcoming = (upcomingRes.data ?? []) as unknown as UpcomingRow[];
  const pendingList = (pendingListRes.data ?? []) as unknown as UpcomingRow[];
  const activity = toActivity(
    (activityRes.data ?? []) as unknown as Parameters<typeof toActivity>[0],
  );

  const hasData = total > 0;

  return (
    <div className="gap-lg mx-auto flex w-full max-w-[80rem] flex-col">
      {/* Cabeçalho da página + filtro de período (CA07) */}
      <header className="gap-md flex flex-wrap items-end justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface">Painel</h1>
          <p className="text-body-sm text-on-surface-variant">
            Visão geral de reservas e recursos do campus · {period.longLabel}
          </p>
        </div>
        <PeriodFilter current={period.key} />
      </header>

      {/* Aviso de ausência de dados no período (CA04) */}
      {!hasData && (
        <p
          role="status"
          className="bg-surface-container-low border-outline-variant text-body-sm text-on-surface-variant p-md gap-sm flex items-center rounded-xl border"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>
          Nenhuma reserva registrada em {period.longLabel.toLowerCase()}. Os
          indicadores aparecem zerados.
        </p>
      )}

      {/* ── KPIs (CA02) ─────────────────────────────────────────────────── */}
      <section
        aria-label="Indicadores principais"
        className="gap-md grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Kpi
          label="Total de reservas"
          value={String(total)}
          valueAria={`${total} reservas no período`}
          icon="event"
          iconClass="bg-primary-fixed text-on-primary-fixed"
          hint={period.longLabel}
        />
        <Kpi
          label="Taxa de aprovação"
          value={rate === null ? "—" : `${rate}%`}
          valueAria={
            rate === null
              ? "Sem decisões no período"
              : `Taxa de aprovação de ${rate} por cento`
          }
          icon="thumb_up"
          iconClass="bg-secondary-container text-on-secondary-container"
          hint={`${counts.approved} aprovadas · ${counts.rejected} recusadas`}
        />
        <Kpi
          label="Aprovações pendentes"
          value={String(counts.pending)}
          valueAria={`${counts.pending} aprovações pendentes`}
          icon="pending_actions"
          iconClass="bg-tertiary-fixed text-on-tertiary-fixed-variant"
          hint=""
          action={{ href: "/aprovacoes", label: "Revisar agora →" }}
        />
        <Kpi
          label="Salas ativas"
          value={String(activeRooms)}
          valueAria={`${activeRooms} salas ativas`}
          icon="meeting_room"
          iconClass="bg-surface-container-highest text-on-surface"
          hint={`${activeEquipment} equipamentos · ${activeProfessors} professores ativos`}
        />
      </section>

      {/* ── Drill-down: gráfico + salas mais ocupadas (CA05/CA06 · CA02) ── */}
      <section className="gap-lg grid grid-cols-1 lg:grid-cols-3">
        {/* Ocupação por dia */}
        <article className="bg-surface-container-lowest border-outline-variant p-md rounded-xl border shadow-sm lg:col-span-2">
          <header className="gap-md mb-md flex items-start justify-between">
            <div>
              <h2 className="text-headline-sm text-on-surface">
                Ocupação por dia
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Reservas aprovadas · {period.longLabel.toLowerCase()}
              </p>
            </div>
          </header>

          <div
            role="img"
            aria-label={occupancyAriaLabel(bars)}
            className="gap-sm border-outline-variant pb-md flex h-48 items-end border-b"
          >
            {bars.map((b) => (
              <div
                key={b.iso}
                className="gap-xs flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className={`w-full rounded-t-md ${b.weekend ? "bg-tertiary-fixed-dim" : "bg-primary/80"}`}
                  style={{ height: `${Math.max(b.heightPct, 2)}%` }}
                  aria-hidden="true"
                />
                <span className="text-label-sm text-on-surface-variant">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          {/* Alternativa textual acessível: tabela com os mesmos valores (CA06). */}
          <details className="mt-md">
            <summary className="text-body-sm text-primary cursor-pointer">
              Ver valores em tabela
            </summary>
            <table className="text-body-sm mt-sm w-full">
              <caption className="sr-only">
                Reservas aprovadas por dia no período
              </caption>
              <thead className="text-label-sm text-on-surface-variant text-left">
                <tr>
                  <th scope="col" className="py-xs pr-md font-medium">
                    Dia
                  </th>
                  <th scope="col" className="py-xs font-medium">
                    Reservas aprovadas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-outline-variant divide-y">
                {bars.map((b) => (
                  <tr key={b.iso}>
                    <th
                      scope="row"
                      className="text-on-surface py-xs pr-md font-normal"
                    >
                      {b.label} ({b.iso})
                    </th>
                    <td className="text-on-surface py-xs">{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <div className="gap-md mt-md text-label-sm text-on-surface-variant flex items-center">
            <span className="gap-xs flex items-center">
              <span
                className="bg-primary h-3 w-3 rounded-sm"
                aria-hidden="true"
              />
              Dia útil
            </span>
            <span className="gap-xs flex items-center">
              <span
                className="bg-tertiary-fixed-dim h-3 w-3 rounded-sm"
                aria-hidden="true"
              />
              Fim de semana
            </span>
          </div>
        </article>

        {/* Salas mais ocupadas (CA02) */}
        <article className="bg-surface-container-lowest border-outline-variant p-md flex flex-col rounded-xl border shadow-sm">
          <header className="mb-md">
            <h2 className="text-headline-sm text-on-surface">
              Salas mais ocupadas
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Por reservas aprovadas
            </p>
          </header>
          {rooms.length === 0 ? (
            <EmptyHint text="Sem reservas aprovadas no período." />
          ) : (
            <ul className="gap-md flex flex-1 flex-col">
              {rooms.map((r) => (
                <li key={r.name} className="gap-xs flex flex-col">
                  <div className="flex items-baseline justify-between">
                    <span className="text-body-md text-on-surface truncate">
                      {r.name}
                    </span>
                    <span
                      className="text-label-md text-on-surface-variant"
                      aria-label={`${r.count} reservas`}
                    >
                      {r.count}
                    </span>
                  </div>
                  <div
                    className="bg-surface-container-high h-2 w-full overflow-hidden rounded-full"
                    aria-hidden="true"
                  >
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.max(r.widthPct, 4)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* ── Próximas aprovadas + pendentes ───────────────────────────────── */}
      <section className="gap-lg grid grid-cols-1 lg:grid-cols-2">
        <ReservationListCard
          title="Próximas reservas"
          subtitle="Aprovadas no período"
          rows={upcoming}
          link={{ href: "/calendario", label: "Ver calendário →" }}
          emptyText="Nenhuma reserva aprovada no período."
          statusKind="approved"
        />
        <ReservationListCard
          title="Solicitações pendentes"
          subtitle="Aguardando sua aprovação"
          rows={pendingList}
          link={{ href: "/aprovacoes", label: "Revisar →" }}
          emptyText="Nenhuma solicitação pendente."
          statusKind="pending"
        />
      </section>

      {/* ── Atividade recente (CA09/CA10) ────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border shadow-sm">
        <header className="border-outline-variant p-md border-b">
          <h2 className="text-headline-sm text-on-surface">
            Atividade recente
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Últimas ações de aprovação · {period.longLabel.toLowerCase()}
          </p>
        </header>

        {activity.length === 0 ? (
          <div className="p-md">
            <EmptyHint text="Sem atividade de aprovação no período." />
          </div>
        ) : (
          <>
            {/* Tabela (desktop) — CA09 */}
            <div className="hidden overflow-x-auto md:block">
              <table className="text-body-sm w-full">
                <caption className="sr-only">
                  Atividade recente de aprovação no período
                </caption>
                <thead className="text-label-sm text-on-surface-variant bg-surface-container-low text-left tracking-wider uppercase">
                  <tr>
                    <th scope="col" className="px-md py-sm font-medium">
                      Quando
                    </th>
                    <th scope="col" className="px-md py-sm font-medium">
                      Quem
                    </th>
                    <th scope="col" className="px-md py-sm font-medium">
                      Ação
                    </th>
                    <th scope="col" className="px-md py-sm font-medium">
                      Recurso
                    </th>
                    <th scope="col" className="px-md py-sm font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-outline-variant divide-y">
                  {activity.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-md py-md text-on-surface-variant whitespace-nowrap">
                        {a.relative}
                      </td>
                      <td className="px-md py-md text-on-surface">{a.who}</td>
                      <td className="px-md py-md text-on-surface">
                        {a.actionLabel}
                      </td>
                      <td className="px-md py-md text-on-surface">
                        {a.resource}
                      </td>
                      <td className="px-md py-md">
                        <span
                          className={`text-label-sm rounded-full px-2 py-0.5 ${a.badgeClass}`}
                        >
                          {a.badgeLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (mobile) — CA10 */}
            <ul className="divide-outline-variant divide-y md:hidden">
              {activity.map((a) => (
                <li key={a.id} className="p-md gap-xs flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md text-on-surface">
                      {a.who}
                    </span>
                    <span
                      className={`text-label-sm rounded-full px-2 py-0.5 ${a.badgeClass}`}
                    >
                      {a.badgeLabel}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    {a.actionLabel} · {a.resource}
                  </p>
                  <span className="text-label-sm text-on-surface-variant">
                    {a.relative}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────── subcomponentes ─────────────────────────────────

interface UpcomingRow {
  id: string;
  reservation_date: string;
  start_time: string;
  status: string;
  rooms: { name: string } | null;
  equipment: { name: string } | null;
  profiles: { full_name: string } | null;
}

function Kpi({
  label,
  value,
  valueAria,
  icon,
  iconClass,
  hint,
  action,
}: {
  label: string;
  value: string;
  valueAria: string;
  icon: string;
  iconClass: string;
  hint: string;
  action?: { href: string; label: string };
}) {
  return (
    <article className="bg-surface-container-lowest border-outline-variant p-md gap-sm flex flex-col rounded-xl border shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-body-sm text-on-surface-variant">{label}</span>
        <span className={`rounded-md p-1.5 ${iconClass}`}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20 }}
            aria-hidden="true"
          >
            {icon}
          </span>
        </span>
      </div>
      <span className="text-headline-lg text-on-surface" aria-label={valueAria}>
        {value}
      </span>
      {action ? (
        <Link
          href={action.href}
          className="text-body-sm text-primary hover:underline"
        >
          {action.label}
        </Link>
      ) : (
        hint && (
          <span className="text-body-sm text-on-surface-variant">{hint}</span>
        )
      )}
    </article>
  );
}

function ReservationListCard({
  title,
  subtitle,
  rows,
  link,
  emptyText,
  statusKind,
}: {
  title: string;
  subtitle: string;
  rows: UpcomingRow[];
  link: { href: string; label: string };
  emptyText: string;
  statusKind: "approved" | "pending";
}) {
  const badge =
    statusKind === "approved"
      ? {
          label: "Confirmada",
          cls: "bg-secondary-container text-on-secondary-container",
        }
      : {
          label: "Pendente",
          cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
        };

  return (
    <article className="bg-surface-container-lowest border-outline-variant p-md flex flex-col rounded-xl border shadow-sm">
      <header className="mb-md flex items-center justify-between">
        <div>
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <p className="text-body-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <Link
          href={link.href}
          className="text-body-sm text-primary hover:underline"
        >
          {link.label}
        </Link>
      </header>
      {rows.length === 0 ? (
        <EmptyHint text={emptyText} />
      ) : (
        <ul className="divide-outline-variant flex flex-1 flex-col divide-y">
          {rows.map((r) => (
            <li key={r.id} className="py-sm gap-sm flex items-start">
              <time
                className="text-label-md text-primary mt-0.5 w-12 shrink-0"
                dateTime={`${r.reservation_date}T${r.start_time}`}
              >
                {formatTime(r.start_time)}
              </time>
              <div className="min-w-0 flex-1">
                <p className="text-body-md text-on-surface truncate">
                  {r.rooms?.name ?? r.equipment?.name ?? "Recurso indisponível"}
                </p>
                <p className="text-body-sm text-on-surface-variant truncate">
                  {r.profiles?.full_name ?? "Solicitante"}
                </p>
              </div>
              <span
                className={`text-label-sm rounded-full px-2 py-0.5 whitespace-nowrap ${badge.cls}`}
              >
                {badge.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-body-sm text-on-surface-variant py-md text-center">
      {text}
    </p>
  );
}
