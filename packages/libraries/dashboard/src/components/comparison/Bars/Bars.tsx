"use client";
import { useId, useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarTexturePatterns } from "../../../components/shared/BarTexturePatterns";
import { ChartTooltip } from "../../../components/shared/ChartTooltip";
import { InkCursor } from "../../../components/shared/InkCursor";
import { Legend } from "../../../components/shared/Legend";
import { seriesNote } from "../../../components/shared/PartNote";
import { ReferenceChipLabel } from "../../../components/shared/ReferenceChipLabel";
import { SrTable } from "../../../components/shared/SrTable";
import { Empty } from "../../../components/shared/States";
import { WrappedTick } from "../../../components/shared/WrappedTick";
import {
  allIntegers,
  AXIS_TICK,
  bandFor,
  BAR_SIZE,
  buildRows,
  CHIP_ROOM,
  durationTicks,
  hasPrevious,
  legendFor,
  minPlotWidth,
  niceTicks,
  PLOT_FLOOR,
  previousColor,
  wrappedLabelWidth,
  yAxisWidth,
  type Row,
} from "../../../shared/chartHelpers";
import { useCompare } from "../../../shared/compare";
import type { ValueFormat } from "../../../shared/format";
import { dateLabels, formatValue, isDurationFormat } from "../../../shared/format";
import { useWidth } from "../../../shared/hooks";
import { unusableSeries } from "../../../shared/parts";
import type { ReferenceProps, SeriesProps } from "../../../shared/trends";
import { toStrings } from "../../../shared/values";

export interface BarsProps {
  labels: string[];
  series: SeriesProps[];
  format?: ValueFormat;
  orientation?: "vertical" | "horizontal";
  stacked?: boolean | "percent";
  goodWhen?: "up" | "down" | "neutral";
  references?: ReferenceProps[];
  diverging?: string[];
}

/** The diverging palette's two poles, at full strength: ahead (cool) and behind (warm). */
export const DIVERGING_POLES = {
  above: "var(--openui-dashboard-div-9)",
  below: "var(--openui-dashboard-div-1)",
} as const;

/**
 * A bar with the previous period marked across it: the Funnel's dashed tick,
 * placed at the previous value on the bar's own scale and running 3px past its
 * edges, so it reads on 6px bars and beyond the bar's end when the value fell.
 */
function PreviousTickBar(
  props: Record<string, unknown> & { previousKey: string; valueKey: string; horizontal: boolean },
) {
  const { previousKey, valueKey, horizontal, ...rect } = props;
  const x = Number(rect["x"]),
    y = Number(rect["y"]),
    width = Number(rect["width"]),
    height = Number(rect["height"]);
  const payload = rect["payload"] as Row | undefined;
  const value = payload?.[valueKey];
  const previous = payload?.[previousKey];
  const tick =
    typeof value === "number" && typeof previous === "number" && value !== 0
      ? horizontal
        ? {
            x1: x + (width * previous) / value,
            x2: x + (width * previous) / value,
            y1: y - 3,
            y2: y + height + 3,
          }
        : {
            y1: y + height - (height * previous) / value,
            y2: y + height - (height * previous) / value,
            x1: x - 3,
            x2: x + width + 3,
          }
      : null;
  return (
    <g>
      <Rectangle {...(rect as object)} />
      {tick ? (
        <line
          {...tick}
          stroke="var(--openui-dashboard-ink-secondary)"
          strokeWidth={2}
          strokeDasharray="2 2"
          strokeOpacity={0.7}
        />
      ) : null}
    </g>
  );
}

