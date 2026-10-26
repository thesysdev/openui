import clsx from "clsx";
import { scaleLinear } from "d3-scale";
import { useMemo, useRef } from "react";
import { useContainerSize, useIsomorphicLayoutEffect } from "../../../hooks";
import { AnimatedPath } from "../shared/AnimatedPath";
import { lineD, packGeometry, seriesCurve, unpackGeometry } from "../shared/seriesGeometry";
import { springPresets, useDataMorph } from "../shared/spring";
import { KIT_CHART_PREFIX } from "../utils/constants";
import type { SparklineProps } from "./types";

const P = `${KIT_CHART_PREFIX}-sparkline`;

function extent(values: number[]): [number?, number?] {
  const finite = values.filter(Number.isFinite);
  return finite.length ? [Math.min(...finite), Math.max(...finite)] : [];
}
const PAD_X = 3;
const PAD_Y = 4;
const CURVE = seriesCurve("natural");

/**
 * A sparkline is a quiet companion to its KPI: a thin muted line, no wash, and
 * only the latest value in the accent. The delta beside it says whether the
 * change is good; a row of coloured, filled lines turned the KPI strip into
 * the loudest thing on the dashboard.
 */
const LINE_COLOR = "var(--kit-spark)";
const DOT_COLOR = "var(--kit-accent)";

/**
 * A KPI's recent trend: a d3 monotone curve with a soft wash and a dot on the
 * latest value: a muted line with the accent on its last point. Unlike
 * react-ui's MiniAreaChart it keeps every point and fits its range to the
 * data, so a metric moving between 40K and 45K still reads as a trend. Drawn
 * at the container's real width (no stretched viewBox, so the dot stays round)
 * and morphed on the spring when the values change; a resize snaps.
 */
export function Sparkline(props: SparklineProps) {
  if (props.values.filter(Number.isFinite).length < 2) return null;
  return <SparklineImpl {...props} />;
}

function SparklineImpl({
  values,
  height = 36,
  isAnimationActive = true,
  className,
}: SparklineProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(160, height);
  const width = Math.max(size.width, 40);
  const n = values.length;

  const flat = useMemo(() => {
    const [min = 0, max = 1] = extent(values);
    const x = scaleLinear()
      .domain([0, n - 1])
      .range([PAD_X, width - PAD_X]);
    const y = scaleLinear()
      .domain(min === max ? [min - 1, max + 1] : [min, max])
      .range([height - PAD_Y, PAD_Y]);
    return packGeometry(
      values.map((_, i) => x(i)),
      [values.map((v) => y(v))],
    );
  }, [values, n, width, height]);

  const draw = (geometry: Float64Array) => {
    const { xs, ys } = unpackGeometry(geometry, n);
    const line = ys[0]!;
    return {
      line: lineD(xs, line, CURVE),
      dot: { x: xs[n - 1]!, y: line[n - 1]! },
    };
  };
  const target = draw(flat);

  const lineRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    const g = drawRef.current(animated);
    lineRef.current?.setAttribute("d", g.line);
    dotRef.current?.setAttribute("cx", String(g.dot.x));
    dotRef.current?.setAttribute("cy", String(g.dot.y));
  });
  // The first aim and any resize snap; only a change in the values glides.
  const lastWidth = useRef<number | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = !isAnimationActive || lastWidth.current !== width;
    lastWidth.current = width;
    aim(flat, snap, isAnimationActive);
  }, [flat, width, isAnimationActive, aim]);

  const color = LINE_COLOR;
  return (
    <div ref={frameRef} className={clsx(P, className)} style={{ height }} aria-hidden>
      <svg width={width} height={height} className={`${P}-svg`}>
        <AnimatedPath
          pathRef={lineRef}
          d={target.line}
          className={`${P}-line`}
          isAnimationActive={isAnimationActive}
          stroke={color}
        />
        <circle
          ref={dotRef}
          cx={target.dot.x}
          cy={target.dot.y}
          r={2.75}
          fill={DOT_COLOR}
          className={clsx(`${P}-dot`, isAnimationActive && `${P}-late--animated`)}
        />
      </svg>
    </div>
  );
}
