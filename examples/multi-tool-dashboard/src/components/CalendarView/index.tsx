"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { CalendarViewSchema } from "./schema";

export { CalendarViewSchema } from "./schema";

interface ParsedEvent {
  summary: string;
  date: Date;
  status: string;
}

function parseEventDate(start: unknown): Date | null {
  if (!start) return null;
  if (typeof start === "string") return new Date(start);
  if (typeof start === "object" && start !== null) {
    const s = start as Record<string, unknown>;
    const raw = s.dateTime ?? s.date;
    if (typeof raw === "string") return new Date(raw);
  }
  return null;
}

function parseEvents(events: unknown[]): ParsedEvent[] {
  const result: ParsedEvent[] = [];
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const e = ev as Record<string, unknown>;
    const date = parseEventDate(e.start);
    if (!date || isNaN(date.getTime())) continue;
    result.push({
      summary: String(e.summary ?? "Event"),
      date,
      status: String(e.status ?? "confirmed"),
    });
  }
  return result;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function CalendarGrid({ events }: { events: ParsedEvent[] }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const eventsInMonth = events.filter(
    (e) => e.date.getMonth() === viewMonth && e.date.getFullYear() === viewYear,
  );

  const eventsByDay = new Map<number, ParsedEvent[]>();
  for (const e of eventsInMonth) {
    const d = e.date.getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(e);
  }

  const totalCells = startOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: "13px" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button onClick={prevMonth} style={navBtnStyle} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#111" }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={navBtnStyle} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "4px" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {Array.from({ length: rows * 7 }, (_, i) => {
          const dayNum = i - startOffset + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          const dayEvents = isValid ? eventsByDay.get(dayNum) : undefined;
          const hasEvents = dayEvents && dayEvents.length > 0;
          const todayCell = isValid && isToday(dayNum);
          const isSelected = isValid && selectedDay === dayNum;

          return (
            <div
              key={i}
              onClick={() => { if (isValid) setSelectedDay(isSelected ? null : dayNum); }}
              style={{
                minHeight: "40px",
                padding: "4px",
                borderRadius: "6px",
                cursor: isValid ? "pointer" : "default",
                background: isSelected ? "#eff6ff" : todayCell ? "#f0fdf4" : isValid ? "#fafbfc" : "transparent",
                border: isSelected ? "1px solid #3b82f6" : todayCell ? "1px solid #86efac" : "1px solid transparent",
                transition: "all 0.1s",
                position: "relative",
              }}
            >
              {isValid && (
                <>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: todayCell ? 700 : 400,
                    color: todayCell ? "#059669" : isSelected ? "#1d4ed8" : "#374151",
                    textAlign: "right",
                    lineHeight: "1",
                  }}>
                    {dayNum}
                  </div>
                  {hasEvents && (
                    <div style={{ display: "flex", gap: "2px", marginTop: "3px", flexWrap: "wrap" }}>
                      {dayEvents.slice(0, 3).map((_, j) => (
                        <div
                          key={j}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: ["#3b82f6", "#f59e0b", "#10b981"][j % 3],
                          }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: "9px", color: "#9ca3af", lineHeight: "6px" }}>+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day event list */}
      {selectedDay !== null && (
        <div style={{ marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
            {MONTHS[viewMonth]} {selectedDay}
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>No events</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {selectedEvents.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{
                    width: "4px",
                    height: "24px",
                    borderRadius: "2px",
                    background: ["#3b82f6", "#f59e0b", "#10b981"][i % 3],
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.summary}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      {ev.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "4px 8px",
  cursor: "pointer",
  color: "#374151",
  display: "flex",
  alignItems: "center",
};

export const CalendarView = defineComponent({
  name: "CalendarView",
  props: CalendarViewSchema,
  description:
    "Month-grid calendar view that displays events as dots on day cells. Click a day to see event details. Pass an array of event objects with summary and start (dateTime or date string).",
  component: ({ props }) => {
    const raw = Array.isArray(props.events) ? props.events : [];
    const parsed = parseEvents(raw);
    return <CalendarGrid events={parsed} />;
  },
});