export function Bars(props: BarsProps) {
  const [chartRef, width] = useWidth<HTMLDivElement>();
  const texId = useId().replace(/:/g, "");
  const compare = useCompare();
  const labels = toStrings(props.labels);
  const series = props.series;
  // Keyed on the prop itself: toStrings returns a new array every render.
  const rows = useMemo(() => buildRows(toStrings(props.labels), series), [props.labels, series]);
  const references = props.references ?? [];
  // Horizontal single-series bars print their value at the bar's end, so small
  // bars next to an outlier stay readable without hovering.
  const diverging = props.diverging && props.diverging.length >= 2 ? props.diverging : null;
  const valueLabels =
    (props.orientation ?? "horizontal") === "horizontal" &&
    series.length === 1 &&
    !props.stacked &&
    !diverging &&
    labels.length <= 16;
  const chartRows = valueLabels
    ? rows.map((row) => ({
        ...row,
        t0:
          typeof row["s0"] === "number"
            ? formatValue(row["s0"], props.format).replace(/ /g, "\u00a0")
            : "",
      }))
    : rows;
  if (!labels.length || !series.length) return <Empty />;
  if (unusableSeries(series).length === series.length) return <Empty />;
  // All zeros is not empty: a zero is a real value, so the bars draw at zero.

  const horizontal = (props.orientation ?? "horizontal") === "horizontal";
  const showPrevious = compare.enabled && hasPrevious(series);
  // Faded previous bars only for a single series: beside several series they double the bars
  // per category past reading. With several, the previous period shows as each series' change in the tooltip.
  const ghostBars = showPrevious && series.length === 1;
  // Several series side by side: the previous period is a dashed tick across each bar, as on Funnel.
  const tickPrevious = showPrevious && series.length > 1 && !props.stacked;
  const count = series.length;
  const stacked = !!props.stacked;
  const percent = props.stacked === "percent";
  const stackId = stacked ? "stack" : undefined;
  // Dates on the axis and in the tooltip read "May 14", not 2026-05-14; widths follow the shown text.
  const labelText = dateLabels(labels);
  const shownLabels = labelText ? labels.map(labelText) : labels;
  const longestLabel = Math.max(...shownLabels.map((label) => label.length));
  // Vertical bars: tilt category labels only when a wrapped label is wider than its column.
  const column = width ? (width - 64) / Math.max(1, labels.length) : 0;
  const angled =
    !horizontal && column > 0 && Math.max(...shownLabels.map(wrappedLabelWidth)) > column - 6;
  // Bars side by side in one category: a stack is one bar; a faded previous bar adds half of one.
  const barsPerBand = stacked ? 1 : count + (ghostBars ? 0.5 : 0);
  // Horizontal: the usual height, grown only when a category needs more room to keep every bar at BAR_MIN.
  // The plot is the bands plus the top margin (room for a reference chip) and the 30px value axis.
  const usual = Math.max(160, labels.length * (count > 1 || hasPrevious(series) ? 44 : 34) + 24);
  const needed =
    labels.length * bandFor(barsPerBand, 0.24) + (references.length ? CHIP_ROOM : 12) + 30;
  // Vertical bars fill the card down to the plot floor; horizontal bars need room per category.
  const height = horizontal ? Math.ceil(Math.max(usual, needed)) : PLOT_FLOOR;
  // Vertical: the plot keeps a width that holds BAR_MIN, scrolling sideways when the card is narrower.
  const plotMin = horizontal ? 0 : minPlotWidth(width, labels.length, barsPerBand, 0.24);
  const radius = (i: number): [number, number, number, number] =>
    // 100% stacks all end on the same line, so no segment rounds, the outer one included.
    percent || (stacked && i < count - 1) ? [0, 0, 0, 0] : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];

  // Round steps ($1M, not $950K), with the domain ending on the last tick so none is dropped.
  const valueKeys = series
    .map((_, i) => `s${i}`)
    .concat(ghostBars || tickPrevious ? series.map((_, i) => `p${i}`) : []);
  const nice = niceTicks(
    rows,
    stacked ? series.map((_, i) => `s${i}`) : valueKeys,
    // A stack sums its segments; a faded previous bar beside it stands on its own.
    references
      .map((r) => r.value)
      .concat(
        stacked && ghostBars
          ? rows.flatMap((row) => (typeof row["p0"] === "number" ? [row["p0"]] : []))
          : [],
      ),
    {
      stacked,
      integers: allIntegers(rows, valueKeys) && references.every((r) => Number.isInteger(r.value)),
    },
  );
  const niceAxis = nice
    ? { ticks: nice, domain: [nice[0]!, nice[nice.length - 1]!] as [number, number] }
    : {};
  const valueAxis = {
    tickLine: false,
    axisLine: false,
    tick: AXIS_TICK,
    tickCount: 5,
    allowDecimals: !allIntegers(
      rows,
      series.map((_, i) => `s${i}`),
    ),
    ...(isDurationFormat(props.format)
      ? {
          ticks: durationTicks(
            rows,
            series.map((_, i) => `s${i}`).concat(ghostBars ? series.map((_, i) => `p${i}`) : []),
            references.map((r) => r.value),
          ),
        }
      : niceAxis),
    tickFormatter: (value: number) =>
      percent ? `${Math.round(value * 100)}%` : formatValue(value, props.format, { axis: true }),
    ...(percent
      ? {
          domain: [0, 1] as [number, number],
          ticks: [0, 0.25, 0.5, 0.75, 1],
          allowDecimals: true,
        }
      : {}),
  };

  return (
    <div className="openui-dashboard-chart" ref={chartRef}>
      <SrTable
        caption="Chart data by category"
        head={["Category", ...series.map((s) => s.name)]}
        rows={rows.map((row) => [
          String(row["label"]),
          ...series.map((_, i) => formatValue(row[`s${i}`], props.format)),
        ])}
      />
      <Legend
        entries={
          diverging
            ? [
                { name: diverging[0]!, color: DIVERGING_POLES.above },
                { name: diverging[1]!, color: DIVERGING_POLES.below },
                ...references.map((r) => ({
                  name: r.label,
                  color: "var(--openui-dashboard-ink-muted)",
                  dotted: true,
                })),
              ]
            : tickPrevious
              ? [
                  ...legendFor(series, false, compare.label, true, references).filter(
                    (entry) => !entry.hidden,
                  ),
                  {
                    name: compare.label,
                    color: "var(--openui-dashboard-ink-secondary)",
                    dashed: true,
                  },
                ]
              : legendFor(series, ghostBars, compare.label, true, references)
        }
      />
      <div
        className="openui-dashboard-chart-plot"
        style={{ minHeight: height, marginTop: 4, overflowX: plotMin ? "auto" : undefined }}
      >
        {/* Past BAR_MIN the chart takes a fixed width and the plot scrolls sideways (a number, since a
              responsive container keeps its first measurement when only its parent widens). */}
        <ResponsiveContainer width={plotMin || "100%"} height="100%">
          <ComposedChart
            key={ghostBars ? "compare" : "plain"}
            data={chartRows}
            layout={horizontal ? "vertical" : "horizontal"}
            stackOffset={percent ? "expand" : undefined}
            margin={{
              top: horizontal && references.length ? CHIP_ROOM : 12,
              right: valueLabels ? 64 : 12,
              bottom: 0,
              left: 0,
            }}
            barGap={2}
            barCategoryGap="24%"
          >
            <defs>
              <BarTexturePatterns id={texId} count={series.length} />
              {/* Diverging: the poles carry the same textures as series (dots above, hatch below), so sign never rests on hue alone. */}
              {diverging ? (
                <BarTexturePatterns
                  id={`${texId}-div`}
                  count={2}
                  colors={[DIVERGING_POLES.above, DIVERGING_POLES.below]}
                />
              ) : null}
            </defs>
            <CartesianGrid
              horizontal={!horizontal}
              vertical={horizontal}
              stroke="var(--openui-dashboard-grid)"
            />
            {horizontal ? (
              <>
                <XAxis type="number" {...valueAxis} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ ...AXIS_TICK, fill: "var(--openui-dashboard-ink-secondary)" }}
                  tickFormatter={labelText ?? undefined}
                  width={Math.min(190, Math.max(64, longestLabel * 7.4 + 14))}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={<WrappedTick angled={angled} band={column} format={labelText} />}
                  height={angled ? 56 : 36}
                  interval={0}
                />
                <YAxis
                  {...valueAxis}
                  width={
                    percent
                      ? 44
                      : yAxisWidth(
                          rows,
                          series.map((_, i) => `s${i}`),
                          props.format,
                        )
                  }
                />
              </>
            )}
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 5 }}
              cursor={<InkCursor />}
              content={(tooltip) => (
                <ChartTooltip
                  {...(tooltip as object)}
                  series={series}
                  format={props.format}
                  goodWhen={props.goodWhen}
                  showPrevious={showPrevious}
                  previousLabel={compare.label}
                  formatLabel={labelText}
                  colorOf={
                    diverging
                      ? (i: number, row: Row) =>
                          typeof row["s0"] === "number" && row["s0"] < 0
                            ? DIVERGING_POLES.below
                            : DIVERGING_POLES.above
                      : undefined
                  }
                />
              )}
            />
            {diverging ? (
              <ReferenceLine
                {...(horizontal ? { x: 0 } : { y: 0 })}
                stroke="var(--openui-dashboard-border-strong)"
                strokeWidth={1}
              />
            ) : null}
            {references.map((reference) => (
              <ReferenceLine
                key={`${reference.label}-${reference.value}`}
                {...(horizontal ? { x: reference.value } : { y: reference.value })}
                stroke="var(--openui-dashboard-ink-muted)"
                strokeWidth={1.5}
                strokeDasharray="0.1 4"
                strokeLinecap="round"
                label={
                  <ReferenceChipLabel
                    text={`${reference.label} · ${formatValue(reference.value, props.format)}`}
                  />
                }
                ifOverflow="extendDomain"
              />
            ))}
            {ghostBars
              ? series.map((_, i) => (
                  <Bar
                    key={`p${i}`}
                    dataKey={`p${i}`}
                    fill={previousColor(i, count)}
                    fillOpacity={count === 1 ? 0.6 : 0.3}
                    radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                    maxBarSize={BAR_SIZE / 2}
                    isAnimationActive={false}
                  />
                ))
              : null}
            {series.map((s, i) => (
              <Bar
                key={`s${i}`}
                dataKey={`s${i}`}
                name={s.name}
                stackId={stackId}
                fill={`url(#${texId}-tex-${i})`}
                shape={
                  tickPrevious
                    ? (shape: unknown) => (
                        <PreviousTickBar
                          {...(shape as Record<string, unknown>)}
                          previousKey={`p${i}`}
                          valueKey={`s${i}`}
                          horizontal={horizontal}
                        />
                      )
                    : undefined
                }
                stroke={props.stacked ? "var(--openui-dashboard-surface)" : undefined}
                strokeWidth={props.stacked ? 2 : 0}
                radius={radius(i)}
                maxBarSize={BAR_SIZE}
                isAnimationActive={false}
              >
                {valueLabels ? (
                  <LabelList
                    dataKey="t0"
                    position="right"
                    offset={8}
                    fontSize={11}
                    fill="var(--openui-dashboard-ink-secondary)"
                  />
                ) : null}
                {diverging && i === 0
                  ? rows.map((row) => (
                      // Polarity, not status: the diverging palette's two poles.
                      <Cell
                        key={String(row["label"])}
                        fill={`url(#${texId}-div-tex-${typeof row["s0"] === "number" && row["s0"] < 0 ? 1 : 0})`}
                      />
                    ))
                  : null}
              </Bar>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {seriesNote(unusableSeries(series))}
    </div>
  );
}
