"use client";

import { useId, useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  allIntegers,
  AXIS_TICK,
  BAR_SIZE,
  buildRows,
  CHIP_ROOM,
  chipAlign,
  durationTicks,
  hasPrevious,
  legendFor,
  minPlotWidth,
  PLOT_FLOOR,
  previousColor,
  seriesColor,
  SUMMARY_COLOR,
  yAxisWidth,
  type Row,
} from "../../../shared/chartHelpers";

import {
  dateLabels,
  formatValue,
  isDurationFormat,
  isRateFormat,
  isRatioFormat,
} from "../../../shared/format";

import { Legend } from "../../../components/shared/Legend";
import { SrTable } from "../../../components/shared/SrTable";
import { Empty } from "../../../components/shared/States";
import { useCompare } from "../../../shared/compare";
import { useWidth } from "../../../shared/hooks";
import { unusableSeries } from "../../../shared/parts";
import { niceStep } from "../../../shared/scales";
import { toStrings } from "../../../shared/values";
import { seriesNote } from "../../shared/PartNote";

import type { ValueFormat } from "../../../shared/format";
import type { MarkerProps, ReferenceProps, SeriesProps } from "../../../shared/trends";
import { BarTexturePatterns } from "../../shared/BarTexturePatterns";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { InkCursor } from "../../shared/InkCursor";
import { ReferenceChipLabel } from "../../shared/ReferenceChipLabel";
import { TextureTile } from "../../shared/TextureTile";
export interface TimeSeriesProps {
  labels: string[];
  series: SeriesProps[];
  type?: "line" | "area" | "bar";
  format?: ValueFormat;
  stacked?: boolean | "percent";
  references: ReferenceProps[];
  goodWhen?: "up" | "down" | "neutral";
  markers: MarkerProps[];
  curve?: "smooth" | "linear" | "step";
  forecastFrom?: string;
}

/**
 * Stacked areas carry the same cycling textures as stacked bars, in each
 * band's own hue over its fill, so neighbouring bands differ by more than
 * colour. No fade: every band keeps its texture.
 */
function StackTexturePatterns({ id, count }: { id: string; count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <TextureTile
          key={i}
          id={`${id}-stack-${i}`}
          index={i}
          ink={seriesColor(i)}
          opacity="var(--openui-dashboard-area-stack-tex)"
        />
      ))}
    </>
  );
}
const isSummaryLine = (series: SeriesProps[], type: string, i: number) =>
  (series[i]?.mark ?? type) === "line" && series.some((s) => (s.mark ?? type) === "bar");
const markColor = (series: SeriesProps[], type: string, i: number) =>
  isSummaryLine(series, type, i) ? SUMMARY_COLOR : seriesColor(i);

/** A rounded y-range around the values, kept at or above zero for positive data. */
function lineDomain(
  rows: Row[],
  keys: string[],
  extra: number[],
  ceiling?: number,
  integers = false,
): [number, number] | undefined {
  const values = [...extra.filter((v) => typeof v === "number")];
  for (const row of rows)
    for (const key of keys) if (typeof row[key] === "number") values.push(row[key] as number);
  if (!values.length) return undefined;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const spread = high - low || Math.abs(high) || 1;
  const step = integers ? Math.max(1, niceStep((spread * 1.6) / 4)) : niceStep((spread * 1.6) / 4);
  let min = Math.floor((low - spread * 0.3) / step) * step;
  if (low >= 0) min = Math.max(0, min);
  let max = Math.ceil((high + spread * 0.15) / step) * step;
  // Shares can't pass 100%: stop the axis there rather than padding to 150%.
  if (ceiling !== undefined && high <= ceiling) max = Math.min(max, ceiling);
  return [min, max];
}

function domainTicks([min, max]: [number, number], integers = false) {
  const step = integers ? Math.max(1, niceStep((max - min) / 4)) : niceStep((max - min) / 4);
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + step / 1000; t += step)
    ticks.push(Number(t.toFixed(10)));
  return ticks;
}

/**
 * Dots only where a line can't show a value: a lone point between gaps, or a
 * series too short to draw a line. Elsewhere the line carries the data.
 */
