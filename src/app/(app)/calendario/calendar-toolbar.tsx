"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface CalendarToolbarProps {
  /** Rótulo do intervalo da semana (ex.: "13 – 19 Janeiro"). */
  rangeLabel: string;
  /** ISO da segunda-feira da semana exibida (âncora para prev/next). */
  weekStartIso: string;
  /** ISO da segunda da semana anterior. */
  prevIso: string;
  /** ISO da segunda da próxima semana. */
  nextIso: string;
}

/**
 * Barra de navegação da grade (CA04: semana anterior/próxima/Hoje; CA11: visão
 * dia/semana/mês). Client island: o estado vive na URL (?date=) — bom para
 * voltar/avançar do navegador (F-06) e para o Server Component re-buscar dados.
 * A visão "Semana" é a implementada; Dia/Mês ficam sinalizadas como em breve.
 */
export function CalendarToolbar({
  rangeLabel,
  prevIso,
  nextIso,
}: CalendarToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Preserva filtros ativos ao navegar/alternar (CA12).
  const goToDate = useCallback(
    (iso: string) => {
      const next = new URLSearchParams(params.toString());
      next.set("date", iso);
      next.delete("semana");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const goToday = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("date");
    next.delete("semana");
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }, [params, pathname, router]);

  return (
    <header className="p-md border-outline-variant gap-md flex flex-wrap items-center border-b">
      <div className="gap-sm flex items-center">
        <button
          type="button"
          onClick={() => goToDate(prevIso)}
          className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
          aria-label="Semana anterior"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
        </button>
        <h2
          className="text-headline-sm text-on-surface px-sm whitespace-nowrap"
          aria-live="polite"
        >
          {rangeLabel}
        </h2>
        <button
          type="button"
          onClick={() => goToDate(nextIso)}
          className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full"
          aria-label="Próxima semana"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_right
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={goToday}
        className="px-md text-on-surface border-outline-variant hover:bg-surface-container text-label-md rounded-lg border py-1.5"
      >
        Hoje
      </button>

      {/* CA11: visões dia/semana/mês — Semana ativa; demais em breve (F-13 v2). */}
      <div
        className="bg-surface-container gap-xs flex rounded-lg p-1 md:ml-auto"
        role="group"
        aria-label="Visão do calendário"
      >
        <button
          type="button"
          disabled
          title="Disponível em breve"
          className="px-md text-on-surface-variant/50 text-label-md cursor-not-allowed rounded py-1"
        >
          Dia
        </button>
        <button
          type="button"
          aria-current="true"
          className="px-md bg-surface-container-lowest text-on-surface text-label-md rounded py-1 shadow-sm"
        >
          Semana
        </button>
        <button
          type="button"
          disabled
          title="Disponível em breve"
          className="px-md text-on-surface-variant/50 text-label-md cursor-not-allowed rounded py-1"
        >
          Mês
        </button>
      </div>
    </header>
  );
}
