import clsx from "clsx";
import { scaleBand } from "d3-scale";
import { memo, useCallback, useMemo, useRef } from "react";
import {
  useChartHover,
  useContainerSize,
  useIsomorphicLayoutEffect,
  useKitPalette,
  useSeriesFocus,
} from "../../../hooks";
import { ChartLegend, ChartTooltip, colorSeries, paletteCount } from "../shared";
import { ChartEmpty } from "../shared/ChartEmpty";
import { FadeFollower, springPresets, useDataMorph } from "../shared/spring";
import { FILL_MAX_HEIGHT, KIT_CHART_PREFIX } from "../utils/constants";
import { formatTicks, formatValue } from "../utils/format";
import { findBandIndex } from "../utils/mouseUtils";
import { labelIndexes, labelWidth, valueScale } from "../utils/scale";
import {
  columnPath,
  columnSpans,
  columnTotals,
  outerSegments,
  packColumns,
} from "./columnGeometry";
import type { ColumnChartProps } from "./types";

const P = `${KIT_CHART_PREFIX}-column-chart`;
const DEFAULT_HEIGHT = 240;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 24;
const MIN_WIDTH = 240;
/** Widest a stacked column, or one bar of a group, is drawn. */
const MAX_BAR = 28;
const RADIUS = 4;

type Round = "top" | "bottom" | "none";

/**
 * Columns over time or categories on one d3 band scale and one linear scale:
 * grouped side by side, or stacked from zero (positive values up, negative
 * values down, so gains and losses read from one baseline). Each column's outer
 * end is rounded and stacked segments keep a 2px surface gap.
 *
 * Interactions match the kit's other charts: a hover band glides between
 * columns with the shared tooltip (series values, and the total or net for a
 * stack) while the other columns step back; arrow keys walk the columns; the
 * legend brings a series forward on hover and pins it on click. Columns rise
 * from the baseline on mount, glide to new values on the data morph spring when
 * a filter changes, and snap on resize.
 */
export function ColumnChart(props: ColumnChartProps) {
  const hasData =
    props.labels.length > 0 &&
    props.series.some((s) => s.values.slice(0, props.labels.length).some(Number.isFinite));
  if (!hasData) {
    return <ChartEmpty prefix={P} className={props.className} />;
  }
  return <ColumnChartImpl {...props} />;
}

