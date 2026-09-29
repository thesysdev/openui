import type { CalendarSeparatorLabel } from "./separatorLayout";

interface CalendarSeparatorsProps {
  /** Columns a vertical rule is drawn at. */
  columns: number[];
  /** Per-column x-offset in px (length `weeks`); the rule follows its gutter. */
  offsets: number[];
  /** Column pitch in px. */
  pitchX: number;
  /** Gutter width; when 0 the rule sits in the inter-cell gap. */
  spacing: number;
  /** Inter-cell gap in px. */
  gap: number;
  /** Full grid height in px — the rule spans it top to bottom. */
  plotHeight: number;
  /** Line color (falls back to the theme border token in CSS). */
  stroke?: string;
  /** Dashed vs. solid rule. */
  dashed?: boolean;
  classPrefix: string;
}

/**
 * The vertical column separators, drawn inside the plot group (already
 * translated to the grid origin). A rule at column `c` sits in the gutter its
 * offset opened — centered when `spacing > 0`, otherwise in the cell gap
 * (bklit `getHeatmapSeparatorX` parity). Color/dash come from props; the base
 * stroke token lives in CSS so an unstyled rule still reads in both themes.
 */
export function CalendarSeparators({
  columns,
  offsets,
  pitchX,
  spacing,
  gap,
  plotHeight,
  stroke,
  dashed,
  classPrefix,
}: CalendarSeparatorsProps) {
  return (
    <g>
      {columns.map((col) => {
        const x = col * pitchX + (offsets[col] ?? 0) - (spacing > 0 ? spacing / 2 : gap / 2);
        return (
          <line
            key={col}
            className={`${classPrefix}-separator`}
            x1={x}
            x2={x}
            y1={0}
            y2={plotHeight}
            stroke={stroke}
            strokeDasharray={dashed ? "4,4" : undefined}
          />
        );
      })}
    </g>
  );
}

interface CalendarSeparatorLabelsProps {
  /** Quarter labels anchored to the column that opens each group. */
  labels: CalendarSeparatorLabel[];
  /** Per-column x-offset in px (length `weeks`). */
  offsets: number[];
  /** Column pitch in px. */
  pitchX: number;
  /** Left gutter width (weekday axis) — labels share the grid's left origin. */
  gutterLeft: number;
  /** Formats the `Q{n} {year}` label text. */
  format: (quarter: number, year: number) => string;
  classPrefix: string;
}

/**
 * The quarter labels for `groupBy: 'quarter'`, rendered as HTML positioned over
 * the plot (absolute, relative to the plot wrapper which shares the SVG's left
 * origin). Each label left-anchors to its group's opening column, matching the
 * separator rule below it.
 */
export function CalendarSeparatorLabels({
  labels,
  offsets,
  pitchX,
  gutterLeft,
  format,
  classPrefix,
}: CalendarSeparatorLabelsProps) {
  return (
    <>
      {labels.map(({ col, quarter, year }) => (
        <span
          key={col}
          className={`${classPrefix}-quarter-label`}
          style={{
            position: "absolute",
            top: 0,
            left: gutterLeft + col * pitchX + (offsets[col] ?? 0),
          }}
        >
          {format(quarter, year)}
        </span>
      ))}
    </>
  );
}
