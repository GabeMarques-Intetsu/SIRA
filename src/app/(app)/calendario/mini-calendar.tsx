"use client";

import { useMemo, useState } from "react";
import { addDays, parseIso, startOfWeek, toIso, isSameWeek } from "@/lib/calendar";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface MiniCalendarProps {
  weekStartIso: string;
}

export function MiniCalendar({ weekStartIso }: MiniCalendarProps) {
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

  return <section className="bg-surface-container-lowest border-outline-variant p-md rounded-xl border shadow-sm">Carregando...</section>;
}