function ColumnChartImpl({
  labels,
  series: seriesProp,
  format = "number",
  stacked = false,
  yLabel,
  xLabel,
  columnColors,
  keys,
  height = DEFAULT_HEIGHT,
  fill = false,
  maxHeight = FILL_MAX_HEIGHT,
  isAnimationActive = true,
  className,
}: ColumnChartProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, height);
  const focus = useSeriesFocus();
  const drawn = useMemo(() => seriesProp.slice(0, 8), [seriesProp]);
  const palette = useKitPalette(paletteCount(drawn), "barChartPalette");
  const series = useMemo(() => colorSeries(drawn, palette), [drawn, palette]);
  const n = labels.length;
  const width = Math.max(size.width, MIN_WIDTH);
  const plotHeight = fill ? Math.min(maxHeight, Math.max(height, size.height)) : height;
  const plotBottom = plotHeight - MARGIN_BOTTOM;

  const values = useMemo(
    () => series.map((s) => Array.from({ length: n }, (_, j) => s.values[j] ?? Number.NaN)),
    [series, n],
  );
  const spans = useMemo(() => columnSpans(values, stacked), [values, stacked]);
  const totals = useMemo(() => columnTotals(values), [values]);
  const hasNegative = useMemo(() => values.some((v) => v.some((x) => x < 0)), [values]);

  const geometry = useMemo(() => {
    const ends = spans.flatMap((s) => s.flatMap((span) => [span.from, span.to]));
    const { scale: y, ticks } = valueScale(ends, [plotBottom, MARGIN_TOP]);
    const tickLabels = formatTicks(ticks, format);
    const left = labelWidth(tickLabels) + 10;
    const right = width - 6;
    const band = scaleBand<number>()
      .domain(Array.from({ length: n }, (_, j) => j))
      .range([left, right])
      .paddingInner(n > 40 ? 0.18 : 0.28)
      .paddingOuter(0.12);
    // Bars inside a column group: one per series grouped, one per stack.
    const lanes = stacked ? 1 : series.length;
    const gap = lanes > 1 ? Math.min(2, band.bandwidth() * 0.08) : 0;
    const bar = Math.max(1, Math.min(MAX_BAR, (band.bandwidth() - gap * (lanes - 1)) / lanes));
    const group = bar * lanes + gap * (lanes - 1);
    const xs = series.map((_, i) =>
      Array.from(
        { length: n },
        (_, j) => band(j)! + (band.bandwidth() - group) / 2 + (stacked ? 0 : i * (bar + gap)),
      ),
    );
    return { y, ticks, tickLabels, left, right, band, bar, group, xs };
  }, [spans, plotBottom, format, width, n, stacked, series]);

  const { y, band, left, right } = geometry;
  const flat = useMemo(() => packColumns(spans, y, stacked), [spans, y, stacked]);
  const rounds = useMemo((): Round[][] => {
    if (!stacked) return values.map((v) => v.map((x) => (x < 0 ? "bottom" : "top")));
    const outer = outerSegments(values);
    return values.map((_, i) =>
      Array.from({ length: n }, (_, j) =>
        outer.top[j] === i ? "top" : outer.bottom[j] === i ? "bottom" : "none",
      ),
    );
  }, [values, stacked, n]);
  const colors = useMemo(
    () =>
      series.map((s, i) =>
        Array.from(
          { length: n },
          (_, j) => (series.length === 1 && i === 0 && columnColors?.[j]) || s.color,
        ),
      ),
    [series, n, columnColors],
  );

  const findIndex = useCallback((px: number) => findBandIndex(band, px), [band]);
  const hover = useChartHover(n);
  const hovered = hover.hoveredIndex;
  const shown = Math.min(hover.restingIndex ?? n - 1, n - 1);
  const center = (j: number) => band(j)! + band.bandwidth() / 2;
  const baseY = y(0);

  const spacing = Math.max(28, labelWidth(labels) + 14);
  const xTicks = labelIndexes(n, right - left, spacing);
  const legendItems =
    keys ?? series.map((s) => ({ name: s.name, color: s.color, kind: "rect" as const }));
  const showLegend = keys != null || series.length > 1;
  const footerLabel = hasNegative ? "Net" : "Total";

  return (
    <div className={clsx(P, fill && `${P}--fill`, className)} data-kit-fill={fill ? "" : undefined}>
      {(showLegend || yLabel) && (
        <div className={`${P}-top`}>
          {yLabel && <span className={`${P}-unit`}>{yLabel}</span>}
          {showLegend && <ChartLegend items={legendItems} {...(keys ? {} : focus.legend)} />}
        </div>
      )}
      <div
        ref={frameRef}
        className={clsx(`${P}-frame`, fill && `${P}-frame--fill`)}
        style={
          fill
            ? { minHeight: height, maxHeight: Number.isFinite(maxHeight) ? maxHeight : undefined }
            : { height }
        }
        tabIndex={0}
        role="img"
        aria-label={`${stacked ? "Stacked" : "Grouped"} columns of ${series.map((s) => s.name).join(", ")} from ${labels[0]} to ${labels[n - 1]}. Use the arrow keys to read each column.`}
        {...hover.createHandlers(findIndex)}
      >
        <svg width={width} height={plotHeight} className={`${P}-svg`}>
          <g className={`${P}-axes`}>
            {geometry.ticks.map((tick, k) => (
              <g key={tick}>
                {/* Zero is drawn over the columns, below. */}
                {tick !== 0 && (
                  <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className={`${P}-grid`} />
                )}
                <text x={left - 8} y={y(tick) + 4} textAnchor="end" className={`${P}-tick`}>
                  {geometry.tickLabels[k]}
                </text>
              </g>
            ))}
          </g>
          <FadeFollower
            x={band(shown)! - (band.step() - band.bandwidth()) / 2}
            visible={hovered != null}
          >
            <rect
              y={MARGIN_TOP - 6}
              width={band.step()}
              height={plotBottom - MARGIN_TOP + 6}
              rx={Math.min(6, band.step() / 4)}
              className={`${P}-hover-band`}
            />
          </FadeFollower>
          <ColumnBars
            flat={flat}
            xs={geometry.xs}
            bar={geometry.bar}
            rounds={rounds}
            colors={colors}
            opacities={series.map((s) => focus.opacity(s.name))}
            hovered={hovered}
            baseY={baseY}
            layoutKey={`${width}:${n}:${series.length}:${stacked}`}
            isAnimationActive={isAnimationActive}
          />
          <line x1={left} x2={right} y1={baseY} y2={baseY} className={`${P}-baseline`} />
          <g className={`${P}-x`}>
            {xTicks.map((j) => (
              <text
                key={j}
                x={center(j)}
                y={plotHeight - 6}
                textAnchor="middle"
                className={`${P}-tick`}
              >
                {labels[j]}
              </text>
            ))}
          </g>
        </svg>
        {hovered != null && (
          <ChartTooltip
            x={center(hovered) + geometry.group / 2}
            y={MARGIN_TOP}
            width={width}
            title={labels[hovered]!}
            rows={series.flatMap((s, i) =>
              // A stack leaves out series with nothing in this column, e.g. zones.
              stacked && series.length > 1 && values[i]![hovered] === 0
                ? []
                : [
                    {
                      color: colors[i]![hovered]!,
                      name: s.name,
                      value: formatValue(values[i]![hovered]!, format),
                      kind: "rect" as const,
                    },
                  ],
            )}
            footer={
              stacked && series.length > 1 ? (
                <>
                  <span>{footerLabel}</span>
                  <strong>{formatValue(totals[hovered]!, format)}</strong>
                </>
              ) : undefined
            }
          />
        )}
      </div>
      {xLabel && <div className={`${P}-xlabel`}>{xLabel}</div>}
    </div>
  );
}

