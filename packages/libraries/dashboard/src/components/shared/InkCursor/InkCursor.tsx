"use client";

import { useId } from "react";

export type InkCursorProps = {
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

/** A reference line's label: an ink chip pinned to the line's start. */
export const CURSOR_CAP = 3;

/**
 * The one hover cursor for every cartesian chart: a 1px ink line with small
 * perpendicular caps at both ends. Recharts hands line charts the two end
 * points and bar charts the hovered band; for a band the line runs through
 * its centre, vertical for columns and horizontal for horizontal bars.
 */
export function InkCursor(props: InkCursorProps) {
  const { points, x, y, width, height } = props;
  const fadeId = `openui-dashboard-cursor-${useId().replace(/:/g, "")}`;
  let line: [number, number, number, number] | null = null;
  if (points && points.length >= 2) line = [points[0]!.x, points[0]!.y, points[1]!.x, points[1]!.y];
  else if (x != null && y != null && width != null && height != null)
    line =
      width > height
        ? [x, y + height / 2, x + width, y + height / 2]
        : [x + width / 2, y, x + width / 2, y + height];
  if (!line) return null;
  const [x1, y1, x2, y2] = line;
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const cap = (cx: number, cy: number) =>
    vertical
      ? `M${cx - CURSOR_CAP},${cy}H${cx + CURSOR_CAP}`
      : `M${cx},${cy - CURSOR_CAP}V${cy + CURSOR_CAP}`;
  // Full ink at the middle, fading to 20% at both ends (caps included).
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={fadeId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor="var(--openui-dashboard-ink)" stopOpacity={0.2} />
          <stop offset="50%" stopColor="var(--openui-dashboard-ink)" stopOpacity={1} />
          <stop offset="100%" stopColor="var(--openui-dashboard-ink)" stopOpacity={0.2} />
        </linearGradient>
      </defs>
      <path
        d={`M${x1},${y1}L${x2},${y2}${cap(x1, y1)}${cap(x2, y2)}`}
        fill="none"
        stroke={`url(#${fadeId})`}
        strokeWidth={1}
      />
    </g>
  );
}
