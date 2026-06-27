import { getHourSlots, type WeekDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/calendar-events";
import { EventCard } from "./event-card";

interface WeekGridProps {
  days: WeekDay[];
  events: CalendarEvent[];
}

export function WeekGrid({ days, events }: WeekGridProps) {
  const cols = "60px repeat(7, minmax(0, 1fr))";

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Cabeçalho dos dias */}
        <div
          className="border-outline-variant grid border-b"
          style={{ gridTemplateColumns: cols }}
          role="row"
        >
          <div aria-hidden="true" />
          {days.map((d) => (
            <div
              key={d.iso}
              className={`px-sm py-sm text-center ${d.isWeekend ? "bg-surface-container-low" : ""}`}
              role="columnheader"
            >
              <div className="text-label-sm text-on-surface-variant">
                {d.weekdayLabel}
              </div>
              <div
                className={
                  d.isToday
                    ? "text-body-md text-primary font-bold"
                    : `text-body-md ${d.isWeekend ? "text-on-surface-variant" : "text-on-surface"}`
                }
              >
                <span className="sr-only">{d.weekdayLabel} </span>
                {d.dayOfMonth}
                {d.isToday && <span className="sr-only"> (hoje)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}