interface BarsProps {
  flat: Float64Array;
  xs: number[][];
  bar: number;
  rounds: Round[][];
  colors: string[][];
  opacities: number[];
  hovered: number | null;
  baseY: number;
  /** Changes on resize or a new shape: the columns then snap instead of gliding. */
  layoutKey: string;
  isAnimationActive: boolean;
}

/**
 * Every column segment, driven by one spring data morph over the flat pixel
 * vector. The paths are rebuilt from the animated tops and bottoms each frame;
 * a hover re-render only toggles classes.
 */
const ColumnBars = memo(function ColumnBars(props: BarsProps) {
  const n = props.xs[0]?.length ?? 0;
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const propsRef = useRef(props);
  propsRef.current = props;
  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    const { xs, bar, rounds } = propsRef.current;
    xs.forEach((row, i) =>
      row.forEach((x, j) => {
        const o = (i * n + j) * 2;
        pathRefs.current[i * n + j]?.setAttribute(
          "d",
          columnPath(x, bar, animated[o]!, animated[o + 1]!, rounds[i]![j]!, RADIUS),
        );
      }),
    );
  });

  const lastLayout = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = !props.isAnimationActive || lastLayout.current !== props.layoutKey;
    lastLayout.current = props.layoutKey;
    aim(props.flat, snap, props.isAnimationActive);
  }, [props.flat, props.layoutKey, props.isAnimationActive, aim]);

  const animate = props.isAnimationActive;
  const stagger = Math.min(24, 420 / Math.max(1, n));
  return (
    <g className={clsx(`${P}-bars`, props.hovered != null && `${P}-bars--hovering`)}>
      {props.xs.map((row, i) => (
        <g key={i} className={`${P}-series`} style={{ opacity: props.opacities[i] }}>
          {row.map((x, j) => {
            const o = (i * n + j) * 2;
            return (
              <path
                key={j}
                ref={(el) => {
                  pathRefs.current[i * n + j] = el;
                }}
                d={columnPath(
                  x,
                  props.bar,
                  props.flat[o]!,
                  props.flat[o + 1]!,
                  props.rounds[i]![j]!,
                  RADIUS,
                )}
                fill={props.colors[i]![j]}
                className={clsx(
                  `${P}-col`,
                  j === props.hovered && `${P}-col--active`,
                  animate && `${P}-col--animated`,
                )}
                style={
                  animate
                    ? { transformOrigin: `0 ${props.baseY}px`, animationDelay: `${j * stagger}ms` }
                    : undefined
                }
              />
            );
          })}
        </g>
      ))}
    </g>
  );
});
