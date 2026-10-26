import clsx from "clsx";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveLinear } from "d3-shape";
import { useCallback, useMemo, useRef } from "react";
import type { Goal, ValueFormat } from "../../../../core/schemas";
import { useChartHover, useContainerSize, useIsomorphicLayoutEffect } from "../../hooks";
import { ChartCrosshair, ChartTooltip } from "../../shared";
import { AnimatedPath } from "../../shared/AnimatedPath";
import { areaD, lineD, packGeometry, seriesCurve } from "../../shared/seriesGeometry";
import { springPresets, useDataMorph } from "../../shared/spring";
import { KIT_CHART_PREFIX, MUTED_COLOR, SERIES_COLORS } from "../../utils/constants";
import { formatValue } from "../../utils/format";
import { findNearestDataIndex } from "../../utils/mouseUtils";
import type { GoalStatus } from "../goalGeometry";

const P = `${KIT_CHART_PREFIX}-goal-pace`;
const HEIGHT = 150;
const M = { top: 12, right: 10, bottom: 22, left: 10 };
const ACCENT = SERIES_COLORS[0]!;
const CURVE = seriesCurve("natural");
/** Scalars after the points in the morph vector: pace start y, goal y, projected-finish y, and the forecast range's low and high y. */
const EXTRAS = 5;

interface PaceGeometry {
  line: string;
  area: string;
  pace: string;
  projection: string;
  /** The forecast's 80% range as a cone from today to the period's end. */
  cone: string;
  goalY: number;
  today: { x: number; y: number };
}

/**
 * The running total against the straight-line pace to the goal: the actual
 * total to date as a d3 monotone curve, a dotted projection to the end of the
 * period, the dashed pace line, and the goal. All of it rides one data morph,
 * so a filter glides the whole chart; a resize snaps. Hovering shows a
 * crosshair with a dot on the line it reads and a spring-following tooltip.
 */
