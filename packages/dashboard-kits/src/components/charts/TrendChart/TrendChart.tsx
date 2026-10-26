import clsx from "clsx";
import { scalePoint } from "d3-scale";
import { useCallback, useId, useMemo, useRef, type ReactNode } from "react";
import { changeTone, formatChange } from "../../../core/format";
import { useChartHover, useContainerSize, useKitPalette, useSeriesFocus } from "../../../hooks";
import { ChartCrosshair, ChartLegend, ChartTooltip, type LegendGuide } from "../shared";
import { ChartEmpty } from "../shared/ChartEmpty";
import { linePatterns } from "../shared/linePatterns";
import { colorSeries, comparisonInSeriesColor, paletteCount } from "../shared/seriesColors";
import { DEFAULT_TREND_HEIGHT, KIT_CHART_PREFIX, X_LABEL_SPACING } from "../utils/constants";
import { formatAxis, formatValue } from "../utils/format";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { fitsWithoutZero, labelIndexes, labelWidth, valueScale } from "../utils/scale";
import { EventBands, eventAt } from "./parts/EventBands";
import { TrendAxes } from "./parts/TrendAxes";
import { TrendSeries, type GapTone } from "./parts/TrendSeries";
import { packTrend } from "./trendGeometry";
import type { TrendChartProps, TrendCompareDirection } from "./types";

const P = `${KIT_CHART_PREFIX}-trend-chart`;
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 26;
const MIN_WIDTH = 240;

/**
 * Empty-data guard in a hook-free dispatcher, as react-ui's charts do: the
 * implementation calls hooks unconditionally, so "no data" must short-circuit
 * before any hook runs.
 */
export function TrendChart(props: TrendChartProps) {
  const hasData =
    props.labels.length > 0 &&
    props.series.some((s) => s.values.slice(0, props.labels.length).some(Number.isFinite));
  if (!hasData) {
    return <ChartEmpty prefix={P} className={props.className} />;
  }
  return <TrendChartImpl {...props} />;
}

function gapTones(compare: TrendCompareDirection): { ahead: GapTone; behind: GapTone } {
  if (compare === "neutral") return { ahead: "neutral", behind: "neutral" };
  return compare === "up" ? { ahead: "good", behind: "bad" } : { ahead: "bad", behind: "good" };
}

