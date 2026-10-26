import clsx from "clsx";
import { memo, useId, useRef, type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "../../../core/hooks";
import { FADED_OPACITY } from "../../../core/hooks/useSeriesFocus";
import { AnimatedPath } from "../../shared/AnimatedPath";
import { DASH_ARRAYS, type LinePattern } from "../../shared/linePatterns";
import type { ColoredSeries } from "../../shared/seriesColors";
import { areaD, lineD, seriesCurve } from "../../shared/seriesGeometry";
import { springPresets, useDataMorph } from "../../shared/spring";
import { KIT_CHART_PREFIX } from "../../utils/constants";
import { differencePaths, spreadLabels, unpackTrend } from "../trendGeometry";
import { ReferenceGuides, writeGuides, type GuideRefs } from "./ReferenceGuides";

const P = `${KIT_CHART_PREFIX}-trend-chart`;
const CURVE = seriesCurve("natural");
/** How far past the plot the clip rectangles reach, so round line caps aren't cut. */
const BLEED = 12;

export type GapTone = "good" | "bad" | "neutral";

export interface TrendSeriesProps {
  /** Target pixel geometry in the trend morph layout (see `packTrend`). */
  flat: Float64Array;
  pointCount: number;
  series: ColoredSeries[];
  /** A dash pattern per series when color alone can't tell them apart (see `linePatterns`). */
  patterns: LinePattern[] | null;
  /** Index of the series the story is about; it gets the area wash and gap. */
  primary: number;
  /** Index of the muted comparison series, or -1. */
  comparison: number;
  /** Tone where the primary is ahead (a larger value) and where it is behind; omit for no gap. */
  aheadTone?: GapTone;
  behindTone?: GapTone;
  area: boolean;
  /** The last point is in progress: its segment is dotted and its dot hollow. */
  partial: boolean;
  hasTarget: boolean;
  hasBand: boolean;
  /** Plot edges in px. */
  top: number;
  bottom: number;
  left: number;
  right: number;
  baseY: number;
  /** Series indexes labeled at their last point, and their label text. */
  labelled: number[];
  endLabels: string[];
  /** Fade the end dots and labels (while the crosshair shows values instead). */
  hideEnds: boolean;
  /** The series a legend has brought forward, if any. */
  focused: string | null;
  gradientId: string;
  /** Changes when the plot is resized (or first measured): geometry then snaps instead of gliding. */
  layoutKey: string;
  isAnimationActive: boolean;
}

interface Geometry {
  area: string;
  band: string;
  aboveComparison: string;
  belowComparison: string;
  lines: string[];
  split: number;
  dots: { x: number; y: number }[];
  labelY: number[];
  guides: Float64Array;
}

function buildGeometry(values: Float64Array, props: TrendSeriesProps): Geometry {
  const n = props.pointCount;
  const { xs, ys, guides } = unpackTrend(values, n, props.series.length);
  const primary = ys[props.primary];
  const comparison = props.comparison >= 0 ? ys[props.comparison] : undefined;
  const diff =
    props.aheadTone && primary && comparison
      ? differencePaths(xs, primary, comparison, props.top, props.bottom, CURVE)
      : { band: "", aboveComparison: "", belowComparison: "" };
  const labelY = spreadLabels(
    props.labelled.map((s) => ({ key: String(s), y: ys[s]![n - 1]! + 4 })),
    props.top + 4,
    props.bottom,
  );
  return {
    area: props.area && primary ? areaD(xs, props.baseY, primary, CURVE) : "",
    ...diff,
    lines: ys.map((y) => lineD(xs, y, CURVE)),
    split: n > 2 ? xs[n - 2]! : xs[0]!,
    dots: props.labelled.map((s) => ({ x: xs[n - 1]!, y: ys[s]![n - 1]! })),
    labelY: props.labelled.map((s) => labelY.get(String(s)) ?? 0),
    guides,
  };
}

/**
 * Every data mark of a trend: the reference guides, the primary's area wash,
 * the shaded difference against the comparison, each series as a d3 monotone
 * curve (with a dotted in-progress tail), and the end dots and labels.
 *
 * One spring data morph — react-ui's, over the flat pixel vector — drives all
 * of them, so when the data changes (a filter, or a KPI tile switching the
 * hero) the curves, the gap, and the guides glide to their new shape together.
 * A resize snaps: only data changes animate. Memoized, so hovering the chart
 * (which re-renders its parent once per point crossed) never rebuilds a path.
 */
export const TrendSeries = memo(function TrendSeries(props: TrendSeriesProps) {
  const target = buildGeometry(props.flat, props);
  const ids = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clip = {
    above: `${P}-above-${ids}`,
    below: `${P}-below-${ids}`,
    solid: `${P}-solid-${ids}`,
    tail: `${P}-tail-${ids}`,
  };

  const areaRef = useRef<SVGPathElement>(null);
  const bandAheadRef = useRef<SVGPathElement>(null);
  const bandBehindRef = useRef<SVGPathElement>(null);
  const aboveRef = useRef<SVGPathElement>(null);
  const belowRef = useRef<SVGPathElement>(null);
  const solidClipRef = useRef<SVGRectElement>(null);
  const tailClipRef = useRef<SVGRectElement>(null);
  const lineRefs = useRef<RefObject<SVGPathElement | null>[]>([]);
  const tailRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const guideRefs: GuideRefs = {
    target: useRef<SVGLineElement>(null),
    band: useRef<SVGRectElement>(null),
  };
  props.series.forEach((_, s) => {
    lineRefs.current[s] ??= { current: null };
  });

  const propsRef = useRef(props);
  propsRef.current = props;
  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    const p = propsRef.current;
    const g = buildGeometry(animated, p);
    areaRef.current?.setAttribute("d", g.area);
    bandAheadRef.current?.setAttribute("d", g.band);
    bandBehindRef.current?.setAttribute("d", g.band);
    aboveRef.current?.setAttribute("d", g.aboveComparison);
    belowRef.current?.setAttribute("d", g.belowComparison);
    g.lines.forEach((d, s) => {
      lineRefs.current[s]?.current?.setAttribute("d", d);
      tailRefs.current[s]?.setAttribute("d", d);
    });
    solidClipRef.current?.setAttribute("width", String(Math.max(0, g.split - p.left + BLEED)));
    tailClipRef.current?.setAttribute("x", String(g.split));
    g.dots.forEach((dot, k) => {
      dotRefs.current[k]?.setAttribute("cx", String(dot.x));
      dotRefs.current[k]?.setAttribute("cy", String(dot.y));
      labelRefs.current[k]?.setAttribute("x", String(dot.x + 8));
      labelRefs.current[k]?.setAttribute("y", String(g.labelY[k]));
    });
    writeGuides(guideRefs, g.guides);
  });

  // Pre-paint, so a retarget mid-glide restores the animated geometry before
  // the freshly committed target attributes can flash. The first aim and any
  // resize snap; only data changes glide.
  const lastLayout = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = !props.isAnimationActive || lastLayout.current !== props.layoutKey;
    lastLayout.current = props.layoutKey;
    aim(props.flat, snap, props.isAnimationActive);
  }, [props.flat, props.layoutKey, props.isAnimationActive, aim]);

  const opacity = (name: string) =>
    props.focused == null || props.focused === name ? 1 : FADED_OPACITY;
  const primary = props.series[props.primary];
  const tail = props.partial && props.pointCount > 2;
  const animate = props.isAnimationActive;
  const plotHeight = props.bottom - props.top + BLEED * 2;

  return (
    <g className={`${P}-series-layer`}>
      <defs>
        <clipPath id={clip.above}>
          <path ref={aboveRef} d={target.aboveComparison} />
        </clipPath>
        <clipPath id={clip.below}>
          <path ref={belowRef} d={target.belowComparison} />
        </clipPath>
        <clipPath id={clip.solid}>
          <rect
            ref={solidClipRef}
            x={props.left - BLEED}
            y={props.top - BLEED}
            width={Math.max(0, target.split - props.left + BLEED)}
            height={plotHeight}
          />
        </clipPath>
        <clipPath id={clip.tail}>
          <rect
            ref={tailClipRef}
            x={target.split}
            y={props.top - BLEED}
            width={props.right - target.split + BLEED}
            height={plotHeight}
          />
        </clipPath>
      </defs>
      <ReferenceGuides
        refs={guideRefs}
        guides={target.guides}
        hasBand={props.hasBand}
        hasTarget={props.hasTarget}
        left={props.left}
        right={props.right}
      />
      <g className={clsx(animate && `${P}-wash--animated`)}>
        {props.area && primary && (
          <path
            ref={areaRef}
            d={target.area}
            fill={`url(#${props.gradientId})`}
            className={`${P}-area`}
            opacity={opacity(primary.name)}
          />
        )}
        {props.aheadTone && props.behindTone && (
          <g className={`${P}-gap`} opacity={props.focused == null ? 1 : 0.3}>
            <path
              ref={bandAheadRef}
              d={target.band}
              clipPath={`url(#${clip.above})`}
              className={`${P}-gap--${props.aheadTone}`}
            />
            <path
              ref={bandBehindRef}
              d={target.band}
              clipPath={`url(#${clip.below})`}
              className={`${P}-gap--${props.behindTone}`}
            />
          </g>
        )}
      </g>
      {props.series
        .map((s, index) => ({ s, index }))
        .reverse()
        .map(({ s, index }) => {
          const muted = s.emphasis === "muted";
          const split = tail && !muted;
          const pattern = props.patterns?.[index];
          const dash = pattern
            ? DASH_ARRAYS[pattern]
            : muted || s.dashed
              ? DASH_ARRAYS.context
              : undefined;
          return (
            <g key={s.name} className={`${P}-series`} opacity={opacity(s.name)}>
              {/* Dashed and dotted lines can't draw on (the draw-on owns the
                  dash array), so they fade in with the wash instead. */}
              <g className={clsx(animate && dash && `${P}-wash--animated`)}>
                <AnimatedPath
                  pathRef={lineRefs.current[index]}
                  d={target.lines[index]!}
                  data-series={index}
                  className={`${P}-line${muted ? ` ${P}-line--muted` : ""}`}
                  isAnimationActive={animate && !dash}
                  stroke={s.color}
                  strokeDasharray={dash}
                  clipPath={split ? `url(#${clip.solid})` : undefined}
                />
              </g>
              {split && (
                <path
                  ref={(el) => {
                    tailRefs.current[index] = el;
                  }}
                  d={target.lines[index]}
                  clipPath={`url(#${clip.tail})`}
                  className={clsx(`${P}-line ${P}-line--partial`, animate && `${P}-late--animated`)}
                  stroke={s.color}
                  strokeDasharray="1 5"
                />
              )}
            </g>
          );
        })}
      <g className={clsx(`${P}-ends`, props.hideEnds && `${P}-ends--hidden`)}>
        <g className={clsx(animate && `${P}-late--animated`)}>
          {props.labelled.map((s, k) => {
            const item = props.series[s]!;
            const dot = target.dots[k]!;
            return (
              <g key={item.name} opacity={opacity(item.name)}>
                <circle
                  ref={(el) => {
                    dotRefs.current[k] = el;
                  }}
                  cx={dot.x}
                  cy={dot.y}
                  r={4}
                  fill={tail ? "var(--kit-card)" : item.color}
                  // Inline, so the ring beats the card-colored halo every dot gets.
                  style={tail ? { stroke: item.color } : undefined}
                  className={`${P}-dot${tail ? ` ${P}-dot--open` : ""}`}
                />
                <text
                  ref={(el) => {
                    labelRefs.current[k] = el;
                  }}
                  x={dot.x + 8}
                  y={target.labelY[k]}
                  className={`${P}-end-label`}
                >
                  {props.endLabels[k]}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
});
