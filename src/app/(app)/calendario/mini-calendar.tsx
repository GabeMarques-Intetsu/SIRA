"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { addDays, parseIso, startOfWeek, toIso, isSameWeek } from "@/lib/calendar";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
      return { year: cur.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <section className="bg-surface-container-lowest border-outline-variant p-md rounded-xl border shadow-sm">
        {/* Placeholder para os componentes de UI que virão no passo 3 */}
    </section>
  );
}