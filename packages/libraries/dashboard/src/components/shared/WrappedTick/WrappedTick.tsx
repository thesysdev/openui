"use client";

export type WrappedTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
  angled?: boolean;
  band?: number;
  /** The text for a category label, e.g. a date as "May 14" (see dateLabels). */
  format?: ((label: string) => string) | null;
};

/** An x-axis tick that wraps a multi-word label onto two lines instead of colliding. */
export function WrappedTick({ x, y, payload, angled, band, format }: WrappedTickProps) {
  const label = (format ?? String)(String(payload?.value ?? ""));
  if (angled) {
    return (
      <text
        x={x}
        y={y}
        dy={10}
        textAnchor="end"
        fill="var(--openui-dashboard-ink-muted)"
        fontSize={11}
        transform={`rotate(-35 ${x} ${y})`}
      >
        {label}
      </text>
    );
  }
  const text = label;
  const words = text.split(" ");
  // Split onto two lines only when the label doesn't fit its column on one.
  const fits = !band || text.length * 6.4 <= band - 6;
  const lines =
    !fits && words.length > 1
      ? [
          words.slice(0, Math.ceil(words.length / 2)).join(" "),
          words.slice(Math.ceil(words.length / 2)).join(" "),
        ]
      : [text];
  return (
    <text x={x} y={y} textAnchor="middle" fill="var(--openui-dashboard-ink-muted)" fontSize={11}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 12 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
