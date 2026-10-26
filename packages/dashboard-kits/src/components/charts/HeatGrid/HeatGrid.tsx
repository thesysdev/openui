import clsx from "clsx";
import { scaleBand } from "d3-scale";
import { useCallback, useMemo, type KeyboardEvent } from "react";
import { useChartHover, useContainerSize } from "../../../hooks";
import { ChartTooltip } from "../shared";
import { ChartEmpty } from "../shared/ChartEmpty";
import { FadeFollower } from "../shared/spring";
import { KIT_CHART_PREFIX, SERIES_COLORS } from "../utils/constants";
import { formatValue } from "../utils/format";
import { labelIndexes, labelWidth } from "../utils/scale";
import { cellAt, HEAT_STEPS, heatMix, heatStep } from "./heatGeometry";
import type { HeatGridProps } from "./types";

const P = `${KIT_CHART_PREFIX}-heat-grid`;
const MARGIN_BOTTOM = 20;
const GAP = 2;
const MIN_WIDTH = 240;

/** A shade step as a fill: the accent mixed into the card, so both themes recede at the low end. */
const shade = (step: number) =>
  step === 0
    ? "var(--kit-sunk)"
    : `color-mix(in oklab, ${SERIES_COLORS[0]} ${heatMix(step)}%, var(--kit-card))`;

/**
 * Rows by columns of cells (weekday by hour) on two d3 band scales, shaded in
 * one hue from the card color to the accent, quantized to the steps the legend
 * names. Hovering a cell rings it — the ring glides between cells on the kit's
 * crosshair spring — bolds its row and column labels, and reads out its value
 * and share of the busiest cell in the shared tooltip. Arrow keys walk the
 * grid in all four directions. Shades ease to new values when a filter changes.
 */
export function HeatGrid(props: HeatGridProps) {
  const hasData = props.rows.length > 0 && props.columns.length > 0;
  if (!hasData) {
    return <ChartEmpty prefix={P} className={props.className} />;
  }
  return <HeatGridImpl {...props} />;
}

function HeatGridImpl({
  rows,
  columns,
  format = "number",
  unit,
  cellHeight = 22,
  isAnimationActive = true,
  className,
}: HeatGridProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640);
  const cols = columns.length;
  const count = rows.length * cols;
  const width = Math.max(size.width, MIN_WIDTH);
  const height = rows.length * cellHeight + MARGIN_BOTTOM;
  const max = useMemo(() => Math.max(0, ...rows.flatMap((r) => r.values)), [rows]);

  const left = labelWidth(rows.map((r) => r.label)) + 8;
  const x = useMemo(
    () =>
      scaleBand<number>()
        .domain(Array.from({ length: cols }, (_, c) => c))
        .range([left, width]),
    [cols, left, width],
  );
  const y = useMemo(
    () =>
      scaleBand<number>()
        .domain(rows.map((_, r) => r))
        .range([0, rows.length * cellHeight]),
    [rows, cellHeight],
  );

  const findIndex = useCallback(
    (px: number, py: number) => {
      const cell = cellAt(px, py, {
        left,
        top: 0,
        cellWidth: x.step(),
        cellHeight: y.step(),
        rows: rows.length,
        cols,
      });
      return cell ? cell.row * cols + cell.col : null;
    },
    [left, x, y, cols, rows.length],
  );
  const hover = useChartHover(count);
  const handlers = hover.createHandlers(findIndex);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const down = event.key === "ArrowDown";
      hover.setHoveredIndex((h) =>
        h == null ? 0 : Math.max(0, Math.min(count - 1, h + (down ? cols : -cols))),
      );
      event.preventDefault();
    } else handlers.onKeyDown(event);
  };
  const hovered = hover.hoveredIndex;
  const resting = hover.restingIndex ?? 0;
  const at = { row: Math.floor(resting / cols), col: resting % cols };
  const active = hovered == null ? null : { row: Math.floor(hovered / cols), col: hovered % cols };
  const xTicks = labelIndexes(cols, width - left, labelWidth(columns) + 12);
  const cw = x.bandwidth() - GAP;
  const ch = y.bandwidth() - GAP;
  const stagger = Math.min(18, 360 / Math.max(1, cols));

  const value = active ? (rows[active.row]!.values[active.col] ?? 0) : 0;

  return (
    <div className={clsx(P, className)}>
      <div
        ref={frameRef}
        className={`${P}-frame`}
        style={{ height }}
        tabIndex={0}
        role="img"
        aria-label={`${rows.length} rows by ${cols} columns, shaded by ${unit ?? "value"}. Use the arrow keys to read each cell.`}
        {...handlers}
        onKeyDown={onKeyDown}
      >
        <svg width={width} height={height} className={`${P}-svg`}>
          {rows.map((row, r) => (
            <text
              key={row.label}
              x={left - 8}
              y={y(r)! + ch / 2}
              dy="0.32em"
              textAnchor="end"
              className={clsx(`${P}-tick`, active?.row === r && `${P}-tick--active`)}
            >
              {row.label}
            </text>
          ))}
          {rows.map((row, r) =>
            Array.from({ length: cols }, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={x(c)!}
                y={y(r)!}
                width={Math.max(1, cw)}
                height={Math.max(1, ch)}
                rx={Math.min(3, cw / 4)}
                fill={shade(heatStep(row.values[c] ?? 0, max))}
                className={clsx(`${P}-cell`, isAnimationActive && `${P}-cell--animated`)}
                style={isAnimationActive ? { animationDelay: `${c * stagger}ms` } : undefined}
              />
            )),
          )}
          <FadeFollower x={x(at.col)!} y={y(at.row)!} visible={active != null}>
            <rect
              x={-1.5}
              y={-1.5}
              width={cw + 3}
              height={ch + 3}
              rx={Math.min(4, cw / 3)}
              className={`${P}-ring`}
            />
          </FadeFollower>
          {xTicks.map((c) => (
            <text
              key={c}
              x={x(c)! + cw / 2}
              y={height - 5}
              textAnchor="middle"
              className={clsx(`${P}-tick`, active?.col === c && `${P}-tick--active`)}
            >
              {columns[c]}
            </text>
          ))}
        </svg>
        {active && (
          <ChartTooltip
            x={x(active.col)! + cw}
            y={y(active.row)!}
            width={width}
            title={`${rows[active.row]!.label} ${columns[active.col]}`}
            note={max > 0 ? `${Math.round((value / max) * 100)}% of the busiest cell` : undefined}
            rows={[
              {
                color: shade(heatStep(value, max)),
                name: unit ?? "",
                value: formatValue(value, format),
                kind: "rect",
              },
            ]}
          />
        )}
      </div>
      <div className={`${P}-legend`} aria-hidden>
        <span>Fewer</span>
        {Array.from({ length: HEAT_STEPS }, (_, k) => (
          <i key={k} className={`${P}-swatch`} style={{ background: shade(k + 1) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