function sparseDot(rows: Row[], key: string, color: string) {
  return function SparseDot(props: { cx?: number; cy?: number; index?: number }) {
    const { cx, cy, index = 0 } = props;
    const value = rows[index]?.[key];
    const before = rows[index - 1]?.[key];
    const after = rows[index + 1]?.[key];
    const lone =
      typeof value === "number" &&
      (rows.length <= 2 || (typeof before !== "number" && typeof after !== "number"));
    if (!lone || cx === undefined || cy === undefined) return <g key={`${key}-${index}`} />;
    return (
      <circle
        key={`${key}-${index}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill={color}
        stroke="var(--openui-dashboard-surface)"
        strokeWidth={1.5}
      />
    );
  };
}
const previousOpacity = (count: number) => (count === 1 ? 1 : 0.45);

export function TimeSeries(props: TimeSeriesProps) {
  const compare = useCompare();
  const [plotRef, plotWidth] = useWidth<HTMLDivElement>();
  const gradientId = useId().replace(/:/g, "");
  const labels = toStrings(props.labels);
  const series = props.series;
  const references = props.references;
  const markers = props.markers;
  // Keyed on the prop itself: toStrings returns a new array every render.
  const baseRows = useMemo(
    () => buildRows(toStrings(props.labels), series),
    [props.labels, series],
  );
  if (!labels.length || !series.length) return <Empty />;
  // Every series without a single value: nothing to draw, so the empty state, not bare axes.
  const allMissing = unusableSeries(series).length === series.length;
  if (allMissing) return <Empty />;

  const type = props.type ?? "line";
  const stacked = !!props.stacked;
  const percent = props.stacked === "percent";
  const curve =
    props.curve === "step" ? "stepAfter" : props.curve === "linear" ? "linear" : "monotone";
  // Forecast: from forecastFrom on, line/area values move to f{i}, drawn
  // dashed; one shared point keeps the actual and projected lines joined.
  const forecastAt = props.forecastFrom ? labels.indexOf(props.forecastFrom) : -1;
  const forecast = forecastAt > 0;
  const rows = forecast
    ? baseRows.map((row, j) => {
        const next: Row = { ...row };
        series.forEach((s, i) => {
          if ((s.mark ?? type) === "bar") return;
          next[`f${i}`] = j >= forecastAt - 1 ? (row[`s${i}`] ?? null) : null;
          if (j >= forecastAt) next[`s${i}`] = null;
        });
        return next;
      })
    : baseRows;
  const showPrevious = compare.enabled && hasPrevious(series);
  // Dates on the axis and in the tooltip read "May 14", not 2026-05-14.
  const labelText = dateLabels(labels);
  const keys = series.flatMap((s, i) => [
    `s${i}`,
    ...(forecast ? [`f${i}`] : []),
    ...(showPrevious ? [`p${i}`] : []),
    ...(s.lows || s.highs ? [`lo${i}`, `hi${i}`] : []),
  ]);
  // The plot fills its card (rows set the height); this is only its floor.
  const height = PLOT_FLOOR;
  const stackId = stacked ? "stack" : undefined;
  const count = series.length;
  const lastBar = series.reduce((last, s, i) => ((s.mark ?? type) === "bar" ? i : last), -1);
  // Bars and areas encode size from zero; a line only encodes change, so zoom
  // to the data (plus references) or every rate looks flat.
  const linesOnly = series.every((s) => (s.mark ?? type) === "line");
  const dense = labels.length > 14;
  const overlapGhosts =
    showPrevious &&
    dense &&
    !stacked &&
    series.filter((s) => (s.mark ?? type) === "bar").length === 1;
  // Columns side by side in one period: a stack is one; previous bars sit beside unless they overlap.
  const barSeries = series.filter((s) => (s.mark ?? type) === "bar").length;
  const columns = barSeries
    ? (stacked ? 1 : barSeries) * (showPrevious && !overlapGhosts ? 2 : 1)
    : 0;
  const plotMin = minPlotWidth(plotWidth, labels.length, columns, dense ? 0.18 : 0.28);
  const domain = percent
    ? undefined
    : linesOnly
      ? lineDomain(
          rows,
          keys,
          references.map((reference) => reference.value),
          isRateFormat(props.format) ? (isRatioFormat(props.format) ? 1 : 100) : undefined,
          allIntegers(rows, keys),
        )
      : undefined;

  return (
    <div className="openui-dashboard-chart">
      <SrTable
        caption="Chart data by period"
        head={["Period", ...series.map((s) => s.name)]}
        rows={baseRows.map((row) => [
          String(row["label"]),
          ...series.map((_, i) => formatValue(row[`s${i}`], props.format)),
        ])}
      />
      <Legend
        entries={[
          ...legendFor(series, showPrevious, compare.label, type === "bar", references, (i) =>
            isSummaryLine(series, type, i),
          ),
          ...(forecast
            ? [{ name: "Forecast", color: "var(--openui-dashboard-ink-muted)", dashed: true }]
            : []),
        ]}
      />
      <div
        ref={plotRef}
        className="openui-dashboard-chart-plot"
        style={{ minHeight: height, marginTop: 4, overflowX: plotMin ? "auto" : undefined }}
      >
        {/* Past BAR_MIN the chart takes a fixed width and the plot scrolls sideways (a number, since a
              responsive container keeps its first measurement when only its parent widens). */}
        <ResponsiveContainer width={plotMin || "100%"} height="100%">
          {/* Recharts orders bars by mount order: remount when ghost bars come and go so previous stays first. */}
          <ComposedChart
            key={showPrevious ? "compare" : "plain"}
            data={rows}
            stackOffset={percent ? "expand" : undefined}
            margin={{ top: markers.length ? CHIP_ROOM : 12, right: 8, bottom: 0, left: 0 }}
            barGap={2}
            barCategoryGap={dense ? "18%" : "28%"}
          >
            {/* Dense series draw the previous period behind each bar on its own hidden axis, not beside it. */}
            {overlapGhosts ? <XAxis xAxisId="ghost" dataKey="label" hide /> : null}
            <defs>
              {series.map((_, i) => (
                <linearGradient key={i} id={`${gradientId}-${i}`} x1="0" x2="0" y1="0" y2="1">
                  {/* Unstacked fills are a whisper of a wash fading to nothing at the baseline. */}
                  <stop
                    offset="0%"
                    stopColor={seriesColor(i)}
                    style={{
                      stopOpacity: stacked
                        ? "var(--openui-dashboard-area-stack-top)"
                        : "var(--openui-dashboard-area-wash)",
                    }}
                  />
                  <stop
                    offset="100%"
                    stopColor={seriesColor(i)}
                    style={{
                      stopOpacity: stacked ? "var(--openui-dashboard-area-stack-bottom)" : "0",
                    }}
                  />
                </linearGradient>
              ))}
              {/* Dot texture under unstacked area fills, in the series' own hue,
                    fading out toward the baseline. */}
              {series.map((_, i) => (
                <pattern
                  key={`d${i}`}
                  id={`${gradientId}-dots-${i}`}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <circle
                    cx="1.8"
                    cy="1.8"
                    r="0.8"
                    fill={seriesColor(i)}
                    style={{ opacity: "var(--openui-dashboard-area-dot)" }}
                  />
                </pattern>
              ))}
              <linearGradient id={`${gradientId}-dotfade`} x1="0" x2="0" y1="0" y2="1">
                {/* Dots fade out across the full height, gone by the baseline. */}
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <mask id={`${gradientId}-dotmask`}>
                <rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId}-dotfade)`} />
              </mask>
              <BarTexturePatterns id={gradientId} count={series.length} />
              {stacked ? <StackTexturePatterns id={gradientId} count={series.length} /> : null}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--openui-dashboard-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={labelText ?? undefined}
              tickMargin={10}
              minTickGap={20}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickMargin={6}
              tickCount={5}
              domain={percent ? [0, 1] : domain}
              allowDecimals={percent || !allIntegers(rows, keys)}
              ticks={
                percent
                  ? [0, 0.25, 0.5, 0.75, 1]
                  : domain
                    ? domainTicks(domain, allIntegers(rows, keys))
                    : isDurationFormat(props.format)
                      ? durationTicks(
                          rows,
                          keys,
                          references.map((r) => r.value),
                        )
                      : undefined
              }
              width={percent ? 44 : yAxisWidth(rows, keys, props.format)}
              tickFormatter={(value: number) =>
                percent
                  ? `${Math.round(value * 100)}%`
                  : formatValue(value, props.format, { axis: true })
              }
            />
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
                  colorOf={(i: number) => markColor(series, type, i)}
                  formatLabel={labelText}
                />
              )}
            />
            {references.map((reference) => (
              <ReferenceLine
                key={`${reference.label}-${reference.value}`}
                // A percent stack plots shares on a 0 to 1 axis; a target past the data widens the axis.
                y={percent ? reference.value / 100 : reference.value}
                ifOverflow="extendDomain"
                stroke="var(--openui-dashboard-ink-muted)"
                strokeWidth={1.5}
                strokeDasharray="0.1 4"
                strokeLinecap="round"
                label={
                  <ReferenceChipLabel
                    text={`${reference.label} · ${formatValue(reference.value, props.format)}`}
                    align={stacked ? "start" : chipAlign(rows, keys, reference.value)}
                  />
                }
              />
            ))}
            {forecast ? (
              // The projected stretch sits on a whisper of a tint.
              <ReferenceArea
                x1={labels[forecastAt]}
                x2={labels[labels.length - 1]}
                fill="var(--openui-dashboard-ink)"
                fillOpacity={0.03}
                stroke="none"
                ifOverflow="hidden"
              />
            ) : null}
            {markers.map((marker) => (
              <ReferenceLine
                key={`${marker.label}-${marker.at}`}
                x={marker.at}
                stroke="var(--openui-dashboard-ink-muted)"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={<ReferenceChipLabel text={marker.label} />}
              />
            ))}
            {showPrevious
              ? series.map((s, i) =>
                  (s.mark ?? type) === "bar" ? (
                    // Stacked charts get one stacked ghost per category, not one ghost per series.
                    <Bar
                      key={`p${i}`}
                      dataKey={`p${i}`}
                      xAxisId={overlapGhosts ? "ghost" : undefined}
                      stackId={stacked ? "previous" : undefined}
                      fill={previousColor(i, count)}
                      fillOpacity={count === 1 ? 0.55 : 0.3}
                      stroke={stacked ? "var(--openui-dashboard-surface)" : undefined}
                      strokeWidth={stacked ? 2 : 0}
                      radius={percent || (stacked && i < lastBar) ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                      maxBarSize={BAR_SIZE}
                      isAnimationActive={false}
                    />
                  ) : null,
                )
              : null}
            {/* Dots render under the translucent gradient, so the stroke stays clean on top. */}
            {!stacked
              ? series.map((s, i) =>
                  (s.mark ?? type) === "area" ? (
                    <Area
                      key={`dots${i}`}
                      dataKey={`s${i}`}
                      type={curve}
                      stroke="none"
                      fill={`url(#${gradientId}-dots-${i})`}
                      mask={`url(#${gradientId}-dotmask)`}
                      connectNulls={false}
                      dot={false}
                      activeDot={false}
                      legendType="none"
                      tooltipType="none"
                      isAnimationActive={false}
                    />
                  ) : null,
                )
              : null}
            {series.map((s, i) => {
              const mark = s.mark ?? type;
              return mark === "bar" ? (
                <Bar
                  key={`s${i}`}
                  dataKey={`s${i}`}
                  name={s.name}
                  stackId={stackId}
                  fill={`url(#${gradientId}-tex-${i})`}
                  stroke={stacked ? "var(--openui-dashboard-surface)" : undefined}
                  strokeWidth={stacked ? 2 : 0}
                  radius={percent || (stacked && i < lastBar) ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  maxBarSize={BAR_SIZE}
                  isAnimationActive={false}
                />
              ) : mark === "area" ? (
                <Area
                  key={`s${i}`}
                  dataKey={`s${i}`}
                  name={s.name}
                  type={curve}
                  stackId={stackId}
                  stroke={seriesColor(i)}
                  strokeWidth={stacked ? 2 : 2.5}
                  fill={`url(#${gradientId}-${i})`}
                  connectNulls={false}
                  dot={sparseDot(rows, `s${i}`, seriesColor(i))}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--openui-dashboard-surface)" }}
                  isAnimationActive={false}
                />
              ) : isSummaryLine(series, type, i) ? null : (
                <Line
                  key={`s${i}`}
                  dataKey={`s${i}`}
                  name={s.name}
                  type={curve}
                  stroke={seriesColor(i)}
                  strokeWidth={i < 8 ? 2.5 : 1.25}
                  connectNulls={false}
                  dot={sparseDot(rows, `s${i}`, seriesColor(i))}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--openui-dashboard-surface)" }}
                  isAnimationActive={false}
                />
              );
            })}
            {/* Summary lines (an average over bars) draw after the bars, with a 1px
                  surface-coloured line along their lower edge so the neutral stroke stays
                  distinct where it crosses them, in both themes. */}
            {series.map((s, i) =>
              isSummaryLine(series, type, i) ? (
                <Line
                  key={`halo${i}`}
                  className="openui-dashboard-summary-edge"
                  dataKey={`s${i}`}
                  type={curve}
                  stroke="var(--openui-dashboard-surface)"
                  strokeWidth={1}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  tooltipType="none"
                  isAnimationActive={false}
                />
              ) : null,
            )}
            {series.map((s, i) =>
              isSummaryLine(series, type, i) ? (
                <Line
                  key={`s${i}`}
                  dataKey={`s${i}`}
                  name={s.name}
                  type={curve}
                  stroke={SUMMARY_COLOR}
                  strokeWidth={2}
                  connectNulls={false}
                  dot={sparseDot(rows, `s${i}`, SUMMARY_COLOR)}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--openui-dashboard-surface)" }}
                  isAnimationActive={false}
                />
              ) : null,
            )}
            {/* Stacked areas: each band's texture, stacked on its own so it sits exactly over the band. */}
            {stacked
              ? series.map((s, i) =>
                  (s.mark ?? type) === "area" ? (
                    <Area
                      key={`tex${i}`}
                      dataKey={`s${i}`}
                      type={curve}
                      stackId={`${stackId}-texture`}
                      stroke="none"
                      fill={`url(#${gradientId}-stack-${i})`}
                      dot={false}
                      activeDot={false}
                      legendType="none"
                      tooltipType="none"
                      isAnimationActive={false}
                    />
                  ) : null,
                )
              : null}
            {forecast
              ? series.map((s, i) =>
                  (s.mark ?? type) === "bar" ? null : (
                    <Line
                      key={`f${i}`}
                      dataKey={`f${i}`}
                      name={`${s.name} (forecast)`}
                      type={curve}
                      stroke={markColor(series, type, i)}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: "var(--openui-dashboard-surface)",
                      }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ),
                )
              : null}
            {series.map((s, i) =>
              s.lows || s.highs ? (
                // A range band (e.g. a 95% interval) under its line, in the line's hue.
                <Area
                  key={`band${i}`}
                  dataKey={(row: Row) => [row[`lo${i}`], row[`hi${i}`]]}
                  type={curve}
                  stroke="none"
                  fill={seriesColor(i)}
                  fillOpacity={0.14}
                  activeDot={false}
                  legendType="none"
                  tooltipType="none"
                  isAnimationActive={false}
                />
              ) : null,
            )}
            {showPrevious
              ? series.map((s, i) =>
                  // Bar-marked series compare with ghost bars (above); lines and areas with a dashed line.
                  (s.mark ?? type) === "bar" ? null : stacked ? (
                    // Stacked series compare stacked: each dashed edge sits on the previous period's stack.
                    <Area
                      key={`p${i}`}
                      dataKey={`p${i}`}
                      type={curve}
                      stackId="previous"
                      stroke={previousColor(i, count)}
                      strokeOpacity={previousOpacity(count)}
                      strokeWidth={1.75}
                      strokeDasharray="4 4"
                      fill="none"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  ) : (
                    <Line
                      key={`p${i}`}
                      dataKey={`p${i}`}
                      type={curve}
                      stroke={previousColor(i, count)}
                      strokeOpacity={previousOpacity(count)}
                      strokeWidth={1.75}
                      strokeDasharray="4 4"
                      dot={sparseDot(rows, `p${i}`, previousColor(i, count))}
                      activeDot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ),
                )
              : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {seriesNote(unusableSeries(series))}
    </div>
  );
}