export function PaceChart({
  goal,
  status,
  format,
  isAnimationActive = true,
}: {
  goal: Goal;
  status: GoalStatus;
  format: ValueFormat;
  isAnimationActive?: boolean;
}) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(360);
  const svgRef = useRef<SVGSVGElement>(null);
  const { total, elapsed, actual, projected } = status;
  const low = status.low ?? projected;
  const high = status.high ?? projected;
  const width = Math.max(size.width, 220);
  const plotBottom = HEIGHT - M.bottom;
  const paceAt = useCallback((i: number) => (goal.goal * (i + 1)) / total, [goal.goal, total]);

  const { x, y, flat } = useMemo(() => {
    const x = scalePoint<number>()
      .domain(Array.from({ length: total }, (_, i) => i))
      .range([M.left, width - M.right]);
    const y = scaleLinear()
      .domain([0, Math.max(goal.goal, projected, high) * 1.08 || 1])
      .range([plotBottom, M.top]);
    const points = packGeometry(
      Array.from({ length: elapsed }, (_, i) => x(i)!),
      [goal.cumulative.slice(0, elapsed).map((v) => y(v))],
    );
    const flat = new Float64Array(points.length + EXTRAS);
    flat.set(points);
    flat.set([y(paceAt(0)), y(goal.goal), y(projected), y(low), y(high)], points.length);
    return { x, y, flat };
  }, [goal.cumulative, goal.goal, elapsed, total, width, projected, low, high, plotBottom, paceAt]);

  const first = x(0)!;
  const last = x(total - 1)!;
  const draw = (values: Float64Array): PaceGeometry => {
    const xs = values.subarray(0, elapsed);
    const ys = values.subarray(elapsed, elapsed * 2);
    const [paceY0, goalY, projectedY, lowY, highY] = values.subarray(elapsed * 2);
    const today = { x: xs[elapsed - 1]!, y: ys[elapsed - 1]! };
    return {
      line: lineD(xs, ys, CURVE),
      area: areaD(xs, plotBottom, ys, CURVE),
      pace: lineD([first, last], [paceY0!, goalY!], curveLinear),
      projection:
        elapsed < total ? lineD([today.x, last], [today.y, projectedY!], curveLinear) : "",
      cone:
        elapsed < total && lowY !== highY
          ? `M${today.x},${today.y}L${last},${highY}L${last},${lowY}Z`
          : "",
      goalY: goalY!,
      today,
    };
  };
  const target = draw(flat);

  const refs = {
    line: useRef<SVGPathElement>(null),
    area: useRef<SVGPathElement>(null),
    pace: useRef<SVGPathElement>(null),
    projection: useRef<SVGPathElement>(null),
    cone: useRef<SVGPathElement>(null),
    goal: useRef<SVGLineElement>(null),
    goalLabel: useRef<SVGTextElement>(null),
    today: useRef<SVGCircleElement>(null),
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    const g = drawRef.current(animated);
    refs.line.current?.setAttribute("d", g.line);
    refs.area.current?.setAttribute("d", g.area);
    refs.pace.current?.setAttribute("d", g.pace);
    refs.projection.current?.setAttribute("d", g.projection);
    refs.cone.current?.setAttribute("d", g.cone);
    refs.goal.current?.setAttribute("y1", String(g.goalY));
    refs.goal.current?.setAttribute("y2", String(g.goalY));
    refs.goalLabel.current?.setAttribute("y", String(g.goalY - 6));
    refs.today.current?.setAttribute("cx", String(g.today.x));
    refs.today.current?.setAttribute("cy", String(g.today.y));
  });
  // The first aim and any resize snap; only data changes glide.
  const lastWidth = useRef<number | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = !isAnimationActive || lastWidth.current !== width;
    lastWidth.current = width;
    aim(flat, snap, isAnimationActive);
  }, [flat, width, isAnimationActive, aim]);

  const findIndex = useCallback((px: number) => findNearestDataIndex(x, px), [x]);
  const hover = useChartHover(total);
  const hovered = hover.hoveredIndex;
  const shown = Math.min(hover.restingIndex ?? elapsed - 1, total - 1);
  const onLine = shown < elapsed;
  const projectedAt = (i: number) => (actual / elapsed) * (i + 1);
  const pathOf = (line: "actual" | "projected" | "pace") => () =>
    svgRef.current?.querySelector<SVGPathElement>(`[data-line="${line}"]`) ?? null;

  return (
    <div ref={frameRef} className={`${P}-plot`} {...hover.createHandlers(findIndex)}>
      <svg ref={svgRef} width={width} height={HEIGHT} className={`${P}-svg`}>
        <line x1={first} x2={last} y1={plotBottom} y2={plotBottom} className={`${P}-baseline`} />
        <line
          ref={refs.goal}
          x1={first}
          x2={last}
          y1={target.goalY}
          y2={target.goalY}
          className={`${P}-goal`}
        />
        <text ref={refs.goalLabel} x={first + 2} y={target.goalY - 6} className={`${P}-goal-label`}>
          Goal {formatValue(goal.goal, format)}
        </text>
        <path
          ref={refs.cone}
          d={target.cone}
          className={clsx(`${P}-cone`, isAnimationActive && `${P}-late--animated`)}
        />
        <path ref={refs.pace} d={target.pace} data-line="pace" className={`${P}-pace`} />
        <path
          ref={refs.area}
          d={target.area}
          className={clsx(`${P}-area`, isAnimationActive && `${P}-area--animated`)}
        />
        <AnimatedPath
          pathRef={refs.line}
          d={target.line}
          data-line="actual"
          className={`${P}-line`}
          isAnimationActive={isAnimationActive}
          stroke={ACCENT}
        />
        <path
          ref={refs.projection}
          d={target.projection}
          data-line="projected"
          className={clsx(
            `${P}-line ${P}-line--projected`,
            isAnimationActive && `${P}-late--animated`,
          )}
          stroke={ACCENT}
        />
        <circle
          ref={refs.today}
          cx={target.today.x}
          cy={target.today.y}
          r={4}
          fill={ACCENT}
          className={clsx(`${P}-dot`, isAnimationActive && `${P}-late--animated`)}
        />
        <ChartCrosshair
          classPrefix={P}
          x={x(shown)!}
          visible={hovered != null}
          top={M.top}
          bottom={plotBottom}
          dots={[
            {
              key: "actual",
              color: ACCENT,
              fallbackY: onLine ? y(goal.cumulative[shown]!) : Number.NaN,
              getPath: pathOf("actual"),
            },
            {
              key: "projected",
              color: ACCENT,
              fallbackY: onLine ? Number.NaN : y(projectedAt(shown)),
              getPath: pathOf("projected"),
            },
            {
              key: "pace",
              color: MUTED_COLOR,
              fallbackY: y(paceAt(shown)),
              getPath: pathOf("pace"),
            },
          ]}
        />
        {[0, elapsed - 1, total - 1]
          .filter((i, k, all) => all.indexOf(i) === k)
          .map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? "start" : i === total - 1 ? "end" : "middle"}
              className={`${P}-tick`}
            >
              {i === elapsed - 1 && elapsed < total ? "Today" : goal.labels[i]}
            </text>
          ))}
      </svg>
      {hovered != null && (
        <ChartTooltip
          x={x(hovered)!}
          y={M.top}
          width={width}
          title={goal.labels[hovered]!}
          rows={[
            hovered < elapsed
              ? {
                  color: ACCENT,
                  name: "To date",
                  value: formatValue(goal.cumulative[hovered]!, format),
                }
              : {
                  color: ACCENT,
                  name: "Projected",
                  value:
                    hovered === total - 1 && status.low != null && status.high != null
                      ? `${formatValue(projected, format)} (${formatValue(status.low, format)}–${formatValue(status.high, format)})`
                      : formatValue(projectedAt(hovered), format),
                  dotted: true,
                },
            {
              color: MUTED_COLOR,
              name: "Pace to goal",
              value: formatValue(paceAt(hovered), format),
              dashed: true,
            },
          ]}
        />
      )}
    </div>
  );
}
