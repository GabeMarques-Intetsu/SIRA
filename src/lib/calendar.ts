/**
 * Utilitários de calendário (F-13 / RF-005) — funções puras, sem dependências.
 *
 * Construímos a grade semanal com aritmética de datas própria (sem libs de
 * calendário) para manter o bundle leve e o Server Component rápido (CWV/LCP).
 * Toda manipulação de datas é feita em UTC para evitar deslocamentos de fuso
 * que moveriam reservas para o dia errado na grade.
 */

/** Primeira hora exibida na grade (07h) — CA01. */
export const FIRST_HOUR = 7;
/** Última faixa exibida começa às 18h e termina às 19h — CA01 ("7h às 19h"). */
export const LAST_HOUR = 19;

export interface WeekDay {
  /** Data no formato ISO `YYYY-MM-DD` (chave de junção com reservation_date). */
  iso: string;
  /** Número do dia do mês (1–31). */
  dayOfMonth: number;
  /** Rótulo curto do dia (SEG, TER, …). */
  weekdayLabel: string;
  /** true para sábado/domingo (estilização "fim de semana"). */
  isWeekend: boolean;
  /** true quando este dia é a data de hoje. */
  isToday: boolean;
}

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Constrói uma Date em UTC a partir dos componentes Y-M-D (mês 0-based). */
function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

/** Hoje, normalizado para meia-noite UTC. */
export function todayUtc(now: Date = new Date()): Date {
  return utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Formata uma Date (UTC) como `YYYY-MM-DD`. */
export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parseia `YYYY-MM-DD` para uma Date em meia-noite UTC (ou null se inválida). */
export function parseIso(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = utcDate(Number(y), Number(m) - 1, Number(d));
  // Rejeita datas que "transbordam" (ex.: 2025-02-30 viraria março).
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}