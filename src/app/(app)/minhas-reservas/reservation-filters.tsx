"use client";

/**
 * Filtros + busca + exportação de "Minhas Reservas" (F-16 CA03/CA04/CA05/CA06 ·
 * F-20). Todo o estado vive na URL (?status=&tipo=&periodo=&q=) para suportar
 * voltar/avançar e deep-link (F-06) e para que o Server Component refaça a
 * filtragem RLS-safe. A exportação CSV (F-20) acontece no client sobre o mesmo
 * conjunto FILTRADO já carregado, sem nova ida ao servidor.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useId, useState, useTransition } from "react";
import {
  buildCsv,
  csvFileName,
  STATUS_FILTERS,
  type MyReservationRow,
  type PeriodFilter,
  type ReservationFilters,
  type ReservationStatus,
} from "@/lib/my-reservations";

interface Props {
  filters: ReservationFilters;
  /** Conjunto JÁ filtrado e exibido — base da exportação (F-20 CA01). */
  filteredRows: MyReservationRow[];
  /** Contadores por aba para os badges (Todas/Salas/Equipamentos). */
  counts: { all: number; room: number; equipment: number };
}

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Qualquer período" },
  { value: "next7", label: "Próximos 7 dias" },
  { value: "month", label: "Mês corrente" },
];

export function ReservationFilters({ filters, filteredRows, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchId = useId();
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  // Atualiza a URL preservando os demais parâmetros e zerando a paginação.
  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page"); // mudou o filtro → volta à página 1
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [params, pathname, router],
  );

  const toggleStatus = (status: ReservationStatus) => {
    const set = new Set(filters.statuses);
    if (set.has(status)) set.delete(status);
    else set.add(status);
    setParam("status", [...set].join(","));
  };

  const handleExport = () => {
    // F-20 CA04 — sem dados filtrados, avisa e não gera arquivo.
    if (filteredRows.length === 0) {
      setExportMsg("Não há reservas para exportar.");
      return;
    }
    setExportMsg(null);
    const blob = new Blob([buildCsv(filteredRows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // libera memória (F-20 T20.1.5)
  };

  const TABS: {
    value: ReservationFilters["kind"];
    label: string;
    count: number;
  }[] = [
    { value: "all", label: "Todas", count: counts.all },
    { value: "room", label: "Salas", count: counts.room },
    { value: "equipment", label: "Equipamentos", count: counts.equipment },
  ];

  return (
    <div className="gap-lg flex flex-col" aria-busy={isPending}>
      {/* Abas Todas / Salas / Equipamentos (resource_kind) */}
      <div
        role="tablist"
        aria-label="Tipo de reserva"
        className="border-outline-variant flex border-b"
      >
        {TABS.map((t) => {
          const selected = filters.kind === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setParam("tipo", t.value === "all" ? "" : t.value)}
              className={`px-md gap-sm text-label-md -mb-px flex items-center border-b-2 py-2 transition-colors ${
                selected
                  ? "border-primary text-primary"
                  : "text-on-surface-variant hover:text-on-surface border-transparent"
              }`}
            >
              {t.label}
              <span
                className={`text-label-sm ml-1 rounded-full px-2 py-0.5 ${
                  selected
                    ? "bg-primary-fixed text-on-primary-fixed-variant"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra de filtros: chips de status + período + busca + export */}
      <section className="bg-surface-container-lowest p-md border-outline-variant gap-md flex flex-col rounded-xl border shadow-sm lg:flex-row lg:items-center">
        <div
          role="group"
          aria-label="Filtrar por status"
          className="gap-xs flex flex-wrap"
        >
          <button
            type="button"
            aria-pressed={filters.statuses.length === 0}
            onClick={() => setParam("status", "")}
            className={`px-md text-label-md rounded-full py-1.5 transition-colors ${
              filters.statuses.length === 0
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Todas
          </button>
          {STATUS_FILTERS.map((s) => {
            const on = filters.statuses.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStatus(s.value)}
                className={`px-md text-label-md rounded-full py-1.5 transition-colors ${
                  on
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="gap-sm flex flex-col sm:flex-row sm:items-center lg:ml-auto">
          {/* Período (CA04) */}
          <label className="sr-only" htmlFor={`${searchId}-period`}>
            Período
          </label>
          <select
            id={`${searchId}-period`}
            value={filters.period}
            onChange={(e) =>
              setParam(
                "periodo",
                e.target.value === "all" ? "" : e.target.value,
              )
            }
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-sm rounded-lg border py-2 outline-none focus:ring-2"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Busca por nome de sala (CA05) */}
          <div className="relative">
            <span
              className="material-symbols-outlined text-on-surface-variant absolute top-1/2 left-3 -translate-y-1/2"
              aria-hidden="true"
            >
              search
            </span>
            <label className="sr-only" htmlFor={`${searchId}-q`}>
              Buscar por sala
            </label>
            <input
              id={`${searchId}-q`}
              type="search"
              defaultValue={filters.query}
              placeholder="Buscar por sala…"
              onChange={(e) => setParam("q", e.target.value)}
              className="border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary text-body-sm w-full rounded-lg border py-2 pr-3 pl-[44px] outline-none focus:ring-2 sm:w-64"
            />
          </div>

          {/* Exportar CSV (F-20) */}
          <button
            type="button"
            onClick={handleExport}
            className="px-md border-outline-variant text-on-surface hover:bg-surface-container text-label-md gap-xs flex items-center justify-center rounded-lg border py-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              file_download
            </span>
            Exportar CSV
          </button>
        </div>
      </section>

      {exportMsg && (
        <p
          role="status"
          className="text-body-sm text-on-error-container bg-error-container px-md rounded-lg py-2"
        >
          {exportMsg}
        </p>
      )}
    </div>
  );
}
