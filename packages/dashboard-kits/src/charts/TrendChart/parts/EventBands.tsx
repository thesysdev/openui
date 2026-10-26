import type { ChartEvent } from "../../../core/schemas";
import { KIT_CHART_PREFIX } from "../../utils/constants";
import { placeEventLabels } from "../trendGeometry";

const P = `${KIT_CHART_PREFIX}-trend-chart`;

/**
 * Events on the plot: spans (a sale, a stockout) shaded and labeled at their
 * top-left, and one-day events (a launch, a tracking change) as a dashed
 * marker labeled beside it. Marker labels step down so neighbours don't
 * collide. Drawn twice: the "marks" layer goes under the lines and the
 * "labels" layer over them, so a line never crosses the text.
 */
export function EventBands({
  events,
  labels,
  x,
  top,
  height,
  halfStep,
  active,
  layer = "marks",
}: {
  events: ChartEvent[];
  labels: string[];
  x: (index: number) => number;
  top: number;
  height: number;
  /** Half the distance between points, so a span covers its whole first and last day. */
  halfStep: number;
  active?: ChartEvent;
  layer?: "marks" | "labels";
}) {
  const marks = layer === "marks";
  // Span labels take the top line; marker labels step down below them. Each
  // label goes on the first row where it fits, or is left to the tooltip.
  const spans = events.some((e) => e.start !== e.end || !e.kind || e.kind === "promo");
  const isMarker = (e: ChartEvent) => e.start === e.end && !!e.kind && e.kind !== "promo";
  const right = x(labels.length - 1) + halfStep;
  const rows = placeEventLabels(
    events.map((e) => {
      const a = labels.indexOf(e.start);
      if (isMarker(e)) {
        const at = x(Math.max(0, a));
        const flip = at > right - 90;
        return { x: flip ? at - 5 : at + 5, text: e.label, minRow: spans ? 1 : 0, end: flip };
      }
      return { x: x(Math.max(0, a)) - halfStep + 6, text: e.label, minRow: 0 };
    }),
    x(0) - halfStep,
    right,
  );
  return (
    <g className={`${P}-events${marks ? "" : ` ${P}-events--labels`}`}>
      {events.map((event, index) => {
        const row = rows[index];
        const a = labels.indexOf(event.start);
        const b = labels.indexOf(event.end);
        if (a < 0 || b < 0) return null;
        const classes = `${P}-event ${P}-event--${event.kind ?? "promo"}${event === active ? ` ${P}-event--active` : ""}`;
        if (isMarker(event)) {
          const at = x(a);
          // Labels near the right edge sit to the left of their marker.
          const flip = at > right - 90;
          return (
            <g key={event.label} className={`${classes} ${P}-event--marker`}>
              {marks ? (
                <line x1={at} x2={at} y1={top} y2={top + height} className={`${P}-event-marker`} />
              ) : row == null ? null : (
                <text
                  x={flip ? at - 5 : at + 5}
                  y={top + 13 + row * 13}
                  textAnchor={flip ? "end" : "start"}
                  className={`${P}-event-label`}
                >
                  {event.label}
                </text>
              )}
            </g>
          );
        }
        return (
          <g key={event.label} className={classes}>
            {marks ? (
              <rect
                x={x(a) - halfStep}
                y={top}
                width={x(b) - x(a) + halfStep * 2}
                height={height}
                className={`${P}-event-band`}
              />
            ) : row == null ? null : (
              <text x={x(a) - halfStep + 6} y={top + 13 + row * 13} className={`${P}-event-label`}>
                {event.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The event a point falls inside, if any. */
export function eventAt(events: ChartEvent[], labels: string[], index: number) {
  return events.find((event) => {
    const a = labels.indexOf(event.start);
    const b = labels.indexOf(event.end);
    return a >= 0 && b >= 0 && index >= a && index <= b;
  });
}
