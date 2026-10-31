"use client";

import clsx from "clsx";
import { calendarHeatmapStyles, names } from "../calendarHeatmap.styles";
interface MonthAxisProps {
  /** One short-month label per month, anchored to its first-of-month column. */
  labels: Array<{ col: number; label: string }>;
  /** Column pitch in px — the label is placed at the column's left edge. */
  pitchX: number;
  /** Per-column x-offset in px (separator gutters); length `weeks`. */
  xOffsets: number[];
  /** Baseline y for every month label (inside the reserved top gutter). */
  y: number;
}

/**
 * The top month axis: an SVG `<text>` per month, left-anchored to the column
 * that contains that month's 1st. Rendered inside a group already translated to
 * the grid's left edge, so `col * pitchX` (plus its separator-gutter offset)
 * lines each label up with its column.
 */
export function MonthAxis({ labels, pitchX, xOffsets, y }: MonthAxisProps) {
  const styles = calendarHeatmapStyles;
  return (
    <g className={names.group}>
      {labels.map(({ col, label }) => (
        <text
          key={col}
          x={col * pitchX + (xOffsets[col] ?? 0)}
          y={y}
          className={clsx(styles.monthLabel, names.monthLabel)}
        >
          {label}
        </text>
      ))}
    </g>
  );
}
