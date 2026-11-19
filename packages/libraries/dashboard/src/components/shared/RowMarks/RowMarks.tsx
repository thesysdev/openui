"use client";

export type RowGridProps = { ticks: number[]; x: (value: number) => string };

export type CapMarkProps = { side: "min" | "max"; color: string };

export type IntervalMarkProps = { color: string };

export type TickMarkProps = { color: string };

/** Vertical grid lines at the axis ticks, drawn inside each row's track so they read as one grid down the rows. */
export function RowGrid({ ticks, x }: RowGridProps) {
  return (
    <>
      {ticks.map((tick) => (
        <span
          key={tick}
          className="openui-dashboard-row-grid"
          style={{ left: x(tick) }}
          aria-hidden
        />
      ))}
    </>
  );
}

/** A faint horizontal guide across a row's track, so the eye follows the row from label to value. */
export function RowGuide() {
  return <span className="openui-dashboard-row-guide" aria-hidden />;
}

/**
 * Small marks for tooltips, each the shape of what it names: a whisker's end
 * cap (min on the left, max on the right), an interval with its caps, a
 * median tick.
 */
export function CapMark({ side, color }: CapMarkProps) {
  return (
    <svg className="openui-dashboard-tip-mark" viewBox="0 0 12 10" aria-hidden>
      <path
        d={side === "min" ? "M2 5H11M2 1.5V8.5" : "M1 5H10M10 1.5V8.5"}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IntervalMark({ color }: IntervalMarkProps) {
  return (
    <svg className="openui-dashboard-tip-mark" viewBox="0 0 12 10" aria-hidden>
      <path
        d="M1.5 5H10.5M1.5 2V8M10.5 2V8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function TickMark({ color }: TickMarkProps) {
  return (
    <svg className="openui-dashboard-tip-mark" viewBox="0 0 12 10" aria-hidden>
      <path d="M6 1V9" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