function TrendChartImpl({
  labels,
  series: seriesProp,
  format = "number",
  variant: variantProp,
  events = [],
  target,
  band,
  partial = false,
  compare,
  height = DEFAULT_TREND_HEIGHT,
  fill = false,
  maxHeight = Infinity,
  legend = true,
  isAnimationActive = true,
  className,
}: TrendChartProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, height);
  const svgRef = useRef<SVGSVGElement>(null);
  const focus = useSeriesFocus();
  const gradientId = `${P}-g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const n = labels.length;
  // One value per label: a longer series is cut, a shorter one padded with
  // gaps, so every line breaks where its data ends instead of overrunning the
  // morph buffer or diving to an empty slot.
  const drawn = useMemo(
    () =>
      seriesProp
        .slice(0, 4)
        .map((s) =>
          s.values.length === n
            ? s
            : { ...s, values: Array.from({ length: n }, (_, j) => s.values[j] ?? Number.NaN) },
        ),
    [seriesProp, n],
  );
  const palette = useKitPalette(paletteCount(drawn), "lineChartPalette");
  const series = useMemo(
    () => comparisonInSeriesColor(colorSeries(drawn, palette), drawn),
    [drawn, palette],
  );
  // Three or more strong lines are told apart by dash as well as color.
  const patterns = useMemo(() => linePatterns(series), [series]);
  const variant = variantProp ?? (series.length > 2 ? "line" : "area");
  const width = Math.max(size.width, MIN_WIDTH);
  const plotHeight = fill ? Math.min(maxHeight, Math.max(height, size.height)) : height;
  const plotBottom = plotHeight - MARGIN_BOTTOM;

  const explicit = series.findIndex((s) => s.emphasis === "primary");
  const firstStrong = series.findIndex((s) => s.emphasis !== "muted");
  const primary = explicit >= 0 ? explicit : Math.max(0, firstStrong);
  const comparison = series.findIndex((s, i) => s.emphasis === "muted" && i !== primary);
  const tones = compare != null && comparison >= 0 && variant === "area" ? gapTones(compare) : null;

  // Area charts label their primary series; line charts label every strong one.
  const { labelled, endLabels } = useMemo(() => {
    const picked = (
      variant === "area"
        ? [primary]
        : series.map((s, i) => (s.emphasis === "muted" ? -1 : i)).filter((i) => i >= 0)
    )
      .filter((i) => Number.isFinite(series[i]!.values[n - 1]))
      .slice(0, 4);
    return {
      labelled: picked,
      endLabels: picked.map((i) => formatValue(series[i]!.values[n - 1]!, format)),
    };
  }, [variant, primary, series, n, format]);

  const geometry = useMemo(() => {
    const values = series.flatMap((s) => s.values);
    const guides = [target?.value, band?.from, band?.to].filter(
      (v): v is number => v != null && Number.isFinite(v),
    );
    // Lines of a level far from zero (a rate near 110%) fit their range; areas keep zero.
    const all = [...values, ...guides];
    const zero = variant === "area" || !fitsWithoutZero(all);
    const { scale: y, ticks } = valueScale(all, [plotBottom, MARGIN_TOP], 4, zero);
    const left = labelWidth(ticks.map((t) => formatAxis(t, format))) + 10;
    const right = width - Math.max(16, labelWidth(endLabels) + 14);
    const x = scalePoint<number>()
      .domain(Array.from({ length: n }, (_, i) => i))
      .range([left, right]);
    const xs = Float64Array.from({ length: n }, (_, i) => x(i)!);
    const ys = series.map((s) => Float64Array.from(s.values, (v) => y(v)));
    const flat = packTrend(xs, ys, [y(target?.value ?? 0), y(band?.from ?? 0), y(band?.to ?? 0)]);
    return { x, y, ticks, left, right, flat };
  }, [
    series,
    variant,
    width,
    plotBottom,
    format,
    n,
    target?.value,
    band?.from,
    band?.to,
    endLabels,
  ]);

  const { x, y, left, right } = geometry;
  const at = (i: number) => x(i)!;
  const findIndex = useCallback((px: number) => findNearestDataIndex(x, px), [x]);
  const hover = useChartHover(n);
  const handlers = hover.createHandlers(findIndex);
  const hovered = hover.hoveredIndex;
  // The crosshair stays mounted and rests where it was last shown, so it fades
  // out in place and glides in from there on the next hover.
  const shown = Math.min(hover.restingIndex ?? n - 1, n - 1);

  const hoveredEvent = hovered == null ? undefined : eventAt(events, labels, hovered);
  const legendGuides: LegendGuide[] = [
    ...(band ? [{ name: band.label, kind: "band" as const }] : []),
    ...(target ? [{ name: target.label, kind: "target" as const }] : []),
  ];
  const tail = partial && n > 2;

  let gapFooter: ReactNode;
  if (hovered != null && tones) {
    const c = series[primary]!.values[hovered]!;
    const p = series[comparison]!.values[hovered]!;
    if (Number.isFinite(c) && Number.isFinite(p) && p !== 0) {
      const change = ((c - p) / Math.abs(p)) * 100;
      gapFooter = (
        <>
          <span>vs {series[comparison]!.name.toLowerCase()}</span>
          <strong className={`kit-text-${changeTone(change, compare)}`}>
            {formatChange(change)}
          </strong>
        </>
      );
    }
  }

  return (
    <div className={clsx(P, fill && `${P}--fill`, className)} data-kit-fill={fill ? "" : undefined}>
      {legend && series.length > 1 && (
        <ChartLegend
          items={series.map((s, i) => ({
            name: s.name,
            color: s.color,
            dashed: s.dashed || s.emphasis === "muted",
            pattern: patterns?.[i],
          }))}
          guides={legendGuides}
          {...focus.legend}
        />
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
        aria-label={`${series.map((s) => s.name).join(", ")} from ${labels[0]} to ${labels[n - 1]}. Use the arrow keys to read values.`}
        {...handlers}
      >
        <svg ref={svgRef} width={width} height={plotHeight} className={`${P}-svg`}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor={series[primary]!.color}
                stopOpacity={tones ? 0.12 : 0.2}
              />
              <stop offset="100%" stopColor={series[primary]!.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <EventBands
            events={events}
            labels={labels}
            x={at}
            top={MARGIN_TOP}
            height={plotBottom - MARGIN_TOP}
            halfStep={x.step() / 2 || 8}
            active={hoveredEvent}
          />
          <TrendAxes
            ticks={geometry.ticks}
            y={y}
            left={left}
            right={right}
            height={plotHeight}
            format={format}
            labels={labels}
            xTicks={labelIndexes(n, right - left, X_LABEL_SPACING)}
            x={at}
          />
          <TrendSeries
            flat={geometry.flat}
            pointCount={n}
            series={series}
            patterns={patterns}
            primary={primary}
            comparison={comparison}
            area={variant === "area"}
            partial={partial}
            hasTarget={target != null}
            hasBand={band != null}
            top={MARGIN_TOP}
            bottom={plotBottom}
            left={left}
            right={right}
            baseY={y(Math.max(y.domain()[0]!, 0))}
            labelled={labelled}
            endLabels={endLabels}
            hideEnds={hovered != null}
            focused={focus.active}
            gradientId={gradientId}
            // Width alone: a filling plot's height follows its card, which
            // changes with the data (a hero switching metric), so it glides.
            layoutKey={String(width)}
            isAnimationActive={isAnimationActive}
          />
          <EventBands
            events={events}
            labels={labels}
            x={at}
            top={MARGIN_TOP}
            height={plotBottom - MARGIN_TOP}
            halfStep={x.step() / 2 || 8}
            active={hoveredEvent}
            layer="labels"
          />
          <ChartCrosshair
            classPrefix={P}
            x={at(shown)}
            visible={hovered != null}
            top={MARGIN_TOP}
            bottom={plotBottom}
            dots={series.map((s, i) => ({
              key: s.name,
              color: s.color,
              fallbackY: y(s.values[shown]!),
              opacity: focus.opacity(s.name),
              getPath: () =>
                svgRef.current?.querySelector<SVGPathElement>(`[data-series="${i}"]`) ?? null,
            }))}
          />
        </svg>
        {hovered != null && (
          <ChartTooltip
            x={at(hovered)}
            y={MARGIN_TOP}
            width={width}
            title={labels[hovered]!}
            note={
              hoveredEvent
                ? `${hoveredEvent.label}${hoveredEvent.detail ? ` · ${hoveredEvent.detail}` : ""}`
                : tail && hovered === n - 1
                  ? "In progress · projected from the pace so far"
                  : undefined
            }
            rows={series.map((s, i) => ({
              color: s.color,
              name: s.name,
              value: formatValue(s.values[hovered]!, format),
              dashed: s.dashed || s.emphasis === "muted",
              pattern: patterns?.[i],
            }))}
            footer={gapFooter}
          />
        )}
      </div>
    </div>
  );
}
