import clsx from "clsx";
import { scaleBand, scaleLinear } from "d3-scale";
import { memo, useCallback, useMemo, useRef } from "react";
import { useChartHover, useContainerSize, useIsomorphicLayoutEffect } from "../../../hooks";
import { ChartEmpty } from "../shared/ChartEmpty";
import { FadeFollower, springPresets, useDataMorph } from "../shared/spring";
import { FILL_MAX_HEIGHT, KIT_CHART_PREFIX } from "../utils/constants";
import { formatAxis, formatTicks, formatValue } from "../utils/format";
import { findBandIndex } from "../utils/mouseUtils";
import type { ProfitWaterfallProps, WaterfallStep } from "./types";
import {
  packWaterfall,
  rowLabelMargin,
  spacedTickLabels,
  unpackWaterfall,
  varianceTone,
  waterfallSpans,
  type WaterfallBar,
} from "./waterfallGeometry";

const P = `${KIT_CHART_PREFIX}-waterfall-chart`;
const DEFAULT_HEIGHT = 240;
/** Narrower than this, the steps turn into rows so every label stays readable. */
const ROWS_BELOW = 520;
const ROW_HEIGHT = 28;
const COLUMN_MARGIN = { top: 20, right: 4, bottom: 6, left: 48 };
const ROW_MARGIN = { top: 2, right: 52, bottom: 20, left: 0 };
/** Below this bar width only the subtotals keep their value labels. */
const LABEL_MIN_BAND = 46;

/**
 * A profit bridge: floating bars from a starting amount through each cost to
 * the result, on one d3 linear scale, with the comparison (plan, prior period,
 * last year) drawn as a dashed outline on every bar so the variance shows
 * where it happens. Wide cards get columns; narrow ones get rows, so each
 * step's name stays whole. Hovering a bar reads out the step, its comparison,
 * and whether it beat it. Bars glide to new values on the data morph spring
 * when a filter changes and snap on resize.
 */
export function ProfitWaterfall(props: ProfitWaterfallProps) {
  if (props.steps.length === 0) {
    return <ChartEmpty prefix={P} className={props.className} />;
  }
  return <ProfitWaterfallImpl {...props} />;
}

function signed(step: WaterfallStep, value: number, format: ProfitWaterfallProps["format"]) {
  const flow = step.kind === "subtract" || step.kind === "add";
  const sign = step.kind === "subtract" ? "−" : step.kind === "add" ? "+" : "";
  return `${sign}${formatValue(flow ? Math.abs(value) : value, format)}`;
}

