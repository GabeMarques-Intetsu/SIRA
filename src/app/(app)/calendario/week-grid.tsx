import { getHourSlots, type WeekDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/calendar-events";
import { EventCard } from "./event-card";

interface WeekGridProps {
  days: WeekDay[];
  events: CalendarEvent[];
}

const LUNCH_SLOT = 12;

export function WeekGrid({ days, events }: WeekGridProps) {
  const slots = getHourSlots();
  const cols = "60px repeat(7, minmax(0, 1fr))";

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="border-outline-variant grid border-b" style={{ gridTemplateColumns: cols }} role="row">
          <div aria-hidden="true" />
          {days.map((d) => (
            <div key={d.iso} className={`px-sm py-sm text-center ${d.isWeekend ? "bg-surface-container-low" : ""}`} role="columnheader">
              <div className="text-label-sm text-on-surface-variant">{d.weekdayLabel}</div>
              <div className={d.isToday ? "text-body-md text-primary font-bold" : `text-body-md ${d.isWeekend ? "text-on-surface-variant" : "text-on-surface"}`}>
                <span className="sr-only">{d.weekdayLabel} </span>{d.dayOfMonth}
              </div>
            </div>
          ))}
        </div>

        <div className="text-body-sm relative grid" style={{ gridTemplateColumns: cols, gridTemplateRows: `repeat(${slots.length}, minmax(60px, 1fr))` }}>
          {slots.map((hour, i) => (
            <div key={`time-${hour}`} className="text-on-surface-variant border-outline-variant pr-sm py-md border-r text-right" style={{ gridColumn: 1, gridRow: i + 1 }}>
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
          {slots.map((hour, rowIdx) => days.map((d, colIdx) => {
            const isLunch = hour === LUNCH_SLOT;
            const tone = d.isWeekend ? "bg-surface-container-low/40" : isLunch ? "bg-surface-container-low/30" : "";
            return (
              <div key={`${d.iso}-${hour}`} className={`border-outline-variant border-r border-b ${tone}`} style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1 }} role="gridcell" aria-label={`${d.weekdayLabel} ${d.dayOfMonth}, ${String(hour).padStart(2, "0")}:00, livre`}>
                {isLunch && colIdx === 0 && <span className="text-on-surface-variant/60 text-label-sm block pt-3 text-center">Almoço</span>}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}