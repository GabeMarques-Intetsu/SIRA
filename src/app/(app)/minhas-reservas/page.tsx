import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  applyFilters,
  parseFilters,
  PAGE_SIZE,
  sortByDateDesc,
  type MyReservationRow,
} from "@/lib/my-reservations";
import { ReservationFilters } from "./reservation-filters";
import { ReservationsList } from "./reservations-list";

export const metadata: Metadata = { title: "Minhas Reservas · SIRA" };

interface SearchParams {
  status?: string;
  tipo?: string;
  periodo?: string;
  q?: string;
  page?: string;
}

/**
 * Minhas Reservas (F-16/F-18/F-19/F-20 · RF-007). Server Component:
 * - garante a sessão (RBAC) e busca as reservas do usuário — o RLS de
 *   `reservations` já devolve só as próprias (admin vê todas), então NUNCA
 *   vazamos reservas de terceiros (F-10);
 * - aplica os filtros vindos da URL (status múltiplo, período, busca por sala,
 *   aba de tipo) combinando em AND (F-16 CA06), ordena por data desc (CA02) e
 *   pagina a partir de 50 itens (CA09);
 * - os controles de filtro/exportação (client) vivem em `ReservationFilters`;
 *   a lista é renderizada no servidor (HTML leve, bom LCP, sem CLS).
 *
 * ESCOPO: edição (F-18) acontece na tela de detalhe; aqui a lista expõe
 * cancelar (F-19) inline para pendentes e a exportação CSV (F-20) do conjunto
 * filtrado.
 */
export default async function MinhasReservasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `id, reservation_date, start_time, end_time, status, resource_kind,
       purpose, recurrence_type, room_id, equipment_id,
       rooms ( name, block, type ),
       equipment ( name, block, type )`,
    )
    .order("reservation_date", { ascending: false })
    .order("start_time", { ascending: false });

  const allRows = error ? [] : ((data ?? []) as unknown as MyReservationRow[]);

  // Contadores por aba (sobre o conjunto SEM o filtro de tipo, com os demais
  // filtros aplicados — para os badges refletirem o recorte ativo).
  const filters = parseFilters(params);
  const withoutKind = applyFilters(allRows, { ...filters, kind: "all" });
  const counts = {
    all: withoutKind.length,
    room: withoutKind.filter((r) => r.resource_kind === "room").length,
    equipment: withoutKind.filter((r) => r.resource_kind === "equipment")
      .length,
  };

  // Filtragem combinada (AND) + ordenação desc (CA02/CA06).
  const filtered = sortByDateDesc(applyFilters(allRows, filters));

  // Paginação a partir de 50 itens (CA09).
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = clampPage(params.page, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  // QueryString base (sem page) para os links de paginação preservarem filtros.
  const baseQuery = buildBaseQuery(params);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2">
      <header className="gap-md mb-2 flex flex-wrap items-start justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface">Minhas Reservas</h1>
          <p className="text-body-sm text-on-surface-variant hidden md:block">
            {summary(allRows)}
          </p>
        </div>
        <Link
          href="/nova-reserva"
          className="bg-primary text-on-primary hover:bg-surface-tint px-md text-label-md gap-xs flex items-center rounded-lg py-2 shadow-sm transition-all active:scale-[0.98]"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            add
          </span>
          Nova Reserva
        </Link>
      </header>

      <ReservationFilters
        filters={filters}
        filteredRows={filtered}
        counts={counts}
      />

      {total === 0 ? (
        <EmptyState hasAny={allRows.length > 0} />
      ) : (
        <ReservationsList
          rows={pageRows}
          page={page}
          totalPages={totalPages}
          total={total}
          rangeStart={start + 1}
          rangeEnd={start + pageRows.length}
          baseQuery={baseQuery}
        />
      )}
    </div>
  );
}

/** Resumo "N reservas · X pendentes · Y aprovadas" (cabeçalho, mockup 06). */
function summary(rows: MyReservationRow[]): string {
  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const plural = rows.length === 1 ? "reserva" : "reservas";
  return `${rows.length} ${plural} · ${pending} pendente${pending === 1 ? "" : "s"} · ${approved} aprovada${approved === 1 ? "" : "s"}`;
}

function clampPage(raw: string | undefined, totalPages: number): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, totalPages);
}

function buildBaseQuery(params: SearchParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.tipo) qs.set("tipo", params.tipo);
  if (params.periodo) qs.set("periodo", params.periodo);
  if (params.q) qs.set("q", params.q);
  return qs.toString();
}

/** Estado vazio (F-16 CA08): "Nenhuma reserva encontrada". */
function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="bg-surface-container-lowest border-outline-variant p-xxl gap-md flex flex-col items-center rounded-xl border text-center shadow-sm">
      <span
        className="material-symbols-outlined text-on-surface-variant"
        style={{ fontSize: 48 }}
        aria-hidden="true"
      >
        event_busy
      </span>
      <p className="text-body-md text-on-surface-variant max-w-[24rem]">
        Nenhuma reserva encontrada
        {hasAny ? " para os filtros aplicados." : "."}
      </p>
      {!hasAny && (
        <Link
          href="/nova-reserva"
          className="bg-primary text-on-primary hover:bg-surface-tint px-md gap-sm text-label-md inline-flex items-center rounded-lg py-2.5 shadow-sm"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            add
          </span>
          Nova Reserva
        </Link>
      )}
    </div>
  );
}