function ProfitWaterfallImpl({
  steps,
  comparisonLabel = "Comparison",
  format = "currency",
  zero = true,
  height: columnHeight = DEFAULT_HEIGHT,
  fill: fillProp = false,
  maxHeight = FILL_MAX_HEIGHT,
  isAnimationActive = true,
  className,
}: ProfitWaterfallProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, columnHeight);
  const n = steps.length;
  const rows = size.width < ROWS_BELOW;
  const fill = fillProp && !rows;
  const width = size.width;
  const height = rows
    ? n * ROW_HEIGHT + ROW_MARGIN.top + ROW_MARGIN.bottom
    : fill
      ? Math.min(maxHeight, Math.max(columnHeight, size.height))
      : columnHeight;
  // Rows: the step names take about 40% of the width on the left, up to half
  // when a long name needs it, so none runs off the card.
  const margin = rows
    ? {
        ...ROW_MARGIN,
        left: rowLabelMargin(
          steps.map((s) => s.label),
          width,
        ),
      }
    : COLUMN_MARGIN;
  const hasComparison = steps.every((s) => s.comparison != null);

  const spans = useMemo(() => waterfallSpans(steps), [steps]);
  const ghosts = useMemo(
    () =>
      hasComparison
        ? waterfallSpans(steps.map((s) => ({ value: s.comparison!, kind: s.kind })))
        : undefined,
    [steps, hasComparison],
  );

  // One band scale places the steps (across, or down in rows); one linear
  // scale places the amounts (up, or right in rows).
  const band = useMemo(
    () =>
      scaleBand<number>()
        .domain(Array.from({ length: n }, (_, i) => i))
        .range(rows ? [margin.top, height - margin.bottom] : [margin.left, width - margin.right])
        .paddingInner(rows ? 0.3 : 0.28)
        .paddingOuter(0.1),
    [n, rows, width, height, margin.top, margin.bottom, margin.left, margin.right],
  );
  const value = useMemo(() => {
    const range = rows ? [margin.left, width - margin.right] : [height - margin.bottom, margin.top];
    if (zero) {
      const all = [...spans, ...(ghosts ?? [])].flatMap((s) => [s.from, s.to]);
      return scaleLinear()
        .domain([Math.min(0, ...all), Math.max(0, ...all)])
        .range(range)
        .nice(rows ? 3 : 4);
    }
    // Without zero: fit the levels the walk passes through, with some room,
    // and clamp so totals standing on zero rest on the plot's edge.
    const levels = spans.flatMap((s, i) =>
      steps[i]!.kind === "add" || steps[i]!.kind === "subtract" ? [s.from, s.to] : [s.level],
    );
    const lo = Math.min(...levels);
    const hi = Math.max(...levels);
    const room = (hi - lo || Math.abs(hi) || 1) * 0.35;
    return scaleLinear()
      .domain([lo - room, hi + room * 0.5])
      .range(range)
      .nice(rows ? 3 : 4)
      .clamp(true);
  }, [
    spans,
    ghosts,
    steps,
    zero,
    rows,
    width,
    height,
    margin.left,
    margin.right,
    margin.top,
    margin.bottom,
  ]);
  const flat = useMemo(() => packWaterfall(spans, ghosts, value), [spans, ghosts, value]);

  const findIndex = useCallback(
    (px: number, py: number) => findBandIndex(band, rows ? py : px),
    [band, rows],
  );
  const hover = useChartHover(n);
  const hovered = hover.hoveredIndex;
  const shown = hover.restingIndex ?? 0;
  const pad = (band.step() - band.bandwidth()) / 2;
  const step = hovered != null ? steps[hovered] : undefined;
  const tone = step ? varianceTone(step.kind, step.value, step.comparison) : "neutral";
  const ticks = value.ticks(rows ? 3 : 4);
  const tickLabels = formatTicks(ticks, format);
  // Along the bottom in rows, crowded tick labels drop so none collide.
  const showTick = rows
    ? spacedTickLabels(
        ticks.map((t) => value(t)),
        tickLabels,
      )
    : ticks.map(() => true);
  const start = (band(shown) ?? 0) - pad;

  return (
    <div
      className={clsx(P, rows && `${P}--rows`, fill && `${P}--fill`, className)}
      data-kit-fill={fill ? "" : undefined}
    >
      <div className={`${P}-top`} aria-live="polite">
        {step ? (
          <span className={`${P}-readout`}>
            <strong>{step.label}</strong> {signed(step, step.value, format)}
            {step.comparison != null && (
              <>
                <span className="kit-muted">
                  {" "}
                  · {comparisonLabel} {signed(step, step.comparison, format)} ·{" "}
                </span>
                <span className={`kit-text-${tone}`}>
                  {step.value === step.comparison
                    ? `on ${comparisonLabel.toLowerCase()}`
                    : `${formatValue(Math.abs(step.value - step.comparison), format)} ${tone === "good" ? "better" : "worse"} than ${comparisonLabel.toLowerCase()}`}
                </span>
              </>
            )}
          </span>
        ) : (
          <span className={`${P}-readout kit-muted`}>
            {hasComparison && (
              <>
                <i className={`${P}-key`} /> {comparisonLabel} ·{" "}
              </>
            )}
            Hover a bar for its {hasComparison ? "variance" : "amount"}
          </span>
        )}
      </div>
      <div
        ref={frameRef}
        className={clsx(`${P}-frame`, fill && `${P}-frame--fill`)}
        style={
          fill
            ? {
                minHeight: columnHeight,
                maxHeight: Number.isFinite(maxHeight) ? maxHeight : undefined,
              }
            : undefined
        }
        tabIndex={0}
        role="img"
        aria-label={`${steps[0]!.label} ${signed(steps[0]!, steps[0]!.value, format)} to ${steps[n - 1]!.label} ${signed(steps[n - 1]!, steps[n - 1]!.value, format)}, in ${n} steps. Use the arrow keys to read each step.`}
        {...hover.createHandlers(findIndex)}
      >
        <svg width={width} height={height} className={`${P}-svg`}>
          <g className={`${P}-axis`}>
            {ticks.map((tick, k) => {
              const at = value(tick);
              return rows ? (
                <g key={tick}>
                  <line
                    x1={at}
                    x2={at}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    className={tick === 0 ? `${P}-baseline` : `${P}-grid`}
                  />
                  {showTick[k] && (
                    <text x={at} y={height - 4} textAnchor="middle" className={`${P}-tick`}>
                      {tickLabels[k]}
                    </text>
                  )}
                </g>
              ) : (
                <g key={tick}>
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={at}
                    y2={at}
                    className={tick === 0 ? `${P}-baseline` : `${P}-grid`}
                  />
                  <text
                    x={margin.left - 8}
                    y={at}
                    dy="0.32em"
                    textAnchor="end"
                    className={`${P}-tick`}
                  >
                    {tickLabels[k]}
                  </text>
                </g>
              );
            })}
          </g>
          <FadeFollower x={rows ? 0 : start} y={rows ? start : 0} visible={hovered != null}>
            {rows ? (
              <rect width={width} height={band.step()} rx={6} className={`${P}-hover-band`} />
            ) : (
              <rect
                y={margin.top - 12}
                width={band.step()}
                height={height - margin.top - margin.bottom + 12}
                rx={6}
                className={`${P}-hover-band`}
              />
            )}
          </FadeFollower>
          {rows &&
            steps.map((s, i) => (
              <text
                key={`${s.label}-${i}`}
                x={margin.left - 10}
                y={(band(i) ?? 0) + band.bandwidth() / 2}
                dy="0.32em"
                textAnchor="end"
                className={clsx(`${P}-row-label`, s.kind === "total" && `${P}-row-label--total`)}
              >
                {s.label}
              </text>
            ))}
          <WaterfallBars
            flat={flat}
            steps={steps}
            starts={steps.map((_, i) => band(i) ?? 0)}
            bandwidth={band.bandwidth()}
            rows={rows}
            hasComparison={hasComparison}
            hovered={hovered}
            format={format}
            layoutKey={`${width}:${rows}`}
            isAnimationActive={isAnimationActive}
          />
        </svg>
      </div>
      {!rows && (
        <div className={`${P}-labels`} aria-hidden>
          {steps.map((s, i) => (
            <span
              key={`${s.label}-${i}`}
              className={clsx(`${P}-label`, s.kind === "total" && `${P}-label--total`)}
              style={{ left: (band(i) ?? 0) - pad / 2, width: band.bandwidth() + pad }}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface BarsProps {
  flat: Float64Array;
  steps: WaterfallStep[];
  /** Where each step's band starts: x for columns, y for rows. */
  starts: number[];
  bandwidth: number;
  rows: boolean;
  hasComparison: boolean;
  hovered: number | null;
  format: ProfitWaterfallProps["format"];
  /** Changes on resize (or first measure): the bars then snap instead of gliding. */
  layoutKey: string;
  isAnimationActive: boolean;
}

/** A bar's extent along the value axis, whichever way that axis runs. */
const extent = (a: number, b: number) => ({ at: Math.min(a, b), length: Math.abs(b - a) });

/**
 * Where a step's value label sits along the value axis: past the outer end of
 * the bar or its outline, above in columns and to the right in rows.
 */
function labelAt(b: WaterfallBar, rows: boolean): number {
  return rows
    ? Math.max(b.top, b.bottom, b.ghostTop, b.ghostBottom) + 6
    : Math.min(b.top, b.bottom, b.ghostTop, b.ghostBottom) - 6;
}

/**
 * The bars, outlines, connectors, and value labels, all driven by one spring
 * data morph over the flat pixel vector. Memoized on the data, so a hover
 * re-render only toggles classes.
 */
const WaterfallBars = memo(function WaterfallBars(props: BarsProps) {
  const n = props.steps.length;
  const target = unpackWaterfall(props.flat, n);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);
  const ghostRefs = useRef<(SVGRectElement | null)[]>([]);
  const linkRefs = useRef<(SVGLineElement | null)[]>([]);
  const valueRefs = useRef<(SVGTextElement | null)[]>([]);
  const propsRef = useRef(props);
  propsRef.current = props;
  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    const rows = propsRef.current.rows;
    // Attribute names along the value axis: up in columns, right in rows.
    const a = rows
      ? ({ pos: "x", size: "width", line: ["x1", "x2"] } as const)
      : ({ pos: "y", size: "height", line: ["y1", "y2"] } as const);
    unpackWaterfall(animated, n).forEach((b, i) => {
      const bar = extent(b.top, b.bottom);
      const ghost = extent(b.ghostTop, b.ghostBottom);
      barRefs.current[i]?.setAttribute(a.pos, String(bar.at));
      barRefs.current[i]?.setAttribute(a.size, String(Math.max(1, bar.length)));
      ghostRefs.current[i]?.setAttribute(a.pos, String(ghost.at));
      ghostRefs.current[i]?.setAttribute(a.size, String(ghost.length));
      linkRefs.current[i]?.setAttribute(a.line[0], String(b.level));
      linkRefs.current[i]?.setAttribute(a.line[1], String(b.level));
      valueRefs.current[i]?.setAttribute(a.pos, String(labelAt(b, rows)));
    });
  });

  const lastLayout = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = !props.isAnimationActive || lastLayout.current !== props.layoutKey;
    lastLayout.current = props.layoutKey;
    aim(props.flat, snap, props.isAnimationActive);
  }, [props.flat, props.layoutKey, props.isAnimationActive, aim]);

  const { rows, starts, bandwidth } = props;
  const showValue = (i: number) =>
    rows || bandwidth >= LABEL_MIN_BAND || props.steps[i]!.kind !== "subtract";
  const animate = props.isAnimationActive;
  /** Attributes for a rect spanning [a, b] on the value axis across band i, widened by `grow`. */
  const rect = (i: number, a: number, b: number, grow = 0, min = 0) => {
    const e = extent(a, b);
    const across = { at: starts[i]! - grow, size: bandwidth + grow * 2 };
    return rows
      ? { x: e.at, width: Math.max(min, e.length), y: across.at, height: across.size }
      : { y: e.at, height: Math.max(min, e.length), x: across.at, width: across.size };
  };

  return (
    <g
      className={clsx(
        `${P}-bars`,
        props.hovered != null && `${P}-bars--hovering`,
        rows && `${P}-bars--rows`,
      )}
    >
      {target.slice(0, -1).map((b, i) => {
        const from = starts[i]! + bandwidth;
        const to = starts[i + 1]!;
        return (
          <line
            key={`link-${i}`}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            {...(rows
              ? { y1: from, y2: to, x1: b.level, x2: b.level }
              : { x1: from, x2: to, y1: b.level, y2: b.level })}
            className={`${P}-link`}
          />
        );
      })}
      {props.steps.map((s, i) => (
        <rect
          key={`bar-${i}`}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          {...rect(i, target[i]!.top, target[i]!.bottom, 0, 1)}
          rx={Math.min(4, bandwidth / 4)}
          className={clsx(
            `${P}-bar ${P}-bar--${s.kind}`,
            i === n - 1 && `${P}-bar--result`,
            i === props.hovered && `${P}-bar--active`,
            animate && `${P}-bar--animated`,
          )}
          style={animate ? { animationDelay: `${i * 45}ms` } : undefined}
        />
      ))}
      {props.hasComparison &&
        props.steps.map((_, i) => (
          <rect
            key={`ghost-${i}`}
            ref={(el) => {
              ghostRefs.current[i] = el;
            }}
            {...rect(i, target[i]!.ghostTop, target[i]!.ghostBottom, 2)}
            rx={Math.min(5, bandwidth / 4)}
            className={clsx(`${P}-ghost`, animate && `${P}-late--animated`)}
          />
        ))}
      {props.steps.map((s, i) => {
        if (!showValue(i)) return null;
        const at = labelAt(target[i]!, rows);
        const across = starts[i]! + bandwidth / 2;
        return (
          <text
            key={`value-${i}`}
            ref={(el) => {
              valueRefs.current[i] = el;
            }}
            {...(rows ? { x: at, y: across, dy: "0.32em" } : { x: across, y: at })}
            textAnchor={rows ? "start" : "middle"}
            className={clsx(
              `${P}-value`,
              s.kind === "total" && `${P}-value--total`,
              animate && `${P}-late--animated`,
            )}
          >
            {s.kind === "subtract" ? "−" : s.kind === "add" ? "+" : ""}
            {s.kind === "subtract" || s.kind === "add"
              ? formatAxis(Math.abs(s.value), props.format)
              : formatValue(s.value, props.format)}
          </text>
        );
      })}
    </g>
  );
});
