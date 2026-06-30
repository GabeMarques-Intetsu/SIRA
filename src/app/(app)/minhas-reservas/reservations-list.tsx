import Link from "next/link";
import {
  displayStatus,
  formatDateShort,
  formatTimeRange,
  groupByWhen,
  resourceIcon,
  resourceName,
  type MyReservationRow,
} from "@/lib/my-reservations";
import { CancelButton } from "./cancel-button";

interface Props {
  /** Reservas da página atual (já filtradas + ordenadas + paginadas). */
  rows: MyReservationRow[];
  /** Página 1-based e total de páginas (para a paginação — F-16 CA09). */
  page: number;
  totalPages: number;
  /** Total filtrado e janela mostrada (rótulo "X–Y de Z"). */
  total: number;
  rangeStart: number;
  rangeEnd: number;
  /** QueryString base (sem `page`) para preservar filtros nos links de página. */
  baseQuery: string;
}

/**
 * Lista das reservas agrupada em "Próximas"/"Anteriores" (mockup 06), com badge
 * de status (F-16 CA07), item → detalhe (CA10) e ações por status (editar via
 * detalhe; cancelar inline para pendentes — F-19). Renderizada no servidor
 * (sem JS para a lista; só o botão de cancelar é client). Mobile: cards.
 */
export function ReservationsList({
  rows,
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  baseQuery,
}: Props) {
  const { upcoming, past } = groupByWhen(rows);

  return (
    <section
      aria-label="Suas reservas"
      className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border shadow-sm"
    >
      {upcoming.length > 0 && <Group title="Próximas" rows={upcoming} />}
      {past.length > 0 && <Group title="Anteriores" rows={past} dimmed />}

      {totalPages > 1 && (
        <nav
          aria-label="Paginação das reservas"
          className="px-md py-md border-outline-variant text-body-sm text-on-surface-variant gap-md flex flex-wrap items-center justify-between border-t"
        >
          <span>
            Mostrando{" "}
            <strong className="text-on-surface">
              {rangeStart}–{rangeEnd}
            </strong>{" "}
            de <strong className="text-on-surface">{total}</strong>
          </span>
          <div className="gap-xs flex items-center">
            <PageLink
              page={page - 1}
              disabled={page <= 1}
              baseQuery={baseQuery}
              label="Anterior"
              icon="chevron_left"
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p, baseQuery)}
                aria-current={p === page ? "page" : undefined}
                className={`text-label-md rounded-lg px-3 py-1 ${
                  p === page
                    ? "bg-primary text-on-primary"
                    : "hover:bg-surface-container"
                }`}
              >
                {p}
              </Link>
            ))}
            <PageLink
              page={page + 1}
              disabled={page >= totalPages}
              baseQuery={baseQuery}
              label="Próxima"
              icon="chevron_right"
            />
          </div>
        </nav>
      )}
    </section>
  );
}

function Group({
  title,
  rows,
  dimmed = false,
}: {
  title: string;
  rows: MyReservationRow[];
  dimmed?: boolean;
}) {
  return (
    <>
      <header className="px-md py-sm bg-surface-container-low border-outline-variant border-y first:border-t-0">
        <h2 className="text-label-md text-on-surface-variant tracking-wider uppercase">
          {title}
        </h2>
      </header>
      <ul
        className={`divide-outline-variant divide-y ${dimmed ? "opacity-75" : ""}`}
      >
        {rows.map((r) => (
          <ReservationItem key={r.id} row={r} />
        ))}
      </ul>
    </>
  );
}

function ReservationItem({ row }: { row: MyReservationRow }) {
  const status = displayStatus(row);
  const isPending = row.status === "pending";

  return (
    <li className="p-md md:p-lg gap-md hover:bg-surface-container-low/40 flex flex-col transition-colors md:flex-row md:items-center">
      {/* O bloco principal é o link para o detalhe (CA10). */}
      <Link
        href={`/minhas-reservas/${row.id}`}
        className="gap-md focus-visible:ring-primary flex flex-1 items-start rounded-lg outline-none focus-visible:ring-2"
      >
        <span className="bg-primary-fixed flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
          <span
            className="material-symbols-outlined text-on-primary-fixed"
            aria-hidden="true"
          >
            {resourceIcon(row)}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-body-md text-on-surface block font-medium">
            {resourceName(row)}
          </span>
          {row.purpose && (
            <span className="text-body-sm text-on-surface-variant block truncate">
              {row.purpose}
            </span>
          )}
          <span className="text-body-sm text-on-surface mt-xs gap-md flex flex-wrap items-center">
            <span className="gap-xs flex items-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden="true"
              >
                event
              </span>
              {formatDateShort(row.reservation_date)}
            </span>
            <span className="gap-xs flex items-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden="true"
              >
                schedule
              </span>
              {formatTimeRange(row.start_time, row.end_time)}
            </span>
            {row.recurrence_type !== "none" && (
              <span className="gap-xs flex items-center">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16 }}
                  aria-hidden="true"
                >
                  repeat
                </span>
                Recorrente
              </span>
            )}
          </span>
        </span>
      </Link>

      <div className="gap-sm flex flex-shrink-0 flex-col items-start md:items-end">
        <span
          className={`text-label-sm gap-xs flex items-center rounded-full px-2 py-0.5 whitespace-nowrap ${status.badgeClass}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14 }}
            aria-hidden="true"
          >
            {status.icon}
          </span>
          {status.label}
        </span>
        <div className="gap-xs flex items-center">
          <Link
            href={`/minhas-reservas/${row.id}`}
            className="px-sm text-on-surface-variant hover:bg-surface-container text-label-md gap-xs flex items-center rounded-lg py-1"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              info
            </span>
            <span className="hidden sm:inline">Detalhes</span>
          </Link>
          {isPending && <CancelButton reservationId={row.id} compact />}
        </div>
      </div>
    </li>
  );
}

function pageHref(page: number, baseQuery: string): string {
  const qs = new URLSearchParams(baseQuery);
  if (page > 1) qs.set("page", String(page));
  else qs.delete("page");
  const s = qs.toString();
  return s ? `/minhas-reservas?${s}` : "/minhas-reservas";
}

function PageLink({
  page,
  disabled,
  baseQuery,
  label,
  icon,
}: {
  page: number;
  disabled: boolean;
  baseQuery: string;
  label: string;
  icon: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="touch-target flex items-center justify-center rounded-lg opacity-50"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <Link
      href={pageHref(page, baseQuery)}
      aria-label={label}
      className="touch-target hover:bg-surface-container flex items-center justify-center rounded-lg"
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
    </Link>
  );
}
