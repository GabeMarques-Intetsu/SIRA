import type { CalendarEvent } from "@/lib/calendar-events";

/**
 * Cartão de uma reserva, posicionado como item de CSS grid (sem absolute →
 * sem layout shift, ordem de leitura preservada). A cor comunica o STATUS da
 * reserva (a agenda é pessoal — F-13 v1), com tokens M3:
 * - approved   → primary  (confirmada)
 * - pending    → tertiary (aguardando aprovação)
 * - rejected   → error    (recusada)
 * - cancelled  → surface  (esmaecida, riscada)
 * A borda esquerda reforça a distinção sem depender só de cor (WCAG 1.4.1).
 *
 * Colunas da grade: 1 = faixa de horário; 2..8 = dias SEG..DOM.
 * Linhas da grade: 1 linha por faixa horária (slotIndex 0 → linha 1).
 */

const STATUS_STYLE: Record<
  CalendarEvent["status"],
  { box: string; bar: string; label: string }
> = {
  approved: {
    box: "bg-primary-fixed text-on-primary-fixed",
    bar: "border-primary",
    label: "Confirmada",
  },
  pending: {
    box: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    bar: "border-tertiary",
    label: "Pendente",
  },
  rejected: {
    box: "bg-error-container text-on-error-container",
    bar: "border-error",
    label: "Recusada",
  },
  cancelled: {
    box: "bg-surface-container text-on-surface-variant line-through opacity-70",
    bar: "border-outline",
    label: "Cancelada",
  },
};

export function EventCard({ event }: { event: CalendarEvent }) {
  const style = STATUS_STYLE[event.status];
  const kindLabel = event.resourceKind === "equipment" ? "Equipamento" : "Sala";

  return (
    <li
      className={`m-0.5 list-none overflow-hidden rounded border-l-4 p-1.5 ${style.box} ${style.bar}`}
      style={{
        gridColumn: event.dayIndex + 2,
        gridRow: `${event.slotIndex + 1} / span ${event.span}`,
      }}
    >
      <span
        className="group block"
        aria-label={`${kindLabel} ${event.resourceName}, ${event.timeLabel}, ${style.label}, autor ${event.authorName}`}
        title={`${event.resourceName} · ${event.timeLabel} · ${event.authorName}`}
      >
        <span className="text-label-sm block truncate font-bold">
          {event.resourceName}
        </span>
        <span className="text-label-sm block truncate opacity-80">
          {event.timeLabel}
        </span>
        {event.span > 1 && (
          <span className="text-label-sm block truncate opacity-70">
            {event.authorName}
          </span>
        )}
      </span>
    </li>
  );
}