"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { dayLabel, isoDay, pad2, parseDay, shiftDay } from "../dateRange";
const Chevron = ({ back }: { back?: boolean }) => (
  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
    <path
      d={back ? "M7.5 3 4.5 6l3 3" : "M4.5 3l3 3-3 3"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * One month of days. Click a start, then an end; the band between them is a
 * quiet tint and the two ends are solid. Future days are disabled: a
 * dashboard has no data there. Arrow keys walk the days.
 */
export function RangeCalendar({
  from,
  to,
  today,
  onPick,
}: {
  from: string | null;
  to: string | null;
  today: string;
  onPick: (day: string) => void;
}) {
  const [month, setMonth] = useState(() => (to ?? from ?? today).slice(0, 7));
  const [hover, setHover] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState(() => to ?? from ?? today);
  const grid = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, month]);

  const first = parseDay(`${month}-01`);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => `${month}-${pad2(i + 1)}`);
  const shiftMonth = (by: number) => {
    const date = new Date(first.getFullYear(), first.getMonth() + by, 1);
    return isoDay(date).slice(0, 7);
  };
  // While only a start is picked, the hovered day previews the band.
  const end = to ?? (from && hover && hover >= from ? hover : null);
  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const onKey = (event: ReactKeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = shiftDay(focusDay, step);
    if (next > today) return;
    moveFocus.current = true;
    setFocusDay(next);
    setMonth(next.slice(0, 7));
  };
  return (
    <div className="openui-dashboard-cal">
      <div className="openui-dashboard-cal-head">
        <span className="openui-dashboard-cal-title">{title}</span>
        <button
          type="button"
          className="openui-dashboard-cal-nav"
          aria-label="Previous month"
          onClick={() => setMonth(shiftMonth(-1))}
        >
          <Chevron back />
        </button>
        <button
          type="button"
          className="openui-dashboard-cal-nav"
          aria-label="Next month"
          disabled={shiftMonth(1) > today.slice(0, 7)}
          onClick={() => setMonth(shiftMonth(1))}
        >
          <Chevron />
        </button>
      </div>
      <div
        className="openui-dashboard-cal-grid"
        role="grid"
        aria-label={title}
        ref={grid}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
      >
        {WEEKDAYS.map((name) => (
          <span key={name} className="openui-dashboard-cal-weekday" aria-hidden>
            {name}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((day, index) => {
          const column = (lead + index) % 7;
          const isStart = day === from;
          const isEnd = !!end && day === end;
          const inside = !!from && !!end && day > from && day < end;
          return (
            <span
              key={day}
              className="openui-dashboard-cal-cell"
              data-start={isStart && end && end !== from ? "" : undefined}
              data-end={isEnd && end !== from ? "" : undefined}
              data-inside={inside ? "" : undefined}
              data-edge={
                column === 0
                  ? "left"
                  : column === 6
                    ? "right"
                    : index === 0
                      ? "left"
                      : index === days.length - 1
                        ? "right"
                        : undefined
              }
            >
              <button
                type="button"
                className="openui-dashboard-cal-day"
                data-day={day}
                data-today={day === today ? "" : undefined}
                aria-pressed={isStart || isEnd}
                aria-label={dayLabel(day, true)}
                tabIndex={day === focusDay ? 0 : -1}
                disabled={day > today}
                onMouseEnter={() => setHover(day)}
                onFocus={() => setFocusDay(day)}
                onClick={() => onPick(day)}
              >
                {Number(day.slice(8))}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
