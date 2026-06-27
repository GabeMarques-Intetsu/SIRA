import type { CalendarEvent } from "@/lib/calendar-events";

/**
 * Cartão de uma reserva, posicionado como item de CSS grid.
 * A cor comunica o STATUS da reserva com tokens M3.
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
