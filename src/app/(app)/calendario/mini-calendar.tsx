"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  addDays,
  parseIso,
  startOfWeek,
  toIso,
  isSameWeek,
} from "@/lib/calendar";

const MONTHS = [
  "Janeiro", "Feveiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface MiniCalendarProps {
  weekStartIso: string;
}

export function MiniCalendar({ weekStartIso }: MiniCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const weekStart = parseIso(weekStartIso)!;
  const [viewMonth, setViewMonth] = useState(() => ({
    year: weekStart.getUTCFullYear(),
    month: weekStart.getUTCMonth(),
  }));

  const grid = useMemo(() => {
    const first = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [viewMonth]);

  function selectDay(iso: string) {
    const next = new URLSearchParams(params.toString());
    next.set("date", iso);
    next.delete("semana");
    router.push(`${pathname}?${next.toString()}`);
  }

  function shiftMonth(delta: number) {
    setViewMonth((cur) => {
      const m = cur.month + delta;
      return {
        year: cur.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      };
    });
  }

  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md rounded-xl border shadow-sm">
      <div className="mb-md flex items-center justify-between">
        <h2 className="text-label-md text-on-surface" aria-live="polite">
          {MONTHS[viewMonth.month]} {viewMonth.year}
        </h2>
        <div className="gap-xs flex">
          <button type="button" onClick={() => shiftMonth(-1)} className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full" aria-label="Mês anterior">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">chevron_left</span>
          </button>
          <button type="button" onClick={() => shiftMonth(1)} className="touch-target text-on-surface-variant hover:bg-surface-container rounded-full" aria-label="Próximo mês">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="gap-xs text-label-sm text-on-surface-variant mb-xs grid grid-cols-7 text-center">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i} aria-hidden="true">{d}</span>
        ))}
      </div>

      <div className="gap-xs text-body-sm grid grid-cols-7 text-center">
        {grid.map((day) => {
          const iso = toIso(day);
          const inMonth = day.getUTCMonth() === viewMonth.month;
          const inWeek = isSameWeek(day, weekStart);
          const cls = !inMonth
            ? "text-on-surface-variant/80"
            : inWeek
              ? "bg-primary-fixed text-on-primary-fixed font-medium"
              : "text-on-surface hover:bg-surface-container";
          return (
            <button key={iso} type="button" onClick={() => selectDay(iso)} className={`aspect-square rounded ${cls}`} aria-label={iso} aria-pressed={inWeek}>
              {day.getUTCDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}