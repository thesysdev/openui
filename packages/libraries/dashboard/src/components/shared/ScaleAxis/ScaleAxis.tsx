"use client";

import { formatValue, type ValueFormat } from "../../../shared/format";

export type ScaleAxisProps = {
  ticks: number[];
  x: (v: number) => string;
  format?: ValueFormat | null;
  columns: string;
};

/* ---------- DOM-drawn scales ---------- */

/** The tick row under a DOM-drawn scale, aligned with the track column. */
export function ScaleAxis({ ticks, x, format, columns }: ScaleAxisProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: columns, gap: 14 }}>
      <span />
      <div
        style={{
          position: "relative",
          height: 16,
          fontSize: 11,
          color: "var(--openui-dashboard-ink-muted)",
        }}
      >
        {ticks.map((tick) => (
          <span
            key={tick}
            style={{
              position: "absolute",
              left: x(tick),
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            {formatValue(tick, format, { axis: true })}
          </span>
        ))}
      </div>
      <span />
    </div>
  );
}
