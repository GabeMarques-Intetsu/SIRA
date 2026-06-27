import type { CalendarEvent } from "@/lib/calendar-events";

const STATUS_STYLE: Record<
  CalendarEvent["status"],
  { box: string; bar: string; label: string }
> = {
  approved: { box: "bg-primary-fixed text-on-primary-fixed", bar: "border-primary", label: "Confirmada" },
  pending: { box: "bg-tertiary-fixed text-on-tertiary-fixed-variant", bar: "border-tertiary", label: "Pendente" },
  rejected: { box: "bg-error-container text-on-error-container", bar: "border-error", label: "Recusada" },
  cancelled: { box: "bg-surface-container text-on-surface-variant line-through opacity-70", bar: "border-outline", label: "Cancelada" },
};

export function EventCard({ event }: { event: CalendarEvent }) {
  const style = STATUS_STYLE[event.status];

  return (
    <li
      className={`m-0.5 list-none overflow-hidden rounded border-l-4 p-1.5 ${style.box} ${style.bar}`}
      style={{
        gridColumn: event.dayIndex + 2,
        gridRow: `${event.slotIndex + 1} / span ${event.span}`,
      }}
    >
      {/* Conteúdo será renderizado no próximo passo */}
    </li>
  );
}